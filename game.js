
(() => {
  "use strict";

  // ==========================================
  // NEON DRIFT - SPACE ARCADE
  // ==========================================

  const $ = id => document.getElementById(id);
  const canvas = $("game");
  const ctx = canvas.getContext("2d");

  const W = 420;
  const H = 700;
  canvas.width = W;
  canvas.height = H;

  const SAVE_KEY = "neonDriftSpaceArcade_v1";
  const OLD_KEY = "neonDriftAfterburn_v1";

  const defaults = {
    credits: 0,
    best: 0,
    runs: 0,
    upgrades: {
      shield: 0,
      engine: 0,
      magnet: 0,
      extra: 0
    },
    inventory: ["laser", "basic_hull"],
    equipped: {
      weapon: "laser",
      module: "basic_hull"
    },
    lastDailyClaim: ""
  };

  function loadSave() {
    try {
      const current = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (current) return current;

      // Keep credits and progress from the previous game version.
      const old = JSON.parse(localStorage.getItem(OLD_KEY));
      if (old) {
        return {
          ...defaults,
          credits: old.credits || 0,
          best: old.best || 0,
          runs: old.runs || 0,
          upgrades: {
            ...defaults.upgrades,
            ...(old.upgrades || {})
          }
        };
      }
    } catch (error) {
      console.warn("Save data could not be loaded.", error);
    }

    return JSON.parse(JSON.stringify(defaults));
  }

  const save = loadSave();

  save.upgrades = { ...defaults.upgrades, ...(save.upgrades || {}) };
  save.inventory = Array.isArray(save.inventory) ? save.inventory : ["laser", "basic_hull"];
  save.equipped = { ...defaults.equipped, ...(save.equipped || {}) };
  save.lastDailyClaim = save.lastDailyClaim || "";

  function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    updateMenu();
  }

  // ==========================================
  // EQUIPMENT DATABASE
  // ==========================================

  const items = {
    laser: {
      name: "Standard Laser",
      type: "weapon",
      rarity: "Common",
      icon: "✦",
      description: "A reliable single laser.",
      damage: 1,
      fireRate: 0.55,
      color: "#39eaff",
      price: 0
    },
    twin_laser: {
      name: "Twin Laser",
      type: "weapon",
      rarity: "Uncommon",
      icon: "✦",
      description: "Fires two lasers at once.",
      damage: 1,
      fireRate: 0.58,
      color: "#65ffb4",
      price: 0
    },
    plasma: {
      name: "Plasma Cannon",
      type: "weapon",
      rarity: "Rare",
      icon: "◈",
      description: "Powerful plasma shots.",
      damage: 3,
      fireRate: 0.8,
      color: "#5e9cff",
      price: 0
    },
    burst: {
      name: "Burst Blaster",
      type: "weapon",
      rarity: "Epic",
      icon: "✧",
      description: "Fires a fast three-shot burst.",
      damage: 2,
      fireRate: 0.72,
      color: "#c58aff",
      price: 0
    },
    nova: {
      name: "Nova Cannon",
      type: "weapon",
      rarity: "Legendary",
      icon: "☀",
      description: "A powerful five-direction energy blast.",
      damage: 3,
      fireRate: 0.9,
      color: "#ffc45c",
      price: 0
    },

    basic_hull: {
      name: "Standard Hull",
      type: "module",
      rarity: "Common",
      icon: "⬡",
      description: "Your standard spacecraft hull.",
      health: 0,
      magnet: 0,
      price: 0
    },
    reinforced_hull: {
      name: "Reinforced Hull",
      type: "module",
      rarity: "Uncommon",
      icon: "⬡",
      description: "Adds one extra starting life.",
      health: 1,
      magnet: 0,
      price: 0
    },
    crystal_core: {
      name: "Crystal Core",
      type: "module",
      rarity: "Rare",
      icon: "◆",
      description: "Attracts crystals from further away.",
      health: 0,
      magnet: 90,
      price: 0
    },
    overdrive: {
      name: "Overdrive Core",
      type: "module",
      rarity: "Epic",
      icon: "⚡",
      description: "Increases your weapon's firing speed.",
      health: 0,
      magnet: 0,
      fireBonus: 0.18,
      price: 0
    },
    phoenix_core: {
      name: "Phoenix Core",
      type: "module",
      rarity: "Legendary",
      icon: "🔥",
      description: "Adds two extra starting lives.",
      health: 2,
      magnet: 60,
      price: 0
    }
  };

  const rarityClass = rarity => "rarity-" + rarity.toLowerCase();

  function getItem(id) {
    return items[id] || items.laser;
  }

  function owns(id) {
    return save.inventory.includes(id);
  }

  function rarityColor(rarity) {
    return {
      Common: "#c4cad7",
      Uncommon: "#57df8c",
      Rare: "#4c9dff",
      Epic: "#c17aff",
      Legendary: "#ffbd4a"
    }[rarity] || "#ffffff";
  }

  // ==========================================
  // NAVIGATION
  // ==========================================

  let state = "home";

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach(screen => {
      screen.classList.remove("active");
    });

    const target = $(name);
    if (target) target.classList.add("active");

    state = name;

    if (name === "hangar") renderHangar();
    if (name === "packs") updateDailyButton();
    if (name === "upgrades") renderUpgrades();
  }

  document.querySelectorAll("[data-open]").forEach(button => {
    button.addEventListener("click", () => {
      if (state === "playing" || state === "paused") return;
      showScreen(button.dataset.open);
    });
  });

  $("playBtn").addEventListener("click", () => showScreen("tutorial"));
  $("startBtn").addEventListener("click", startRun);
  $("againBtn").addEventListener("click", startRun);

  // ==========================================
  // MENU HUD
  // ==========================================

  function updateMenu() {
    if ($("bank")) $("bank").textContent = save.credits;
    if ($("bestHome")) $("bestHome").textContent = save.best;
    if ($("runsHome")) $("runsHome").textContent = save.runs;
    if ($("shipLevelHome")) {
      $("shipLevelHome").textContent =
        1 + Object.values(save.upgrades).reduce((a, b) => a + b, 0);
    }
  }

  // ==========================================
  // HANGAR
  // ==========================================

  let inventoryFilter = "all";

  function renderHangar() {
    const weapon = getItem(save.equipped.weapon);
    const module = getItem(save.equipped.module);

    $("shipName").textContent = weapon.name.toUpperCase();

    $("weaponSlots").innerHTML = `
      <div class="equipment-slot">
        <div>
          <strong>⚡ Weapon</strong>
          <small class="${rarityClass(weapon.rarity)}">${weapon.name} · ${weapon.rarity}</small>
        </div>
        <button data-jump="weapon">CHANGE</button>
      </div>`;

    $("moduleSlots").innerHTML = `
      <div class="equipment-slot">
        <div>
          <strong>◆ Module</strong>
          <small class="${rarityClass(module.rarity)}">${module.name} · ${module.rarity}</small>
        </div>
        <button data-jump="module">CHANGE</button>
      </div>`;

    document.querySelectorAll("[data-jump]").forEach(button => {
      button.addEventListener("click", () => {
        inventoryFilter = button.dataset.jump;
        renderInventory();
        document.querySelector(".subheading")?.scrollIntoView({ behavior: "smooth" });
      });
    });

    renderInventory();
  }

  function renderInventory() {
    const container = $("inventory");
    container.innerHTML = "";

    const ownedItems = save.inventory
      .map(id => ({ id, item: getItem(id) }))
      .filter(entry => inventoryFilter === "all" || entry.item.type === inventoryFilter);

    document.querySelectorAll(".filter").forEach(button => {
      button.classList.toggle("active", button.dataset.filter === inventoryFilter);
    });

    if (!ownedItems.length) {
      container.innerHTML = '<p class="muted">No equipment in this category yet. Open some packs!</p>';
      return;
    }

    ownedItems.forEach(({ id, item }) => {
      const equipped = save.equipped[item.type] === id;
      const card = document.createElement("div");
      card.className = "item-card";

      card.innerHTML = `
        <div class="item-icon" style="color:${rarityColor(item.rarity)}">${item.icon}</div>
        <strong>${item.name}</strong>
        <small class="${rarityClass(item.rarity)}">${item.rarity} ${item.type}</small>
        <small>${item.description}</small>
        <button ${equipped ? "disabled" : ""}>${equipped ? "EQUIPPED" : "EQUIP"}</button>
      `;

      card.querySelector("button").addEventListener("click", () => {
        save.equipped[item.type] = id;
        saveGame();
        renderHangar();
      });

      container.appendChild(card);
    });
  }

  document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      inventoryFilter = button.dataset.filter;
      renderInventory();
    });
  });

  // ==========================================
  // SUPPLY PACKS
  // ==========================================

  function localDateKey() {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }

  function updateDailyButton() {
    const claimed = save.lastDailyClaim === localDateKey();

    $("dailyBtn").disabled = claimed;
    $("dailyBtn").textContent = claimed ? "ALREADY CLAIMED" : "CLAIM FREE PACK";
    $("dailyStatus").textContent = claimed
      ? "Your next free pack is available tomorrow."
      : "Your free pack is ready!";
  }

  function chooseRarity(elite) {
    const roll = Math.random() * 100;

    if (elite) {
      if (roll < 35) return "Common";
      if (roll < 65) return "Uncommon";
      if (roll < 85) return "Rare";
      if (roll < 97) return "Epic";
      return "Legendary";
    }

    if (roll < 60) return "Common";
    if (roll < 85) return "Uncommon";
    if (roll < 95) return "Rare";
    if (roll < 99) return "Epic";
    return "Legendary";
  }

  function openPack(elite) {
    const rarity = chooseRarity(elite);

    let pool = Object.entries(items)
      .filter(([id, item]) => item.rarity === rarity);

    // Prefer an item the player does not already own.
    let newPool = pool.filter(([id]) => !owns(id));
    let duplicate = false;

    if (!newPool.length) {
      newPool = pool;
      duplicate = true;
    }

    const [id, item] = newPool[Math.floor(Math.random() * newPool.length)];

    if (!duplicate) {
      save.inventory.push(id);
    } else {
      const bonus = {
        Common: 25,
        Uncommon: 50,
        Rare: 100,
        Epic: 200,
        Legendary: 400
      }[rarity];

      save.credits += bonus;
    }

    saveGame();

    $("packResult").classList.remove("hidden");
    $("packItemIcon").textContent = item.icon;
    $("packItemIcon").style.color = rarityColor(rarity);
    $("packItemName").textContent = duplicate ? `${item.name} · DUPLICATE` : item.name;
    $("packRarity").textContent = rarity.toUpperCase();
    $("packRarity").className = "rarity-label " + rarityClass(rarity);
    $("packItemDesc").textContent = duplicate
      ? `${item.description} You already own this item, so you received bonus credits instead.`
      : item.description;

    $("dailyBtn").disabled = true;
    $("buyPackBtn").disabled = true;
  }

  $("dailyBtn").addEventListener("click", () => {
    if (save.lastDailyClaim === localDateKey()) return;

    save.lastDailyClaim = localDateKey();
    saveGame();
    openPack(false);
    updateDailyButton();
  });

  $("buyPackBtn").addEventListener("click", () => {
    if (save.credits < 500) {
      $("dailyStatus").textContent = "Not enough credits. Play a mission to earn more!";
      return;
    }

    save.credits -= 500;
    saveGame();
    openPack(true);
  });

  $("packDoneBtn").addEventListener("click", () => {
    $("packResult").classList.add("hidden");
    $("buyPackBtn").disabled = false;
    updateDailyButton();
  });

  // ==========================================
  // PERMANENT UPGRADES
  // ==========================================

  const upgrades = {
    shield: {
      name: "Energy Shield",
      description: "Start each mission with extra protection.",
      base: 120,
      max: 5
    },
    engine: {
      name: "Engine Core",
      description: "Improves your ship's handling.",
      base: 150,
      max: 5
    },
    magnet: {
      name: "Crystal Magnet",
      description: "Collect crystals from further away.",
      base: 130,
      max: 5
    },
    extra: {
      name: "Hull Reinforcement",
      description: "Start with an additional life.",
      base: 250,
      max: 3
    }
  };

  function renderUpgrades() {
    const list = $("upgradeList");
    if (!list) return;

    list.innerHTML = "";

    Object.entries(upgrades).forEach(([key, info]) => {
      const level = save.upgrades[key] || 0;
      const cost = info.base * (level + 1);
      const maxed = level >= info.max;

      const card = document.createElement("div");
      card.className = "upgrade-card";

      const infoBox = document.createElement("div");
      infoBox.innerHTML = `
        <h3>${info.name}</h3>
        <p>${info.description}</p>
        <small>LEVEL ${level}/${info.max}</small>
      `;

      const button = document.createElement("button");
      button.className = "upgrade-button";
      button.textContent = maxed ? "MAX LEVEL" : `${cost} CR`;
      button.disabled = maxed || save.credits < cost;

      button.addEventListener("click", () => {
        if (save.credits < cost || save.upgrades[key] >= info.max) return;

        save.credits -= cost;
        save.upgrades[key]++;
        saveGame();
        renderUpgrades();
      });

      card.append(infoBox, button);
      list.appendChild(card);
    });
  }

  // ==========================================
  // GAME STATE
  // ==========================================

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
  let animationId = null;
  let pointerDown = false;
  let pointerId = null;

  const player = {
    x: W / 2,
    y: H - 105
  };

  // ==========================================
  // STARS AND BACKGROUND
  // ==========================================

  function createStars() {
    stars = [];

    for (let i = 0; i < 110; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 2 + .3,
        speed: Math.random() * 65 + 20,
        alpha: Math.random() * .7 + .2
      });
    }
  }

  function drawBackground(dt) {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#080b25");
    gradient.addColorStop(.55, "#10143a");
    gradient.addColorStop(1, "#050817");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    stars.forEach(star => {
      star.y += star.speed * dt;

      if (star.y > H) {
        star.y = 0;
        star.x = Math.random() * W;
      }

      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;

    ctx.save();
    ctx.globalAlpha = .13;

    const planet = ctx.createRadialGradient(320, 190, 5, 320, 190, 105);
    planet.addColorStop(0, "#b58cff");
    planet.addColorStop(.7, "#6046b8");
    planet.addColorStop(1, "#17133c");

    ctx.fillStyle = planet;
    ctx.beginPath();
    ctx.arc(320, 190, 105, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ==========================================
  // PLAYER DRAWING
  // ==========================================

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.shadowBlur = 24;
    ctx.shadowColor = "#00d9ff";

    ctx.fillStyle = "#00bfff";
    ctx.beginPath();
    ctx.moveTo(-8, 17);
    ctx.lineTo(0, 43 + Math.random() * 5);
    ctx.lineTo(8, 17);
    ctx.fill();

    ctx.fillStyle = "#247dff";
    ctx.beginPath();
    ctx.moveTo(-12, -7);
    ctx.lineTo(-34, 18);
    ctx.lineTo(-7, 10);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(12, -7);
    ctx.lineTo(34, 18);
    ctx.lineTo(7, 10);
    ctx.fill();

    const shipGradient = ctx.createLinearGradient(0, -25, 0, 20);
    shipGradient.addColorStop(0, "#ffffff");
    shipGradient.addColorStop(.45, "#60dfff");
    shipGradient.addColorStop(1, "#1465d9");

    ctx.fillStyle = shipGradient;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(15, 12);
    ctx.lineTo(0, 21);
    ctx.lineTo(-15, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#17245a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    if (shieldTime > 0 || invincible > 0) {
      ctx.strokeStyle = "#00eaff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 43, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // ENEMIES AND CRYSTALS
  // ==========================================

  function spawnRock() {
    const size = 15 + Math.random() * 17;

    objects.push({
      type: "rock",
      x: 25 + Math.random() * (W - 50),
      y: -40,
      size,
      speed: 190 + level * 18,
      rotation: Math.random() * 6,
      spin: (Math.random() - .5) * 3,
      hp: 2
    });
  }

  function spawnDrone() {
    objects.push({
      type: "drone",
      x: 30 + Math.random() * (W - 60),
      y: -40,
      size: 19,
      speed: 220 + level * 15,
      hp: 3
    });
  }

  function spawnCrystal() {
    objects.push({
      type: "crystal",
      x: 25 + Math.random() * (W - 50),
      y: -30,
      size: 11,
      speed: 160 + level * 8
    });
  }

  // ==========================================
  // WEAPONS
  // ==========================================

  function fireWeapon() {
    const weapon = getItem(save.equipped.weapon);
    const module = getItem(save.equipped.module);

    const fireRate = Math.max(
      .2,
      weapon.fireRate - (module.fireBonus || 0) -
      save.upgrades.engine * .025
    );

    if (fireTimer > 0) return;
    fireTimer = fireRate;

    const x = player.x;
    const y = player.y - 25;
    const color = weapon.color || "#39eaff";

    function bullet(bx, by, vx, damage) {
      bullets.push({
        x: bx,
        y: by,
        vx,
        speed: 520,
        damage,
        color,
        size: 4
      });
    }

    switch (save.equipped.weapon) {
      case "twin_laser":
        bullet(x - 11, y, -12, 1);
        bullet(x + 11, y, 12, 1);
        break;

      case "plasma":
        bullet(x, y, 0, 3);
        break;

      case "burst":
        bullet(x - 12, y, -55, 2);
        bullet(x, y - 4, 0, 2);
        bullet(x + 12, y, 55, 2);
        break;

      case "nova":
        bullet(x, y, 0, 3);
        bullet(x - 8, y, -65, 3);
        bullet(x + 8, y, 65, 3);
        bullet(x - 14, y, -120, 2);
        bullet(x + 14, y, 120, 2);
        break;

      default:
        bullet(x, y, 0, 1);
    }
  }

  function drawBullets() {
    bullets.forEach(b => {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x - 2, b.y - 10, 4, 15);
      ctx.restore();
    });
  }

  // ==========================================
  // OBJECT DRAWING
  // ==========================================

  function drawObjects() {
    objects.forEach(obj => {
      ctx.save();
      ctx.translate(obj.x, obj.y);

      if (obj.type === "rock") {
        ctx.rotate(obj.rotation);
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff477e";
        ctx.fillStyle = "#71334e";
        ctx.strokeStyle = "#ff709a";
        ctx.lineWidth = 2;

        ctx.beginPath();

        for (let i = 0; i < 9; i++) {
          const angle = i / 9 * Math.PI * 2;
          const radius = obj.size * (.75 + Math.sin(i * 3) * .2);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      if (obj.type === "drone") {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff365d";
        ctx.fillStyle = "#a51f53";
        ctx.strokeStyle = "#ff5c85";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(19, 12);
        ctx.lineTo(0, 7);
        ctx.lineTo(-19, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (obj.type === "crystal") {
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00f5d4";
        ctx.fillStyle = "#00eacb";

        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 13);
        ctx.lineTo(-10, 0);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // ==========================================
  // PARTICLES
  // ==========================================

  function burst(x, y, color, amount = 12) {
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 180;

      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: .5 + Math.random() * .5,
        color,
        size: 2 + Math.random() * 4
      });
    }
  }

  function updateParticles(dt) {
    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    particles = particles.filter(p => p.life > 0);
    ctx.globalAlpha = 1;
  }

  // ==========================================
  // COLLISIONS
  // ==========================================

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function damagePlayer() {
    if (invincible > 0) return;

    if (shieldTime > 0) {
      shieldTime = 0;
      invincible = .8;
      burst(player.x, player.y, "#00eaff");
      return;
    }

    lives--;
    invincible = 1.5;
    burst(player.x, player.y, "#ff477e", 22);
    updateHUD();

    if (lives <= 0) endRun();
  }

  function updateBullets(dt) {
    bullets.forEach(b => {
      b.x += b.vx * dt;
      b.y -= b.speed * dt;
    });

    bullets = bullets.filter(b => b.y > -30 && b.x > -30 && b.x < W + 30);

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (obj.type !== "rock" && obj.type !== "drone") continue;

      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];

        if (distance(obj, b) < obj.size + 5) {
          obj.hp -= b.damage;
          bullets.splice(j, 1);
          burst(b.x, b.y, b.color, 4);

          if (obj.hp <= 0) {
            burst(obj.x, obj.y, "#ff779e", 13);
            objects.splice(i, 1);
            score += obj.type === "drone" ? 40 : 20;
          }

          break;
        }
      }
    }
  }

  // ==========================================
  // HUD
  // ==========================================

  function updateHUD() {
    if ($("score")) $("score").textContent = Math.floor(score);
    if ($("levelHud")) $("levelHud").textContent = level;
    if ($("lives")) $("lives").textContent = lives;
  }

  // ==========================================
  // GAME UPDATE
  // ==========================================

  function update(dt) {
    if (invincible > 0) invincible -= dt;
    if (shieldTime > 0) shieldTime -= dt;
    if (fireTimer > 0) fireTimer -= dt;

    score += dt * (10 + level * 2);

    const newLevel = Math.floor(score / 1500) + 1;

    if (newLevel > level) {
      level = newLevel;
      earned += 25;
      updateHUD();
    }

    spawnTimer -= dt;
    crystalTimer -= dt;

    if (spawnTimer <= 0) {
      if (Math.random() < .22) spawnDrone();
      else spawnRock();

      spawnTimer = Math.max(.28, .9 - Math.min(level, 12) * .045);
    }

    if (crystalTimer <= 0) {
      spawnCrystal();
      crystalTimer = 1.4 + Math.random() * 1.3;
    }

    // Automatic weapon firing.
    fireWeapon();

    // Move bullets.
    updateBullets(dt);

    const module = getItem(save.equipped.module);
    const magnetRange =
      85 + save.upgrades.magnet * 35 + (module.magnet || 0);

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];

      obj.y += obj.speed * dt;

      if (obj.type === "rock") obj.rotation += obj.spin * dt;

      if (obj.type === "crystal") {
        const dx = player.x - obj.x;
        const dy = player.y - obj.y;
        const dist = Math.hypot(dx, dy);

        if (dist < magnetRange) {
          obj.x += dx * Math.min(1, dt * 5);
          obj.y += dy * Math.min(1, dt * 5);
        }
      }

      if (distance(obj, player) < obj.size + 22) {
        if (obj.type === "crystal") {
          earned += 5;
          burst(obj.x, obj.y, "#00f5d4", 9);
          objects.splice(i, 1);
          continue;
        }

        if (obj.type === "rock" || obj.type === "drone") {
          objects.splice(i, 1);
          damagePlayer();
          if (state !== "playing") return;
          continue;
        }
      }

      if (obj.y > H + 60) objects.splice(i, 1);
    }

    updateHUD();
  }

  // ==========================================
  // DRAW GAME
  // ==========================================

  function draw(dt) {
    drawBackground(dt);
    drawObjects();
    drawBullets();
    updateParticles(dt);
    drawPlayer();

    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";

    if (shieldTime > 0 || invincible > 0) {
      ctx.fillStyle = "#00eaff";
      ctx.fillText("SHIELD ACTIVE", 15, 25);
    }

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText(`LEVEL ${level}`, W - 15, 25);
  }

  // ==========================================
  // GAME LOOP
  // ==========================================

  function loop(timestamp) {
    if (state !== "playing") return;

    const dt = Math.min((timestamp - lastFrame) / 1000 || 0, .04);
    lastFrame = timestamp;

    update(dt);

    if (state === "playing") {
      draw(dt);
      animationId = requestAnimationFrame(loop);
    }
  }

  // ==========================================
  // START AND END
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

    spawnTimer = .5;
    crystalTimer = 1;
    fireTimer = 0;

    invincible = 1.5 + save.upgrades.shield * 1.5;
    shieldTime = 0;

    player.x = W / 2;
    player.y = H - 105;

    pointerDown = false;
    pointerId = null;

    updateHUD();
    showScreen("gameScreen");

    lastFrame = performance.now();
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(loop);
  }

  function endRun() {
    state = "result";
    cancelAnimationFrame(animationId);

    pointerDown = false;
    pointerId = null;

    save.runs++;
    save.credits += earned;

    const finalScore = Math.floor(score);
    if (finalScore > save.best) save.best = finalScore;

    saveGame();

    $("finalScore").textContent = finalScore;
    $("earned").textContent = earned;
    $("bestResult").textContent = save.best;

    showScreen("result");
  }

  // ==========================================
  // PAUSE
  // ==========================================

  function pauseGame() {
    if (state !== "playing") return;

    state = "paused";
    pointerDown = false;
    pointerId = null;

    cancelAnimationFrame(animationId);

    $("overlay").classList.add("active");
    $("overlayTitle").textContent = "PAUSED";
    $("overlayText").textContent = "Take a break, pilot.";
    $("overlayTag").textContent = "MISSION PAUSED";
  }

  function resumeGame() {
    if (state !== "paused") return;

    $("overlay").classList.remove("active");

    state = "playing";
    lastFrame = performance.now();
    animationId = requestAnimationFrame(loop);
  }

  function quitGame() {
    if (state !== "paused") return;
    $("overlay").classList.remove("active");
    endRun();
  }

  $("pauseBtn").addEventListener("click", pauseGame);
  $("resumeBtn").addEventListener("click", resumeGame);
  $("quitBtn").addEventListener("click", quitGame);

  // ==========================================
  // DIRECT TOUCH CONTROL
  // ==========================================

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return (event.clientX - rect.left) * (W / rect.width);
  }

  function moveShip(event) {
    const x = pointerPosition(event);

    // Direct 1:1 movement. No speed limit or acceleration.
    player.x = Math.max(25, Math.min(W - 25, x));
  }

  canvas.style.touchAction = "none";

  canvas.addEventListener("pointerdown", event => {
    if (state !== "playing") return;

    event.preventDefault();
    pointerDown = true;
    pointerId = event.pointerId;

    canvas.setPointerCapture(event.pointerId);
    moveShip(event);
  });

  canvas.addEventListener("pointermove", event => {
    if (!pointerDown || state !== "playing") return;
    if (event.pointerId !== pointerId) return;

    event.preventDefault();
    moveShip(event);
  });

  function releasePointer(event) {
    if (event.pointerId !== pointerId) return;
    pointerDown = false;
    pointerId = null;
  }

  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);

  canvas.addEventListener("lostpointercapture", () => {
    pointerDown = false;
    pointerId = null;
  });

  // ==========================================
  // KEYBOARD CONTROL
  // ==========================================

  window.addEventListener("keydown", event => {
    if (state !== "playing") return;

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      player.x = Math.max(25, player.x - 28);
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      player.x = Math.min(W - 25, player.x + 28);
    }

    if (event.key === "Escape") pauseGame();
  });

  // ==========================================
  // INITIALIZE
  // ==========================================

  createStars();
  updateMenu();
  updateDailyButton();
  showScreen("home");

})();
