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
    function Square(x, y, colour) {
        this.x = x;
        this.y = y;
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
        ctx.fillRect(this.getX(), this.getY(), Square.WIDTH, Square.HEIGHT);
        if (this.piece == null) {
            return;
        }
        this.piece.draw(this.x, this.y);
    };
    Square.prototype.getX = function () { return this.x; };
    Square.prototype.getY = function () { return this.y; };
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
        fetch("http://127.0.0.1:8000/chess?index=".concat(Board.indexOf(this)))
            .then(function (response) { return response.json(); })
            .then(function (json) {
            highlightSquares(json);
            drawBoard();
        })
            .catch(function (error) { return console.log("Error: ".concat(error)); });
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
        var queryParams = "index=".concat(Board.indexOf(SelectedSquare), "&indexMove=").concat(Board.indexOf(moveSquare));
        fetch("http://127.0.0.1:8000/chess?".concat(queryParams))
            .then(function (response) { return response.json(); })
            .then(function (json) { })
            .catch(function (error) { return console.log(error); });
        moveSquare.piece = this.piece;
        this.piece = null;
        SelectedSquare.unselect();
        unhighlightSquares();
        drawBoard();
    };
    return Square;
}());
function drawBoard() {
    Board.forEach(function (square) {
        square.draw();
    });
}
var ROWS = 8;
var COLS = 8;
var canvas = document.querySelector("#board");
var canvasParent = canvas.parentElement;
var ctx = canvas.getContext("2d");
var Board = [];
var SelectedSquare = null;
var HighlightedSquares = [];
var vmin = Math.min(canvasParent.offsetWidth, canvasParent.offsetHeight);
Square.WIDTH = vmin / COLS;
Square.HEIGHT = vmin / ROWS;
canvas.width = Square.WIDTH * COLS;
canvas.height = Square.HEIGHT * ROWS;
// Initialise Squares
for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
        Board.push(new Square(j * Square.WIDTH, i * Square.HEIGHT, (i + j) % 2 == 0 ? "#ffffff" : "#22aa44"));
    }
}
function onSpriteSheetLoad() {
    Piece.WIDTH = this.width / 6;
    Piece.HEIGHT = this.height / 2;
    Board[0].setPiece(new Piece(Colours.White, Pieces.Rook));
    Board[1].setPiece(new Piece(Colours.White, Pieces.Knight));
    Board[2].setPiece(new Piece(Colours.White, Pieces.Bishop));
    Board[3].setPiece(new Piece(Colours.White, Pieces.King));
    Board[4].setPiece(new Piece(Colours.White, Pieces.Queen));
    Board[5].setPiece(new Piece(Colours.White, Pieces.Bishop));
    Board[6].setPiece(new Piece(Colours.White, Pieces.Knight));
    Board[7].setPiece(new Piece(Colours.White, Pieces.Rook));
    for (var i = 8; i < 16; i++) {
        Board[i].setPiece(new Pawn(Colours.White, Pieces.Pawn));
    }
    Board[56].setPiece(new Piece(Colours.Black, Pieces.Rook));
    Board[57].setPiece(new Piece(Colours.Black, Pieces.Knight));
    Board[58].setPiece(new Piece(Colours.Black, Pieces.Bishop));
    Board[59].setPiece(new Piece(Colours.Black, Pieces.King));
    Board[60].setPiece(new Piece(Colours.Black, Pieces.Queen));
    Board[61].setPiece(new Piece(Colours.Black, Pieces.Bishop));
    Board[62].setPiece(new Piece(Colours.Black, Pieces.Knight));
    Board[63].setPiece(new Piece(Colours.Black, Pieces.Rook));
    for (var i = 48; i < 56; i++) {
        Board[i].setPiece(new Pawn(Colours.Black, Pieces.Pawn));
    }
    drawBoard();
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
Piece.SPRITE_SHEET.onload = onSpriteSheetLoad;
canvas.addEventListener('mouseup', function (e) {
    var x = Math.floor(e.offsetX / Square.WIDTH);
    var y = Math.floor(e.offsetY / Square.HEIGHT);
    var index = y * COLS + x;
    selectSquare(index);
});
