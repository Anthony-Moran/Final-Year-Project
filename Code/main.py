import itertools

from flask import Flask, render_template, make_response, request, redirect
from flask_restful import Api, Resource, reqparse

from chess_engine import game_state, Piece, Player

app = Flask(__name__)
api = Api(app)


class MetaState(game_state):
    def __init__(self, player_1=None):
        super().__init__()
        self.white_player = player_1
        self.black_player = None

    def add_player(self, player):
        if self.white_player is None:
            self.white_player = player
        elif self.black_player is None and self.white_player != player:
            self.black_player = player
        else:
            raise AssertionError


states = {}

def get_new_state_id():
    num = 0
    while num in states.keys():
        num += 1
    return num

class Index(Resource):
    def get(self):
        headers = {"Content-Type": "text/html"}
        return make_response(render_template("index.html"), 200, headers)
    

class NewGame(Resource):
    def get(self):
        state_id = get_new_state_id()
        states[state_id] = MetaState()
        return redirect(f"chess/{state_id}")
    
    
class ExistingGame(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument("GameID", required=True, type=int, location="form")
        args = parser.parse_args()

        state_id = args.get("GameID")

        if state_id not in states.keys():
            return make_response(render_template("chess404.html"), 404, {"Content-Type": "text/html"})
        
        return redirect(f"chess/{state_id}")
    

class Chess(Resource):
    def get(self, state_id):
        headers = {"Content-Type": "text/html"}

        if state_id not in states:
            return make_response(render_template("chess404.html"), 404, {"Content-Type": "text/html"})
        else:
            state = states[state_id]
            try:
                state.add_player(request.remote_addr)
            except AssertionError:
                print("Player attempting to join the same game or game is full")

        return make_response(render_template("chess.html"), 200, headers)


class Board(Resource):
    def get(self, state_id):
        if state_id not in states.keys():
            return make_response("Error: No state to get board from", 404)

        state = states[state_id]

        ascii_board = list(itertools.chain(*state.board))
        ascii_board = list(map(lambda piece: f"{piece.get_name()} {piece.get_player()}" if issubclass(type(piece), Piece) else ' ', ascii_board))
        return {
            'turn': not state.white_turn,
            'state': state.checkmate_stalemate_checker(),
            'check': state._is_check,
            'board': ascii_board
        }

    def put(self, state_id):
        if state_id not in states.keys():
            return make_response("Error: No state to get board from", 404)
        state: MetaState = states[state_id]

        if state.white_turn and request.remote_addr != state.white_player\
                or not state.white_turn and request.remote_addr != state.black_player:
            return make_response("It is not your turn", 400)

        json: dict = request.get_json()
        index = json["index"]
        starting_square = (index // 8, index % 8)

        piece: Piece = state.get_piece(starting_square[0], starting_square[1])
        if piece.get_player() == Player.PLAYER_1 and request.remote_addr != state.white_player\
                or piece.get_player() == Player.PLAYER_2 and request.remote_addr != state.black_player:
            return make_response("These are not one of your pieces", 400)

        indexMove = json.get('indexMove')
        if indexMove is None:
            valid_moves = state.get_valid_moves(starting_square)
            return valid_moves

        ending_square = (indexMove // 8, indexMove % 8)
        state.move_piece(starting_square, ending_square, False)

        return state.checkmate_stalemate_checker()


def main():
    api.add_resource(Index, "/")
    api.add_resource(NewGame, "/new")
    api.add_resource(ExistingGame, "/existing")
    api.add_resource(Chess, "/chess/<int:state_id>")
    api.add_resource(Board, "/board/<int:state_id>")
    app.run(host='0.0.0.0', port='8000', debug=True)


if __name__ == "__main__":
    main()
