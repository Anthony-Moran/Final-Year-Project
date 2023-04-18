const ROWS_AND_COLS = 8;
let square_size;

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.font = "30px Arial";

const chess_spritesheet = document.querySelector('img');
const spritesheet_rows = 2;
const spritesheet_cols = 6;
let frame_width;
let frame_height;

const COLOUR0 = "#22aa44";
const COLOUR1 = "#ffffff";
const COLOUR_SELECT = "#ffff00";
const COLOUR_HIGHLIGHT = "#33aaff";

let current_selection = null;
let current_moves = null;

export function create_board(container) {
    const vmin = 480;

    canvas.width = vmin;
    canvas.height = vmin;

    frame_width = chess_spritesheet.width / spritesheet_cols;
    frame_height = chess_spritesheet.height / spritesheet_rows;

    square_size = vmin / ROWS_AND_COLS;
    for (let i=0; i<ROWS_AND_COLS**2; i++) {
        draw_square(i);
    }

    container.append(canvas);
    return canvas;
}

export function init_pieces(fen) {
    let row = ROWS_AND_COLS - 1, col = 0;
    for (let i=0; i<fen.length; i++) {
        const char = fen[i];

        if (char == '/') {
            row -= 1;
            col = 0;
            continue;
        }

        if (!isNaN(char)) {
            const num = Number(char);
            col += num;
            continue;
        }

        draw_piece_from_char(get_index_from_rowcol(row, col), char);
        col += 1;
    }
}

function get_piece_from_char(char) {
    let addition = " ";
    if (char == char.toUpperCase()) {
        addition += "white"
    } else {
        addition += "black"
    }
    return char.toLowerCase() + addition;
}

export function get_rowcol_from_xy(x, y) {
    const row = ROWS_AND_COLS - Math.floor(y / square_size) - 1;
    const col = Math.floor(x / square_size);
    return [row, col];
}

function get_rowcol_from_index(index) {
    const row = Math.floor(index / ROWS_AND_COLS);
    const col = index % ROWS_AND_COLS;
    return [row, col];
}

export function get_index_from_xy(x, y) {
    const [row, col] = get_rowcol_from_xy(x, y);
    return get_index_from_rowcol(row, col);
}

function get_xy_from_index(index) {
    const [row, col] = get_rowcol_from_index(index);
    return [col * square_size, (ROWS_AND_COLS - row - 1) * square_size];
}

function get_index_from_rowcol(row, col) {
    return row * ROWS_AND_COLS + col;
}

function get_source_rect(piece) {
    const [type, colour] = piece.split(" ");
    const x = get_source_col(type) * frame_width;
    const y = get_source_row(colour) * frame_height;
    return [x, y, frame_width, frame_height];
}

function get_source_row(colour) {
    switch (colour) {
        case "white":
            return 0;
        case "black":
            return 1;
    }
}

function get_source_col(type) {
    switch (type) {
        case "k":
            return 0;
        case "q":
            return 1;
        case "b":
            return 2;
        case "n":
            return 3;
        case "r":
            return 4;
        case "p":
            return 5;
    }
}

function get_colour_from_index(index) {
    const [row, col] = get_rowcol_from_index(index)
    return (row + col) % 2 == 0 ? COLOUR0 : COLOUR1;
}

function draw_square(index, colour=null) {
    if (colour == null) {
        ctx.fillStyle = get_colour_from_index(index);
    } else {
        ctx.fillStyle = colour;
    }

    const [x, y] = get_xy_from_index(index);
    ctx.fillRect(x, y, square_size, square_size);

    draw_square_name(index);
}

function draw_square_name(index) {
    const [row, col] = get_rowcol_from_index(index);
    const [x, y] = get_xy_from_index(index);
    ctx.fillStyle = "#515151";

    if (row == 0) {
        const str = String.fromCharCode(97+col);
        const text_metrics = ctx.measureText(str)
        const width = text_metrics.width;
        ctx.fillText(str, x + square_size - width, y + square_size);
    }
    if (col == 0) {
        const str = (row+1).toString();
        const text_metrics = ctx.measureText(str);
        const height = text_metrics.actualBoundingBoxAscent + text_metrics.actualBoundingBoxDescent;
        ctx.fillText(str, x, y + height);
    }
}

function draw_piece(index, piece) {
    // 's' and 'd' denote source and destination respectively
    const [dx, dy] = get_xy_from_index(index);
    const [sx, sy, sw, sh] = get_source_rect(piece);

    ctx.drawImage(chess_spritesheet, sx, sy, sw, sh,
        dx, dy, square_size, square_size);
}

function draw_piece_from_char(index, char) {
    const piece = get_piece_from_char(char);
    draw_piece(index, piece);
}

export function select(selection, available_moves) {
    unselect();
    unhighlight_available_moves();

    const [square, char] = selection;
    if (char == "") {
        return;
    }

    draw_square(square, COLOUR_SELECT);
    draw_piece_from_char(square, char);

    current_selection = selection;
    highlight_available_moves(available_moves)
}

export function play(start, end_square) {
    unselect();
    unhighlight_available_moves();

    const [start_square, piece] = start;
    draw_square(start_square);
    draw_square(end_square);
    draw_piece(end_square, piece);
}

function highlight_available_moves(available_moves) {
    if (current_moves != null) {
        current_moves.forEach(move => {
            const [square, char] = move;
            draw_square(square);
            if (char != "") {
                draw_piece_from_char(square, char);
            }
        })
    }

    available_moves.forEach(move => {
        const [square, piece] = move;
        draw_square(square, COLOUR_HIGHLIGHT);
        draw_piece(square, piece);
    });

    current_moves = available_moves;
}

function unselect() {
    if (current_selection == null) {
        return;
    }

    const [square, piece] = current_selection
    draw_square(square);
    draw_piece_from_char(square, piece);
    current_selection = null;
}

function unhighlight_available_moves() {
    if (current_moves == null) {
        return;
    }

    current_moves.forEach(move => {
        const [square, piece] = move;
        draw_square(square);
        draw_piece_from_char(square, piece);
    });
    current_moves = null;
}

export function attempting_move(move) {
    if (current_moves == null) {
        return false;
    }

    return current_moves.map(move => move[0]).find(available_move => JSON.stringify(available_move) == JSON.stringify(move)) != undefined
}

export function get_current_selection_pos() {
    return current_selection[0];
}