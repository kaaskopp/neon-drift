
(() => {
"use strict";

const $ = id => document.getElementById(id);
const canvas = $("game");
if (!canvas) return;

const ctx = canvas.getContext("2d");
const W = 420, H = 700;
canvas.width = W;
canvas.height = H;

const SAVE_KEY = "neonDriftSpaceArcade_v1";

const defaults = {
  credits: 0,
  best: 0,
  runs: 0,
  upgrades: { hull: 0, engine: 0, weapon: 0, extra: 0 },
  inventory: ["laser"],
  equipped: { weapon: "laser", module: "none" },
  lastDaily: ""
};

let save;
try {
  save = JSON.parse(localStorage.getItem(SAVE_KEY)) || defaults;
} catch {
  save = defaults;
}

save = {
  ...defaults,
  ...save,
  upgrades: { ...defaults.upgrades, ...(save.upgrades || {}) },
  equipped: { ...defaults.equipped, ...(save.equipped || {}) },
  inventory: save.inventory || ["laser"]
};

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

const items = {
  laser: { name: "Standard Laser", rarity: "Common", type: "weapon", damage: 1, icon: "🔫" },
  double: { name: "Double Laser", rarity: "Rare", type: "weapon", damage: 2, icon: "⚡" },
  plasma: { name: "Plasma Cannon", rarity: "Epic", type: "weapon", damage: 3, icon: "💥" },
  nova: { name: "Nova Blaster", rarity: "Legendary", type: "weapon", damage: 5, icon: "🌟" },
  none: { name: "No Module", rarity: "Common", type: "module", health: 0, icon: "—" },
  shield: { name: "Shield Core", rarity: "Rare", type: "module", health: 1, icon: "🛡️" },
  reactor: { name: "Reactor Core", rarity: "Epic", type: "module", health: 0, icon: "🔋" }
};

let screen = "home";
let mode = "menu";
let score = 0;
let earned = 0;
let level = 1;
let lives = 3;
let objects = [];
let bullets = [];
let particles = [];
let lastFrame = 0;
let animationId = 0;
let spawnTimer = 0;
let fireTimer = 0;
let pointerDown = false;
let player = { x: W / 2, y: H - 100 };

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = $(id);
  if (target) target.classList.add("active");
  screen = id;

  if (id === "hangar") renderHangar();
  if (id === "packs") updateDailyButton();
  if (id === "upgrades") renderUpgrades();
  updateBank();
}

function updateBank() {
  if ($("bank")) $("bank").textContent = save.credits.toLocaleString();
  if ($("bestHome")) $("bestHome").textContent = save.best;
  if ($("runsHome")) $("runsHome").textContent = save.runs;
  if ($("shipLevelHome")) $("shipLevelHome").textContent = save.upgrades.hull + 1;
}

function getWeapon() {
  return items[save.equipped.weapon] || items.laser;
}

function getModule() {
  return items[save.equipped.module] || items.none;
}

function renderHangar() {
  if ($("shipName")) $("shipName").textContent = "NEON FIGHTER";

  const weapons = $("weaponSlots");
  const modules = $("moduleSlots");

  if (weapons) {
    weapons.innerHTML = "";
    save.inventory.filter(id => items[id]?.type === "weapon").forEach(id => {
      const item = items[id];
      const button = document.createElement("button");
      button.className = "upgrade-card";
      button.textContent = `${item.icon} ${item.name} (${item.rarity}) ${save.equipped.weapon === id ? "✓ EQUIPPED" : "EQUIP"}`;
      button.onclick = () => {
        save.equipped.weapon = id;
        saveGame();
        renderHangar();
      };
      weapons.appendChild(button);
    });
  }

  if (modules) {
    modules.innerHTML = "";
    save.inventory.filter(id => items[id]?.type === "module").forEach(id => {
      const item = items[id];
      const button = document.createElement("button");
      button.className = "upgrade-card";
      button.textContent = `${item.icon} ${item.name} ${save.equipped.module === id ? "✓ EQUIPPED" : "EQUIP"}`;
      button.onclick = () => {
        save.equipped.module = id;
        saveGame();
        renderHangar();
      };
      modules.appendChild(button);
    });
  }

  const inventory = $("inventory");
  if (inventory) {
    inventory.innerHTML = "";
    save.inventory.forEach(id => {
      const item = items[id];
      if (!item) return;
      const card = document.createElement("div");
      card.className = "upgrade-card";
      card.textContent = `${item.icon} ${item.name} — ${item.rarity}`;
      inventory.appendChild(card);
    });
  }
}

function renderUpgrades() {
  const area = $("upgradeList");
  if (!area) return;

  const upgrades = [
    ["hull", "Hull Strength", "More durability", 100],
    ["engine", "Engine Speed", "Move faster", 150],
    ["weapon", "Weapon Power", "Deal more damage", 200],
    ["extra", "Extra Life", "Start with another life", 300]
  ];

  area.innerHTML = "";

  upgrades.forEach(([id, name, desc, base]) => {
    const level = save.upgrades[id];
    const price = base * (level + 1);
    const card = document.createElement("div");
    card.className = "upgrade-card";
    card.innerHTML = `<h3>${name}</h3><p>${desc}</p><p>Level ${level}</p><button>UPGRADE — ${price} CR</button>`;
    card.querySelector("button").onclick = () => {
      if (save.credits < price) return alert("Not enough credits!");
      save.credits -= price;
      save.upgrades[id]++;
      saveGame();
      renderUpgrades();
      updateBank();
    };
    area.appendChild(card);
  });
}

function updateDailyButton() {
  const today = new Date().toDateString();
  const claimed = save.lastDaily === today;

  if ($("dailyBtn")) {
    $("dailyBtn").disabled = claimed;
    $("dailyBtn").textContent = claimed ? "DAILY PACK CLAIMED" : "CLAIM FREE DAILY PACK";
  }
  if ($("dailyStatus")) {
    $("dailyStatus").textContent = claimed ? "Come back tomorrow!" : "Your free daily pack is ready!";
  }
}

function openPack(free = false) {
  if (!free) {
    if (save.credits < 250) return alert("Not enough credits!");
    save.credits -= 250;
  }

  const roll = Math.random();
  let id = "laser";

  if (roll > .995) id = "nova";
  else if (roll > .96) id = "plasma";
  else if (roll > .82) id = "double";
  else if (roll > .65) id = "shield";
  else if (roll > .50) id = "reactor";

  if (!save.inventory.includes(id)) save.inventory.push(id);

  const item = items[id];

  if ($("packItemIcon")) $("packItemIcon").textContent = item.icon;
  if ($("packItemName")) $("packItemName").textContent = item.name;
  if ($("packRarity")) $("packRarity").textContent = item.rarity;
  if ($("packItemDesc")) $("packItemDesc").textContent = `You received ${item.name}!`;

  saveGame();
  updateBank();
  renderHangar();
}

function claimDaily() {
  const today = new Date().toDateString();
  if (save.lastDaily === today) return;
  save.lastDaily = today;
  saveGame();
  openPack(true);
  updateDailyButton();
}

function updateHUD() {
  if ($("score")) $("score").textContent = score;
  if ($("levelHud")) $("levelHud").textContent = level;
  if ($("lives")) $("lives").textContent = lives;
}

function startRun() {
  score = 0;
  earned = 0;
  level = 1;
  lives = 3 + save.upgrades.extra + (getModule().health || 0);

  objects = [];
  bullets = [];
  particles = [];

  spawnTimer = .5;
  fireTimer = 0;
  player.x = W / 2;
  player.y = H - 100;

  mode = "playing";
  showScreen("gameScreen");
  updateHUD();

  cancelAnimationFrame(animationId);
  lastFrame = performance.now();
  animationId = requestAnimationFrame(loop);
}

function pauseGame() {
  if (mode !== "playing") return;
  mode = "paused";
  if ($("overlay")) $("overlay").classList.add("active");
  if ($("overlayTag")) $("overlayTag").textContent = "PAUSED";
  if ($("overlayTitle")) $("overlayTitle").textContent = "MISSION PAUSED";
  if ($("overlayText")) $("overlayText").textContent = "Take a break, pilot.";
}

function resumeGame() {
  if (mode !== "paused") return;
  if ($("overlay")) $("overlay").classList.remove("active");
  mode = "playing";
  lastFrame = performance.now();
  animationId = requestAnimationFrame(loop);
}

function endRun() {
  if (mode !== "playing") return;
  mode = "over";

  save.runs++;
  save.credits += earned;
  save.best = Math.max(save.best, score);
  saveGame();

  if ($("finalScore")) $("finalScore").textContent = score;
  if ($("earned")) $("earned").textContent = earned;
  if ($("bestResult")) $("bestResult").textContent = save.best;

  updateBank();
  showScreen("result");
}

function spawnEnemy() {
  objects.push({
    x: 25 + Math.random() * (W - 50),
    y: -30,
    size: 16 + Math.random() * 13,
    speed: 100 + level * 15,
    hp: 1 + Math.floor(level / 4),
    crystal: false
  });
}

function spawnCrystal() {
  objects.push({
    x: 25 + Math.random() * (W - 50),
    y: -20,
    size: 10,
    speed: 130,
    hp: 1,
    crystal: true
  });
}

function shoot() {
  const weapon = getWeapon();
  const damage = weapon.damage + save.upgrades.weapon;

  bullets.push({ x: player.x, y: player.y - 25, damage });
  if (weapon.damage >= 2) {
    bullets.push({ x: player.x - 12, y: player.y - 15, damage });
    bullets.push({ x: player.x + 12, y: player.y - 15, damage });
  }
}

function update(dt) {
  spawnTimer -= dt;
  fireTimer -= dt;

  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(.25, 1 - level * .045);
  }

  if (Math.random() < dt * .18) spawnCrystal();

  if (fireTimer <= 0) {
    shoot();
    fireTimer = Math.max(.12, .35 - save.upgrades.weapon * .025);
  }

  const speed = 260 + save.upgrades.engine * 25;

  if (keys.left) player.x -= speed * dt;
  if (keys.right) player.x += speed * dt;

  player.x = Math.max(20, Math.min(W - 20, player.x));

  bullets.forEach(b => b.y -= 520 * dt);
  bullets = bullets.filter(b => b.y > -20);

  objects.forEach(o => o.y += o.speed * dt);

  for (const b of bullets) {
    for (const o of objects) {
      if (o.crystal || o.hp <= 0) continue;
      if (Math.hypot(b.x - o.x, b.y - o.y) < o.size + 6) {
        o.hp -= b.damage;
        b.y = -100;
        if (o.hp <= 0) {
          score += 10;
          earned += 5;
          for (let i = 0; i < 5; i++) {
            particles.push({ x: o.x, y: o.y, life: .5 });
          }
        }
        break;
      }
    }
  }

  objects = objects.filter(o => {
    if (o.y > H + 30) return false;
    if (o.hp <= 0) return false;

    if (o.crystal && Math.hypot(o.x - player.x, o.y - player.y) < 30) {
      score += 5;
      earned += 10;
      return false;
    }

    if (!o.crystal && Math.hypot(o.x - player.x, o.y - player.y) < o.size + 17) {
      lives--;
      updateHUD();
      if (lives <= 0) endRun();
      return false;
    }
    return true;
  });

  particles.forEach(p => p.life -= dt);
  particles = particles.filter(p => p.life > 0);

  level = 1 + Math.floor(score / 200);
  updateHUD();
}

