
(() => {
"use strict";

const $ = id => document.getElementById(id);
const canvas = $("game");
const ctx = canvas.getContext("2d");

const SAVE_KEY = "neonDriftAfterburn_v1";
const defaults = {
  credits: 0,
  best: 0,
  runs: 0,
  upgrades: { hull: 0, engine: 0, magnet: 0 }
};

let save;

try {
  save = { ...defaults, ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") };
  save.upgrades = { ...defaults.upgrades, ...(save.upgrades || {}) };
} catch {
  save = structuredClone(defaults);
}

const upgradeInfo = [
  {
    id: "hull",
    name: "REINFORCED HULL",
    desc: "Start every run with an extra life.",
    base: 90,
    max: 3
  },
  {
    id: "engine",
    name: "ION ENGINE",
    desc: "Move faster and control your ship more easily.",
    base: 70,
    max: 4
  },
  {
    id: "magnet",
    name: "CREDIT MAGNET",
    desc: "Collect credits from a greater distance.",
    base: 100,
    max: 3
  }
];

let player, rocks = [], orbs = [], powerups = [], particles = [];
let score = 0, lives = 3, runCredits = 0;
let frame = 0, raf = 0, active = false, paused = false;
let shield = 0, slow = 0, keys = {}, lastTime = 0;
let level = 1, nextRock = 0, nextOrb = 0, nextPowerup = 0;
let levelToast = 0;

const WIDTH = 360;
const HEIGHT = 600;
const LEVEL_LENGTH = 1500;

function persist() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  updateMeta();
}

function updateMeta() {
  $("bank").textContent = save.credits;
  $("shopBank").textContent = save.credits;
  $("bestHome").textContent = save.best;
  $("runsHome").textContent = save.runs;
  $("levelHome").textContent = 1 + save.upgrades.hull + save.upgrades.engine + save.upgrades.magnet;
  $("bestHud").textContent = save.best;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.toggle("active", s.id === id);
  });
}

document.querySelectorAll("[data-screen]").forEach(button => {
  button.addEventListener("click", () => {
    showScreen(button.dataset.screen);
    if (button.dataset.screen === "shop") renderShop();
  });
});

function renderShop() {
  $("shopBank").textContent = save.credits;
  $("upgradeList").innerHTML = "";

  upgradeInfo.forEach(u => {
    const lvl = save.upgrades[u.id];
    const cost = u.base * (lvl + 1);

    const el = document.createElement("article");
    el.className = "upgrade";

    el.innerHTML = `
      <div class="upgrade-head">
        <h3>${u.name}</h3>
        <span class="level">LVL ${lvl}/${u.max}</span>
      </div>
      <p>${u.desc}</p>
      <div class="upgrade-foot">
        <span class="level">
          ${lvl === u.max ? "MAX LEVEL" : "◆ " + cost + " CREDITS"}
        </span>
        <button class="buy" ${lvl >= u.max || save.credits < cost ? "disabled" : ""}>
          ${lvl === u.max ? "MAXED" : "UPGRADE"}
        </button>
      </div>
    `;

    el.querySelector("button").addEventListener("click", () => {
      if (lvl >= u.max || save.credits < cost) return;

      save.credits -= cost;
      save.upgrades[u.id]++;
      persist();
      renderShop();
    });

    $("upgradeList").appendChild(el);
  });
}

// Create a level display without requiring extra HTML changes.
function createLevelDisplay() {
  const hud = document.querySelector(".hud");
  if (!hud || $("levelDisplay")) return;

  const item = document.createElement("div");
  item.className = "hud-item";
  item.id = "levelDisplay";

  item.innerHTML = `
    <div class="hud-label">LEVEL</div>
    <div class="hud-value" id="levelValue">1</div>
    <div id="levelProgress" style="
      height:4px;
      background:#26334b;
      margin-top:7px;
      border-radius:5px;
      overflow:hidden;">
      <div id="levelBar" style="
        height:100%;
        width:0%;
        background:#00eaff;
        box-shadow:0 0 10px #00eaff;">
      </div>
    </div>
  `;

  hud.appendChild(item);
}

