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

// ===== Game Variables =====
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
let flameTimers = [];

const FLAME_DURATION = 3000;
const FLAME_WARNING = 2000;
const MULTIPLIER_TIME = 10000;

// ===== Input =====
window.addEventListener("keydown", (e) => {
  if (!gameRunning) return;
  const key = e.key;
  if (key === "ArrowUp" && direction.y !== 1) nextDirection = { x: 0, y: -1 };
  else if (key === "ArrowDown" && direction.y !== -1) nextDirection = { x: 0, y: 1 };
  else if (key === "ArrowLeft" && direction.x !== 1) nextDirection = { x: -1, y: 0 };
  else if (key === "ArrowRight" && direction.x !== -1) nextDirection = { x: 1, y: 0 };
});

// ===== Food, Multiplier, Blaster Generators =====
function generateFood() {
  food = getSafeRandomPosition();
}

function spawnMultiplier() {
  multiplier = getSafeRandomPosition();
  setTimeout(() => multiplier = null, MULTIPLIER_TIME);
}

function spawnBlaster() {
  const blasterPos = getSafeRandomPosition(3);
  blasters.push({ x: blasterPos.x, y: blasterPos.y, time: Date.now(), warning: true });
}

function getSafeRandomPosition(padding = 1) {
  let pos, safe;
  do {
    pos = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
    safe = !snake.some(seg => Math.abs(seg.x - pos.x) <= padding && Math.abs(seg.y - pos.y) <= padding);
    safe &&= !(food && pos.x === food.x && pos.y === food.y);
    safe &&= !(multiplier && pos.x === multiplier.x && pos.y === multiplier.y);
    safe &&= !flames.some(f => f.x === pos.x && f.y === pos.y);
  } while (!safe);
  return pos;
}

// ===== Game Control =====
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
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  // Wall or self collision
  if (newHead.x < 0 || newHead.y < 0 || newHead.x >= cols || newHead.y >= rows ||
      snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
    return endGame();
  }

  // Check flame collision
  if (flames.some(f => f.x === newHead.x && f.y === newHead.y)) {
    score = Math.max(0, score - 2);
    document.getElementById("score-display").textContent = "Score: " + score;
  }

  snake.unshift(newHead);

  // Check food
  if (newHead.x === food.x && newHead.y === food.y) {
    score += multiplierActive ? 2 : 1;
    document.getElementById("score-display").textContent = "Score: " + score;
    generateFood();

    // Chance to spawn multiplier
    if (!multiplier && Math.random() < 0.3) spawnMultiplier();
    if (score >= 10 && Math.random() < 0.4) spawnBlaster();
  } else {
    snake.pop();
  }

  // Check multiplier pickup
  if (multiplier && newHead.x === multiplier.x && newHead.y === multiplier.y) {
    multiplierActive = true;
    multiplierEndTime = Date.now() + MULTIPLIER_TIME;
    multiplier = null;
  }

  // Multiplier timeout
  if (multiplierActive && Date.now() > multiplierEndTime) {
    multiplierActive = false;
  }

  updateBlasters();
  draw();
  setTimeout(() => requestAnimationFrame(update), 120);
}

// ===== Blaster Logic =====
function updateBlasters() {
  const now = Date.now();
  blasters.forEach((b, i) => {
    if (b.warning && now - b.time >= FLAME_WARNING) {
      // Turn into flame
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const fx = b.x + dx;
          const fy = b.y + dy;
          if (fx >= 0 && fy >= 0 && fx < cols && fy < rows) {
            flames.push({ x: fx, y: fy, created: now });
          }
        }
      }
      b.warning = false;
    }
  });

  // Remove old flames
  flames = flames.filter(f => now - f.created < FLAME_DURATION);
  blasters = blasters.filter(b => now - b.time < FLAME_WARNING + FLAME_DURATION);
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

  // Blaster Warnings
  blasters.forEach(b => {
    if (b.warning) {
      ctx.fillStyle = "gray";
      ctx.fillRect(b.x * blockSize, b.y * blockSize, blockSize - 1, blockSize - 1);
    } else {
      ctx.fillStyle = "red";
      ctx.fillRect(b.x * blockSize, b.y * blockSize, blockSize - 1, blockSize - 1);
    }
  });

  // Flames
  flames.forEach(f => {
    ctx.fillStyle = "orange";
    ctx.fillRect(f.x * blockSize, f.y * blockSize, blockSize - 1, blockSize - 1);
  });
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

// ===== High Score =====
function updateHighScoreDisplay() {
  document.getElementById("high-score").textContent = highScore;
}
updateHighScoreDisplay();
