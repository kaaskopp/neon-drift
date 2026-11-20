
(() => {
  "use strict";

  // ==========================================
  // NEON DRIFT: SPACE ARCADE
  // ==========================================

  const SAVE_KEY = "neonDriftSpaceArcade_v1";

  const $ = id => document.getElementById(id);

  const canvas = $("game");
  const ctx = canvas.getContext("2d");

  const W = 420;
  const H = 700;

  canvas.width = W;
  canvas.height = H;

  // ==========================================
  // SAVE DATA
  // ==========================================

  const defaults = {
    credits: 0,
    best: 0,
    runs: 0,
    upgrades: {
      shield: 0,
      engine: 0,
      magnet: 0,
      extra: 0
    }
  };

  let save;

  try {
    save = JSON.parse(localStorage.getItem(SAVE_KEY)) || defaults;
  } catch {
    save = structuredClone(defaults);
  }

  save.credits ??= 0;
  save.best ??= 0;
  save.runs ??= 0;
  save.upgrades ??= { ...defaults.upgrades };

  Object.keys(defaults.upgrades).forEach(key => {
    save.upgrades[key] ??= 0;
  });

  function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    updateMenu();
  }

  // ==========================================
  // GAME STATE
  // ==========================================

  let state = "home";

  let score = 0;
  let earned = 0;
  let level = 1;
  let lives = 3;
  let time = 0;

  let objects = [];
  let particles = [];
  let stars = [];

  let spawnTimer = 0;
  let crystalTimer = 0;
  let powerTimer = 0;

  let invincible = 0;
  let shieldTime = 0;
  let slowTime = 0;

  let lastFrame = 0;
  let animationId = null;

  // ==========================================
  // PLAYER
  // ==========================================

  const player = {
    x: W / 2,
    y: H - 105,
    width: 38,
    height: 48
  };

  let pointerDown = false;
  let pointerId = null;

  // ==========================================
  // UPGRADES
  // ==========================================

  const upgradeInfo = {
    shield: {
      name: "Shield",
      description: "Start each run with extra protection.",
      base: 100,
      max: 5
    },
    engine: {
      name: "Engine",
      description: "Improves your ship's movement handling.",
      base: 120,
      max: 5
    },
    magnet: {
      name: "Crystal Magnet",
      description: "Attract crystals from further away.",
      base: 150,
      max: 5
    },
    extra: {
      name: "Extra Life",
      description: "Start each run with another life.",
      base: 250,
      max: 3
    }
  };

  function upgradeCost(key) {
    return upgradeInfo[key].base *
      (save.upgrades[key] + 1);
  }

  function renderUpgrades() {
    const list = $("upgradeList");
    if (!list) return;

    list.innerHTML = "";

    Object.keys(upgradeInfo).forEach(key => {
      const info = upgradeInfo[key];
      const level = save.upgrades[key];
      const maxed = level >= info.max;
      const cost = upgradeCost(key);

      const card = document.createElement("div");
      card.className = "upgrade-card";

      card.innerHTML = `
        <div class="upgrade-info">
          <h3>${info.name}</h3>
          <p>${info.description}</p>
          <small>Level ${level}/${info.max}</small>
        </div>
        <button class="upgrade-button" ${maxed || save.credits < cost ? "disabled" : ""}>
          ${maxed ? "MAX LEVEL" : "UPGRADE · ${cost}"}
        </button>
      `;

      card.querySelector("button").textContent =
        maxed ? "MAX LEVEL" : `UPGRADE · ${cost}`;

      card.querySelector("button").addEventListener("click", () => {
        buyUpgrade(key);
      });

      list.appendChild(card);
    });
  }

  function buyUpgrade(key) {
    const info = upgradeInfo[key];
    if (!info) return;

    if (save.upgrades[key] >= info.max) return;

    const cost = upgradeCost(key);
    if (save.credits < cost) return;

    save.credits -= cost;
    save.upgrades[key]++;

    saveGame();
    renderUpgrades();
  }

  // ==========================================
  // MENU
  // ==========================================

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach(screen => {
      screen.classList.remove("active");
    });

    const screen = $(name);
    if (screen) screen.classList.add("active");

    state = name;
  }

  function updateMenu() {
    if ($("bank")) $("bank").textContent = save.credits;
    if ($("shopBank")) $("shopBank").textContent = save.credits;
    if ($("bestHome")) $("bestHome").textContent = save.best;
    if ($("runsHome")) $("runsHome").textContent = save.runs;
    if ($("levelHome")) $("levelHome").textContent = "1";

    renderUpgrades();
  }

  $("playBtn")?.addEventListener("click", () => {
    showScreen("tutorial");
  });

  $("againBtn")?.addEventListener("click", () => {
    startRun();
  });

  document.querySelectorAll("[data-screen]").forEach(button => {
    button.addEventListener("click", () => {
      showScreen(button.dataset.screen);
    });
  });

  // Support common menu button IDs
  $("shopBtn")?.addEventListener("click", () => {
    showScreen("shop");
  });

  $("tutorialBtn")?.addEventListener("click", () => {
    showScreen("tutorial");
  });

  $("startBtn")?.addEventListener("click", startRun);

  // ==========================================
  // STARS
  // ==========================================

  function createStars() {
    stars = [];

    for (let i = 0; i < 110; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 2 + 0.3,
        speed: Math.random() * 65 + 20,
        alpha: Math.random() * 0.7 + 0.2
      });
    }
  }

  function drawStars(dt) {
    ctx.save();

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

    ctx.restore();
  }

  // ==========================================
  // BACKGROUND
  // ==========================================

  function drawBackground(dt) {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#080b25");
    gradient.addColorStop(0.5, "#10143a");
    gradient.addColorStop(1, "#050817");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    drawStars(dt);

    // Planet
    ctx.save();
    ctx.globalAlpha = 0.16;

    const planet = ctx.createRadialGradient(
      320, 190, 5,
      320, 190, 105
    );

    planet.addColorStop(0, "#b58cff");
    planet.addColorStop(0.7, "#6046b8");
    planet.addColorStop(1, "#17133c");

    ctx.fillStyle = planet;
    ctx.beginPath();
    ctx.arc(320, 190, 105, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Horizon grid
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#4b9dff";
    ctx.lineWidth = 1;

    for (let y = 480; y < H; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // PLAYER DRAWING
  // ==========================================

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Engine glow
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#00d9ff";

    ctx.fillStyle = "#00bfff";
    ctx.beginPath();
    ctx.moveTo(-9, 17);
    ctx.lineTo(0, 39 + Math.random() * 7);
    ctx.lineTo(9, 17);
    ctx.fill();

    ctx.shadowBlur = 18;
    ctx.shadowColor = "#00d9ff";

    // Wings
    ctx.fillStyle = "#247dff";
    ctx.beginPath();
    ctx.moveTo(-12, -7);
    ctx.lineTo(-34, 18);
    ctx.lineTo(-23, 18);
    ctx.lineTo(-7, 10);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(12, -7);
    ctx.lineTo(34, 18);
    ctx.lineTo(23, 18);
    ctx.lineTo(7, 10);
    ctx.fill();

    // Main ship
    const shipGradient = ctx.createLinearGradient(0, -25, 0, 20);
    shipGradient.addColorStop(0, "#ffffff");
    shipGradient.addColorStop(0.45, "#60dfff");
    shipGradient.addColorStop(1, "#1465d9");

    ctx.fillStyle = shipGradient;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(15, 12);
    ctx.lineTo(0, 21);
    ctx.lineTo(-15, 12);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = "#17245a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shield
    if (shieldTime > 0 || invincible > 0) {
      ctx.strokeStyle = "#00eaff";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#00eaff";
      ctx.beginPath();
      ctx.arc(0, 0, 43, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // OBJECTS
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
      spin: (Math.random() - 0.5) * 3
    });
  }

  function spawnDrone() {
    objects.push({
      type: "drone",
      x: 30 + Math.random() * (W - 60),
      y: -40,
      size: 19,
      speed: 220 + level * 15,
      phase: Math.random() * 6
    });
  }

  function spawnCrystal() {
    objects.push({
      type: "crystal",
      x: 25 + Math.random() * (W - 50),
      y: -30,
      size: 11,
      speed: 160 + level * 8,
      rotation: 0
    });
  }

  function spawnPower() {
    objects.push({
      type: Math.random() > 0.5 ? "shield" : "slow",
      x: 30 + Math.random() * (W - 60),
      y: -30,
      size: 15,
      speed: 145
    });
  }

  // ==========================================
  // DRAW OBJECTS
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
          const radius = obj.size * (0.75 + Math.sin(i * 3) * 0.2);

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
        ctx.rotate(obj.rotation);

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

      if (obj.type === "shield" || obj.type === "slow") {
        const color = obj.type === "shield" ? "#00cfff" : "#b77aff";

        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(obj.type === "shield" ? "S" : "T", 0, 1);
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
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
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
    });

    particles = particles.filter(p => p.life > 0);

    particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }

  // ==========================================
  // COLLISION
  // ==========================================

  function collides(obj) {
    const dx = obj.x - player.x;
    const dy = obj.y - player.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < obj.size + 22;
  }

  function damage(obj) {
    if (invincible > 0) return;

    if (shieldTime > 0) {
      shieldTime = 0;
      invincible = 0.8;
      burst(obj.x, obj.y, "#00eaff");
      return;
    }

    lives--;
    invincible = 1.5;

    burst(player.x, player.y, "#ff477e", 22);

    updateHUD();

    if (lives <= 0) {
      endRun();
    }
  }

  // ==========================================
  // HUD
  // ==========================================

  function updateHUD() {
    if ($("score")) $("score").textContent = Math.floor(score);
    if ($("bestHud")) $("bestHud").textContent = save.best;
    if ($("lives")) $("lives").textContent = lives;
    if ($("levelHome")) $("levelHome").textContent = level;
  }

  // ==========================================
  // GAME UPDATE
  // ==========================================

  function update(dt) {
    time += dt;

    if (invincible > 0) invincible -= dt;
    if (shieldTime > 0) shieldTime -= dt;
    if (slowTime > 0) slowTime -= dt;

    // DIRECT TOUCH CONTROL:
    // Player position is set immediately when your finger moves.
    // No acceleration or speed limit is applied here.

    score += dt * (10 + level * 2);

    const newLevel = Math.floor(score / 1500) + 1;

    if (newLevel > level) {
      level = newLevel;
      earned += 25;
      save.credits += 25;
      saveGame();
    }

    spawnTimer -= dt;
    crystalTimer -= dt;
    powerTimer -= dt;

    const difficulty = Math.min(level, 12);

    if (spawnTimer <= 0) {
      if (Math.random() < 0.22) spawnDrone();
      else spawnRock();

      spawnTimer = Math.max(0.28, 0.9 - difficulty * 0.045);
    }

    if (crystalTimer <= 0) {
      spawnCrystal();
      crystalTimer = 1.4 + Math.random() * 1.3;
    }

    if (powerTimer <= 0) {
      if (Math.random() < 0.65) spawnPower();
      powerTimer = 10 + Math.random() * 8;
    }

    const magnetRange = 85 + save.upgrades.magnet * 35;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];

      obj.y += obj.speed * dt * (slowTime > 0 ? 0.55 : 1);

      if (obj.type === "rock") {
        obj.rotation += obj.spin * dt;
      }

      if (obj.type === "crystal") {
        obj.rotation += dt * 2;

        const dx = player.x - obj.x;
        const dy = player.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < magnetRange) {
          obj.x += dx * Math.min(1, dt * 5);
          obj.y += dy * Math.min(1, dt * 5);
        }
      }

      if (collides(obj)) {
        if (obj.type === "crystal") {
          earned += 5;
          save.credits += 5;
          burst(obj.x, obj.y, "#00f5d4", 10);
          objects.splice(i, 1);
          continue;
        }

        if (obj.type === "shield") {
          shieldTime = 7;
          burst(obj.x, obj.y, "#00dfff");
          objects.splice(i, 1);
          continue;
        }

        if (obj.type === "slow") {
          slowTime = 5;
          burst(obj.x, obj.y, "#b77aff");
          objects.splice(i, 1);
          continue;
        }

        if (obj.type === "rock" || obj.type === "drone") {
          objects.splice(i, 1);
          damage(obj);
          continue;
        }
      }

      if (obj.y > H + 60) {
        objects.splice(i, 1);
      }
    }

    if (state !== "playing") return;

    updateHUD();
  }

  // ==========================================
  // DRAW
  // ==========================================

  function draw(dt) {
    drawBackground(dt);

    drawObjects();
    updateParticles(dt);
    drawPlayer();

    // Power indicators
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";

    if (shieldTime > 0) {
      ctx.fillStyle = "#00eaff";
      ctx.fillText(`SHIELD ${Math.ceil(shieldTime)}s`, 15, 28);
    }

    if (slowTime > 0) {
      ctx.fillStyle = "#c38aff";
      ctx.fillText(`SLOW TIME ${Math.ceil(slowTime)}s`, 15, 48);
    }

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText(`LEVEL ${level}`, W - 15, 28);
  }

  // ==========================================
  // GAME LOOP
  // ==========================================

  function loop(timestamp) {
    if (state !== "playing") return;

    const dt = Math.min((timestamp - lastFrame) / 1000 || 0, 0.04);
    lastFrame = timestamp;

    update(dt);

    if (state === "playing") {
      draw(dt);
    }

    animationId = requestAnimationFrame(loop);
  }

  // ==========================================
  // START GAME
  // ==========================================

  function startRun() {
    score = 0;
    earned = 0;
    level = 1;
    lives = 3 + save.upgrades.extra;

    time = 0;

    objects = [];
    particles = [];

    spawnTimer = 0.5;
    crystalTimer = 1;
    powerTimer = 5;

    invincible = 1.5 + save.upgrades.shield * 1.5;
    shieldTime = 0;
    slowTime = 0;

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

  // ==========================================
  // END GAME
  // ==========================================

  function endRun() {
    state = "result";

    cancelAnimationFrame(animationId);

    pointerDown = false;
    pointerId = null;

    save.runs++;
    save.credits += earned;

    const finalScore = Math.floor(score);

    if (finalScore > save.best) {
      save.best = finalScore;
    }

    saveGame();

    if ($("finalScore")) $("finalScore").textContent = finalScore;
    if ($("earned")) $("earned").textContent = earned;
    if ($("bestResult")) $("bestResult").textContent = save.best;

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

    if ($("overlay")) $("overlay").classList.add("active");
    if ($("overlayTitle")) $("overlayTitle").textContent = "PAUSED";
    if ($("overlayText")) $("overlayText").textContent = "Take a break, pilot.";
    if ($("overlayTag")) $("overlayTag").textContent = "MISSION PAUSED";
  }

  function resumeGame() {
    if (state !== "paused") return;

    if ($("overlay")) $("overlay").classList.remove("active");

    state = "playing";
    pointerDown = false;
    pointerId = null;

    lastFrame = performance.now();
    animationId = requestAnimationFrame(loop);
  }

  function quitGame() {
    if (state !== "paused") return;

    if ($("overlay")) $("overlay").classList.remove("active");

    endRun();
  }

  $("pauseBtn")?.addEventListener("click", pauseGame);
  $("resumeBtn")?.addEventListener("click", resumeGame);
  $("quitBtn")?.addEventListener("click", quitGame);

  // ==========================================
  // TOUCH CONTROL
  // ==========================================

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();

    const scaleX = W / rect.width;

    return (event.clientX - rect.left) * scaleX;
  }

  function moveShip(event) {
    const x = pointerPosition(event);

    // Immediate position update, not delayed by the game loop.
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

    const step = 28;

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      player.x = Math.max(25, player.x - step);
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      player.x = Math.min(W - 25, player.x + step);
    }

    if (event.key === "Escape") {
      pauseGame();
    }
  });

  // ==========================================
  // INITIALIZE
  // ==========================================

  createStars();
  updateMenu();
  updateHUD();

  showScreen("home");

})();
