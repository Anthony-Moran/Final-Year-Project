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

def get_piecetype_from_symbol(symbol):
    return chess.Piece.from_symbol(symbol).piece_type

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
            piece = get_piece_from_square(board, event["start square"])
            end_piece = piece
            new_piece_rank = move.uci()[3]
            
            if (board.is_castling(move)):
                king_file, king_rank = move.uci()[2:4]

                old_castle_file = "a" if king_file == "c" else "h"
                new_castle_file = "d" if king_file == "c" else "f"
                castle_rank = king_rank
                castle_symbol = "R" if int(castle_rank) == 1 else "r"

                old_castle_uci = old_castle_file+castle_rank
                new_castle_uci = new_castle_file+castle_rank
                old_castle_square_index = chess.parse_square(old_castle_uci)
                new_castle_square_index = chess.parse_square(new_castle_uci)

                websockets.broadcast(connected, json.dumps({
                    "type": "play",
                    "start": (old_castle_square_index, castle_symbol),
                    "end square": new_castle_square_index
                }))

            elif (board.is_en_passant(move)):
                attacking_file, attacking_rank = move.uci()[2:4]
                defending_file = attacking_file
                defending_rank = "4" if attacking_rank == "3" else "5"

                defending_uci = defending_file+defending_rank
                defending_square_index = chess.parse_square(defending_uci)

                websockets.broadcast(connected, json.dumps({
                    "type": "clear",
                    "piece": defending_square_index
                }))

            elif (piece.lower() == "p" and (int(new_piece_rank) == 1 or int(new_piece_rank) == 8)):
                await websocket.send(json.dumps({
                    "type": "promotion"
                }))

                promotion_message = await websocket.recv()
                promotion_event = json.loads(promotion_message)

                end_piece = promotion_event["piece"]
                move.promotion = get_piecetype_from_symbol(end_piece)
            
            board.push(move)
            websockets.broadcast(connected, json.dumps({
                "type": "play",
                "start square": event["start square"],
                "end square": event["end square"],
                "piece": end_piece
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
            "player": player,
            "turn": board.turn
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
            "player": player,
            "turn": board.turn
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