function draw() {
  ctx.fillStyle = "#070b20";
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 65; i++) {
    const x = (i * 73) % W;
    const y = (i * 137 + Date.now() * .025) % H;
    ctx.fillStyle = "#52618b";
    ctx.fillRect(x, y, 2, 2);
  }

  objects.forEach(o => {
    ctx.beginPath();
    ctx.fillStyle = o.crystal ? "#27e8ff" : "#ff416d";
    ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2);
    ctx.fill();
  });

  bullets.forEach(b => {
    ctx.fillStyle = "#5fffff";
    ctx.fillRect(b.x - 3, b.y - 10, 6, 17);
  });

  particles.forEach(p => {
    ctx.fillStyle = "#ffcc55";
    ctx.fillRect(p.x, p.y, 4, 4);
  });

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = "#55eaff";
  ctx.beginPath();
  ctx.moveTo(0, -25);
  ctx.lineTo(19, 20);
  ctx.lineTo(0, 12);
  ctx.lineTo(-19, 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-4, -8, 8, 17);
  ctx.restore();
}

function loop(timestamp) {
  if (mode !== "playing") return;

  const dt = Math.min((timestamp - lastFrame) / 1000 || 0, .04);
  lastFrame = timestamp;

  update(dt);

  if (mode === "playing") {
    draw();
    animationId = requestAnimationFrame(loop);
  }
}