function updateLevelDisplay() {
  if (!$("levelValue")) return;

  $("levelValue").textContent = level;

  const progress = (score % LEVEL_LENGTH) / LEVEL_LENGTH * 100;
  $("levelBar").style.width = progress + "%";
}

function startRun() {
  cancelAnimationFrame(raf);
  showScreen("gameScreen");

  player = {
    x: 165,
    y: 520,
    w: 30,
    h: 36,
    speed: 5.5 + save.upgrades.engine * 0.65
  };

  rocks = [];
  orbs = [];
  powerups = [];
  particles = [];

  score = 0;
  runCredits = 0;
  lives = 3 + save.upgrades.hull;

  shield = 0;
  slow = 0;
  frame = 0;
  level = 1;

  nextRock = 70;
  nextOrb = 100;
  nextPowerup = 700;

  levelToast = 0;
  active = true;
  paused = false;
  lastTime = 0;

  $("score").textContent = "0";
  $("lives").textContent = "♥".repeat(lives);
  $("overlay").classList.add("hidden");

  createLevelDisplay();
  updateLevelDisplay();

  raf = requestAnimationFrame(loop);
}

function endRun() {
  active = false;
  cancelAnimationFrame(raf);

  const earned = runCredits + Math.floor(score / 100);

  save.credits += earned;
  save.runs++;
  save.best = Math.max(save.best, score);

  persist();

  $("finalScore").textContent = score;
  $("earned").textContent = earned;
  $("bestResult").textContent = save.best;

  showScreen("result");
}

function levelUp() {
  level++;

  const bonus = 25 + level * 10;
  runCredits += bonus;
  levelToast = 150;

  burst(WIDTH / 2, HEIGHT / 2, "#00eaff", 35);

  updateLevelDisplay();
}

function getDifficulty() {
  return Math.min(1, (level - 1) / 15);
}

function spawnRock() {
  const difficulty = getDifficulty();

  const size = 20 + Math.random() * 19;
  const speed = Math.min(
    4.5,
    2.1 + difficulty * 1.7 + Math.random() * 0.6
  );

  rocks.push({
    x: 10 + Math.random() * (WIDTH - size - 20),
    y: -size,
    size,
    speed,
    rot: Math.random() * 6,
    rotationSpeed: (Math.random() - 0.5) * 0.035,
    type: Math.random() < 0.5 ? "rock" : "diamond"
  });
}

function spawnOrb() {
  orbs.push({
    x: 18 + Math.random() * (WIDTH - 36),
    y: -15,
    r: 8,
    speed: 2.2 + getDifficulty() * 0.3
  });
}

function spawnPowerup() {
  powerups.push({
    x: 22 + Math.random() * (WIDTH - 44),
    y: -20,
    r: 12,
    type: Math.random() < 0.5 ? "shield" : "slow",
    speed: 2.1
  });
}

function hit(a, b, pad = 0) {
  return (
    a.x + pad < b.x + b.size &&
    a.x + a.w - pad > b.x &&
    a.y + pad < b.y + b.size &&
    a.y + a.h - pad > b.y
  );
}

function burst(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 25 + Math.random() * 20,
      color
    });
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#080e22");
  gradient.addColorStop(1, "#050711");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Moving stars
  for (let i = 0; i < 55; i++) {
    const y = (i * 83 + frame * (1 + i % 3) * 0.35) % HEIGHT;
    const x = (i * 67) % WIDTH;

    ctx.fillStyle = i % 4 === 0
      ? "rgba(0,234,255,.8)"
      : "rgba(130,155,210,.45)";

    ctx.fillRect(x, y, 2, 2);
  }

  // Neon grid
  ctx.strokeStyle = "rgba(0,234,255,.07)";
  ctx.lineWidth = 1;

  for (let x = 0; x < WIDTH; x += 45) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }

  for (let y = (frame * 1.1) % 45; y < HEIGHT; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  // Side borders
  ctx.fillStyle = "rgba(0,234,255,.5)";
  ctx.fillRect(3, 0, 1, HEIGHT);
  ctx.fillRect(WIDTH - 4, 0, 1, HEIGHT);
}

