function posToCoordinates(pos) {
  let x = pos % 8;
  let y = Math.floor(pos / 8);

  return [x, y];
}

function mouseToCoordinate() {
  return [Math.floor(mouseX / 100), Math.floor(mouseY / 100)];
}

const PAWN = 1;
const KNIGHT = 2;
const ROOK = 3;
const BISHOP = 4;
const KING = 5;
const QUEEN = 6;

const WHITE = 8;
const BLACK = 16;

const RANK_MASK = 0b111;
const COLOR_MASK = 0b11000;

const GRAPHICS = {};

const TILE_WIDTH = 100;
const CANVAS_WIDTH = TILE_WIDTH * 8;

const DARK_COLOR = "#5c4033";
const LIGHT_COLOR = "#C4A484";

const DIRECTIONS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

let board = [
  [19, 18, 20, 22, 21, 20, 18, 19],
  [0, 17, 17, 17, 17, 17, 17, 17],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [9, 9, 9, 9, 9, 9, 9, 9],
  [11, 10, 12, 14, 13, 12, 10, 11],
];

let valid_moves = {};

let held_piece = {
  piece: null,
  position: null,
};

const SQUARES_TO_EDGE = {};

for (let pos = 0; pos < 64; pos++) {
  SQUARES_TO_EDGE[pos] = [];

  DIRECTIONS.forEach((direction) => {
    let squares = [];
    let [x, y] = posToCoordinates(pos);
    x += direction[0];
    y += direction[1];

    while (x >= 0 && x <= 7 && y >= 0 && y <= 7) {
      squares.push(y * 8 + x);
      x += direction[0];
      y += direction[1];
    }
    SQUARES_TO_EDGE[pos].push(squares);
  });
}

function preload() {
  GRAPHICS[WHITE + PAWN] = loadImage("images/white-pawn.png");
  GRAPHICS[WHITE + KNIGHT] = loadImage("images/white-knight.png");
  GRAPHICS[WHITE + ROOK] = loadImage("images/white-rook.png");
  GRAPHICS[WHITE + BISHOP] = loadImage("images/white-bishop.png");
  GRAPHICS[WHITE + QUEEN] = loadImage("images/white-queen.png");
  GRAPHICS[WHITE + KING] = loadImage("images/white-king.png");

  GRAPHICS[BLACK + PAWN] = loadImage("images/black-pawn.png");
  GRAPHICS[BLACK + KNIGHT] = loadImage("images/black-knight.png");
  GRAPHICS[BLACK + ROOK] = loadImage("images/black-rook.png");
  GRAPHICS[BLACK + BISHOP] = loadImage("images/black-bishop.png");
  GRAPHICS[BLACK + QUEEN] = loadImage("images/black-queen.png");
  GRAPHICS[BLACK + KING] = loadImage("images/black-king.png");
}

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_WIDTH);
  generate_moves();

  console.log(valid_moves);
}

function draw() {
  background(200);
  draw_board(held_piece.position);

  if (held_piece.piece) {
    image(
      GRAPHICS[held_piece.piece],
      mouseX - TILE_WIDTH / 2,
      mouseY - TILE_WIDTH / 2,
      TILE_WIDTH,
      TILE_WIDTH,
    );
  }
}

function mousePressed() {
  let [x, y] = mouseToCoordinate();
  if (x < 0 || x > 7 || y < 0 || y > 7 || board[y][x] == 0) {
    held_piece.position = null;
    held_piece.piece = null;
  } else {
    held_piece.piece = board[y][x];
    held_piece.position = y * 8 + x;
  }
}

function mouseReleased() {
  if (held_piece.position == null || held_piece.piece == null) return;

  let [x, y] = mouseToCoordinate();

  // if the position is valid then move the piece
  if (valid_moves[held_piece.position]?.includes(y * 8 + x)) {
    let [x_prev, y_prev] = posToCoordinates(held_piece.position);
    board[y_prev][x_prev] = 0;
    board[y][x] = held_piece.piece;
  }
  // recalculate the valid positions

  generate_moves();

  held_piece.position = null;
  held_piece.piece = null;
}

function generate_moves() {
  valid_moves = {};

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      let piece = board[row][col] & RANK_MASK;
      let color = board[row][col] & COLOR_MASK;

      if (piece == ROOK || piece == BISHOP || piece == QUEEN) {
        let start_dir = piece == BISHOP ? 4 : 0;
        let end_dir = piece == ROOK ? 4 : 8;

        let moves = [];
        // console.log(piece, color);

        for (let dir = start_dir; dir < end_dir; dir++) {
          let squares_to_edge = SQUARES_TO_EDGE[row * 8 + col][dir];

          // console.log(squares_to_edge);

          for (let i = 0; i < squares_to_edge.length; i++) {
            let [x, y] = posToCoordinates(squares_to_edge[i]);

            if (board[y][x] == 0) {
              moves.push(squares_to_edge[i]);
            } else if ((board[y][x] & COLOR_MASK) == color) {
              break;
            } else {
              moves.push(squares_to_edge[i]);
              break;
            }
          }
        }

        valid_moves[row * 8 + col] = moves;
      }
    }
  }
}

function draw_board(held_piece) {
  // Draw the board
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 == 0) {
        fill(LIGHT_COLOR);
      } else {
        fill(DARK_COLOR);
      }
      noStroke();
      rect(i * TILE_WIDTH, j * TILE_WIDTH, TILE_WIDTH);
    }
  }

  // Draw the pieces
  board.forEach((row, y) => {
    row.forEach((piece, x) => {
      if (piece === 0 || y * 8 + x == held_piece) return;
      image(
        GRAPHICS[piece],
        x * TILE_WIDTH,
        y * TILE_WIDTH,
        TILE_WIDTH,
        TILE_WIDTH,
      );
    });
  });
}
