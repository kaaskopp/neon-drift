
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const canvas = $("game");
  const ctx = canvas.getContext("2d");

  const W = 420, H = 700;
  const SAVE_KEY = "neonDriftSpaceArcade_v1";

  const defaults = {
    credits: 0,
    best: 0,
    runs: 0,
    upgrades: { shield: 0, engine: 0, magnet: 0, extra: 0 }
  };

  let save;
  try {
    save = { ...defaults, ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") };
    save.upgrades = { ...defaults.upgrades, ...(save.upgrades || {}) };
  } catch {
    save = { ...defaults, upgrades: { ...defaults.upgrades } };
  }

  function persist() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    updateMenus();
  }

  const upgradeData = [
    { id: "shield", name: "SHIELD CORE", icon: "◉", description: "Start each mission with extra protection.", max: 5, base: 100 },
    { id: "engine", name: "ION ENGINE", icon: "✦", description: "Increase your ship's movement speed.", max: 5, base: 90 },
    { id: "magnet", name: "CREDIT MAGNET", icon: "◎", description: "Collect energy crystals from further away.", max: 5, base: 120 },
    { id: "extra", name: "HULL ARMOR", icon: "⬡", description: "Begin missions with an extra life.", max: 3, base: 180 }
  ];

  let state = "home";
  let score = 0;
  let earned = 0;
  let level = 1;
  let lives = 3;
  let player;
  let objects = [];
  let particles = [];
  let stars = [];
  let elapsed = 0;
  let spawnTimer = 0;
  let shake = 0;
  let lastTime = 0;
  let pointerDown = false;
  let targetX = W / 2;
  let invincible = 0;
  let shieldTime = 0;
  let slowTime = 0;
  let toast = "";
  let toastTime = 0;
  let audioContext = null;

  function sound(frequency = 500, duration = .08, type = "sine") {
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(.045, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + duration);
    } catch {}
  }

  function updateMenus() {
    $("bank").textContent = save.credits;
    $("shopBank").textContent = save.credits;
    $("bestHome").textContent = save.best;
    $("bestHud").textContent = save.best;
    $("runsHome").textContent = save.runs;
    $("levelHome").textContent = Math.max(1, Math.floor(save.best / 1500) + 1);
    renderShop();
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
    state = id === "gameScreen" ? "playing" : id;
    updateMenus();
  }

  function renderShop() {
    const list = $("upgradeList");
    if (!list) return;
    list.innerHTML = "";

    upgradeData.forEach(item => {
      const current = save.upgrades[item.id] || 0;
      const cost = Math.floor(item.base * Math.pow(1.75, current));
      const maxed = current >= item.max;

      const card = document.createElement("div");
      card.className = "upgrade-card";

      const top = document.createElement("div");
      top.className = "upgrade-top";

      const name = document.createElement("div");
      name.innerHTML = `<span class="upgrade-icon">${item.icon}</span><span class="upgrade-name">${item.name}</span>`;

      const levelText = document.createElement("span");
      levelText.className = "upgrade-level";
      levelText.textContent = `LVL ${current}/${item.max}`;

      top.append(name, levelText);

      const description = document.createElement("p");
      description.className = "upgrade-description";
      description.textContent = item.description;

      const bars = document.createElement("div");
      bars.className = "level-bars";

      for (let i = 0; i < item.max; i++) {
        const bar = document.createElement("i");
        if (i < current) bar.className = "filled";
        bars.appendChild(bar);
      }

      const bottom = document.createElement("div");
      bottom.className = "upgrade-bottom";

      const price = document.createElement("span");
      price.className = "upgrade-level";
      price.textContent = maxed ? "FULLY UPGRADED" : `◈ ${cost}`;

      const button = document.createElement("button");
      button.className = "buy-btn";
      button.textContent = maxed ? "MAXED" : "UPGRADE";
      button.disabled = maxed || save.credits < cost;

      button.addEventListener("click", () => {
        if (maxed || save.credits < cost) return;
        save.credits -= cost;
        save.upgrades[item.id]++;
        sound(700, .12);
        persist();
      });

      bottom.append(price, button);
      card.append(top, description, bars, bottom);
      list.appendChild(card);
    });
  }

  function newStars() {
    stars = Array.from({ length: 115 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 1.8 + .3,
      speed: Math.random() * 65 + 20,
      alpha: Math.random() * .65 + .2
    }));
  }

  function startRun() {
    score = 0;
    earned = 0;
    level = 1;
    elapsed = 0;
    spawnTimer = 0;
    objects = [];
    particles = [];
    shake = 0;
    invincible = 1.5;
    shieldTime = 0;
    slowTime = 0;
    lives = 3 + save.upgrades.extra;

    player = {
      x: W / 2,
      y: H - 105,
      width: 30,
      height: 42,
      speed: 310 + save.upgrades.engine * 35
    };

    targetX = player.x;

    save.runs++;
    persist();

    $("score").textContent = "0";
    $("lives").textContent = "♥".repeat(lives);
    $("overlay").classList.add("hidden");

    showScreen("gameScreen");
    sound(400, .15);
    lastTime = performance.now();
  }

  function difficulty() {
    return {
      speed: Math.min(430, 155 + level * 20),
      interval: Math.max(.32, .95 - level * .045)
    };
  }

  function spawnObject() {
    const roll = Math.random();
    const x = 25 + Math.random() * (W - 50);
    const d = difficulty();

    if (roll < .48) {
      objects.push({
        type: "rock", x, y: -35,
        radius: 13 + Math.random() * 14,
        speed: d.speed * (.8 + Math.random() * .5),
        rotation: Math.random() * 6,
        spin: (Math.random() - .5) * 2,
        sides: 7 + Math.floor(Math.random() * 4)
      });
    } else if (roll < .69) {
      objects.push({
        type: "crystal", x, y: -25,
        radius: 11, speed: d.speed * .75
      });
    } else if (roll < .83) {
      objects.push({
        type: "drone", x, y: -35,
        radius: 17, speed: d.speed * .9,
        phase: Math.random() * 6
      });
    } else if (roll < .92) {
      objects.push({
        type: "shield", x, y: -25,
        radius: 13, speed: d.speed * .7
      });
    } else {
      objects.push({
        type: "slow", x, y: -25,
        radius: 13, speed: d.speed * .7
      });
    }
  }

  function burst(x, y, color, amount = 14) {
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * 180;

      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: .35 + Math.random() * .55,
        max: .9,
        size: 2 + Math.random() * 4,
        color
      });
    }
  }

  function collect(obj) {
    if (obj.type === "crystal") {
      earned += 10;
      score += 100;
      burst(obj.x, obj.y, "#48eaff", 10);
      sound(850, .1);
    } else if (obj.type === "shield") {
      shieldTime = 6;
      burst(obj.x, obj.y, "#55ffb8", 18);
      sound(600, .18);
    } else if (obj.type === "slow") {
      slowTime = 5;
      burst(obj.x, obj.y, "#b18aff", 18);
      sound(450, .18);
    }

    objects.splice(objects.indexOf(obj), 1);
  }

  function damage(obj) {
    if (invincible > 0) return;

    if (shieldTime > 0) {
      shieldTime = 0;
      burst(obj.x, obj.y, "#55ffb8", 20);
      objects.splice(objects.indexOf(obj), 1);
      sound(300, .2);
      return;
    }

    lives--;
    invincible = 1.5;
    shake = 12;

    burst(player.x, player.y, "#ff4f9a", 22);
    sound(120, .25, "sawtooth");

    objects.splice(objects.indexOf(obj), 1);
    $("lives").textContent = "♥".repeat(Math.max(0, lives));

    if (lives <= 0) endRun();
  }

  function endRun() {
    if (state !== "playing") return;

    state = "result";
    save.credits += earned;
    save.best = Math.max(save.best, score);
    persist();

    $("finalScore").textContent = score;
    $("earned").textContent = `+${earned} ◈`;
    $("bestResult").textContent = save.best;

    showScreen("result");
    sound(180, .3);
  }

  function pauseGame() {
    if (state !== "playing") return;

    state = "paused";
    $("overlayTag").textContent = "MISSION PAUSED";
    $("overlayTitle").textContent = "PAUSED";
    $("overlayText").textContent = "Your mission is on hold.";
    $("resumeBtn").textContent = "RESUME";
    $("overlay").classList.remove("hidden");
  }

  function resumeGame() {
    if (state !== "paused") return;

    $("overlay").classList.add("hidden");
    state = "playing";
    lastTime = performance.now();
  }

  function quitGame() {
    if (state !== "paused") return;

    save.credits += earned;
    save.best = Math.max(save.best, score);
    persist();
    showScreen("home");
  }

  function drawBackground(dt) {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#090d26");
    gradient.addColorStop(.55, "#10102c");
    gradient.addColorStop(1, "#070b1c");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    stars.forEach(star => {
      star.y += star.speed * dt;

      if (star.y > H) {
        star.y = 0;
        star.x = Math.random() * W;
      }

      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = "#d7faff";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;

    ctx.save();
    ctx.globalAlpha = .22;

    const planetGlow = ctx.createRadialGradient(315, 185, 10, 315, 185, 105);
    planetGlow.addColorStop(0, "#c18aff");
    planetGlow.addColorStop(.65, "#563c9c");
    planetGlow.addColorStop(1, "transparent");

    ctx.fillStyle = planetGlow;
    ctx.beginPath();
    ctx.arc(315, 185, 105, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = "rgba(72,234,255,.045)";
    ctx.lineWidth = 1;

    for (let x = 30; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
  }

  function drawShip() {
    if (!player) return;
    if (invincible > 0 && Math.floor(elapsed * 12) % 2 === 0) return;

    ctx.save();
    ctx.translate(player.x, player.y);

    const flame = 15 + Math.random() * 13;
    const fire = ctx.createLinearGradient(0, 15, 0, 15 + flame);

    fire.addColorStop(0, "#ffffff");
    fire.addColorStop(.3, "#48eaff");
    fire.addColorStop(1, "transparent");

    ctx.fillStyle = fire;
    ctx.beginPath();
    ctx.moveTo(-8, 14);
    ctx.lineTo(0, 14 + flame);
    ctx.lineTo(8, 14);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 18;
    ctx.shadowColor = "#48eaff";
    ctx.fillStyle = "#297ca8";

    ctx.beginPath();
    ctx.moveTo(-9, -2);
    ctx.lineTo(-26, 17);
    ctx.lineTo(-9, 12);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(9, -2);
    ctx.lineTo(26, 17);
    ctx.lineTo(9, 12);
    ctx.closePath();
    ctx.fill();

    const hull = ctx.createLinearGradient(-15, 0, 15, 0);
    hull.addColorStop(0, "#5e8dff");
    hull.addColorStop(.5, "#efffff");
    hull.addColorStop(1, "#45c9ff");

    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(0, -27);
    ctx.lineTo(13, 12);
    ctx.lineTo(0, 7);
    ctx.lineTo(-13, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#7bdeff";
    ctx.beginPath();
    ctx.ellipse(0, -6, 4, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    if (shieldTime > 0) {
      ctx.strokeStyle = "rgba(85,255,184,.9)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#55ffb8";
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawRock(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rotation);

    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff5b9b";
    ctx.fillStyle = "#65516e";
    ctx.strokeStyle = "#d18aa9";
    ctx.lineWidth = 2;

    ctx.beginPath();

    for (let i = 0; i < o.sides; i++) {
      const a = i / o.sides * Math.PI * 2;
      const r = o.radius * (.78 + .25 * Math.sin(i * 4.7));
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,.15)";
    ctx.beginPath();
    ctx.arc(-o.radius * .25, -o.radius * .2, o.radius * .18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawDrone(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(Math.sin(elapsed * 3 + o.phase) * .12);

    ctx.shadowBlur = 16;
    ctx.shadowColor = "#ff4f9a";
    ctx.fillStyle = "#622b67";
    ctx.strokeStyle = "#ff80ce";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(20, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(-20, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawCrystal(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(elapsed * 2);

    ctx.shadowBlur = 20;
    ctx.shadowColor = "#48eaff";
    ctx.fillStyle = "#48eaff";

    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 13);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawPowerup(o) {
    const color = o.type === "shield" ? "#55ffb8" : "#b18aff";

    ctx.save();
    ctx.translate(o.x, o.y);

    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(o.type === "shield" ? "S" : "Z", 0, 1);

    ctx.restore();
  }

  function drawObjects() {
    objects.forEach(o => {
      if (o.type === "rock") drawRock(o);
      if (o.type === "drone") drawDrone(o);
      if (o.type === "crystal") drawCrystal(o);
      if (o.type === "shield" || o.type === "slow") drawPowerup(o);
    });
  }

  function drawParticles(dt) {
    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.vx *= .98;
      p.vy *= .98;

      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    particles = particles.filter(p => p.life > 0);
  }

  function drawGame(dt) {
    ctx.save();

    if (shake > 0) {
      ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
      shake *= .88;
    }

    drawBackground(dt);
    drawObjects();
    drawParticles(dt);
    drawShip();

    ctx.restore();

    if (toastTime > 0) {
      toastTime -= dt;

      ctx.save();
      ctx.globalAlpha = Math.min(1, toastTime * 2);
      ctx.textAlign = "center";
      ctx.font = "bold 24px Orbitron, Arial";
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#48eaff";
      ctx.fillStyle = "#fff";
      ctx.fillText(toast, W / 2, 120);
      ctx.restore();
    }

    if (shieldTime > 0 || slowTime > 0) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "left";

      if (shieldTime > 0) ctx.fillText(`SHIELD ${shieldTime.toFixed(1)}s`, 12, H - 18);
      if (slowTime > 0) ctx.fillText(`SLOW-MO ${slowTime.toFixed(1)}s`, 12, H - (shieldTime > 0 ? 36 : 18));
    }
  }

  function update(dt) {
    elapsed += dt;
    score += Math.floor(dt * 12);

    invincible = Math.max(0, invincible - dt);
    shieldTime = Math.max(0, shieldTime - dt);
    slowTime = Math.max(0, slowTime - dt);

    const newLevel = Math.floor(score / 1500) + 1;

    if (newLevel > level) {
      level = newLevel;

      const bonus = 25 + level * 10;
      earned += bonus;

      toast = `LEVEL ${level}  +${bonus} CREDITS`;
      toastTime = 2.5;

      burst(W / 2, 160, "#48eaff", 30);
      sound(750, .25);
    }

    $("score").textContent = score;

    // INSTANT 1:1 TOUCH CONTROL
    // The ship immediately moves to the exact finger position.
    // No speed limit, acceleration or movement delay.
    player.x = Math.max(25, Math.min(W - 25, targetX));

    const d = difficulty();

    spawnTimer -= dt;

    if (spawnTimer <= 0) {
      spawnObject();
      spawnTimer = d.interval * (.8 + Math.random() * .45);
    }

    objects.forEach(o => {
      const speedFactor = slowTime > 0 ? .48 : 1;

      o.y += o.speed * speedFactor * dt;

      if (o.type === "rock") o.rotation += o.spin * dt;
      if (o.type === "drone") o.x += Math.sin(elapsed * 2 + o.phase) * 35 * dt;

      if (o.type === "crystal" && save.upgrades.magnet > 0) {
        const range = 35 + save.upgrades.magnet * 19;
        const distance = Math.hypot(player.x - o.x, player.y - o.y);

        if (distance < range) {
          o.x += (player.x - o.x) * dt * 3;
          o.y += (player.y - o.y) * dt * 3;
        }
      }

      const distance = Math.hypot(player.x - o.x, player.y - o.y);
      const hitDistance = o.radius + 17;

      if (distance < hitDistance) {
        if (o.type === "crystal" || o.type === "shield" || o.type === "slow") {
          collect(o);
        } else {
          damage(o);
        }
      }
    });

    objects = objects.filter(o => o.y < H + 50);

    drawGame(dt);
  }

  function loop(time) {
    requestAnimationFrame(loop);

    if (state !== "playing") return;

    const dt = Math.min((time - lastTime) / 1000, .035);
    lastTime = time;

    update(dt);
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = W / rect.width;
    return (event.clientX - rect.left) * scale;
  }

  canvas.addEventListener("pointerdown", event => {
    if (state !== "playing") return;

    pointerDown = true;
    targetX = pointerPosition(event);

    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", event => {
    if (pointerDown && state === "playing") {
      targetX = pointerPosition(event);
    }
  });

  canvas.addEventListener("pointerup", () => {
    pointerDown = false;
  });

  canvas.addEventListener("pointercancel", () => {
    pointerDown = false;
  });

  document.addEventListener("keydown", event => {
    if (state === "playing") {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        targetX = 25;
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        targetX = W - 25;
      }

      if (event.key === "Escape" || event.key === " ") {
        pauseGame();
      }
    } else if (state === "paused" && (event.key === "Escape" || event.key === " ")) {
      resumeGame();
    }
  });

  $("playBtn").addEventListener("click", startRun);
  $("againBtn").addEventListener("click", startRun);
  $("pauseBtn").addEventListener("click", pauseGame);
  $("resumeBtn").addEventListener("click", resumeGame);
  $("quitBtn").addEventListener("click", quitGame);

  document.querySelectorAll("[data-screen]").forEach(button => {
    button.addEventListener("click", () => showScreen(button.dataset.screen));
  });

  newStars();
  updateMenus();
  showScreen("home");

  requestAnimationFrame(loop);
})();