function drawShip() {
  ctx.save();

  ctx.translate(player.x + 15, player.y + 18);

  // Engine glow
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00eaff";
  ctx.fillStyle = "#4385ff";

  ctx.beginPath();
  ctx.moveTo(-5, 12);
  ctx.lineTo(0, 25 + Math.random() * 5);
  ctx.lineTo(5, 12);
  ctx.fill();

  // Ship body
  const gradient = ctx.createLinearGradient(0, -18, 0, 18);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.45, "#00eaff");
  gradient.addColorStop(1, "#4385ff");

  ctx.fillStyle = gradient;
  ctx.shadowBlur = 18;
  ctx.shadowColor = "#00eaff";

  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(14, 17);
  ctx.lineTo(0, 10);
  ctx.lineTo(-14, 17);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-2, -4, 4, 10);

  if (shield > 0) {
    ctx.strokeStyle = "#00eaff";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawRock(o) {
  ctx.save();

  ctx.translate(o.x + o.size / 2, o.y + o.size / 2);
  ctx.rotate(o.rot);

  ctx.shadowBlur = 15;
  ctx.shadowColor = "#ff3d9a";

  const gradient = ctx.createLinearGradient(
    -o.size / 2,
    -o.size / 2,
    o.size / 2,
    o.size / 2
  );

  gradient.addColorStop(0, "#ff8acb");
  gradient.addColorStop(1, "#a71978");

  ctx.fillStyle = gradient;

  if (o.type === "diamond") {
    ctx.beginPath();
    ctx.moveTo(0, -o.size / 2);
    ctx.lineTo(o.size / 2, 0);
    ctx.lineTo(0, o.size / 2);
    ctx.lineTo(-o.size / 2, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.roundRect(
      -o.size / 2,
      -o.size / 2,
      o.size,
      o.size,
      5
    );
    ctx.fill();
  }

  ctx.restore();
}

function moveTo(e) {
  if (!active || paused) return;

  const rect = canvas.getBoundingClientRect();

  player.x = Math.max(
    0,
    Math.min(
      WIDTH - player.w,
      (e.clientX - rect.left) * WIDTH / rect.width - player.w / 2
    )
  );
}

function loop(t) {
  if (!active || paused) return;

  const dt = lastTime
    ? Math.min(2, (t - lastTime) / 16.67)
    : 1;

  lastTime = t;
  frame += dt;

  drawBackground();

  // Level progression
  const newLevel = Math.floor(score / LEVEL_LENGTH) + 1;

  if (newLevel > level) {
    levelUp();
  }

  const difficulty = getDifficulty();

  // Gradually reduce time between spawns.
  const rockInterval = Math.max(48, 105 - (level - 1) * 3.5);
  const orbInterval = Math.max(75, 115 - (level - 1) * 1.2);

  nextRock -= dt;
  nextOrb -= dt;
  nextPowerup -= dt;

  if (nextRock <= 0) {
    spawnRock();
    nextRock = rockInterval * (0.85 + Math.random() * 0.3);
  }

  if (nextOrb <= 0) {
    spawnOrb();
    nextOrb = orbInterval * (0.8 + Math.random() * 0.4);
  }

  if (nextPowerup <= 0) {
    if (Math.random() < 0.65) spawnPowerup();
    nextPowerup = 750 + Math.random() * 300;
  }

  // Keyboard controls
  if (keys.ArrowLeft || keys.a || keys.A) {
    player.x -= player.speed * dt;
  }

  if (keys.ArrowRight || keys.d || keys.D) {
    player.x += player.speed * dt;
  }

  player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));

  drawShip();

  // Obstacles
  for (let i = rocks.length - 1; i >= 0; i--) {
    const o = rocks[i];

    o.y += o.speed * (slow > 0 ? 0.55 : 1) * dt;
    o.rot += o.rotationSpeed * dt;

    drawRock(o);

    if (hit(player, {
      x: o.x,
      y: o.y,
      size: o.size
    }, 7)) {
      rocks.splice(i, 1);

      if (shield > 0) {
        shield = 0;
        burst(player.x + 15, player.y + 15, "#00eaff", 18);
      } else {
        lives--;
        burst(player.x + 15, player.y + 15, "#ff3d9a", 16);

        $("lives").textContent = "♥".repeat(Math.max(0, lives));

        if (lives <= 0) {
          endRun();
          return;
        }
      }
    } else if (o.y > HEIGHT + 30) {
      rocks.splice(i, 1);
    }
  }

  // Credits
  for (let i = orbs.length - 1; i >= 0; i--) {
    const c = orbs[i];

    c.y += c.speed * dt;

    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#ffd166";
    ctx.fillStyle = "#ffd166";

    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const dist = Math.hypot(
      player.x + 15 - c.x,
      player.y + 15 - c.y
    );

    const magnetRange = save.upgrades.magnet
      ? 38 + save.upgrades.magnet * 18
      : 18;

    if (dist < magnetRange) {
      c.x += (player.x + 15 - c.x) * 0.12;
      c.y += (player.y + 15 - c.y) * 0.12;
    }

    if (dist < 22) {
      runCredits++;
      score += 25;
      burst(c.x, c.y, "#ffd166", 7);
      orbs.splice(i, 1);
    } else if (c.y > HEIGHT + 20) {
      orbs.splice(i, 1);
    }
  }

  // Power-ups
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];

    p.y += p.speed * dt;

    ctx.save();
    ctx.fillStyle = p.type === "shield" ? "#00eaff" : "#bd8aff";
    ctx.shadowBlur = 18;
    ctx.shadowColor = ctx.fillStyle;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (Math.hypot(player.x + 15 - p.x, player.y + 15 - p.y) < 25) {
      if (p.type === "shield") {
        shield = 600;
      } else {
        slow = 600;
      }

      burst(p.x, p.y, "#bd8aff", 12);
      powerups.splice(i, 1);
    } else if (p.y > HEIGHT + 20) {
      powerups.splice(i, 1);
    }
  }

  // Power-up timers
  if (shield > 0) shield = Math.max(0, shield - dt);
  if (slow > 0) slow = Math.max(0, slow - dt);

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    ctx.globalAlpha = Math.max(0, p.life / 40);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
    ctx.globalAlpha = 1;

    if (p.life <= 0) particles.splice(i, 1);
  }

  // Level-up notification
  if (levelToast > 0) {
    levelToast -= dt;

    ctx.save();
    ctx.globalAlpha = Math.min(1, levelToast / 20);
    ctx.textAlign = "center";

    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00eaff";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 27px Orbitron, sans-serif";
    ctx.fillText("LEVEL " + level, WIDTH / 2, 150);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#00eaff";
    ctx.font = "bold 13px Arial";
    ctx.fillText("+" + (25 + level * 10) + " BONUS CREDITS", WIDTH / 2, 175);

    ctx.restore();
  }

  // Score and HUD
  score += Math.max(1, Math.floor(dt));

  $("score").textContent = score;
  updateLevelDisplay();

  raf = requestAnimationFrame(loop);
}

