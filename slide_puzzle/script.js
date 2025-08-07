const boardElement = document.getElementById('board');
const shuffleBtn = document.getElementById('shuffle');

const hintToggleBtn = document.getElementById('hint-toggle');
const helpBtn = document.getElementById('help');

const solved = [1,2,3,4,5,6,7,8,0];
let hintActive = false;
let helpCooldown = false;


let board = [];

function initBoard() {
  board = [1,2,3,4,5,6,7,8,0];
  shuffleBoard();
  render();
}

function shuffleBoard(moves = 100) {
  for (let i = 0; i < moves; i++) {
    const blank = board.indexOf(0);
    const neighbors = getNeighbors(blank);
    const swapWith = neighbors[Math.floor(Math.random() * neighbors.length)];
    [board[blank], board[swapWith]] = [board[swapWith], board[blank]];
  }
}

function getNeighbors(index) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const neighbors = [];
  if (row > 0) neighbors.push(index - 3);
  if (row < 2) neighbors.push(index + 3);
  if (col > 0) neighbors.push(index - 1);
  if (col < 2) neighbors.push(index + 1);
  return neighbors;
}

function render() {
  boardElement.innerHTML = '';
  board.forEach((num, idx) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    if (num === 0) {
      tile.classList.add('blank');
    } else {
      tile.textContent = num;
      tile.addEventListener('click', () => moveTile(idx));

      if (hintActive && num === solved[idx]) {
        tile.classList.add('correct');
      }

    }
    boardElement.appendChild(tile);
  });
}

function moveTile(index) {
  const blank = board.indexOf(0);
  if (getNeighbors(blank).includes(index)) {
    [board[blank], board[index]] = [board[index], board[blank]];
    render();
    if (isSolved()) {
      setTimeout(() => alert('クリア！'), 100);
    }
  }
}

function isSolved() {
  for (let i = 0; i < 8; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[8] === 0;
}

shuffleBtn.addEventListener('click', () => {
  shuffleBoard();
  render();
});


hintToggleBtn.addEventListener('click', () => {
  hintActive = !hintActive;
  hintToggleBtn.textContent = hintActive ? 'ヒントON' : 'ヒントOFF';
  render();
});

function getCorrectCount(arr) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === solved[i]) count++;
  }
  return count;
}

function makeHelpfulMove() {
  const blank = board.indexOf(0);
  const neighbors = getNeighbors(blank);
  let bestNeighbor = null;
  let bestScore = -1;
  neighbors.forEach(n => {
    const copy = board.slice();
    [copy[blank], copy[n]] = [copy[n], copy[blank]];
    const score = getCorrectCount(copy);
    if (score > bestScore) {
      bestScore = score;
      bestNeighbor = n;
    }
  });
  if (bestNeighbor !== null) {
    moveTile(bestNeighbor);
  }
}

helpBtn.addEventListener('click', () => {
  if (helpCooldown) return;
  makeHelpfulMove();
  helpCooldown = true;
  helpBtn.disabled = true;
  setTimeout(() => {
    helpCooldown = false;
    helpBtn.disabled = false;
  }, 3000);
});


initBoard();
