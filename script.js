// ===== Canvas Setup =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const canvasSize = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.75);
canvas.width = canvasSize;
canvas.height = canvasSize;

// ===== Grid Settings =====
const blockSize = 20;
const cols = Math.floor(canvas.width / blockSize);
const rows = Math.floor(canvas.height / blockSize);

// ===== Game State Variables =====
let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: -1 };
let nextDirection = { x: 0, y: -1 };
let food = { x: 5, y: 5 };
let multiplier = null;
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let gameRunning = false;
let multiplierActive = false;
let multiplierEndTime = 0;
let blasters = [];
let flames = [];
let deadlyBlocks = [];

const FLAME_DURATION = 3000;
const FLAME_WARNING = 2000;
const MULTIPLIER_TIME = 10000;
const DEADLY_BLOCK_DURATION = 4000;
const DEADLY_BLOCK_FLASH_TIME = 1000;
const DEADLY_BLOCK_LIMIT = 5;

// ===== Input =====
window.addEventListener("keydown", (e) => {
  if (!gameRunning) return;
  const key = e.key;
  if (key === "ArrowUp" && direction.y !== 1) nextDirection = { x: 0, y: -1 };
  else if (key === "ArrowDown" && direction.y !== -1) nextDirection = { x: 0, y: 1 };
  else if (key === "ArrowLeft" && direction.x !== 1) nextDirection = { x: -1, y: 0 };
  else if (key === "ArrowRight" && direction.x !== -1) nextDirection = { x: 1, y: 0 };
});

// ===== Utility Functions =====
function getSafeRandomPosition(padding = 1) {
  let pos, safe;
  do {
    pos = {
      x: Math.floor(Math.random() * (cols - 2)),
      y: Math.floor(Math.random() * (rows - 2)),
    };
    safe = !snake.some(seg => Math.abs(seg.x - pos.x) <= padding && Math.abs(seg.y - pos.y) <= padding);
    safe &&= !flames.some(f => f.x === pos.x && f.y === pos.y);
    safe &&= !(food && pos.x === food.x && pos.y === food.y);
    safe &&= !(multiplier && pos.x === multiplier.x && pos.y === multiplier.y);
    safe &&= !deadlyBlocks.some(d =>
      Math.abs(d.x - pos.x) < 2 && Math.abs(d.y - pos.y) < 2
    );
  } while (!safe);
  return pos;
}

// ===== Generators =====
function generateFood() {
  food = getSafeRandomPosition();
}

function spawnMultiplier() {
  multiplier = getSafeRandomPosition();
  setTimeout(() => {
    multiplier = null;
  }, MULTIPLIER_TIME);
}

function spawnBlaster() {
  const pos = getSafeRandomPosition(3);
  blasters.push({ x: pos.x, y: pos.y, time: Date.now(), warning: true });
}

function spawnDeadlyBlock() {
  if (deadlyBlocks.length >= DEADLY_BLOCK_LIMIT) return;

  const pos = getSafeRandomPosition(2);
  deadlyBlocks.push({
    x: pos.x,
    y: pos.y,
    created: Date.now(),
    flashing: false,
  });
}

// ===== Game Loop =====
function startGame() {
  snake = [{ x: 10, y: 10 }];
  direction = { x: 0, y: -1 };
  nextDirection = { x: 0, y: -1 };
  score = 0;
  gameRunning = true;
  multiplier = null;
  multiplierActive = false;
  multiplierEndTime = 0;
  blasters = [];
  flames = [];
  deadlyBlocks = [];

  document.getElementById("score-display").textContent = "Score: 0";
  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("hud").style.display = "block";
  canvas.style.display = "block";
  generateFood();
  requestAnimationFrame(update);
}

