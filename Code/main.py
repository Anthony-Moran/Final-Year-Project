import asyncio
import websockets
import json

import chess
board = chess.Board()

def map_squarename_to_validmove(square_name):
    square = chess.parse_square(square_name)
    piece = board.piece_at(square)
    piece = piece.symbol() if piece is not None else ""
    return (square, piece)

def get_valid_moves_from(index):
    name = chess.square_name(index)

    valid_squares = []
    for move in map(lambda x: str(x), board.legal_moves):
        if move[:2] != name:
            continue
        valid_squares.append(move[2:])
    return list(map(map_squarename_to_validmove, valid_squares))

async def handler(websocket):
    async for message in websocket:
        message = json.loads(message)
        print(f"Server has received message: {message}")

        if message["type"] == "init":
            event = {
                "type": "init",
                "board": board.board_fen()
            }
            
            await websocket.send(json.dumps(event))

        if message["type"] == "select":
            available_moves = get_valid_moves_from(message["square"])
            piece = board.piece_at(message["square"])
            piece = piece.symbol() if piece is not None else ""

            event = {
                "type": "select",
                "square": message["square"],
                "piece": piece,
                "available moves": available_moves
            }
            await websocket.send(json.dumps(event))

        if message["type"] == "play":
            board.move_piece(message["start square"], tuple(message["end square"]), False)
            await websocket.send(json.dumps({
                "type": "play",
                "start": (message["start square"], board.get_piece_string(message["end square"][0], message["end square"][1])),
                "end square": message["end square"]
            }))

async def main():
    async with websockets.serve(handler, "", 8001):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
