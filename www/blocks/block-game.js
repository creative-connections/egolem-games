class BlockGame extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
    <p style="color:white;position:absolute;top:15px">score: <span id='score'>0</span></p>
            <canvas width="450" height="640" id="game" style="border:1px solid white;"></canvas>
        `;
  }

  connectedCallback() {
    this.initializeGame();
    this.startGame();
    this.handleEvents();
  }

  initializeGame() {
    this.canvas = this.shadowRoot.getElementById('game');
    this.score_el = this.shadowRoot.getElementById('score');
    this.context = this.canvas.getContext('2d');
    this.grid = 32;
    this.maxcol = 14;
    this.score = 0;
    this.scoreinc = 1;
    this.tetrominoSequence = [];
    this.playfield = [];
    this.count = 0;

    for (let row = -2; row < 20; row++) {
      this.playfield[row] = [];

      for (let col = 0; col < this.maxcol; col++) {
        this.playfield[row][col] = 0;
      }
    }

    this.tetrominos = {
      'I': [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      'J': [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      'L': [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      'O': [
        [1, 1],
        [1, 1],
      ],
      'S': [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      'Z': [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      'T': [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      'l': [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      'i': [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ]
    };

    this.colors = {
      'I': 'cyan',
      'O': 'yellow',
      'T': 'purple',
      'S': 'green',
      'Z': 'red',
      'J': 'blue',
      'L': 'orange',
      'l': 'orange',
      'i': 'cyan'
    };

    this.tetromino = this.getNextTetromino();
  }

  startGame() {
    this.rAF = requestAnimationFrame(() => this.loop());
  }

  handleEvents() {
    document.addEventListener('keydown', (e) => {
      if (this.gameOver) return;
      if (e.which === 37) this.left();
      if (e.which === 39) this.right();
      if (e.which === 38) this.rotateTouch();
      if (e.which === 40) this.down();
    });
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateSequence() {
    const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z', 'l', 'i'];

    while (sequence.length) {
      const rand = this.getRandomInt(0, sequence.length - 1);
      const name = sequence.splice(rand, 1)[0];
      this.tetrominoSequence.push(name);
    }
  }

  getNextTetromino() {
    if (this.tetrominoSequence.length === 0) {
      this.generateSequence();
    }

    const name = this.tetrominoSequence.pop();
    const matrix = this.tetrominos[name];

    // I and O start centered, all others start in left-middle
    const col = this.playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

    // I starts on row 21 (-1), all others start on row 22 (-2)
    const row = name === 'I' ? -1 : -2;

    return {
      name: name,      // name of the piece (L, O, etc.)
      matrix: matrix,  // the current rotation matrix
      row: row,        // current row (starts offscreen)
      col: col         // current col
    };
  }

  rotate(matrix) {
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
      row.map((val, j) => matrix[N - j][i])
    );

    return result;
  }

  isValidMove(matrix, cellRow, cellCol) {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] && (
          // outside the game bounds
          cellCol + col < 0 ||
          cellCol + col >= this.playfield[0].length ||
          cellRow + row >= this.playfield.length ||
          // collides with another piece
          this.playfield[cellRow + row][cellCol + col])
        ) {
          return false;
        }
      }
    }

    return true;
  }

  placeTetromino() {
    for (let row = 0; row < this.tetromino.matrix.length; row++) {
      for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
        if (this.tetromino.matrix[row][col]) {

          // game over if piece has any part offscreen
          if (this.tetromino.row + row < 0) {
            return this.showGameOver();
          }

          this.playfield[this.tetromino.row + row][this.tetromino.col + col] = this.tetromino.name;
        }
      }
    }

    this.scoreinc = 1;
    // check for line clears starting from the bottom and working our way up
    for (let row = this.playfield.length - 1; row >= 0;) {
      if (this.playfield[row].every(cell => !!cell)) {
        this.score += this.scoreinc;
        this.scoreinc++;
        this.score_el.innerText = this.score;
        // drop every row above this one
        for (let r = row; r >= 0; r--) {
          for (let c = 0; c < this.playfield[r].length; c++) {
            this.playfield[r][c] = this.playfield[r - 1][c];
          }
        }
      }
      else {
        row--;
      }
    }

    this.tetromino = this.getNextTetromino();
  }

  showGameOver() {
    cancelAnimationFrame(this.rAF);
    this.gameOver = true;

    this.context.fillStyle = 'black';
    this.context.globalAlpha = 0.75;
    this.context.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);

    this.context.globalAlpha = 1;
    this.context.fillStyle = 'white';
    this.context.font = '36px monospace';
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.fillText('GAME OVER!', this.canvas.width / 2, this.canvas.height / 2);
  }

  loop() {    
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // draw the playfield
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < this.maxcol; col++) {
        if (this.playfield[row][col]) {
          const name = this.playfield[row][col];
          this.context.fillStyle = this.colors[name];

          // drawing 1 px smaller than the grid creates a grid effect
          this.context.fillRect(col * this.grid, row * this.grid, this.grid - 1, this.grid - 1);
        }
      }
    }

    // draw the active tetromino
    if (this.tetromino) {

      // tetromino falls every 35 frames
      if (++this.count > 35) {
        this.tetromino.row++;
        this.count = 0;

        // place piece if it runs into anything
        if (!this.isValidMove(this.tetromino.matrix, this.tetromino.row, this.tetromino.col)) {
          this.tetromino.row--;
          this.placeTetromino();
        }
      }

      this.context.fillStyle = this.colors[this.tetromino.name];

      for (let row = 0; row < this.tetromino.matrix.length; row++) {
        for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
          if (this.tetromino.matrix[row][col]) {

            // drawing 1 px smaller than the grid creates a grid effect
            this.context.fillRect((this.tetromino.col + col) * this.grid, (this.tetromino.row + row) * this.grid, this.grid - 1, this.grid - 1);
          }
        }
      }
    }
    this.rAF = requestAnimationFrame(() => this.loop());    
  }

  rotateTouch() {
    const matrix = this.rotate(this.tetromino.matrix);
    if (this.isValidMove(this.tetromino.matrix, this.tetromino.row, this.tetromino.col)) {
      this.tetromino.matrix = matrix;
    }
  }

  down() {
    const row = this.tetromino.row + 1;
    if (!this.isValidMove(this.tetromino.matrix, row, this.tetromino.col)) {
      this.tetromino.row = row - 1;

      this.placeTetromino();
      return;
    }

    this.tetromino.row = row;

  }

  left() {
    const col = this.tetromino.col - 1
    if (this.isValidMove(this.tetromino.matrix, this.tetromino.row, col)) {
      this.tetromino.col = col;
    }
  }

  right() {
    const col = this.tetromino.col + 1;
    if (this.isValidMove(this.tetromino.matrix, this.tetromino.row, col)) {
      this.tetromino.col = col;
    }
  }
}

customElements.define('tetris-game', TetrisGame);
