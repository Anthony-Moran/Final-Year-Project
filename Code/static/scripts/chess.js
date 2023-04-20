import * as game from "./game.js";
const websocket_address = `ws://${window.location.hostname}:8001/`

let resize_timeout;

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

    window.addEventListener("resize", () => {
        clearTimeout(resize_timeout);
        resize_timeout = setTimeout(() => {
            websocket.send(JSON.stringify({
            "type": "resize"
        }))
    }, 250); 
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
                game.play(event["start square"], event["end square"], event.piece, event.check);
                break;
            case "player joined":
                game.remove_join_text(event.board);
                break;
            case "win":
                game.win(event.winner);
                close_websocket(websocket);
                break;
            case "draw":
                game.draw(event.reason);
                break;
            case "promotion":
                game.choose_promotion()
                break;
            case "clear":
                game.clear(event.piece);
                break;
            case "opponent disconnected":
                alert("The opponent disconnected/resigned...");
                close_websocket(websocket);
                window.location.replace(event.url);
                break;
            case "resize":
                game.init_canvas(event.board);
                break;
            case "bad request":
                window.location.replace(event.urlBad);
                break;
            case "error":
                alert(event.message);
                break;
            }
    });
}

function connectionHandler(websocket) {
    websocket.addEventListener("close", alertBrokenConnection);
}

function alertBrokenConnection() {
    alert("The connection has broken while you were gone...");
    window.location.replace("/");
}

function close_websocket(websocket) {
    websocket.removeEventListener("close", alertBrokenConnection);
    websocket.close()
}

window.addEventListener('DOMContentLoaded', () => {
    const websocket = new WebSocket(websocket_address);
    init(websocket);
    sendHandler(websocket);
    receiveHandler(websocket);
    connectionHandler(websocket);
});