import * as game from "./game.js";

function init(websocket) {
    websocket.addEventListener("open", () => {
        const event = {"type": "init"};
        websocket.send(JSON.stringify(event));
    });
}

function sendHandler(board, websocket) {
    board.addEventListener("click", event => {
        let send_data = {"type": "Error: No type given"}

        // const [row, col] = game.get_row_and_col(event.offsetX, event.offsetY);
        const index = game.get_index_from_xy(event.offsetX, event.offsetY);
        if (game.attempting_move(index)) {
            send_data = {
                "type": "play",
                "start square": game.get_current_selection_index(),
                "end square": index
            }
        } else {
            send_data = {
                "type": "select",
                "square": index
            }
        }

        websocket.send(JSON.stringify(send_data));
    })
}

function receiveHandler(board, websocket) {
    websocket.addEventListener("message", ({data}) => {
        data = JSON.parse(data);
        if (data["type"] == "init") {
            game.init_pieces(data.board);
        } else if (data["type"] == "select") {
            game.select([data["square"], data["piece"]], data["available moves"]);
        } else if (data["type"] == "play") {
            game.play(data["start"], data["end square"]);
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('#CanvasContainer');
    const board = game.create_board(container);

    const websocket = new WebSocket("ws://localhost:8001/");
    init(websocket);
    sendHandler(board, websocket);
    receiveHandler(board, websocket);
});