function posToCoordinates(pos) {
  let x = pos % 8;
  let y = Math.floor(pos / 8);

  return [x, y];
}

function mouseToCoordinate() {
  return [Math.floor(mouseX / 100), Math.floor(mouseY / 100)];
}

function get_king_pos(board) {
  let positions = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      if ((board[row][col] & RANK_MASK) == KING) positions.push(row * 8 + col);
    }
  }
  return positions;
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

const KNIGHT_DIRECTIONS = [
  [1, -2],
  [2, -1],
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
];

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

const EN_PASSANT = {
  black: [false, false, false, false, false, false, false, false],
  white: [false, false, false, false, false, false, false, false],
};

let PROMOTE_TO = QUEEN;

let board = [
  [19, 18, 20, 22, 21, 20, 18, 19],
  [17, 17, 17, 17, 17, 17, 17, 17],
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

let current_turn = WHITE;

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

const SELECT_IMAGES = {};

function preload() {
  SELECT_IMAGES["dot"] = loadImage("images/dot.png");
  SELECT_IMAGES["circle"] = loadImage("images/circle.png");

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
  valid_moves = generate_moves(current_turn);
}

//queen, rook bishop knight
function keyPressed() {
  if (keyCode == 81) PROMOTE_TO = QUEEN;
  else if (keyCode == 82) PROMOTE_TO = ROOK;
  else if (keyCode == 66) PROMOTE_TO = BISHOP;
  else if (keyCode == 75) PROMOTE_TO = KNIGHT;

  console.log(`promotion to ${PROMOTE_TO}`);
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

    valid_moves[held_piece.position]?.forEach((position) => {
      let [x, y] = posToCoordinates(position);
      let scale_factor = 1.5;
      tint(255, 100);
      image(
        SELECT_IMAGES[board[y][x] ? "circle" : "dot"],
        x * TILE_WIDTH + (TILE_WIDTH - TILE_WIDTH / scale_factor) / 2,
        y * TILE_WIDTH + (TILE_WIDTH - TILE_WIDTH / scale_factor) / 2,
        TILE_WIDTH / scale_factor,
        TILE_WIDTH / scale_factor,
      );
      tint(255, 255);
    });
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

  if (valid_moves[held_piece.position]?.includes(y * 8 + x)) {
    let [x_prev, y_prev] = posToCoordinates(held_piece.position);

    EN_PASSANT["black"] = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
    EN_PASSANT["white"] = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];

    if ((held_piece.piece & RANK_MASK) == PAWN) {
      if (y_prev == 1 && y == 3) {
        EN_PASSANT["black"][x_prev] = true;
      } else if (y_prev == 6 && y == 4) {
        EN_PASSANT["white"][x_prev] = true;
      }

      if (board[y][x] == 0 && x_prev != x) {
        // en passant !
        board[y_prev][x] = 0;
      }
    }

    current_turn = current_turn == 8 ? 16 : 8;
    board[y_prev][x_prev] = 0;
    board[y][x] = held_piece.piece;

    if ((held_piece.piece & RANK_MASK) == PAWN) {
      let color = held_piece.piece & COLOR_MASK;
      if ((y == 0 && color == WHITE) || (y == 7 && color == BLACK)) {
        board[y][x] = PROMOTE_TO + color;
      }
    }

    valid_moves = generate_moves(current_turn);

    for (const position in valid_moves) {
      valid_moves[position].forEach((target_position, index) => {
        let [x_from, y_from] = posToCoordinates(position);
        let [x_to, y_to] = posToCoordinates(target_position);

        let piece_from = board[y_from][x_from];
        let piece_to = board[y_to][x_to];
        board[y_from][x_from] = 0;
        board[y_to][x_to] = piece_from;

        let next_moves = generate_moves(current_turn == 8 ? 16 : 8);

        let king_pos = get_king_pos(board);
        for (const from in next_moves) {
          if (
            next_moves[from].includes(king_pos[0]) ||
            next_moves[from].includes(king_pos[1])
          ) {
            valid_moves[position] = valid_moves[position].filter((pos) => {
              return pos != target_position;
            });
            break;
          }
        }

        board[y_from][x_from] = piece_from;
        board[y_to][x_to] = piece_to;
      });
    }
  }

  let no_moves = true;
  for (const from in valid_moves) {
    if (valid_moves[from].length > 0) no_moves = false;
  }

  if (no_moves) {
    let next_moves = generate_moves(current_turn == 8 ? 16 : 8);
    let king_pos = get_king_pos(board);

    let checkmate = false;
    for (const from in next_moves) {
      if (
        next_moves[from].includes(king_pos[0]) ||
        next_moves[from].includes(king_pos[1])
      ) {
        checkmate = true;
        break;
      }
    }

    if (checkmate) {
      console.log("Checkmate!");
    } else {
      console.log("Stalemate!");
    }
  }

  held_piece.position = null;
  held_piece.piece = null;
}