function update() {
  if (!gameRunning) return;

  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // Check collision
  if (
    head.x < 0 || head.y < 0 ||
    head.x >= cols || head.y >= rows ||
    snake.some(s => s.x === head.x && s.y === head.y)
  ) return endGame();

  // Flame damage
  if (flames.some(f => f.x === head.x && f.y === head.y)) {
    score = Math.max(0, score - 2);
    document.getElementById("score-display").textContent = "Score: " + score;
  }

  // Deadly block collision
  if (deadlyBlocks.some(d => isWithinSquare(head, d, 2))) return endGame();

  // Add new head
  snake.unshift(head);

  // Food
  if (head.x === food.x && head.y === food.y) {
    score += multiplierActive ? 2 : 1;
    document.getElementById("score-display").textContent = "Score: " + score;
    generateFood();

    if (!multiplier && Math.random() < 0.25) spawnMultiplier();
    if (score >= 10 && Math.random() < 0.4) spawnBlaster();
    if (score >= 15 && Math.random() < 0.5) spawnDeadlyBlock();
  } else {
    snake.pop();
  }

  // Multiplier pickup
  if (multiplier && head.x === multiplier.x && head.y === multiplier.y) {
    multiplierActive = true;
    multiplierEndTime = Date.now() + MULTIPLIER_TIME;
    multiplier = null;
  }

  if (multiplierActive && Date.now() > multiplierEndTime) {
    multiplierActive = false;
  }

  updateBlasters();
  updateDeadlyBlocks();
  draw();
  setTimeout(() => requestAnimationFrame(update), 120);
}

// ===== Collision Helpers =====
function isWithinSquare(pos, center, size) {
  return (
    pos.x >= center.x &&
    pos.x < center.x + size &&
    pos.y >= center.y &&
    pos.y < center.y + size
  );
}

// ===== Blasters & Flames =====
function updateBlasters() {
  const now = Date.now();
  blasters.forEach((b) => {
    if (b.warning && now - b.time >= FLAME_WARNING) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const x = b.x + dx;
          const y = b.y + dy;
          if (x >= 0 && y >= 0 && x < cols && y < rows) {
            flames.push({ x, y, created: now });
          }
        }
      }
      b.warning = false;
    }
  });
  flames = flames.filter(f => now - f.created < FLAME_DURATION);
  blasters = blasters.filter(b => now - b.time < FLAME_WARNING + FLAME_DURATION);
}

// ===== Deadly Block Flashing and Expiration =====
function updateDeadlyBlocks() {
  const now = Date.now();
  if (deadlyBlocks.length > DEADLY_BLOCK_LIMIT) {
    deadlyBlocks.sort((a, b) => a.created - b.created);
    const oldest = deadlyBlocks[0];
    if (!oldest.flashing) {
      oldest.flashing = true;
      setTimeout(() => {
        deadlyBlocks.shift();
      }, DEADLY_BLOCK_FLASH_TIME);
    }
  }
}

// ===== Drawing =====
function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Snake
  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? "darkgreen" : "#00ff88";
    ctx.fillRect(s.x * blockSize, s.y * blockSize, blockSize - 1, blockSize - 1);
  });

  // Food
  ctx.fillStyle = "green";
  ctx.fillRect(food.x * blockSize, food.y * blockSize, blockSize - 1, blockSize - 1);

  // Multiplier
  if (multiplier) {
    ctx.fillStyle = "gold";
    ctx.fillRect(multiplier.x * blockSize, multiplier.y * blockSize, blockSize - 1, blockSize - 1);
  }

  // Blaster + Warning
  blasters.forEach((b) => {
    ctx.fillStyle = b.warning ? "gray" : "red";
    ctx.fillRect(b.x * blockSize, b.y * blockSize, blockSize - 1, blockSize - 1);
  });

  // Flames
  flames.forEach((f) => {
    ctx.fillStyle = "orange";
    ctx.fillRect(f.x * blockSize, f.y * blockSize, blockSize - 1, blockSize - 1);
  });

  // Deadly Blocks (2x2)
  deadlyBlocks.forEach((d) => {
    for (let dx = 0; dx < 2; dx++) {
      for (let dy = 0; dy < 2; dy++) {
        const color = d.flashing ? (Math.floor(Date.now() / 200) % 2 === 0 ? "#f00" : "#800") : "#f00";
        ctx.fillStyle = color;
        ctx.fillRect((d.x + dx) * blockSize, (d.y + dy) * blockSize, blockSize - 1, blockSize - 1);
      }
    }
  });
}

// ===== UI Buttons =====
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

// ===== High Score =====
function updateHighScoreDisplay() {
  document.getElementById("high-score").textContent = highScore;
}
updateHighScoreDisplay();
