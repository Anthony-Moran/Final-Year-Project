enum Pieces {
    King,
    Queen,
    Bishop,
    Knight,
    Rook,
    Pawn,
    None
}

enum Colours {
    White,
    Black
}


class Piece {
    static SPRITE_SHEET = <HTMLImageElement> document.querySelector("#ImagePieces");
    static WIDTH;
    static HEIGHT;

    private readonly colour: Colours;
    private readonly type: Pieces;

    private readonly sx: number;
    private readonly sy: number;

    constructor(colour, type) {
        this.colour = colour;
        this.type = type;

        this.sx = this.type * Piece.WIDTH;
        this.sy = this.colour * Piece.HEIGHT;
    }

    draw(x, y) {
        ctx.drawImage(Piece.SPRITE_SHEET, this.sx, this.sy, Piece.WIDTH, Piece.HEIGHT,
            x, y, Square.WIDTH, Square.HEIGHT);
    }
}

class Square {
    static WIDTH;
    static HEIGHT;

    private readonly x: number;
    private readonly y: number;
    private piece: Piece;

    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.piece = null;
    }

    draw() {
        if (this.piece == null) {return;}
        this.piece.draw(this.x, this.y);
    }

    getX() {return this.x;}
    getY() {return this.y;}
    setPiece(piece: Piece) {this.piece = piece;}
}

function drawBoard() {
    let colourFlipFlop: boolean = true;

    Board.forEach((square: Square, index) => {
        ctx.fillStyle = colourFlipFlop ? "#ffffff" : "#22aa44";
        ctx.fillRect(square.getX(), square.getY(), Square.WIDTH, Square.HEIGHT);
        square.draw();

        if (index % 8 < 7) {
            colourFlipFlop = !colourFlipFlop;
        }
    })
}

const ROWS = 8;
const COLS = 8;

const canvas = <HTMLCanvasElement> document.querySelector("#board");
const ctx = canvas.getContext("2d");
const Board = [];

const vmin = Math.min(window.innerWidth, window.innerHeight) - 50;
Square.WIDTH = vmin / COLS;
Square.HEIGHT = vmin / ROWS;
canvas.width = Square.WIDTH * COLS;
canvas.height = Square.HEIGHT * ROWS;

for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
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

    for (let i=8; i<16; i++) {
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

    for (let i=48; i<56; i++) {
        Board[i].setPiece(new Piece(Colours.White, Pieces.Pawn));
    }

    drawBoard();
}

Piece.SPRITE_SHEET.onload = onSpriteSheetLoad;