function generate_moves(current_turn) {
  let valid_moves = {};

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] == 0) continue;

      let piece = board[row][col] & RANK_MASK;
      let color = board[row][col] & COLOR_MASK;

      if (current_turn != color) continue;

      if (piece == ROOK || piece == BISHOP || piece == QUEEN) {
        let start_dir = piece == BISHOP ? 4 : 0;
        let end_dir = piece == ROOK ? 4 : 8;

        let moves = [];
        for (let dir = start_dir; dir < end_dir; dir++) {
          let squares_to_edge = SQUARES_TO_EDGE[row * 8 + col][dir];

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

      if (piece == KNIGHT) {
        let moves = [];

        KNIGHT_DIRECTIONS.forEach((direction) => {
          let x = col + direction[0];
          let y = row + direction[1];

          if (
            x >= 0 &&
            x <= 7 &&
            y >= 0 &&
            y <= 7 &&
            (board[y][x] == 0 || (board[y][x] & COLOR_MASK) != color)
          ) {
            moves.push(y * 8 + x);
          }
        });

        valid_moves[row * 8 + col] = moves;
      }

      if (piece == PAWN) {
        let moves = [];
        let move_dir = color == WHITE ? -1 : 1;

        let y = row + move_dir;
        let x = col;

        if (y >= 0 && y <= 7 && board[y][x] == 0) {
          moves.push(y * 8 + x);
        }

        if (
          ((row == 1 && color == BLACK) || (row == 6 && color == WHITE)) &&
          board[y][x] == 0 &&
          board[y + move_dir][x] == 0
        ) {
          moves.push((y + move_dir) * 8 + x);
        }

        if (
          x + 1 >= 0 &&
          x + 1 <= 7 &&
          board[y][x + 1] &&
          (board[y][x + 1] & COLOR_MASK) != color
        ) {
          moves.push(y * 8 + x + 1);
        }
        if (
          x - 1 >= 0 &&
          x - 1 <= 7 &&
          board[y][x - 1] &&
          (board[y][x - 1] & COLOR_MASK) != color
        ) {
          moves.push(y * 8 + x - 1);
        }

        if (
          row == 3 &&
          color == WHITE &&
          (board[row][x - 1] & COLOR_MASK) == BLACK &&
          EN_PASSANT["black"][x - 1]
        ) {
          moves.push(y * 8 + x - 1);
        }
        if (
          row == 3 &&
          color == WHITE &&
          (board[row][x + 1] & COLOR_MASK) == BLACK &&
          EN_PASSANT["black"][x + 1]
        ) {
          moves.push(y * 8 + x + 1);
        }
        if (
          row == 4 &&
          color == BLACK &&
          (board[row][x - 1] & COLOR_MASK) == WHITE &&
          EN_PASSANT["white"][x - 1]
        ) {
          moves.push(y * 8 + x - 1);
        }
        if (
          row == 4 &&
          color == BLACK &&
          (board[row][x + 1] & COLOR_MASK) == WHITE &&
          EN_PASSANT["white"][x + 1]
        ) {
          moves.push(y * 8 + x + 1);
        }

        valid_moves[row * 8 + col] = moves;
      }

      if (piece == KING) {
        let moves = [];
        DIRECTIONS.forEach((direction) => {
          let x = col + direction[0];
          let y = row + direction[1];

          if (
            x >= 0 &&
            x <= 7 &&
            y >= 0 &&
            y <= 7 &&
            (board[y][x] == 0 || (board[y][x] & COLOR_MASK) != color)
          ) {
            moves.push(y * 8 + x);
          }
        });
        valid_moves[row * 8 + col] = moves;
      }
    }
  }

  return valid_moves;
}

function draw_board(held_piece) {
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