function pause() {
  if (!active) return;

  paused = true;
  cancelAnimationFrame(raf);

  $("overlayTag").textContent = "PAUSED";
  $("overlayTitle").textContent = "RUN PAUSED";
  $("overlayText").textContent = "Your run is temporarily paused.";
  $("resumeBtn").textContent = "RESUME";

  $("overlay").classList.remove("hidden");
}

function resume() {
  if (!active) return;

  paused = false;
  $("overlay").classList.add("hidden");

  lastTime = 0;
  raf = requestAnimationFrame(loop);
}

$("playBtn").addEventListener("click", startRun);
$("againBtn").addEventListener("click", startRun);
$("pauseBtn").addEventListener("click", pause);
$("resumeBtn").addEventListener("click", resume);

$("quitBtn").addEventListener("click", () => {
  if (!active) return;

  active = false;
  cancelAnimationFrame(raf);
  showScreen("home");
});

canvas.addEventListener("pointerdown", e => {
  canvas.setPointerCapture?.(e.pointerId);
  moveTo(e);
});

canvas.addEventListener("pointermove", e => {
  if (e.buttons || e.pointerType === "touch") moveTo(e);
});

document.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (
    ["ArrowLeft", "ArrowRight", " "].includes(e.key)
  ) e.preventDefault();

  if (e.key === "Escape" && active) {
    paused ? resume() : pause();
  }
});

document.addEventListener("keyup", e => {
  keys[e.key] = false;
});

updateMeta();
renderShop();

})();
