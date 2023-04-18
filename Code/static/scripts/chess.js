import * as game from "./game.js";

function init(websocket) {
    websocket.addEventListener("open", () => {
        const event = {"type": "init"};
        websocket.send(JSON.stringify(event));
    });
}

function sendHandler(board, websocket) {
    board.addEventListener("click", event => {
        let send_data = null;
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
        switch (data["type"]) {
            case "init":
                game.init_pieces(data.board);
                break;
            case "select":
                game.select([data["square"], data["piece"]], data["available moves"]);
                break;
            case "play":
                game.play(data["start"], data["end square"]);
                break;
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