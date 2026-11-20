
(() => {
"use strict";

/* =========================
   NEON DRIFT: SPACE ARCADE
   ========================= */

const $ = id => document.getElementById(id);
const canvas = $("game");
const ctx = canvas ? canvas.getContext("2d") : null;

if (!canvas || !ctx) {
  console.error("NEON DRIFT: game canvas not found.");
  return;
}

const W = 420;
const H = 700;
canvas.width = W;
canvas.height = H;

const SAVE_KEY = "neonDriftSpaceArcade_v1";

const defaults = {
  credits: 0,
  best: 0,
  runs: 0,
  upgrades: {
    hull: 0,
    engine: 0,
    weapon: 0,
    extra: 0
  },
  inventory: [
    "weapon_basic",
    "module_basic"
  ],
  equipped: {
    weapon: "weapon_basic",
    module: "module_basic"
  },
  dailyClaim: "",
  tutorialSeen: false
};

function loadSave() {
  try {
    const old = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!old) return structuredClone(defaults);

    return {
      ...structuredClone(defaults),
      ...old,
      upgrades: {
        ...defaults.upgrades,
        ...(old.upgrades || {})
      },
      equipped: {
        ...defaults.equipped,
        ...(old.equipped || {})
      },
      inventory: Array.isArray(old.inventory)
        ? old.inventory
        : [...defaults.inventory]
    };
  } catch (error) {
    console.warn("Save could not be loaded:", error);
    return structuredClone(defaults);
  }
}

let save = loadSave();

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (error) {
    console.warn("Save could not be stored:", error);
  }
}

/* =========================
   ITEMS
   ========================= */

const items = {
  weapon_basic: {
    id: "weapon_basic",
    name: "Pulse Blaster",
    type: "weapon",
    rarity: "common",
    icon: "🔫",
    damage: 1,
    fireRate: 0.38,
    description: "A reliable standard weapon."
  },
  weapon_double: {
    id: "weapon_double",
    name: "Twin Blasters",
    type: "weapon",
    rarity: "uncommon",
    icon: "⚔️",
    damage: 1,
    fireRate: 0.43,
    double: true,
    description: "Fires two projectiles at once."
  },
  weapon_laser: {
    id: "weapon_laser",
    name: "Laser Cannon",
    type: "weapon",
    rarity: "rare",
    icon: "🔆",
    damage: 2,
    fireRate: 0.48,
    description: "Powerful laser shots."
  },
  weapon_plasma: {
    id: "weapon_plasma",
    name: "Plasma Destroyer",
    type: "weapon",
    rarity: "epic",
    icon: "💥",
    damage: 3,
    fireRate: 0.42,
    description: "High damage plasma weapon."
  },
  weapon_nova: {
    id: "weapon_nova",
    name: "Nova Blaster",
    type: "weapon",
    rarity: "legendary",
    icon: "🌟",
    damage: 4,
    fireRate: 0.35,
    double: true,
    description: "The ultimate space weapon."
  },

  module_basic: {
    id: "module_basic",
    name: "Standard Core",
    type: "module",
    rarity: "common",
    icon: "🔋",
    health: 0,
    description: "A standard ship module."
  },
  module_shield: {
    id: "module_shield",
    name: "Shield Core",
    type: "module",
    rarity: "uncommon",
    icon: "🛡️",
    health: 1,
    description: "Adds one extra life."
  },
  module_speed: {
    id: "module_speed",
    name: "Velocity Core",
    type: "module",
    rarity: "rare",
    icon: "⚡",
    speed: 1.25,
    description: "Increases ship movement speed."
  },
  module_reactor: {
    id: "module_reactor",
    name: "Reactor Core",
    type: "module",
    rarity: "epic",
    icon: "☢️",
    health: 2,
    description: "Adds two extra lives."
  },
  module_phantom: {
    id: "module_phantom",
    name: "Phantom Core",
    type: "module",
    rarity: "legendary",
    icon: "👾",
    health: 2,
    speed: 1.4,
    description: "An extremely advanced module."
  }
};

const rarityNames = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary"
};

function getItem(id) {
  return items[id] || items.weapon_basic;
}

/* =========================
   SCREEN NAVIGATION
   ========================= */

