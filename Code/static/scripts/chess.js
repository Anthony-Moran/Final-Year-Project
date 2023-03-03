const ROWS = 8;
const COLS = 8;

const canvas = document.querySelector("#board")
const ctx = canvas.getContext("2d")
Board = []

class Square {
    static WIDTH = 48;
    static HEIGHT = 48;

    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.piece = null;
    }
}

canvas.width = Square.WIDTH * COLS;
canvas.height = Square.HEIGHT * ROWS;

for (let i=0; i<ROWS; i++) {
    for (let j=0; j<COLS; j++) {
        let square;
        Board.push(square = new Square(j*Square.WIDTH, i*Square.HEIGHT));

        ctx.fillStyle = (i + j) % 2 === 0 ? "#ffffff" : "#22aa44";
        ctx.fillRect(square.x, square.y, Square.WIDTH, Square.HEIGHT);
    }
}