const keys = { left: false, right: false };

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
  if (e.key === "Escape") pauseGame();
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

canvas.addEventListener("pointerdown", e => {
  pointerDown = true;
  canvas.setPointerCapture(e.pointerId);
  movePlayer(e);
});

canvas.addEventListener("pointermove", e => {
  if (pointerDown && mode === "playing") movePlayer(e);
});

canvas.addEventListener("pointerup", () => pointerDown = false);
canvas.addEventListener("pointercancel", () => pointerDown = false);

function movePlayer(e) {
  const rect = canvas.getBoundingClientRect();
  player.x = (e.clientX - rect.left) / rect.width * W;
  player.x = Math.max(20, Math.min(W - 20, player.x));
}

function on(id, event, fn) {
  const el = $(id);
  if (el) el.addEventListener(event, fn);
}

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => {
    if (mode === "playing" || mode === "paused") return;
    showScreen(button.dataset.open);
  });
});

on("playBtn", "click", () => showScreen("tutorial"));
on("startBtn", "click", startRun);
on("againBtn", "click", startRun);
on("pauseBtn", "click", pauseGame);
on("resumeBtn", "click", resumeGame);
on("quitBtn", "click", () => {
  mode = "menu";
  if ($("overlay")) $("overlay").classList.remove("active");
  showScreen("home");
});
on("dailyBtn", "click", claimDaily);
on("buyPackBtn", "click", () => openPack(false));
on("packDoneBtn", "click", () => showScreen("packs"));

updateBank();
showScreen("home");

})();