let currentScreen = "home";

function showScreen(id) {
  const target = $(id);
  if (!target) return;

  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  target.classList.add("active");
  currentScreen = id;

  if (id !== "gameScreen" && gameState === "playing") {
    pauseGame();
  }

  updateAllUI();
}

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => {
    const destination = button.dataset.open;
    if (destination) showScreen(destination);
  });
});

/* =========================
   GAME STATE
   ========================= */

let gameState = "menu";
let animationId = null;
let lastFrame = 0;

let score = 0;
let earned = 0;
let level = 1;
let lives = 3;
let gameTime = 0;

let spawnTimer = 0;
let fireTimer = 0;
let crystalTimer = 0;
let invincible = 0;

let enemies = [];
let bullets = [];
let crystals = [];
let particles = [];

const player = {
  x: W / 2,
  y: H - 100,
  width: 32,
  height: 42,
  speed: 260
};

const keys = {};
let pointerDown = false;
let pointerX = W / 2;
let pointerY = H - 100;

function startRun() {
  score = 0;
  earned = 0;
  level = 1;
  gameTime = 0;

  const module = getItem(save.equipped.module);
  lives = 3 + save.upgrades.extra + (module.health || 0);

  enemies = [];
  bullets = [];
  crystals = [];
  particles = [];

  spawnTimer = 0.6;
  fireTimer = 0;
  crystalTimer = 2;
  invincible = 2;

  player.x = W / 2;
  player.y = H - 100;

  pointerDown = false;

  gameState = "playing";
  showScreen("gameScreen");
  gameState = "playing";

  updateHUD();

  cancelAnimationFrame(animationId);
  lastFrame = 0;
  animationId = requestAnimationFrame(gameLoop);
}

function pauseGame() {
  if (gameState !== "playing") return;

  gameState = "paused";
  cancelAnimationFrame(animationId);

  $("overlayTag").textContent = "PAUSED";
  $("overlayTitle").textContent = "Game Paused";
  $("overlayText").textContent = "Take a break and continue when you're ready.";

  $("resumeBtn").textContent = "RESUME";
  $("overlay").classList.add("active");
}

function resumeGame() {
  if (gameState !== "paused") return;

  $("overlay").classList.remove("active");
  gameState = "playing";
  lastFrame = 0;
  animationId = requestAnimationFrame(gameLoop);
}

function endRun() {
  if (gameState !== "playing") return;

  gameState = "over";
  cancelAnimationFrame(animationId);

  save.runs++;
  save.credits += earned;
  save.best = Math.max(save.best, score);
  saveGame();

  $("finalScore").textContent = score.toLocaleString();
  $("earned").textContent = earned.toLocaleString();
  $("bestResult").textContent = save.best.toLocaleString();

  $("overlay").classList.remove("active");
  showScreen("result");
  updateAllUI();
}

/* =========================
   PLAYER CONTROLS
   ========================= */

function getPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * (W / rect.width),
    y: (event.clientY - rect.top) * (H / rect.height)
  };
}

canvas.addEventListener("pointerdown", event => {
  if (gameState !== "playing") return;

  pointerDown = true;
  const position = getPointerPosition(event);
  pointerX = position.x;
  pointerY = position.y;
  canvas.setPointerCapture?.(event.pointerId);
});

canvas.addEventListener("pointermove", event => {
  if (!pointerDown || gameState !== "playing") return;

  const position = getPointerPosition(event);
  pointerX = position.x;
  pointerY = position.y;
});

function releasePointer() {
  pointerDown = false;
}

canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);
canvas.addEventListener("pointerleave", releasePointer);

window.addEventListener("keydown", event => {
  keys[event.key.toLowerCase()] = true;

  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
      .includes(event.key.toLowerCase())
  ) {
    event.preventDefault();
  }

  if (event.key === "Escape" && gameState === "playing") {
    pauseGame();
  }
});

window.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

/* =========================
   GAME LOOP
   ========================= */

function gameLoop(timestamp) {
  if (gameState !== "playing") return;

  const dt = lastFrame
    ? Math.min((timestamp - lastFrame) / 1000, 0.04)
    : 0.016;

  lastFrame = timestamp;

  update(dt);
  draw();

  if (gameState === "playing") {
    animationId = requestAnimationFrame(gameLoop);
  }
}

