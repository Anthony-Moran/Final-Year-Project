import * as game from "./game.js";
const websocket_address = `ws://${window.location.hostname}:8001/`

function init(websocket) {
    websocket.addEventListener("open", () => {
        const params = new URLSearchParams(window.location.search);
        const event = {"type": "init"};

        if (params.has("join")) {
            event.join = params.get("join");
        }

        websocket.send(JSON.stringify(event));
    });
}

function sendHandler(websocket) {
    game.click(event => {
        if (game.choosing_promotion) {
            return;
        }

        let send_data = null;
        const index = game.get_index_from_xy(event.offsetX, event.offsetY);

        if (game.attempting_move(index)) {
            send_data = {
                "type": "play",
                "player": game.get_player(),
                "start square": game.get_current_selection_index(),
                "end square": index
            }
        } else {
            send_data = {
                "type": "select",
                "player": game.get_player(),
                "square": index
            }
        }

        websocket.send(JSON.stringify(send_data));
    });

    game.pp_click(piece => {
        websocket.send(JSON.stringify({
            "type": "promotion",
            "piece": piece
        }));
    });
}

function receiveHandler(websocket) {
    websocket.addEventListener("message", ({data}) => {
        const event = JSON.parse(data);
        switch (event.type) {
            case "init":
                game.init(event.board, event.player, event.turn, event.join);
                break;
            case "select":
                game.select([event.square, event.piece], event["available moves"]);
                break;
            case "play":
                game.play(event["start square"], event["end square"], event.piece);
                break;
            case "promotion":
                game.choose_promotion()
                break;
            case "clear":
                game.clear(event.piece);
                break;
            case "error":
                alert(event.message);
                break;
            }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const websocket = new WebSocket(websocket_address);
    init(websocket);
    sendHandler(websocket);
    receiveHandler(websocket);
});