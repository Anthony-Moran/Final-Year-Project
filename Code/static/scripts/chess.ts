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

enum states {
    WhiteLost,
    BlackLost,
    Stalemate,
    Continue
}

// @ts-ignore
const engine_to_web_pieces = new Map<string, Pieces>([
    ['r', Pieces.Rook],
    ['n', Pieces.Knight],
    ['b', Pieces.Bishop],
    ['k', Pieces.King],
    ['q', Pieces.Queen],
    ['p', Pieces.Pawn],
    [' ', Pieces.None]
]);

// @ts-ignore
const engine_to_web_colours = new Map<string, Colours>([
    ['white', Colours.White],
    ['black', Colours.Black]
])

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
            x, y, Square.getWidth(), Square.getHeight());
    }
}

class Pawn extends Piece {
    promote() {
        // Placeholder for actual promotion
        this.type = Pieces.None;
    }
}


class Square {
    private static WIDTH;
    private static HEIGHT;

    private readonly colour: string;
    private piece: Piece;

    private selected: boolean;
    private highlighted: boolean;

    constructor(colour) {
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
        ctx.fillRect(this.getX(), this.getY(), Square.getWidth(), Square.getHeight());

        if (this.piece == null) {return;}
        this.piece.draw(this.getX(), this.getY());
    }

    getX() {return Square.getWidth() * (Board.indexOf(this) % COLS);}
    getY() {return Square.getHeight() * Math.floor(Board.indexOf(this) / ROWS);}

    static getWidth() {return Square.WIDTH;}
    static getHeight() {return Square.HEIGHT;}
    static setWidth(width: number) {Square.WIDTH = width;}
    static setHeight(height: number) {Square.HEIGHT = height;}

    setPiece(piece: Piece) {this.piece = piece;}

    select() {
        if (this.piece == null) {
            unhighlightSquares();
            return;
        }

        const send_data = JSON.stringify({
            'index': Board.indexOf(this)
        });

        fetch(BOARD_URL, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: send_data
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    promptElement.style.color = 'red';
                    console.log(response);
                    throw new Error(response.statusText);
                }
            })
            .then(json => {
                this.selected = true;
                SelectedSquare = this;

                highlightSquares(json);
            })
            .catch(error => {
                console.log(error);
            });
    }
    unselect() {
        this.selected = false;
        SelectedSquare = null
        drawBoard();
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

        fetch(BOARD_URL, {
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
            .then(() => {        
                SelectedSquare.unselect();
                unhighlightSquares();
        
                updateState()
            })
            .catch(error => console.log(error));
    }
}

function updateCanvas() {
    const vmin = Math.min(canvasContainer.clientWidth, canvasContainer.clientHeight);
    canvas.width = vmin;
    canvas.height = vmin;

    Square.setWidth(vmin / COLS);
    Square.setHeight(vmin / ROWS);
    drawBoard();
}

function drawBoard() {
    Board.forEach((square: Square) => {
        square.draw();
    })
}

const ROWS = 8;
const COLS = 8;

const CHESS_URL = window.location.href;
const BOARD_URL = CHESS_URL.replace('chess', 'board');

const canvas = <HTMLCanvasElement> document.querySelector("#board");
const canvasContainer = canvas.parentElement;
const ctx = canvas.getContext("2d");
const promptElement = <HTMLHeadingElement> document.querySelector("#Prompt");

const Board: Square[] = [];
let turn: Colours;
let SelectedSquare: Square = null;
const HighlightedSquares: Square[] = [];

// Initialise Squares
for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
        Board.push(new Square((i + j) % 2 == 0 ? "#ffffff" : "#22aa44"));
    }
}

window.addEventListener('load', () => {
    updateCanvas();
    updateState();
});
window.addEventListener('resize', updateCanvas);

function onSpriteSheetLoad() {
    Piece.WIDTH = this.width / 6;
    Piece.HEIGHT = this.height / 2;

    setInterval(updateState, 500);
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

    drawBoard();
}

function highlightSquares(positions: [number, number][]) {
    unhighlightSquares();

    if (positions == null) {return;}
    positions.forEach(position => {
        const index = position[0] * COLS + position[1];
        Board[index].highlight();
    });

    drawBoard();
}

function updatePrompt(state, check=false) {
    let prompt = "";

    switch(state) {
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
            switch(turn) {
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
    const x = Math.floor(e.offsetX / Square.getWidth());
    const y = Math.floor(e.offsetY / Square.getHeight());
    const index = y * COLS + x;

    selectSquare(index);
}

function updateState() {
    fetch(BOARD_URL)
        .then(response => response.json())
        .then(json => {
            turn = Number(json['turn']);
            const state = json['state'];
            const in_check = json['check'];

            json['board'].forEach((elm, index) => {
                if (elm != ' ') {
                    let [type, colour] = elm.split(' ');
                    type = engine_to_web_pieces.get(type);
                    colour = engine_to_web_colours.get(colour);
                    const piece = new Piece(colour, type);
                    Board[index].setPiece(piece);
                } else {
                    Board[index].setPiece(null);
                }
            });

            updatePrompt(state, in_check);
            drawBoard();
        })
        .catch(error => console.log(`Error updateState: ${error}`));
}

if (Piece.SPRITE_SHEET.complete) {
    onSpriteSheetLoad.bind(Piece.SPRITE_SHEET)();
} else {
    Piece.SPRITE_SHEET.onload = onSpriteSheetLoad;
}
canvas.addEventListener('mouseup', e => {touchCanvas(e)})

const game_link = document.createElement('a');
game_link.href = window.location.href;
game_link.innerHTML = "Game Link";

const text_div = document.querySelector('div.text');
text_div.append(game_link);

const p = document.createElement('p');
p.innerHTML = `Game ID: ${CHESS_URL.match(/\d+$/)}`
text_div.append(p);