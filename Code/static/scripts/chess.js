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
var Piece = /** @class */ (function () {
    function Piece(colour, type) {
        this.colour = colour;
        this.type = type;
        this.sx = this.type * Piece.WIDTH;
        this.sy = this.colour * Piece.HEIGHT;
    }
    Piece.prototype.draw = function (x, y) {
        ctx.drawImage(Piece.SPRITE_SHEET, this.sx, this.sy, Piece.WIDTH, Piece.HEIGHT, x, y, Square.WIDTH, Square.HEIGHT);
    };
    Piece.SPRITE_SHEET = document.querySelector("#ImagePieces");
    return Piece;
}());
var Square = /** @class */ (function () {
    function Square(x, y) {
        this.x = x;
        this.y = y;
        this.piece = null;
    }
    Square.prototype.draw = function () {
        if (this.piece == null) {
            return;
        }
        this.piece.draw(this.x, this.y);
    };
    Square.prototype.getX = function () { return this.x; };
    Square.prototype.getY = function () { return this.y; };
    Square.prototype.setPiece = function (piece) { this.piece = piece; };
    return Square;
}());
function drawBoard() {
    var colourFlipFlop = true;
    Board.forEach(function (square, index) {
        ctx.fillStyle = colourFlipFlop ? "#ffffff" : "#22aa44";
        ctx.fillRect(square.getX(), square.getY(), Square.WIDTH, Square.HEIGHT);
        square.draw();
        if (index % 8 < 7) {
            colourFlipFlop = !colourFlipFlop;
        }
    });
}
var ROWS = 8;
var COLS = 8;
var canvas = document.querySelector("#board");
var ctx = canvas.getContext("2d");
var Board = [];
var vmin = Math.min(window.innerWidth, window.innerHeight) - 50;
Square.WIDTH = vmin / COLS;
Square.HEIGHT = vmin / ROWS;
canvas.width = Square.WIDTH * COLS;
canvas.height = Square.HEIGHT * ROWS;
for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
        Board.push(new Square(j * Square.WIDTH, i * Square.HEIGHT));
    }
}
function onSpriteSheetLoad() {
    Piece.WIDTH = this.width / 6;
    Piece.HEIGHT = this.height / 2;
    Board[0].setPiece(new Piece(Colours.Black, Pieces.Rook));
    Board[1].setPiece(new Piece(Colours.Black, Pieces.Knight));
    Board[2].setPiece(new Piece(Colours.Black, Pieces.Bishop));
    Board[3].setPiece(new Piece(Colours.Black, Pieces.Queen));
    Board[4].setPiece(new Piece(Colours.Black, Pieces.King));
    Board[5].setPiece(new Piece(Colours.Black, Pieces.Bishop));
    Board[6].setPiece(new Piece(Colours.Black, Pieces.Knight));
    Board[7].setPiece(new Piece(Colours.Black, Pieces.Rook));
    for (var i = 8; i < 16; i++) {
        Board[i].setPiece(new Piece(Colours.Black, Pieces.Pawn));
    }
    Board[56].setPiece(new Piece(Colours.White, Pieces.Rook));
    Board[57].setPiece(new Piece(Colours.White, Pieces.Knight));
    Board[58].setPiece(new Piece(Colours.White, Pieces.Bishop));
    Board[59].setPiece(new Piece(Colours.White, Pieces.Queen));
    Board[60].setPiece(new Piece(Colours.White, Pieces.King));
    Board[61].setPiece(new Piece(Colours.White, Pieces.Bishop));
    Board[62].setPiece(new Piece(Colours.White, Pieces.Knight));
    Board[63].setPiece(new Piece(Colours.White, Pieces.Rook));
    for (var i = 48; i < 56; i++) {
        Board[i].setPiece(new Piece(Colours.White, Pieces.Pawn));
    }
    drawBoard();
}
Piece.SPRITE_SHEET.onload = onSpriteSheetLoad;
