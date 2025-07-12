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

// ===== Snake Setup =====
let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: -1 }; // Start moving up
let nextDirection = { x: 0, y: -1 };
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

// ===== Game Loop =====
function startGame() {
  snake = [{ x: 10, y: 10 }];
  direction = { x: 0, y: -1 };
  nextDirection = { x: 0, y: -1 };
  gameRunning = true;
  canvas.style.display = "block";
  requestAnimationFrame(update);
}

function update() {
  if (!gameRunning) return;

  // Move snake
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

  snake.unshift(newHead); // Add head
  snake.pop(); // Remove tail

  draw();
  setTimeout(() => requestAnimationFrame(update), 120);
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw snake
  snake.forEach((block, index) => {
    ctx.fillStyle = index === 0 ? "darkgreen" : "#00ff88";
    ctx.fillRect(block.x * blockSize, block.y * blockSize, blockSize - 1, blockSize - 1);
  });
}

// ===== Game Start Hook (linked to play button) =====
document.getElementById("play-button").addEventListener("click", () => {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("hud").style.display = "block";
  startGame();
});

function endGame() {
  gameRunning = false;
  document.getElementById("game-over-screen").style.display = "flex";
  document.getElementById("final-score").textContent = "0"; // Placeholder
}
