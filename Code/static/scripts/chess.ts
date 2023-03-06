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
    protected type: Pieces;

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

class Pawn extends Piece {
    promote() {
        // Placeholder for actual promotion
        this.type = Pieces.None;
    }
}


class Square {
    static WIDTH;
    static HEIGHT;

    private readonly x: number;
    private readonly y: number;

    private readonly colour: string;
    private piece: Piece;

    private selected: boolean;
    private highlighted: boolean;

    constructor(x, y, colour) {
        this.x = x;
        this.y = y;

        this.colour = colour;
        this.piece = null;

        this.selected = false;
        this.highlighted = false;
    }

    draw() {
        if (this.selected) {
            ctx.fillStyle = "#ffff33";
        } else if (this.highlighted) {
            ctx.fillStyle = "#33aaff";
        } else {
            ctx.fillStyle = this.colour;
        }
        ctx.fillRect(this.getX(), this.getY(), Square.WIDTH, Square.HEIGHT);

        if (this.piece == null) {return;}
        this.piece.draw(this.x, this.y);
    }

    getX() {return this.x;}
    getY() {return this.y;}
    setPiece(piece: Piece) {this.piece = piece;}

    select() {
        if (this.piece == null) {
            // Draw the board so that the old selected square is no longer highlighted
            unhighlightSquares();
            drawBoard();
            return;
        }

        this.selected = true;
        SelectedSquare = this;

        fetch(`http://127.0.0.1:8000/chess?index=${Board.indexOf(this)}`)
            .then(response => response.json())
            .then(json => {
                highlightSquares(json)
                drawBoard();
            })
            .catch(error => console.log(`Error: ${error}`));
    }
    unselect() {
        this.selected = false;
        SelectedSquare = null
    }

    highlight() {
        this.highlighted = true;
        HighlightedSquares.push(this);
    }
    unhighlight() {
        this.highlighted = false;
        HighlightedSquares.slice(HighlightedSquares.indexOf(this));
    }

    move(moveSquare: Square) {
        if (this.piece == null) {return;}

        const queryParams = `index=${Board.indexOf(SelectedSquare)}&indexMove=${Board.indexOf(moveSquare)}`;
        fetch(`http://127.0.0.1:8000/chess?${queryParams}`)
            .then(response => response.json())
            .then(json => {})
            .catch(error => console.log(error));

        moveSquare.piece = this.piece;
        this.piece = null;

        SelectedSquare.unselect();
        unhighlightSquares();

        drawBoard();
    }
}

function drawBoard() {
    Board.forEach((square: Square) => {
        square.draw();
    })
}

const ROWS = 8;
const COLS = 8;

const canvas = <HTMLCanvasElement> document.querySelector("#board");
const canvasParent = canvas.parentElement;
const ctx = canvas.getContext("2d");

const Board: Square[] = [];
let SelectedSquare: Square = null;
const HighlightedSquares: Square[] = [];

const vmin = Math.min(canvasParent.offsetWidth, canvasParent.offsetHeight);
Square.WIDTH = vmin / COLS;
Square.HEIGHT = vmin / ROWS;
canvas.width = Square.WIDTH * COLS;
canvas.height = Square.HEIGHT * ROWS;

// Initialise Squares
for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
        Board.push(new Square(j * Square.WIDTH, i * Square.HEIGHT,
            (i + j) % 2 == 0 ? "#ffffff" : "#22aa44"));
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

    for (let i=8; i<16; i++) {
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

    for (let i=48; i<56; i++) {
        Board[i].setPiece(new Pawn(Colours.Black, Pieces.Pawn));
    }

    drawBoard();
}

function selectSquare(index: number) {

    if (SelectedSquare != null) {
        // @ts-ignore
        const highlightedSquare = HighlightedSquares.find(square => square === Board[index]);
        if ((highlightedSquare !== undefined)) {
            SelectedSquare.move(highlightedSquare);
            return;
        }
        SelectedSquare.unselect();
    }

    Board[index].select();
}

function unhighlightSquares() {
    if (HighlightedSquares.length == 0) {return;}

    let square;
    while ((square = HighlightedSquares.pop()) != undefined) {
        square.unhighlight();
    }
}

function highlightSquares(positions: [number, number][]) {
    unhighlightSquares();

    if (positions == null) {return;}
    positions.forEach(position => {
        const index = position[0] * COLS + position[1];
        Board[index].highlight();
    });
}

Piece.SPRITE_SHEET.onload = onSpriteSheetLoad;

canvas.addEventListener('mouseup', e => {
    const x = Math.floor(e.offsetX / Square.WIDTH);
    const y = Math.floor(e.offsetY / Square.HEIGHT);
    const index = y * COLS + x;

    selectSquare(index);
})
