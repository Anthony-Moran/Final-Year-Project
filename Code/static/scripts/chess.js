var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Pieces;
(function (Pieces) {
    Pieces[Pieces["King"] = 0] = "King";
    Pieces[Pieces["Queen"] = 1] = "Queen";
    Pieces[Pieces["Bishop"] = 2] = "Bishop";
    Pieces[Pieces["Knight"] = 3] = "Knight";
    Pieces[Pieces["Rook"] = 4] = "Rook";
    Pieces[Pieces["Pawn"] = 5] = "Pawn";
    Pieces[Pieces["None"] = 6] = "None";
})(Pieces || (Pieces = {}));
var Colours;
(function (Colours) {
    Colours[Colours["White"] = 0] = "White";
    Colours[Colours["Black"] = 1] = "Black";
})(Colours || (Colours = {}));
var states;
(function (states) {
    states[states["WhiteLost"] = 0] = "WhiteLost";
    states[states["BlackLost"] = 1] = "BlackLost";
    states[states["Stalemate"] = 2] = "Stalemate";
    states[states["Continue"] = 3] = "Continue";
})(states || (states = {}));
// @ts-ignore
var engine_to_web_pieces = new Map([
    ['r', Pieces.Rook],
    ['n', Pieces.Knight],
    ['b', Pieces.Bishop],
    ['k', Pieces.King],
    ['q', Pieces.Queen],
    ['p', Pieces.Pawn],
    [' ', Pieces.None]
]);
// @ts-ignore
var engine_to_web_colours = new Map([
    ['white', Colours.White],
    ['black', Colours.Black]
]);
var Piece = /** @class */ (function () {
    function Piece(colour, type) {
        this.colour = colour;
        this.type = type;
        this.sx = this.type * Piece.WIDTH;
        this.sy = this.colour * Piece.HEIGHT;
    }
    Piece.prototype.draw = function (x, y) {
        ctx.drawImage(Piece.SPRITE_SHEET, this.sx, this.sy, Piece.WIDTH, Piece.HEIGHT, x, y, Square.getWidth(), Square.getHeight());
    };
    Piece.SPRITE_SHEET = document.querySelector("#ImagePieces");
    return Piece;
}());
var Pawn = /** @class */ (function (_super) {
    __extends(Pawn, _super);
    function Pawn() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Pawn.prototype.promote = function () {
        // Placeholder for actual promotion
        this.type = Pieces.None;
    };
    return Pawn;
}(Piece));
var Square = /** @class */ (function () {
    function Square(colour) {
        this.colour = colour;
        this.piece = null;
        this.selected = false;
        this.highlighted = false;
    }
    Square.prototype.draw = function () {
        if (this.selected) {
            ctx.fillStyle = "#ffff33";
        }
        else if (this.highlighted) {
            ctx.fillStyle = "#33aaff";
        }
        else {
            ctx.fillStyle = this.colour;
        }
        ctx.fillRect(this.getX(), this.getY(), Square.getWidth(), Square.getHeight());
        if (this.piece == null) {
            return;
        }
        this.piece.draw(this.getX(), this.getY());
    };
    Square.prototype.getX = function () { return Square.getWidth() * (Board.indexOf(this) % COLS); };
    Square.prototype.getY = function () { return Square.getHeight() * Math.floor(Board.indexOf(this) / ROWS); };
    Square.getWidth = function () { return Square.WIDTH; };
    Square.getHeight = function () { return Square.HEIGHT; };
    Square.setWidth = function (width) { Square.WIDTH = width; };
    Square.setHeight = function (height) { Square.HEIGHT = height; };
    Square.prototype.setPiece = function (piece) { this.piece = piece; };
    Square.prototype.select = function () {
        if (this.piece == null) {
            // Draw the board so that the old selected square is no longer highlighted
            unhighlightSquares();
            drawBoard();
            return;
        }
        this.selected = true;
        SelectedSquare = this;
        var send_data = JSON.stringify({
            'index': Board.indexOf(this)
        });
        fetch("".concat(CHESS_URL), {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: send_data
        })
            .then(function (response) { return response.json(); })
            .then(function (json) {
            highlightSquares(json);
            drawBoard();
        })
            .catch(function (error) { return console.log("Error Select: ".concat(error)); });
    };
    Square.prototype.unselect = function () {
        this.selected = false;
        SelectedSquare = null;
    };
    Square.prototype.highlight = function () {
        this.highlighted = true;
        HighlightedSquares.push(this);
    };
    Square.prototype.unhighlight = function () {
        this.highlighted = false;
        HighlightedSquares.slice(HighlightedSquares.indexOf(this));
    };
    Square.prototype.move = function (moveSquare) {
        if (this.piece == null) {
            return;
        }
        fetch("".concat(CHESS_URL), {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'index': Board.indexOf(SelectedSquare),
                'indexMove': Board.indexOf(moveSquare)
            })
        })
            .then(function (response) { return response.json(); })
            .then(function (json) {
            turn = turn == Colours.White ? Colours.Black : Colours.White;
            updatePrompt(json);
        })
            .catch(function (error) { return console.log(error); });
        moveSquare.piece = this.piece;
        this.piece = null;
        SelectedSquare.unselect();
        unhighlightSquares();
        drawBoard();
    };
    return Square;
}());
function updateCanvas() {
    var vmin = Math.min(document.body.clientWidth, canvasContainer.clientHeight);
    canvas.width = vmin;
    canvas.height = vmin;
    Square.setWidth(vmin / COLS);
    Square.setHeight(vmin / ROWS);
    drawBoard();
}
function drawBoard() {
    Board.forEach(function (square) {
        square.draw();
    });
}
var ROWS = 8;
var COLS = 8;
var CHESS_URL = window.location.href;
var BOARD_URL = CHESS_URL.replace('chess', 'board');
var canvas = document.querySelector("#board");
var canvasContainer = canvas.parentElement;
var ctx = canvas.getContext("2d");
var promptElement = document.querySelector("#Prompt");
var Board = [];
var turn;
var SelectedSquare = null;
var HighlightedSquares = [];
// Initialise Squares
for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
        Board.push(new Square((i + j) % 2 == 0 ? "#ffffff" : "#22aa44"));
    }
}
window.addEventListener('load', function () {
    updateCanvas();
    updateState();
});
window.addEventListener('resize', updateCanvas);
function onSpriteSheetLoad() {
    Piece.WIDTH = this.width / 6;
    Piece.HEIGHT = this.height / 2;
    setInterval(updateState, 1000);
}
function selectSquare(index) {
    if (SelectedSquare != null) {
        // @ts-ignore
        var highlightedSquare = HighlightedSquares.find(function (square) { return square === Board[index]; });
        if ((highlightedSquare !== undefined)) {
            SelectedSquare.move(highlightedSquare);
            return;
        }
        SelectedSquare.unselect();
    }
    Board[index].select();
}
function unhighlightSquares() {
    if (HighlightedSquares.length == 0) {
        return;
    }
    var square;
    while ((square = HighlightedSquares.pop()) != undefined) {
        square.unhighlight();
    }
}
function highlightSquares(positions) {
    unhighlightSquares();
    if (positions == null) {
        return;
    }
    positions.forEach(function (position) {
        var index = position[0] * COLS + position[1];
        Board[index].highlight();
    });
}
function updatePrompt(state, check) {
    if (check === void 0) { check = false; }
    var prompt = "";
    switch (state) {
        case states.WhiteLost:
            prompt = "Black Wins";
            break;
        case states.BlackLost:
            prompt = "White Wins";
            break;
        case states.Stalemate:
            prompt = "It's a Draw";
            break;
        case states.Continue:
            switch (turn) {
                case Colours.White:
                    prompt = "White's Turn";
                    break;
                case Colours.Black:
                    prompt = "Black's Turn";
                    break;
            }
            if (check) {
                prompt += " (In Check)";
            }
            break;
    }
    promptElement.innerHTML = prompt;
}
function touchCanvas(e) {
    var x = Math.floor(e.offsetX / Square.getWidth());
    var y = Math.floor(e.offsetY / Square.getHeight());
    var index = y * COLS + x;
    selectSquare(index);
}
function updateState() {
    fetch(BOARD_URL)
        .then(function (response) { return response.json(); })
        .then(function (json) {
        turn = Number(json['turn']);
        var state = json['state'];
        var in_check = json['check'];
        json['board'].forEach(function (elm, index) {
            if (elm != ' ') {
                var _a = elm.split(' '), type = _a[0], colour = _a[1];
                type = engine_to_web_pieces.get(type);
                colour = engine_to_web_colours.get(colour);
                var piece = new Piece(colour, type);
                Board[index].setPiece(piece);
            }
            else {
                Board[index].setPiece(null);
            }
        });
        updatePrompt(state, in_check);
        drawBoard();
    })
        .catch(function (error) { return console.log("Error updateState: ".concat(error)); });
}
if (Piece.SPRITE_SHEET.complete) {
    onSpriteSheetLoad.bind(Piece.SPRITE_SHEET)();
}
else {
    Piece.SPRITE_SHEET.onload = onSpriteSheetLoad;
}
canvas.addEventListener('mouseup', function (e) { touchCanvas(e); });
var game_link = document.createElement('a');
game_link.href = window.location.href;
game_link.innerHTML = "Game Link";
var text_div = document.querySelector('div.text');
text_div.append(game_link);
