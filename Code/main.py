import asyncio
import websockets
import json
import secrets

import chess
Boards = {}

def map_squarename_to_validmove(board, square_name):
    square = chess.parse_square(square_name)
    piece = board.piece_at(square)
    piece = piece.symbol() if piece is not None else ""
    return (square, piece)

def get_valid_moves_from(board, index):
    name = chess.square_name(index)

    valid_squares = []
    for move in map(lambda x: str(x), board.legal_moves):
        if move[:2] != name:
            continue
        valid_squares.append(move[2:4])
    return list(map(lambda x: map_squarename_to_validmove(board, x), valid_squares))

def get_piece_from_square(board, square):
    piece = board.piece_at(square)
    return piece.symbol() if piece is not None else ""

async def error(websocket, message):
    event = {
        "type": "error",
        "message": message,
    }
    await websocket.send(json.dumps(event))

async def play(websocket, board: chess.Board, player, connected):
    async for message in websocket:
        event = json.loads(message)
        assert event["type"] == "select" or event["type"] == "play"
        
        if event["player"] == chess.WHITE and not board.turn or\
        event["player"] == chess.BLACK and board.turn:
            await error(websocket, "It is not your turn yet")
            continue

        if event["type"] == "select":
            available_moves = get_valid_moves_from(board, event["square"])

            await websocket.send(json.dumps({
                "type": "select",
                "square": event["square"],
                "piece": get_piece_from_square(board, event["square"]),
                "available moves": available_moves
            }))

        if event["type"] == "play":
            move = chess.Move(event["start square"], event["end square"]) # Will have to add edge case for promotion and castling and en pessant
            board.push(move)
            websockets.broadcast(connected, json.dumps({
                "type": "play",
                "start": (event["start square"], get_piece_from_square(board, event["end square"])),
                "end square": event["end square"]
            }))

async def start(websocket):
    board = chess.Board()
    connected = {websocket}

    join_key = secrets.token_urlsafe(12)
    Boards[join_key] = board, connected

    player = chess.WHITE

    try:
        await websocket.send(json.dumps({
            "type": "init",
            "join": join_key,
            "board": board.board_fen(),
            "player": player
        }))
        await play(websocket, board, player, connected)
    finally:
        del Boards[join_key]

async def join(websocket, join_key):
    try:
        board, connected = Boards[join_key]
    except KeyError:
        await error(websocket, "Game not found.")
        return
    
    if len(connected) >= 2:
        await error("The game already has two players")
        return
    
    connected.add(websocket)
    player = chess.BLACK
    try:
        await websocket.send(json.dumps({
            "type": "init",
            "board": board.board_fen(),
            "player": player
        }))
        await play(websocket, board, player, connected)
    finally:
        connected.remove(websocket)

async def handler(websocket):
    message = await websocket.recv()
    event = json.loads(message)
    assert event["type"] == "init"

    if "join" in event:
        await join(websocket, event["join"])
    else:
        await start(websocket)

async def main():
    async with websockets.serve(handler, "", 8001):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
