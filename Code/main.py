from flask import Flask, render_template, make_response, request
from flask_restful import Api, Resource

from chess_engine import game_state

app = Flask(__name__)
api = Api(app)

state = game_state()


class Chess(Resource):
    def get(self):
        global state
        headers = {"Content-Type": "text/html"}
        index = request.args.get('index')

        if index is None:
            state = game_state()
            return make_response(render_template("chess.html"), 200, headers)
        index = int(index)
        starting_square = (index // 8, index % 8)

        indexMove = request.args.get('indexMove')
        if indexMove is None:
            valid_moves = state.get_valid_moves(starting_square)
            return valid_moves

        indexMove = int(indexMove)
        ending_square = (indexMove // 8, indexMove % 8)
        state.move_piece(starting_square, ending_square, False)


def main():
    api.add_resource(Chess, "/chess")
    app.run(host='127.0.0.1', port='8000', debug=True)


if __name__ == "__main__":
    main()
