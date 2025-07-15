const canvas = document.getElementById('carromBoard');
const ctx = canvas.getContext('2d');

const hitSound = document.getElementById('hitSound');
const pocketSound = document.getElementById('pocketSound');

const resetBtn = document.getElementById('resetBtn');
const modeBtn = document.getElementById('modeBtn');
const modeText = document.getElementById('modeText');
const score1El = document.getElementById('score1');
const score2El = document.getElementById('score2');

let coins = [];
let striker = { x: 300, y: 550, vx: 0, vy: 0, radius: 12, isMoving: false };
let dragging = false;
let power = 0;
let angle = 0;
let currentPlayer = 1;
let singlePlayer = false;
let scores = [0, 0];

// Pockets
const pockets = [
  { x: 0, y: 0 },
  { x: 600, y: 0 },
  { x: 0, y: 600 },
  { x: 600, y: 600 }
];

function initCoins() {
  coins = [];
  // Central position for queen and coins
  const cx = 300, cy = 300;
  const colors = ['white', 'black', 'white', 'black', 'red'];
  for (let i = 0; i < colors.length; i++) {
    let angle = (i * Math.PI * 2) / colors.length;
    coins.push({
      x: cx + Math.cos(angle) * 20,
      y: cy + Math.sin(angle) * 20,
      vx: 0,
      vy: 0,
      radius: 8,
      color: colors[i],
      pocketed: false
    });
  }
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw coins
  for (let coin of coins) {
    if (!coin.pocketed) {
      ctx.beginPath();
      ctx.fillStyle = coin.color;
      ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw striker
  if (!striker.isMoving) {
    ctx.beginPath();
    ctx.fillStyle = '#FFD700';
    ctx.arc(striker.x, striker.y, striker.radius, 0, Math.PI * 2);
    ctx.fill();

    if (dragging) {
      ctx.beginPath();
      ctx.strokeStyle = '#00FFAA';
      ctx.moveTo(striker.x, striker.y);
      ctx.lineTo(striker.x + Math.cos(angle) * -power, striker.y + Math.sin(angle) * -power);
      ctx.stroke();
    }
  }
}

function update() {
  let moving = false;

  for (let obj of [striker, ...coins]) {
    if (obj.pocketed) continue;
    obj.x += obj.vx;
    obj.y += obj.vy;

    // Bounce off walls
    if (obj.x - obj.radius < 0 || obj.x + obj.radius > 600) obj.vx *= -0.9;
    if (obj.y - obj.radius < 0 || obj.y + obj.radius > 600) obj.vy *= -0.9;

    // Friction
    obj.vx *= 0.98;
    obj.vy *= 0.98;

    // Check pocketing
    for (let p of pockets) {
      const dx = obj.x - p.x;
      const dy = obj.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < 18) {
        obj.pocketed = true;
        obj.vx = obj.vy = 0;
        pocketSound.play();
        if (obj !== striker) {
          scores[currentPlayer - 1]++;
          updateScoreDisplay();
        }
      }
    }

    if (Math.abs(obj.vx) > 0.5 || Math.abs(obj.vy) > 0.5) moving = true;
  }

  striker.isMoving = moving;
}

function updateScoreDisplay() {
  score1El.textContent = scores[0];
  score2El.textContent = scores[1];
}

canvas.addEventListener('mousedown', (e) => {
  if (striker.isMoving) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  dragging = true;
  power = 0;
  angle = Math.atan2(my - striker.y, mx - striker.x);
});

canvas.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const dx = mx - striker.x;
  const dy = my - striker.y;
  power = Math.min(80, Math.sqrt(dx * dx + dy * dy));
  angle = Math.atan2(dy, dx);
});

canvas.addEventListener('mouseup', () => {
  if (!dragging) return;
  striker.vx = Math.cos(angle) * (power / 5);
  striker.vy = Math.sin(angle) * (power / 5);
  striker.isMoving = true;
  dragging = false;
  hitSound.play();
});

resetBtn.addEventListener('click', () => {
  resetGame();
});

modeBtn.addEventListener('click', () => {
  singlePlayer = !singlePlayer;
  modeText.textContent = singlePlayer ? 'Single Player' : 'Two Player';
  resetGame();
});

function resetGame() {
  striker.x = 300;
  striker.y = 550;
  striker.vx = striker.vy = 0;
  striker.isMoving = false;
  currentPlayer = 1;
  scores = [0, 0];
  updateScoreDisplay();
  initCoins();
}

function gameLoop() {
  drawBoard();
  update();

  // Switch turns if striker stopped
  if (!striker.isMoving && !dragging && striker.vx === 0 && striker.vy === 0) {
    if (coins.every(c => c.pocketed)) return; // Game over
    if (singlePlayer && currentPlayer === 2) {
      cpuPlay();
    } else if (!dragging) {
      currentPlayer = currentPlayer === 1 ? 2 : 1;
      striker.x = 300;
      striker.y = 550;
    }
  }

  requestAnimationFrame(gameLoop);
}

// CPU play (basic)
function cpuPlay() {
  let target = coins.find(c => !c.pocketed);
  if (!target) return;
  const dx = target.x - striker.x;
  const dy = target.y - striker.y;
  angle = Math.atan2(dy, dx);
  power = 60;
  setTimeout(() => {
    striker.vx = Math.cos(angle) * (power / 5);
    striker.vy = Math.sin(angle) * (power / 5);
    striker.isMoving = true;
    hitSound.play();
    currentPlayer = 1;
  }, 500);
}

// Start the game
initCoins();
gameLoop();