function update(dt) {
  gameTime += dt;

  const weapon = getItem(save.equipped.weapon);
  const module = getItem(save.equipped.module);

  const speedMultiplier = module.speed || 1;
  const engineBonus = save.upgrades.engine * 18;
  const moveSpeed = (player.speed + engineBonus) * speedMultiplier;

  if (keys.arrowleft || keys.a) player.x -= moveSpeed * dt;
  if (keys.arrowright || keys.d) player.x += moveSpeed * dt;
  if (keys.arrowup || keys.w) player.y -= moveSpeed * dt;
  if (keys.arrowdown || keys.s) player.y += moveSpeed * dt;

  if (pointerDown) {
    player.x += (pointerX - player.x) * Math.min(1, dt * 12);
    player.y += (pointerY - player.y) * Math.min(1, dt * 12);
  }

  player.x = Math.max(22, Math.min(W - 22, player.x));
  player.y = Math.max(35, Math.min(H - 35, player.y));

  if (invincible > 0) invincible -= dt;

  /* Shooting */
  fireTimer -= dt;

  const fireRate = Math.max(
    0.16,
    weapon.fireRate - save.upgrades.weapon * 0.025
  );

  if (fireTimer <= 0) {
    fireTimer = fireRate;

    const damage = weapon.damage || 1;

    if (weapon.double) {
      bullets.push(
        { x: player.x - 11, y: player.y - 18, damage },
        { x: player.x + 11, y: player.y - 18, damage }
      );
    } else {
      bullets.push({
        x: player.x,
        y: player.y - 20,
        damage
      });
    }
  }

  /* Enemy spawning */
  spawnTimer -= dt;

  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(0.32, 1.05 - level * 0.045);
  }

  /* Crystal spawning */
  crystalTimer -= dt;

  if (crystalTimer <= 0) {
    crystals.push({
      x: 25 + Math.random() * (W - 50),
      y: -20,
      speed: 105 + Math.random() * 45,
      radius: 9
    });

    crystalTimer = 3 + Math.random() * 3;
  }

  /* Bullets */
  bullets.forEach(bullet => {
    bullet.y -= 520 * dt;
  });
  bullets = bullets.filter(bullet => bullet.y > -20);

  /* Enemies */
  enemies.forEach(enemy => {
    enemy.y += enemy.speed * dt;
    enemy.phase += dt * 3;
    enemy.x += Math.sin(enemy.phase) * 22 * dt;
  });

  /* Crystals */
  crystals.forEach(crystal => {
    crystal.y += crystal.speed * dt;
  });

  /* Bullet collisions */
  bullets.forEach(bullet => {
    enemies.forEach(enemy => {
      if (enemy.dead) return;

      const distance = Math.hypot(
        bullet.x - enemy.x,
        bullet.y - enemy.y
      );

      if (distance < enemy.radius + 5) {
        enemy.hp -= bullet.damage;
        bullet.y = -100;

        if (enemy.hp <= 0) {
          enemy.dead = true;
          score += enemy.points;
          earned += enemy.reward;
          createParticles(enemy.x, enemy.y, 12);
        }
      }
    });
  });

  bullets = bullets.filter(bullet => bullet.y > -50);
  enemies = enemies.filter(enemy => !enemy.dead && enemy.y < H + 40);

  /* Player collisions */
  if (invincible <= 0) {
    enemies.forEach(enemy => {
      if (enemy.dead) return;

      if (
        Math.hypot(player.x - enemy.x, player.y - enemy.y)
        < enemy.radius + 17
      ) {
        enemy.dead = true;
        loseLife();
      }
    });
  }

  /* Collect crystals */
  crystals.forEach(crystal => {
    if (
      Math.hypot(player.x - crystal.x, player.y - crystal.y)
      < 25
    ) {
      crystal.collected = true;
      earned += 25;
      score += 50;
      createParticles(crystal.x, crystal.y, 8);
    }
  });

  crystals = crystals.filter(
    crystal => !crystal.collected && crystal.y < H + 20
  );

  /* Particles */
  particles.forEach(particle => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  });

  particles = particles.filter(particle => particle.life > 0);

  const newLevel = Math.floor(score / 500) + 1;

  if (newLevel > level) {
    level = newLevel;
    invincible = 1.5;
    createParticles(player.x, player.y, 20);
  }

  updateHUD();
}

