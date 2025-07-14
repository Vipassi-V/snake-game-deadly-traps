// ===== Canvas Setup =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set fixed canvas size (75% of screen)
const canvasSize = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.75);
canvas.width = canvasSize;
canvas.height = canvasSize;

// Grid settings
const blockSize = 20;
const cols = Math.floor(canvas.width / blockSize);
const rows = Math.floor(canvas.height / blockSize);

// ===== Game State Variables =====
let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: -1 }; // Start moving up
let nextDirection = { x: 0, y: -1 };
let food = { x: 5, y: 5 };
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let gameRunning = false;

// ===== Input Controls =====
window.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

  const key = e.key;
  if (key === "ArrowUp" && direction.y !== 1) nextDirection = { x: 0, y: -1 };
  else if (key === "ArrowDown" && direction.y !== -1) nextDirection = { x: 0, y: 1 };
  else if (key === "ArrowLeft" && direction.x !== 1) nextDirection = { x: -1, y: 0 };
  else if (key === "ArrowRight" && direction.x !== -1) nextDirection = { x: 1, y: 0 };
});

// ===== Food Generator =====
function generateFood() {
  let valid = false;
  while (!valid) {
    food.x = Math.floor(Math.random() * cols);
    food.y = Math.floor(Math.random() * rows);
    valid = !snake.some(block => block.x === food.x && block.y === food.y);
  }
}

// ===== Game Loop =====
function startGame() {
  // Reset values
  snake = [{ x: 10, y: 10 }];
  direction = { x: 0, y: -1 };
  nextDirection = { x: 0, y: -1 };
  score = 0;

  document.getElementById("score-display").textContent = "Score: 0";
  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("hud").style.display = "block";
  canvas.style.display = "block";

  generateFood();
  gameRunning = true;
  requestAnimationFrame(update);
}

function update() {
  if (!gameRunning) return;

  direction = nextDirection;
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  // Wall collision
  if (newHead.x < 0 || newHead.y < 0 || newHead.x >= cols || newHead.y >= rows) {
    endGame();
    return;
  }

  // Self collision
  if (snake.some(block => block.x === newHead.x && block.y === newHead.y)) {
    endGame();
    return;
  }

  // Eating food
  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    document.getElementById("score-display").textContent = "Score: " + score;
    generateFood();
  } else {
    snake.pop();
  }

  snake.unshift(newHead);

  draw();
  setTimeout(() => requestAnimationFrame(update), 120);
}

// ===== Drawing =====
function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw snake
  snake.forEach((block, index) => {
    ctx.fillStyle = index === 0 ? "darkgreen" : "#00ff88";
    ctx.fillRect(block.x * blockSize, block.y * blockSize, blockSize - 1, blockSize - 1);
  });

  // Draw food
  ctx.fillStyle = "green";
  ctx.fillRect(food.x * blockSize, food.y * blockSize, blockSize - 1, blockSize - 1);
}

// ===== UI Events =====
document.getElementById("play-button").addEventListener("click", () => {
  document.getElementById("start-screen").style.display = "none";
  startGame();
});

document.getElementById("return-menu").addEventListener("click", () => {
  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("start-screen").style.display = "flex";
  document.getElementById("hud").style.display = "none";
  canvas.style.display = "none";
  updateHighScoreDisplay();
});

// ===== Game Over =====
function endGame() {
  gameRunning = false;

  document.getElementById("final-score").textContent = score;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }

  document.getElementById("game-over-screen").style.display = "flex";
}

// ===== High Score Display =====
function updateHighScoreDisplay() {
  document.getElementById("high-score").textContent = highScore;
}

// Show high score on load
updateHighScoreDisplay();
