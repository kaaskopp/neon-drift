
(() => {
  "use strict";

  // ==========================================
  // NEON DRIFT - SPACE ARCADE
  // Complete game engine
  // ==========================================

  const $ = id => document.getElementById(id);

  const canvas = $("game");
  if (!canvas) {
    console.error("NEON DRIFT: canvas #game not found.");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("NEON DRIFT: canvas context unavailable.");
    return;
  }

  const W = 420;
  const H = 700;

  canvas.width = W;
  canvas.height = H;

  const SAVE_KEY = "neonDriftSpaceArcade_v1";
  const OLD_KEY = "neonDriftAfterburn_v1";

  const defaults = {
    credits: 500,
    best: 0,
    runs: 0,
    dailyClaim: "",
    upgrades: {
      hull: 0,
      engine: 0,
      shield: 0,
      extra: 0,
      magnet: 0
    },
    inventory: ["pulse", "basicModule"],
    equipped: {
      weapon: "pulse",
      module: "basicModule"
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadSave() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (saved && typeof saved === "object") {
        return {
          ...clone(defaults),
          ...saved,
          upgrades: {
            ...defaults.upgrades,
            ...(saved.upgrades || {})
          },
          equipped: {
            ...defaults.equipped,
            ...(saved.equipped || {})
          },
          inventory: Array.isArray(saved.inventory)
            ? saved.inventory
            : clone(defaults.inventory)
        };
      }

      const old = JSON.parse(localStorage.getItem(OLD_KEY));
      if (old && typeof old === "object") {
        return {
          ...clone(defaults),
          credits: Number(old.credits) || 500,
          best: Number(old.best) || 0,
          runs: Number(old.runs) || 0
        };
      }
    } catch (error) {
      console.warn("Save could not be loaded:", error);
    }

    return clone(defaults);
  }

  let save = loadSave();

  function saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (error) {
      console.warn("Save could not be stored:", error);
    }
    updateBank();
    updateHomeStats();
  }

  // ==========================================
  // ITEMS
  // ==========================================

  const items = [
    {
      id: "pulse",
      name: "Pulse Blaster",
      type: "weapon",
      rarity: "Common",
      icon: "🔹",
      damage: 1,
      fireRate: 0.34,
      description: "A reliable standard energy weapon."
    },
    {
      id: "rapid",
      name: "Rapid Blaster",
      type: "weapon",
      rarity: "Uncommon",
      icon: "⚡",
      damage: 1,
      fireRate: 0.19,
      description: "Fires energy shots at a higher rate."
    },
    {
      id: "double",
      name: "Twin Pulse",
      type: "weapon",
      rarity: "Rare",
      icon: "🔷",
      damage: 1,
      fireRate: 0.30,
      description: "Fires two energy shots at once."
    },
    {
      id: "plasma",
      name: "Plasma Cannon",
      type: "weapon",
      rarity: "Epic",
      icon: "💠",
      damage: 2,
      fireRate: 0.27,
      description: "Powerful plasma energy projectiles."
    },
    {
      id: "nova",
      name: "Nova Blaster",
      type: "weapon",
      rarity: "Legendary",
      icon: "🌟",
      damage: 3,
      fireRate: 0.22,
      description: "An advanced high-power energy weapon."
    },
    {
      id: "basicModule",
      name: "Basic Core",
      type: "module",
      rarity: "Common",
      icon: "🛡️",
      health: 0,
      speed: 0,
      description: "A standard ship module."
    },
    {
      id: "armor",
      name: "Armor Core",
      type: "module",
      rarity: "Uncommon",
      icon: "🔰",
      health: 1,
      speed: 0,
      description: "Adds one extra life."
    },
    {
      id: "engine",
      name: "Turbo Engine",
      type: "module",
      rarity: "Rare",
      icon: "🚀",
      health: 0,
      speed: 65,
      description: "Improves ship movement speed."
    },
    {
      id: "guardian",
      name: "Guardian Core",
      type: "module",
      rarity: "Epic",
      icon: "💎",
      health: 2,
      speed: 25,
      description: "Adds two lives and improves movement."
    },
    {
      id: "overdrive",
      name: "Overdrive Core",
      type: "module",
      rarity: "Legendary",
      icon: "🌌",
      health: 2,
      speed: 75,
      description: "A powerful advanced ship core."
    }
  ];

  function getItem(id) {
    return items.find(item => item.id === id) || items[0];
  }

  function owns(id) {
    return save.inventory.includes(id);
  }

  function rarityClass(rarity) {
    return "rarity-" + rarity.toLowerCase();
  }

  // ==========================================
  // GAME STATE
  // ==========================================

  let screenName = "home";
  let gameState = "menu";

  let score = 0;
  let earned = 0;
  let level = 1;
  let lives = 3;

  let objects = [];
  let bullets = [];
  let particles = [];
  let stars = [];

  let spawnTimer = 0;
  let crystalTimer = 0;
  let fireTimer = 0;
  let invincible = 0;
  let shieldTime = 0;

  let lastFrame = 0;
  let animationId = 0;

  let pointerDown = false;
  let pointerId = null;

  const player = {
    x: W / 2,
    y: H - 105,
    radius: 17,
    speed: 300
  };

  // ==========================================
  // INITIAL SETUP
  // ==========================================

  for (let i = 0; i < 85; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 45 + 20
    });
  }

  function updateBank() {
    const bank = $("bank");
    if (bank) bank.textContent = save.credits.toLocaleString();
  }

  function updateHomeStats() {
    const best = $("bestHome");
    const runs = $("runsHome");
    const ship = $("shipLevelHome");

    if (best) best.textContent = save.best.toLocaleString();
    if (runs) runs.textContent = save.runs.toLocaleString();

    if (ship) {
      ship.textContent =
        1 + save.upgrades.hull + save.upgrades.engine;
    }
  }

  function updateHUD() {
    const scoreEl = $("score");
    const levelEl = $("levelHud");
    const livesEl = $("lives");

    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (levelEl) levelEl.textContent = level;
    if (livesEl) livesEl.textContent = "❤️ ".repeat(Math.max(0, lives));
  }

  // ==========================================
  // SCREEN NAVIGATION
  // ==========================================

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach(screen => {
      screen.classList.remove("active");
    });

    const target = $(name);
    if (target) target.classList.add("active");

    screenName = name;

    if (name === "home") {
      updateHomeStats();
    }

    if (name === "hangar") {
      renderHangar();
    }

    if (name === "packs") {
      updateDailyButton();
    }

    if (name === "upgrades") {
      renderUpgrades();
    }
  }

  document.querySelectorAll("[data-open]").forEach(button => {
    button.addEventListener("click", () => {
      if (gameState === "playing" || gameState === "paused") return;
      showScreen(button.dataset.open);
    });
  });

  const playBtn = $("playBtn");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      showScreen("tutorial");
    });
  }

  // ==========================================
  // HANGAR
  // ==========================================

  function renderHangar() {
    const weapon = getItem(save.equipped.weapon);
    const module = getItem(save.equipped.module);

    const shipName = $("shipName");
    if (shipName) {
      shipName.textContent = "NEON FIGHTER";
    }

    const weaponSlots = $("weaponSlots");
    if (weaponSlots) {
      weaponSlots.innerHTML = `
        <div class="equipment-slot">
          <div>
            <strong>⚡ ${weapon.name}</strong>
            <small class="${rarityClass(weapon.rarity)}">${weapon.rarity} weapon</small>
          </div>
          <span>✓ Equipped</span>
        </div>
      `;
    }

    const moduleSlots = $("moduleSlots");
    if (moduleSlots) {
      moduleSlots.innerHTML = `
        <div class="equipment-slot">
          <div>
            <strong>🛡️ ${module.name}</strong>
            <small class="${rarityClass(module.rarity)}">${module.rarity} module</small>
          </div>
          <span>✓ Equipped</span>
        </div>
      `;
    }

    renderInventory();
  }

  let inventoryFilter = "all";

  function renderInventory() {
    const inventory = $("inventory");
    if (!inventory) return;

    const ownedItems = items.filter(item => owns(item.id));

    const filtered = ownedItems.filter(item => {
      if (inventoryFilter === "all") return true;
      return item.type === inventoryFilter;
    });

    inventory.innerHTML = "";

    if (!filtered.length) {
      inventory.innerHTML = '<p class="muted">No items in this category yet.</p>';
      return;
    }

    filtered.forEach(item => {
      const equipped =
        save.equipped.weapon === item.id ||
        save.equipped.module === item.id;

      const card = document.createElement("div");
      card.className = "item-card";

      card.innerHTML = `
        <div class="item-icon">${item.icon}</div>
        <strong>${item.name}</strong>
        <small class="${rarityClass(item.rarity)}">${item.rarity}</small>
        <small>${item.description}</small>
        <button type="button">${equipped ? "EQUIPPED" : "EQUIP"}</button>
      `;

      const button = card.querySelector("button");

      button.addEventListener("click", () => {
        if (item.type === "weapon") {
          save.equipped.weapon = item.id;
        } else {
          save.equipped.module = item.id;
        }

        saveGame();
        renderHangar();
      });

      inventory.appendChild(card);
    });
  }

  document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(item => {
        item.classList.remove("active");
      });

      button.classList.add("active");
      inventoryFilter = button.dataset.filter || "all";
      renderInventory();
    });
  });

  // ==========================================
  // PACKS AND RARITIES
  // ==========================================

  const rarityRates = [
    { name: "Common", chance: 52 },
    { name: "Uncommon", chance: 27 },
    { name: "Rare", chance: 14 },
    { name: "Epic", chance: 5.5 },
    { name: "Legendary", chance: 1.5 }
  ];

  function rollRarity() {
    const roll = Math.random() * 100;
    let total = 0;

    for (const rarity of rarityRates) {
      total += rarity.chance;
      if (roll <= total) return rarity.name;
    }

    return "Common";
  }

  function openPack() {
    const rarity = rollRarity();

    let possible = items.filter(item => item.rarity === rarity);

    let newItems = possible.filter(item => !owns(item.id));

    let item;

    if (newItems.length) {
      item = newItems[Math.floor(Math.random() * newItems.length)];
    } else {
      item = possible[Math.floor(Math.random() * possible.length)];
    }

    if (!item) item = items[0];

    const isNew = !owns(item.id);

    if (isNew) {
      save.inventory.push(item.id);
    } else {
      const duplicateReward = {
        Common: 40,
        Uncommon: 65,
        Rare: 100,
        Epic: 175,
        Legendary: 300
      };

      const reward = duplicateReward[item.rarity] || 40;
      save.credits += reward;
    }

    saveGame();

    const icon = $("packItemIcon");
    const name = $("packItemName");
    const rarityEl = $("packRarity");
    const desc = $("packItemDesc");
    const result = $("packResult");

    if (icon) icon.textContent = item.icon;
    if (name) name.textContent = item.name;
    if (rarityEl) {
      rarityEl.textContent = item.rarity;
      rarityEl.className = "rarity-label " + rarityClass(item.rarity);
    }

    if (desc) {
      desc.textContent = isNew
        ? item.description + " New item added to your Hangar!"
        : item.description + " Duplicate item converted into credits!";
    }

    if (result) result.classList.remove("hidden");

    updateDailyButton();
  }

  function todayKey() {
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

    const claimed = save.dailyClaim === todayKey();

    button.disabled = claimed;
    button.textContent = claimed ? "ALREADY CLAIMED" : "CLAIM FREE PACK";

    if (status) {
      status.textContent = claimed
        ? "Come back tomorrow for another free pack."
        : "Your daily free pack is ready!";
    }
  }

  const dailyBtn = $("dailyBtn");
  if (dailyBtn) {
    dailyBtn.addEventListener("click", () => {
      if (save.dailyClaim === todayKey()) return;

      save.dailyClaim = todayKey();
      saveGame();
      openPack();
    });
  }

  const buyPackBtn = $("buyPackBtn");
  if (buyPackBtn) {
    buyPackBtn.addEventListener("click", () => {
      const price = 250;

      if (save.credits < price) {
        alert("Not enough credits! Play a mission to earn more.");
        return;
      }

      save.credits -= price;
      saveGame();
      openPack();
    });
  }

  const packDoneBtn = $("packDoneBtn");
  if (packDoneBtn) {
    packDoneBtn.addEventListener("click", () => {
      const result = $("packResult");
      if (result) result.classList.add("hidden");
    });
  }

  // ==========================================
  // PERMANENT UPGRADES
  // ==========================================

  const upgradeData = [
    {
      id: "hull",
      name: "Reinforced Hull",
      description: "Improve your ship's durability.",
      base: 150,
      max: 5
    },
    {
      id: "engine",
      name: "Engine Boost",
      description: "Increase your movement speed.",
      base: 125,
      max: 5
    },
    {
      id: "shield",
      name: "Energy Shield",
      description: "Start each mission with more protection.",
      base: 175,
      max: 5
    },
    {
      id: "extra",
      name: "Extra Life",
      description: "Start each mission with an extra life.",
      base: 300,
      max: 3
    },
    {
      id: "magnet",
      name: "Crystal Magnet",
      description: "Collect crystals from further away.",
      base: 200,
      max: 5
    }
  ];

  function upgradePrice(upgrade) {
    return Math.floor(upgrade.base * (1 + save.upgrades[upgrade.id] * 0.8));
  }

  function renderUpgrades() {
    const list = $("upgradeList");
    if (!list) return;

    list.innerHTML = "";

    upgradeData.forEach(upgrade => {
      const current = save.upgrades[upgrade.id];
      const maxed = current >= upgrade.max;
      const price = upgradePrice(upgrade);

      const card = document.createElement("div");
      card.className = "upgrade-card";

      card.innerHTML = `
        <div>
          <h3>${upgrade.name}</h3>
          <p>${upgrade.description}</p>
          <small>Level ${current}/${upgrade.max}</small>
        </div>
        <button class="upgrade-button" type="button"
          ${maxed ? "disabled" : ""}>
          ${maxed ? "MAXED" : price + " CR"}
        </button>
      `;

      card.querySelector("button").addEventListener("click", () => {
        if (save.upgrades[upgrade.id] >= upgrade.max) return;

        const cost = upgradePrice(upgrade);

        if (save.credits < cost) {
          alert("Not enough credits!");
          return;
        }

        save.credits -= cost;
        save.upgrades[upgrade.id]++;

        saveGame();
        renderUpgrades();
      });

      list.appendChild(card);
    });
  }

  // ==========================================
  // START / PAUSE / RESUME
  // ==========================================

  function startRun() {
    score = 0;
    earned = 0;
    level = 1;

    const module = getItem(save.equipped.module);

    lives = 3 + save.upgrades.extra + (module.health || 0);

    objects = [];
    bullets = [];
    particles = [];

    spawnTimer = 0.5;
    crystalTimer = 1;
    fireTimer = 0;

    invincible = 1.5 + save.upgrades.shield * 1.5;
    shieldTime = 0;

    player.x = W / 2;
    player.y = H - 105;

    pointerDown = false;
    pointerId = null;

    updateHUD();

    const overlay = $("overlay");
    if (overlay) overlay.classList.remove("active");

    showScreen("gameScreen");

    gameState = "playing";

    lastFrame = performance.now();

    if (animationId) cancelAnimationFrame(animationId);

    animationId = requestAnimationFrame(loop);
  }

  function pauseGame() {
    if (gameState !== "playing") return;

    gameState = "paused";

    const tag = $("overlayTag");
    const title = $("overlayTitle");
    const text = $("overlayText");
    const resume = $("resumeBtn");

    if (tag) tag.textContent = "MISSION PAUSED";
    if (title) title.textContent = "PAUSED";
    if (text) text.textContent = "Take a break. Your mission is waiting.";
    if (resume) resume.style.display = "block";

    const overlay = $("overlay");
    if (overlay) overlay.classList.add("active");

    if (animationId) cancelAnimationFrame(animationId);
  }

  function resumeGame() {
    if (gameState !== "paused") return;

    const overlay = $("overlay");
    if (overlay) overlay.classList.remove("active");

    gameState = "playing";
    lastFrame = performance.now();

    animationId = requestAnimationFrame(loop);
  }

  function quitGame() {
    if (animationId) cancelAnimationFrame(animationId);

    gameState = "menu";
    pointerDown = false;

    const overlay = $("overlay");
    if (overlay) overlay.classList.remove("active");

    showScreen("home");
  }

  const startBtn = $("startBtn");
  if (startBtn) startBtn.addEventListener("click", startRun);

  const againBtn = $("againBtn");
  if (againBtn) againBtn.addEventListener("click", startRun);

  const pauseBtn = $("pauseBtn");
  if (pauseBtn) pauseBtn.addEventListener("click", pauseGame);

  const resumeBtn = $("resumeBtn");
  if (resumeBtn) resumeBtn.addEventListener("click", resumeGame);

  const quitBtn = $("quitBtn");
  if (quitBtn) quitBtn.addEventListener("click", quitGame);

  // ==========================================
  // PLAYER INPUT
  // ==========================================

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) * (W / rect.width),
      y: (event.clientY - rect.top) * (H / rect.height)
    };
  }

  canvas.addEventListener("pointerdown", event => {
    if (gameState !== "playing") return;

    event.preventDefault();

    pointerDown = true;
    pointerId = event.pointerId;

    const position = pointerPosition(event);
    player.x = Math.max(22, Math.min(W - 22, position.x));
    player.y = Math.max(70, Math.min(H - 35, position.y));
  });

  canvas.addEventListener("pointermove", event => {
    if (!pointerDown || gameState !== "playing") return;
    if (pointerId !== null && event.pointerId !== pointerId) return;

    event.preventDefault();

    const position = pointerPosition(event);

    player.x = Math.max(22, Math.min(W - 22, position.x));
    player.y = Math.max(70, Math.min(H - 35, position.y));
  });

  function releasePointer(event) {
    if (pointerId !== null && event.pointerId !== pointerId) return;

    pointerDown = false;
    pointerId = null;
  }

  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  canvas.addEventListener("pointerleave", releasePointer);

  const keys = {};

  window.addEventListener("keydown", event => {
    keys[event.key.toLowerCase()] = true;

    if (event.key === "Escape" && gameState === "playing") {
      pauseGame();
    }
  });

  window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
  });

  // ==========================================
  // SPAWNING OBJECTS
  // ==========================================

  function spawnEnemy() {
    const difficulty = Math.min(4, Math.floor(level / 3));

    const enemyTypes = [
      {
        type: "basic",
        hp: 1 + difficulty,
        speed: 105 + level * 4,
        radius: 15,
        points: 100,
        color: "#ff557d"
      },
      {
        type: "fast",
        hp: 1 + difficulty,
        speed: 165 + level * 5,
        radius: 12,
        points: 150,
        color: "#ffad4d"
      },
      {
        type: "heavy",
        hp: 3 + difficulty,
        speed: 65 + level * 3,
        radius: 21,
        points: 250,
        color: "#b56aff"
      }
    ];

    const type = enemyTypes[
      Math.floor(Math.random() * enemyTypes.length)
    ];

    objects.push({
      kind: "enemy",
      x: 25 + Math.random() * (W - 50),
      y: -35,
      ...type
    });
  }

  function spawnCrystal() {
    objects.push({
      kind: "crystal",
      x: 25 + Math.random() * (W - 50),
      y: -20,
      radius: 10,
      speed: 115,
      color: "#25dfff"
    });
  }

  function createExplosion(x, y, color, amount = 10) {
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 150 + 35;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: Math.random() * 0.5 + 0.25,
        maxLife: 0.75,
        size: Math.random() * 4 + 1,
        color
      });
    }
  }

  // ==========================================
  // SHOOTING
  // ==========================================

  function shoot() {
    const weapon = getItem(save.equipped.weapon);
    const damage = weapon.damage || 1;

    if (weapon.id === "double") {
      bullets.push(
        { x: player.x - 10, y: player.y - 15, damage, speed: 510 },
        { x: player.x + 10, y: player.y - 15, damage, speed: 510 }
      );
    } else {
      bullets.push({
        x: player.x,
        y: player.y - 18,
        damage,
        speed: 540,
        color: weapon.rarity === "Legendary"
          ? "#ffbd4a"
          : weapon.rarity === "Epic"
            ? "#c17aff"
            : "#25dfff"
      });
    }
  }

  // ==========================================
  // UPDATE
  // ==========================================

  function update(dt) {
    const module = getItem(save.equipped.module);

    const moveSpeed =
      player.speed +
      save.upgrades.engine * 25 +
      (module.speed || 0);

    if (keys.arrowleft || keys.a) player.x -= moveSpeed * dt;
    if (keys.arrowright || keys.d) player.x += moveSpeed * dt;
    if (keys.arrowup || keys.w) player.y -= moveSpeed * dt;
    if (keys.arrowdown || keys.s) player.y += moveSpeed * dt;

    player.x = Math.max(20, Math.min(W - 20, player.x));
    player.y = Math.max(65, Math.min(H - 30, player.y));

    invincible = Math.max(0, invincible - dt);
    shieldTime = Math.max(0, shieldTime - dt);

    stars.forEach(star => {
      star.y += star.speed * dt;
      if (star.y > H) {
        star.y = 0;
        star.x = Math.random() * W;
      }
    });

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = Math.max(0.35, 1.1 - level * 0.035);
    }

    crystalTimer -= dt;
    if (crystalTimer <= 0) {
      spawnCrystal();
      crystalTimer = 2.8 + Math.random() * 2;
    }

    const weapon = getItem(save.equipped.weapon);

    fireTimer -= dt;
    if (fireTimer <= 0) {
      shoot();
      fireTimer = weapon.fireRate || 0.34;
    }

    bullets.forEach(bullet => {
      bullet.y -= bullet.speed * dt;
    });

    bullets = bullets.filter(bullet => bullet.y > -30);

    objects.forEach(object => {
      object.y += object.speed * dt;

      if (object.kind === "enemy") {
        object.x += Math.sin(object.y * 0.025) * 24 * dt;
      }
    });

    // Bullet collisions
    bullets.forEach(bullet => {
      if (bullet.dead) return;

      objects.forEach(object => {
        if (object.kind !== "enemy" || object.dead) return;

        const dx = bullet.x - object.x;
        const dy = bullet.y - object.y;

        if (Math.hypot(dx, dy) < object.radius + 5) {
          bullet.dead = true;
          object.hp -= bullet.damage;

          createExplosion(bullet.x, bullet.y, "#25dfff", 3);

          if (object.hp <= 0) {
            object.dead = true;
            score += object.points;
            createExplosion(object.x, object.y, object.color, 13);
          }
        }
      });
    });

    bullets = bullets.filter(bullet => !bullet.dead);
    objects = objects.filter(object => !object.dead);

    // Player collisions and crystal collection
    objects.forEach(object => {
      const dx = player.x - object.x;
      const dy = player.y - object.y;
      const distance = Math.hypot(dx, dy);

      if (distance < player.radius + object.radius) {
        if (object.kind === "crystal") {
          object.dead = true;

          const bonus = 10 + save.upgrades.magnet * 3;
          earned += bonus;
          score += 25;

          createExplosion(object.x, object.y, "#25dfff", 8);
        } else if (object.kind === "enemy" && invincible <= 0) {
          object.dead = true;
          createExplosion(object.x, object.y, object.color, 12);

          lives--;
          invincible = 1.4;

          if (lives <= 0) {
            endRun();
          }
        }
      }
    });

    objects = objects.filter(object => object.y < H + 50 && !object.dead);

    // Crystal magnet effect
    const magnetRange = 35 + save.upgrades.magnet * 24;

    objects.forEach(object => {
      if (object.kind !== "crystal") return;

      const distance = Math.hypot(
        player.x - object.x,
        player.y - object.y
      );

      if (distance < magnetRange) {
        object.x += (player.x - object.x) * dt * 2.5;
        object.y += (player.y - object.y) * dt * 2.5;
      }
    });

    // Particles
    particles.forEach(particle => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
    });

    particles = particles.filter(particle => particle.life > 0);

    // Level progression
    const newLevel = Math.floor(score / 1000) + 1;

    if (newLevel > level) {
      level = newLevel;
      invincible = Math.max(invincible, 1);
      createExplosion(player.x, player.y, "#25dfff", 20);
    }

    updateHUD();
  }

  // ==========================================
  // DRAW
  // ==========================================

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#080b20");
    gradient.addColorStop(1, "#101b3c");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    stars.forEach(star => {
      ctx.globalAlpha = 0.35 + star.size * 0.2;
      ctx.fillStyle = "#b9eaff";
      ctx.fillRect(star.x, star.y, star.size, star.size * 2);
    });

    ctx.globalAlpha = 1;

    // Subtle grid
    ctx.strokeStyle = "rgba(50,130,220,.08)";
    ctx.lineWidth = 1;

    for (let x = 0; x < W; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    for (let y = 0; y < H; y += 42) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  function drawPlayer() {
    if (invincible > 0 && Math.floor(invincible * 10) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    ctx.save();
    ctx.translate(player.x, player.y);

    // Engine glow
    ctx.shadowBlur = 22;
    ctx.shadowColor = "#25dfff";
    ctx.fillStyle = "#25dfff";

    ctx.beginPath();
    ctx.moveTo(-7, 15);
    ctx.lineTo(0, 34 + Math.random() * 7);
    ctx.lineTo(7, 15);
    ctx.closePath();
    ctx.fill();

    // Ship body
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#25dfff";

    const shipGradient = ctx.createLinearGradient(-20, -20, 20, 20);
    shipGradient.addColorStop(0, "#ffffff");
    shipGradient.addColorStop(0.4, "#25dfff");
    shipGradient.addColorStop(1, "#3861d8");

    ctx.fillStyle = shipGradient;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(19, 17);
    ctx.lineTo(7, 12);
    ctx.lineTo(0, 17);
    ctx.lineTo(-7, 12);
    ctx.lineTo(-19, 17);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#101a45";
    ctx.beginPath();
    ctx.ellipse(0, -5, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (invincible > 0 || shieldTime > 0) {
      ctx.strokeStyle = "rgba(37,223,255,.7)";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#25dfff";
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    ctx.shadowBlur = 16;
    ctx.shadowColor = enemy.color;

    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.moveTo(0, enemy.radius);
    ctx.lineTo(enemy.radius, -enemy.radius);
    ctx.lineTo(0, -enemy.radius * 0.55);
    ctx.lineTo(-enemy.radius, -enemy.radius);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.8;
    ctx.fillRect(-4, -5, 8, 4);

    ctx.restore();
    ctx.globalAlpha = 1;

    if (enemy.hp > 1) {
      ctx.fillStyle = "rgba(255,255,255,.2)";
      ctx.fillRect(enemy.x - 16, enemy.y - enemy.radius - 9, 32, 3);

      ctx.fillStyle = enemy.color;
      ctx.fillRect(
        enemy.x - 16,
        enemy.y - enemy.radius - 9,
        32 * (enemy.hp / (enemy.type === "heavy" ? 7 : 5)),
        3
      );
    }
  }

  function drawCrystal(object) {
    ctx.save();
    ctx.translate(object.x, object.y);
    ctx.rotate(performance.now() * 0.0015);

    ctx.shadowBlur = 18;
    ctx.shadowColor = "#25dfff";
    ctx.fillStyle = "#25dfff";

    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function draw(dt) {
    drawBackground();

    objects.forEach(object => {
      if (object.kind === "enemy") {
        drawEnemy(object);
      } else {
        drawCrystal(object);
      }
    });

    bullets.forEach(bullet => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = bullet.color || "#25dfff";
      ctx.fillStyle = bullet.color || "#25dfff";
      ctx.fillRect(bullet.x - 2, bullet.y - 10, 4, 14);
      ctx.restore();
    });

    particles.forEach(particle => {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        particle.x,
        particle.y,
        particle.size,
        particle.size
      );
    });

    ctx.globalAlpha = 1;

    drawPlayer();

    // Bottom HUD line
    ctx.strokeStyle = "rgba(37,223,255,.3)";
    ctx.beginPath();
    ctx.moveTo(0, H - 2);
    ctx.lineTo(W, H - 2);
    ctx.stroke();
  }

  // ==========================================
  // MAIN GAME LOOP
  // ==========================================

  function loop(timestamp) {
    if (gameState !== "playing") return;

    const dt = Math.min((timestamp - lastFrame) / 1000 || 0, 0.04);
    lastFrame = timestamp;

    update(dt);

    if (gameState === "playing") {
      draw(dt);
      animationId = requestAnimationFrame(loop);
    }
  }

  // ==========================================
  // END GAME
  // ==========================================

  function endRun() {
    if (gameState !== "playing") return;

    gameState = "over";

    if (animationId) cancelAnimationFrame(animationId);

    save.runs++;
    save.credits += earned;
    save.best = Math.max(save.best, score);

    saveGame();

    const finalScore = $("finalScore");
    const earnedEl = $("earned");
    const bestResult = $("bestResult");

    if (finalScore) finalScore.textContent = score.toLocaleString();
    if (earnedEl) earnedEl.textContent = earned.toLocaleString();
    if (bestResult) bestResult.textContent = save.best.toLocaleString();

    showScreen("result");
  }

  // ==========================================
  // INITIAL DRAW AND STARTUP
  // ==========================================

  function initialDraw() {
    drawBackground();

    player.x = W / 2;
    player.y = H - 105;

    drawPlayer();
  }

  updateBank();
  updateHomeStats();
  updateDailyButton();
  initialDraw();

  showScreen("home");

  console.log("NEON DRIFT loaded successfully.");
})();