function spawnEnemy() {
  const tough = Math.random() < Math.min(0.35, level * 0.035);

  enemies.push({
    x: 25 + Math.random() * (W - 50),
    y: -30,
    radius: tough ? 20 : 15,
    hp: tough ? 2 + Math.floor(level / 3) : 1,
    speed: (tough ? 95 : 125) + level * 7 + Math.random() * 35,
    points: tough ? 150 : 75,
    reward: tough ? 20 : 10,
    phase: Math.random() * 6,
    tough,
    dead: false
  });
}

function loseLife() {
  if (invincible > 0) return;

  lives--;
  invincible = 1.5;
  createParticles(player.x, player.y, 16);
  updateHUD();

  if (lives <= 0) {
    endRun();
  }
}

function createParticles(x, y, amount) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 170;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3 + Math.random() * 0.5
    });
  }
}

/* =========================
   DRAWING
   ========================= */

function draw() {
  ctx.clearRect(0, 0, W, H);

  /* Background */
  const background = ctx.createLinearGradient(0, 0, 0, H);
  background.addColorStop(0, "#080b20");
  background.addColorStop(1, "#101b3c");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);

  /* Stars */
  for (let i = 0; i < 55; i++) {
    const x = (i * 83) % W;
    const y = (i * 137 + gameTime * (25 + i % 4 * 10)) % H;

    ctx.fillStyle = "rgba(180,220,255,0.55)";
    ctx.fillRect(x, y, 2, 2);
  }

  /* Crystals */
  crystals.forEach(crystal => {
    ctx.save();
    ctx.translate(crystal.x, crystal.y);
    ctx.rotate(gameTime * 2);
    ctx.fillStyle = "#48f5ff";
    ctx.shadowColor = "#48f5ff";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  /* Bullets */
  bullets.forEach(bullet => {
    ctx.fillStyle = "#54f6ff";
    ctx.shadowColor = "#54f6ff";
    ctx.shadowBlur = 12;
    ctx.fillRect(bullet.x - 3, bullet.y - 10, 6, 17);
  });
  ctx.shadowBlur = 0;

  /* Enemies */
  enemies.forEach(enemy => {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    ctx.fillStyle = enemy.tough ? "#ff4a9a" : "#ff765c";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(0, enemy.radius);
    ctx.lineTo(enemy.radius, -enemy.radius);
    ctx.lineTo(0, -enemy.radius * 0.55);
    ctx.lineTo(-enemy.radius, -enemy.radius);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  });

  /* Player ship */
  if (invincible <= 0 || Math.floor(gameTime * 10) % 2 === 0) {
    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.fillStyle = "#55edff";
    ctx.shadowColor = "#55edff";
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(20, 20);
    ctx.lineTo(0, 12);
    ctx.lineTo(-20, 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(6, 8);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /* Particles */
  particles.forEach(particle => {
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = "#5ffaff";
    ctx.fillRect(particle.x, particle.y, 4, 4);
  });

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

/* =========================
   HUD
   ========================= */

function updateHUD() {
  if ($("score")) $("score").textContent = score.toLocaleString();
  if ($("levelHud")) $("levelHud").textContent = level;
  if ($("lives")) $("lives").textContent = lives;
}

/* =========================
   UPGRADES
   ========================= */

const upgradeInfo = [
  {
    id: "hull",
    name: "Stronger Hull",
    description: "Increases your ship's durability.",
    base: 150,
    max: 5
  },
  {
    id: "engine",
    name: "Engine Boost",
    description: "Increases your movement speed.",
    base: 125,
    max: 5
  },
  {
    id: "weapon",
    name: "Weapon System",
    description: "Increases your firing speed.",
    base: 200,
    max: 5
  },
  {
    id: "extra",
    name: "Extra Life",
    description: "Start every run with an extra life.",
    base: 300,
    max: 3
  }
];

function upgradeCost(upgrade) {
  return upgrade.base * (save.upgrades[upgrade.id] + 1);
}

function renderUpgrades() {
  const container = $("upgradeList");
  if (!container) return;

  container.innerHTML = "";

  upgradeInfo.forEach(upgrade => {
    const level = save.upgrades[upgrade.id];
    const maxed = level >= upgrade.max;
    const cost = upgradeCost(upgrade);

    const card = document.createElement("div");
    card.className = "upgrade-card";

    const title = document.createElement("h3");
    title.textContent = upgrade.name;

    const description = document.createElement("p");
    description.textContent = upgrade.description;

    const levelText = document.createElement("p");
    levelText.textContent = `Level ${level}/${upgrade.max}`;

    const button = document.createElement("button");
    button.className = "upgrade-button";
    button.textContent = maxed ? "MAX LEVEL" : `UPGRADE · ${cost} CR`;
    button.disabled = maxed || save.credits < cost;

    button.addEventListener("click", () => {
      if (maxed || save.credits < cost) return;

      save.credits -= cost;
      save.upgrades[upgrade.id]++;
      saveGame();
      updateAllUI();
    });

    card.append(title, description, levelText, button);
    container.appendChild(card);
  });
}

/* =========================
   HANGAR & INVENTORY
   ========================= */

let inventoryFilter = "all";

function renderHangar() {
  const weapon = getItem(save.equipped.weapon);
  const module = getItem(save.equipped.module);

  if ($("shipName")) {
    $("shipName").textContent = "NEON FIGHTER";
  }

  const weaponSlots = $("weaponSlots");
  const moduleSlots = $("moduleSlots");

  if (weaponSlots) {
    weaponSlots.innerHTML = `
      <div class="equipment-slot">
        <strong>WEAPON</strong>
        <div>${weapon.icon} ${weapon.name}</div>
        <small class="rarity-${weapon.rarity}">${rarityNames[weapon.rarity]}</small>
      </div>
    `;
  }

  if (moduleSlots) {
    moduleSlots.innerHTML = `
      <div class="equipment-slot">
        <strong>MODULE</strong>
        <div>${module.icon} ${module.name}</div>
        <small class="rarity-${module.rarity}">${rarityNames[module.rarity]}</small>
      </div>
    `;
  }

  renderInventory();
}

function renderInventory() {
  const container = $("inventory");
  if (!container) return;

  container.innerHTML = "";

  const ownedItems = [...new Set(save.inventory)];

  ownedItems.forEach(id => {
    const item = getItem(id);

    if (inventoryFilter !== "all" && item.type !== inventoryFilter) {
      return;
    }

    const equipped =
      save.equipped[item.type] === item.id;

    const card = document.createElement("div");
    card.className = "item-card";

    const icon = document.createElement("div");
    icon.className = "item-icon";
    icon.textContent = item.icon;

    const name = document.createElement("strong");
    name.textContent = item.name;

    const rarity = document.createElement("p");
    rarity.className = `rarity-${item.rarity}`;
    rarity.textContent = rarityNames[item.rarity];

    const description = document.createElement("small");
    description.textContent = item.description;

    const button = document.createElement("button");
    button.textContent = equipped ? "EQUIPPED" : "EQUIP";
    button.disabled = equipped;

    button.addEventListener("click", () => {
      save.equipped[item.type] = item.id;
      saveGame();
      updateAllUI();
    });

    card.append(icon, name, rarity, description, button);
    container.appendChild(card);
  });
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    inventoryFilter = button.dataset.filter || "all";

    document.querySelectorAll(".filter").forEach(filter => {
      filter.classList.toggle("active", filter === button);
    });

    renderInventory();
  });
});

/* =========================
   PACKS
   ========================= */

function randomItem(elite = false) {
  const roll = Math.random() * 100;

  let rarity;

  if (elite) {
    if (roll < 30) rarity = "common";
    else if (roll < 55) rarity = "uncommon";
    else if (roll < 80) rarity = "rare";
    else if (roll < 95) rarity = "epic";
    else rarity = "legendary";
  } else {
    if (roll < 60) rarity = "common";
    else if (roll < 85) rarity = "uncommon";
    else if (roll < 95) rarity = "rare";
    else if (roll < 99) rarity = "epic";
    else rarity = "legendary";
  }

  const possible = Object.values(items).filter(
    item => item.rarity === rarity
  );

  return possible[Math.floor(Math.random() * possible.length)];
}

function openPack(elite = false) {
  const item = randomItem(elite);
  const alreadyOwned = save.inventory.includes(item.id);

  if (!alreadyOwned) {
    save.inventory.push(item.id);
  } else {
    save.credits += item.rarity === "legendary" ? 150 : 50;
  }

  saveGame();

  if ($("packItemIcon")) {
    $("packItemIcon").textContent = item.icon;
  }

  if ($("packItemName")) {
    $("packItemName").textContent = item.name;
  }

  if ($("packRarity")) {
    $("packRarity").textContent =
      alreadyOwned
        ? `${rarityNames[item.rarity]} · DUPLICATE BONUS`
        : rarityNames[item.rarity];

    $("packRarity").className = `rarity-${item.rarity}`;
  }

  if ($("packItemDesc")) {
    $("packItemDesc").textContent = alreadyOwned
      ? `${item.description} You already owned this item, so you received bonus credits.`
      : item.description;
  }

  if ($("packResult")) {
    $("packResult").classList.remove("hidden");
  }

  updateAllUI();
}

function todayString() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function updateDailyButton() {
  const button = $("dailyBtn");
  const status = $("dailyStatus");
  if (!button) return;

  const claimed = save.dailyClaim === todayString();

  button.disabled = claimed;
  button.textContent = claimed ? "CLAIMED TODAY" : "CLAIM DAILY PACK";

  if (status) {
    status.textContent = claimed
      ? "Come back tomorrow for another free pack."
      : "Your free daily pack is ready!";
  }
}

if ($("dailyBtn")) {
  $("dailyBtn").addEventListener("click", () => {
    if (save.dailyClaim === todayString()) return;

    save.dailyClaim = todayString();
    openPack(false);
    updateDailyButton();
  });
}

if ($("buyPackBtn")) {
  $("buyPackBtn").addEventListener("click", () => {
    const cost = 500;

    if (save.credits < cost) {
      if ($("packItemDesc")) {
        $("packItemDesc").textContent =
          "Not enough credits. You need 500 CR.";
      }
      if ($("packResult")) {
        $("packResult").classList.remove("hidden");
      }
      return;
    }

    save.credits -= cost;
    openPack(true);
  });
}

if ($("packDoneBtn")) {
  $("packDoneBtn").addEventListener("click", () => {
    if ($("packResult")) {
      $("packResult").classList.add("hidden");
    }
    updateAllUI();
  });
}

/* =========================
   MENU BUTTONS
   ========================= */

if ($("playBtn")) {
  $("playBtn").addEventListener("click", () => {
    showScreen("tutorial");
  });
}

if ($("startBtn")) {
  $("startBtn").addEventListener("click", () => {
    save.tutorialSeen = true;
    saveGame();
    startRun();
  });
}

if ($("againBtn")) {
  $("againBtn").addEventListener("click", startRun);
}

if ($("pauseBtn")) {
  $("pauseBtn").addEventListener("click", pauseGame);
}

if ($("resumeBtn")) {
  $("resumeBtn").addEventListener("click", resumeGame);
}

if ($("quitBtn")) {
  $("quitBtn").addEventListener("click", () => {
    gameState = "menu";
    cancelAnimationFrame(animationId);
    $("overlay").classList.remove("active");
    showScreen("home");
  });
}

/* =========================
   UPDATE MENU INFORMATION
   ========================= */

function updateAllUI() {
  if ($("bank")) {
    $("bank").textContent = save.credits.toLocaleString();
  }

  if ($("bestHome")) {
    $("bestHome").textContent = save.best.toLocaleString();
  }

  if ($("runsHome")) {
    $("runsHome").textContent = save.runs;
  }

  if ($("shipLevelHome")) {
    $("shipLevelHome").textContent =
      1 + save.upgrades.hull +
      save.upgrades.engine +
      save.upgrades.weapon;
  }

  renderHangar();
  renderUpgrades();
  updateDailyButton();
  updateHUD();
}

/* =========================
   INITIALIZE
   ========================= */

updateAllUI();
showScreen("home");

console.log("NEON DRIFT loaded successfully.");
})();
