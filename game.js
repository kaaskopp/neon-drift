
(() => {
"use strict";

const $ = id => document.getElementById(id);
const canvas = $("game");
const ctx = canvas?.getContext("2d");

if (!canvas || !ctx) {
  console.error("Game canvas ontbreekt.");
  return;
}

const W = 420, H = 700;
canvas.width = W;
canvas.height = H;

const SAVE_KEY = "neonDriftSpaceArcade_v1";

const starterItems = [
  "weapon_basic", "module_basic",
  "engine_basic", "drone_basic", "shield_basic"
];

const defaults = {
  credits: 0,
  best: 0,
  runs: 0,
  upgrades: { hull: 0, engine: 0, weapon: 0, extra: 0 },
  inventory: [...starterItems],
  equipped: {
    weapon: "weapon_basic",
    module: "module_basic",
    engine: "engine_basic",
    drone: "drone_basic",
    shield: "shield_basic"
  },
  dailyClaim: "",
  personalBonusClaimed: false
};

function loadSave() {
  try {
    const old = JSON.parse(localStorage.getItem(SAVE_KEY));
    const result = {
      ...defaults,
      ...(old || {}),
      upgrades: { ...defaults.upgrades, ...(old?.upgrades || {}) },
      equipped: { ...defaults.equipped, ...(old?.equipped || {}) },
      inventory: Array.isArray(old?.inventory)
        ? [...new Set([...starterItems, ...old.inventory])]
        : [...starterItems]
    };

    if (old && !old.personalBonusClaimed) {
      result.credits += 100000;
      result.personalBonusClaimed = true;
    }

    return result;
  } catch {
    return {
      ...defaults,
      upgrades: { ...defaults.upgrades },
      equipped: { ...defaults.equipped },
      inventory: [...starterItems]
    };
  }
}

let save = loadSave();

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (error) {
    console.warn(error);
  }
}

/* ITEMS */

const items = {
  weapon_basic: {
    id:"weapon_basic", name:"Pulse Blaster", type:"weapon",
    rarity:"common", icon:"🔫", damage:1, fireRate:.38,
    color:"#55edff", description:"Your standard space weapon."
  },
  weapon_double: {
    id:"weapon_double", name:"Twin Blasters", type:"weapon",
    rarity:"uncommon", icon:"⚔️", damage:1, fireRate:.43,
    double:true, color:"#65ffbd", description:"Fires two shots at once."
  },
  weapon_laser: {
    id:"weapon_laser", name:"Laser Cannon", type:"weapon",
    rarity:"rare", icon:"🔆", damage:2, fireRate:.48,
    color:"#a77bff", description:"Powerful precision shots."
  },
  weapon_plasma: {
    id:"weapon_plasma", name:"Plasma Destroyer", type:"weapon",
    rarity:"epic", icon:"💥", damage:3, fireRate:.42,
    color:"#ff55c8", description:"Heavy plasma damage."
  },
  weapon_nova: {
    id:"weapon_nova", name:"Nova Blaster", type:"weapon",
    rarity:"legendary", icon:"🌟", damage:4, fireRate:.35,
    double:true, color:"#ffd45c", description:"A legendary double blaster."
  },

  module_basic: {
    id:"module_basic", name:"Standard Core", type:"module",
    rarity:"common", icon:"🔋", health:0,
    color:"#55edff", description:"Your standard ship core."
  },
  module_shield: {
    id:"module_shield", name:"Shield Core", type:"module",
    rarity:"uncommon", icon:"🛡️", health:1,
    color:"#55aaff", description:"Adds one starting life."
  },
  module_speed: {
    id:"module_speed", name:"Velocity Core", type:"module",
    rarity:"rare", icon:"⚡", speed:1.25,
    color:"#65ffbd", description:"Improves ship speed."
  },
  module_reactor: {
    id:"module_reactor", name:"Reactor Core", type:"module",
    rarity:"epic", icon:"☢️", health:2,
    color:"#ff55c8", description:"A powerful reactor with extra health."
  },
  module_phantom: {
    id:"module_phantom", name:"Phantom Core", type:"module",
    rarity:"legendary", icon:"👾", health:2, speed:1.4,
    color:"#b18aff", description:"An advanced phantom reactor."
  },

  engine_basic: {
    id:"engine_basic", name:"Standard Engine", type:"engine",
    rarity:"common", icon:"🚀", speed:1,
    color:"#55edff", description:"A reliable standard engine."
  },
  engine_boost: {
    id:"engine_boost", name:"Boost Engine", type:"engine",
    rarity:"uncommon", icon:"💨", speed:1.12,
    color:"#65ffbd", description:"A little extra movement speed."
  },
  engine_vortex: {
    id:"engine_vortex", name:"Vortex Engine", type:"engine",
    rarity:"rare", icon:"🌀", speed:1.22,
    color:"#638cff", description:"A faster and more advanced engine."
  },
  engine_photon: {
    id:"engine_photon", name:"Photon Engine", type:"engine",
    rarity:"epic", icon:"✨", speed:1.35,
    color:"#c17aff", description:"High-speed photon propulsion."
  },
  engine_inferno: {
    id:"engine_inferno", name:"Inferno Engine", type:"engine",
    rarity:"legendary", icon:"🔥", speed:1.48,
    color:"#ff8b38", description:"A legendary high-speed engine."
  },
  engine_galaxy: {
    id:"engine_galaxy", name:"Galaxy Engine", type:"engine",
    rarity:"legendary", icon:"🌌", speed:1.55,
    color:"#e1a0ff", description:"A second legendary engine."
  },
  engine_celestial: {
    id:"engine_celestial", name:"Celestial Engine", type:"engine",
    rarity:"mythic", icon:"🌠", speed:1.68,
    color:"#ff62bd", description:"An incredibly rare engine."
  },
  engine_divine: {
    id:"engine_divine", name:"Divine Engine", type:"engine",
    rarity:"divine", icon:"☀️", speed:1.78,
    color:"#fff18a", description:"An engine of extraordinary power."
  },
  engine_eternal: {
    id:"engine_eternal", name:"Eternal Engine", type:"engine",
    rarity:"eternal", icon:"♾️", speed:1.9,
    color:"#ffffff", description:"One of the rarest engines in existence."
  },

  drone_basic: {
    id:"drone_basic", name:"Scout Drone", type:"drone",
    rarity:"common", icon:"🛸", droneDamage:1, droneRate:1.5,
    color:"#55edff", description:"A small drone that helps you attack."
  },
  drone_guardian: {
    id:"drone_guardian", name:"Guardian Drone", type:"drone",
    rarity:"uncommon", icon:"🤖", droneDamage:1, droneRate:1.25,
    color:"#65ffbd", description:"A reliable combat companion."
  },
  drone_hunter: {
    id:"drone_hunter", name:"Hunter Drone", type:"drone",
    rarity:"rare", icon:"🎯", droneDamage:2, droneRate:1.2,
    color:"#638cff", description:"A stronger attacking drone."
  },
  drone_destroyer: {
    id:"drone_destroyer", name:"Destroyer Drone", type:"drone",
    rarity:"epic", icon:"💀", droneDamage:3, droneRate:1.1,
    color:"#c17aff", description:"A powerful combat drone."
  },
  drone_phantom: {
    id:"drone_phantom", name:"Phantom Drone", type:"drone",
    rarity:"legendary", icon:"👻", droneDamage:4, droneRate:.95,
    color:"#ff8bff", description:"A fast and powerful legendary drone."
  },
  drone_titan: {
    id:"drone_titan", name:"Titan Drone", type:"drone",
    rarity:"legendary", icon:"⚙️", droneDamage:5, droneRate:.9,
    color:"#ffb34d", description:"A second legendary combat drone."
  },
  drone_mythic: {
    id:"drone_mythic", name:"Mythic Drone", type:"drone",
    rarity:"mythic", icon:"🐉", droneDamage:6, droneRate:.8,
    color:"#ff62bd", description:"An extremely rare companion."
  },
  drone_divine: {
    id:"drone_divine", name:"Divine Drone", type:"drone",
    rarity:"divine", icon:"🪽", droneDamage:7, droneRate:.72,
    color:"#fff18a", description:"A nearly unmatched combat drone."
  },
  drone_eternal: {
    id:"drone_eternal", name:"Eternal Drone", type:"drone",
    rarity:"eternal", icon:"👑", droneDamage:9, droneRate:.65,
    color:"#ffffff", description:"The ultimate drone."
  },

  shield_basic: {
    id:"shield_basic", name:"Standard Shield", type:"shield",
    rarity:"common", icon:"🔰", charges:0,
    color:"#55edff", description:"Standard ship protection."
  },
  shield_bubble: {
    id:"shield_bubble", name:"Bubble Shield", type:"shield",
    rarity:"uncommon", icon:"🫧", charges:1,
    color:"#65ffbd", description:"Blocks one hit per run."
  },
  shield_energy: {
    id:"shield_energy", name:"Energy Shield", type:"shield",
    rarity:"rare", icon:"🛡️", charges:2,
    color:"#638cff", description:"Blocks two hits per run."
  },
  shield_crystal: {
    id:"shield_crystal", name:"Crystal Shield", type:"shield",
    rarity:"epic", icon:"💎", charges:3,
    color:"#c17aff", description:"Three extra protections."
  },
  shield_nova: {
    id:"shield_nova", name:"Nova Shield", type:"shield",
    rarity:"legendary", icon:"🌟", charges:4,
    color:"#ffb34d", description:"A powerful four-charge shield."
  },
  shield_aurora: {
    id:"shield_aurora", name:"Aurora Shield", type:"shield",
    rarity:"legendary", icon:"🌈", charges:5,
    color:"#ff8bff", description:"A second legendary shield."
  },
  shield_mythic: {
    id:"shield_mythic", name:"Mythic Shield", type:"shield",
    rarity:"mythic", icon:"🔮", charges:6,
    color:"#ff62bd", description:"Extremely powerful protection."
  },
  shield_divine: {
    id:"shield_divine", name:"Divine Shield", type:"shield",
    rarity:"divine", icon:"✨", charges:7,
    color:"#fff18a", description:"Exceptional protection."
  },
  shield_eternal: {
    id:"shield_eternal", name:"Eternal Shield", type:"shield",
    rarity:"eternal", icon:"♾️", charges:9,
    color:"#ffffff", description:"The strongest shield available."
  }
};

const rarityNames = {
  common:"Common",
  uncommon:"Uncommon",
  rare:"Rare",
  epic:"Epic",
  legendary:"Legendary",
  mythic:"Mythic",
  divine:"Divine",
  celestial:"Celestial",
  eternal:"Eternal"
};

const rarityColors = {
  common:"#a0a0a0",
  uncommon:"#35c779",
  rare:"#3988ff",
  epic:"#b15aff",
  legendary:"#ffb52e",
  mythic:"#ff477e",
  divine:"#ffe27a",
  celestial:"#55eaff",
  eternal:"#ffffff"
};

const getItem = id => items[id] || items.weapon_basic;

function installRarityStyles() {
  if ($("rarityStyles")) return;

  const style = document.createElement("style");
  style.id = "rarityStyles";
  style.textContent = Object.entries(rarityColors).map(([name,color]) =>
    `.rarity-${name}{color:${color}!important;font-weight:700;text-shadow:0 0 8px ${color}44}`
  ).join("\n");
  document.head.appendChild(style);
}
installRarityStyles();

/* GAME STATE */

let gameState = "menu";
let currentScreen = "home";
let animationId = null;
let lastFrame = 0;

let score = 0, earned = 0, level = 1, lives = 3, gameTime = 0;
let spawnTimer = 0, fireTimer = 0, crystalTimer = 0, invincible = 0;
let droneTimer = 0;
let shieldCharges = 0;

let enemies = [], bullets = [], crystals = [], particles = [];
let pointerDown = false, pointerX = W/2, pointerY = H-100;
const keys = {};

const player = { x:W/2, y:H-100, speed:260 };

let runUpgrades = {
  damage:0, fireRate:0, speed:0,
  maxLives:0, shield:0, score:0
};

function showScreen(id) {
  const target = $(id);
  if (!target) return;

  document.querySelectorAll(".screen").forEach(screen =>
    screen.classList.remove("active")
  );

  target.classList.add("active");
  currentScreen = id;
  updateAllUI();
}

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => {
    if (gameState === "playing") pauseGame();
    showScreen(button.dataset.open);
  });
});

/* TEMPORARY UPGRADES */

function createUpgradeMenu() {
  if ($("runUpgradeMenu")) return;

  const style = document.createElement("style");
  style.textContent = `
    #runUpgradeMenu {
      display:none;position:fixed;inset:0;z-index:9999;
      background:rgba(3,7,25,.94);color:white;
      align-items:center;justify-content:center;padding:18px;
      font-family:Arial,sans-serif;
    }
    #runUpgradeMenu .upgrade-panel {
      width:min(100%,520px);text-align:center;
      background:#111a38;border:1px solid #3c65a5;
      border-radius:20px;padding:24px;
    }
    #runUpgradeMenu h2{color:#5ffaff}
    #runUpgradeMenu .run-upgrade-choice {
      display:block;width:100%;margin:10px 0;padding:16px;
      border:1px solid #41649b;border-radius:12px;
      background:#1b2a50;color:white;text-align:left;
      cursor:pointer;font-size:15px;
    }
    #runUpgradeMenu .run-upgrade-choice strong {
      display:block;color:#68f4ff;font-size:17px;margin-bottom:5px;
    }
    #runUpgradeMenu .run-upgrade-choice span{color:#c2cde4}
  `;
  document.head.appendChild(style);

  const menu = document.createElement("div");
  menu.id = "runUpgradeMenu";
  menu.innerHTML = `
    <div class="upgrade-panel">
      <h2>LEVEL UP!</h2>
      <p>Choose one upgrade for this run.</p>
      <div id="runUpgradeChoices"></div>
    </div>
  `;
  document.body.appendChild(menu);
}

const temporaryUpgradeOptions = [
  {name:"Heavy Ammo",desc:"+1 damage per shot",apply:()=>runUpgrades.damage++},
  {name:"Rapid Fire",desc:"Shoot 15% faster",apply:()=>runUpgrades.fireRate++},
  {name:"Overdrive Engine",desc:"Move 15% faster",apply:()=>runUpgrades.speed++},
  {name:"Emergency Repair",desc:"+1 extra life immediately",apply:()=>{runUpgrades.maxLives++;lives++;}},
  {name:"Energy Shield",desc:"More protection after taking a hit",apply:()=>runUpgrades.shield++},
  {name:"Score Booster",desc:"Earn 20% more points",apply:()=>runUpgrades.score++}
];

function showRunUpgrade() {
  createUpgradeMenu();

  const menu = $("runUpgradeMenu");
  const choices = $("runUpgradeChoices");
  choices.innerHTML = "";

  const selected = [...temporaryUpgradeOptions]
    .sort(() => Math.random()-.5).slice(0,3);

  selected.forEach(upgrade => {
    const button = document.createElement("button");
    button.className = "run-upgrade-choice";

    const title = document.createElement("strong");
    title.textContent = upgrade.name;

    const description = document.createElement("span");
    description.textContent = upgrade.desc;

    button.append(title,description);

    button.addEventListener("click",() => {
      upgrade.apply();
      menu.style.display = "none";
      gameState = "playing";
      updateHUD();
      lastFrame = 0;
      animationId = requestAnimationFrame(gameLoop);
    });

    choices.appendChild(button);
  });

  menu.style.display = "flex";
  gameState = "choosing";
  cancelAnimationFrame(animationId);
}

/* START / PAUSE / END */

function startRun() {
  score = 0;
  earned = 0;
  level = 1;
  gameTime = 0;

  runUpgrades = {
    damage:0,fireRate:0,speed:0,maxLives:0,shield:0,score:0
  };

  const module = getItem(save.equipped.module);
  const shield = getItem(save.equipped.shield);

  lives = 3 +
    Math.floor(save.upgrades.hull / 5) +
    save.upgrades.extra +
    (module.health || 0);

  shieldCharges = shield.charges || 0;

  enemies = [];
  bullets = [];
  crystals = [];
  particles = [];

  spawnTimer = .6;
  fireTimer = 0;
  crystalTimer = 2;
  droneTimer = .5;
  invincible = 2;

  player.x = W/2;
  player.y = H-100;
  pointerDown = false;

  $("overlay")?.classList.remove("active");
  if ($("runUpgradeMenu")) $("runUpgradeMenu").style.display = "none";

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

  if ($("overlayTag")) $("overlayTag").textContent = "PAUSED";
  if ($("overlayTitle")) $("overlayTitle").textContent = "Game Paused";
  if ($("overlayText")) $("overlayText").textContent = "Continue when you're ready.";

  $("overlay")?.classList.add("active");
}

function resumeGame() {
  if (gameState !== "paused") return;

  $("overlay")?.classList.remove("active");
  gameState = "playing";
  lastFrame = 0;
  animationId = requestAnimationFrame(gameLoop);
}

function endRun() {
  if (gameState !== "playing") return;

  gameState = "over";
  cancelAnimationFrame(animationId);

  if ($("runUpgradeMenu")) $("runUpgradeMenu").style.display = "none";

  save.runs++;
  save.credits += earned;
  save.best = Math.max(save.best,score);
  saveGame();

  if ($("finalScore")) $("finalScore").textContent = score.toLocaleString();
  if ($("earned")) $("earned").textContent = earned.toLocaleString();
  if ($("bestResult")) $("bestResult").textContent = save.best.toLocaleString();

  $("overlay")?.classList.remove("active");
  showScreen("result");
}

/* CONTROLS */

function getPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x:(event.clientX-rect.left)*(W/rect.width),
    y:(event.clientY-rect.top)*(H/rect.height)
  };
}

canvas.addEventListener("pointerdown",event => {
  if (gameState !== "playing") return;

  pointerDown = true;
  const p = getPointerPosition(event);
  pointerX = p.x;
  pointerY = p.y;
  canvas.setPointerCapture?.(event.pointerId);
});

canvas.addEventListener("pointermove",event => {
  if (!pointerDown || gameState !== "playing") return;

  const p = getPointerPosition(event);
  pointerX = p.x;
  pointerY = p.y;
});

canvas.addEventListener("pointerup",() => pointerDown = false);
canvas.addEventListener("pointercancel",() => pointerDown = false);

window.addEventListener("keydown",event => {
  keys[event.key.toLowerCase()] = true;
  if (event.key === "Escape") pauseGame();
});

window.addEventListener("keyup",event => {
  keys[event.key.toLowerCase()] = false;
});

/* GAME LOOP */

function gameLoop(timestamp) {
  if (gameState !== "playing") return;

  const dt = lastFrame
    ? Math.min((timestamp-lastFrame)/1000,.04)
    : .016;

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
  const engine = getItem(save.equipped.engine);
  const drone = getItem(save.equipped.drone);

  const permanentEngineBoost =
    1 + save.upgrades.engine * .02;

  const speed = (player.speed + save.upgrades.engine * 2) *
    (module.speed || 1) *
    (engine.speed || 1) *
    permanentEngineBoost *
    (1 + runUpgrades.speed*.15);

  if (keys.arrowleft || keys.a) player.x -= speed*dt;
  if (keys.arrowright || keys.d) player.x += speed*dt;
  if (keys.arrowup || keys.w) player.y -= speed*dt;
  if (keys.arrowdown || keys.s) player.y += speed*dt;

  if (pointerDown) {
    player.x += (pointerX-player.x)*Math.min(1,dt*12);
    player.y += (pointerY-player.y)*Math.min(1,dt*12);
  }

  player.x = Math.max(22,Math.min(W-22,player.x));
  player.y = Math.max(35,Math.min(H-35,player.y));

  if (invincible > 0) invincible -= dt;

  // Main weapon
  fireTimer -= dt;

  if (fireTimer <= 0) {
    const permanentFireReduction =
      save.upgrades.weapon * .005;

    fireTimer = Math.max(.08,
      weapon.fireRate - permanentFireReduction
    ) * Math.pow(.85,runUpgrades.fireRate);

    const damage = (weapon.damage || 1)+runUpgrades.damage;

    if (weapon.double) {
      bullets.push(
        {x:player.x-11,y:player.y-18,damage,color:weapon.color},
        {x:player.x+11,y:player.y-18,damage,color:weapon.color}
      );
    } else {
      bullets.push({
        x:player.x,y:player.y-20,damage,color:weapon.color
      });
    }
  }

  // Drone attacks
  droneTimer -= dt;

  if (droneTimer <= 0 && drone.droneDamage) {
    droneTimer = drone.droneRate || 1.5;

    bullets.push({
      x:player.x-27,y:player.y-8,
      damage:drone.droneDamage,
      color:drone.color,droneShot:true
    });

    bullets.push({
      x:player.x+27,y:player.y-8,
      damage:drone.droneDamage,
      color:drone.color,droneShot:true
    });
  }

  // Enemies
  spawnTimer -= dt;

  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(.32,1.05-level*.045);
  }

  // Crystals
  crystalTimer -= dt;

  if (crystalTimer <= 0) {
    crystals.push({
      x:25+Math.random()*(W-50),
      y:-20,
      speed:120
    });
    crystalTimer = 3+Math.random()*3;
  }

  bullets.forEach(b => b.y -= (b.droneShot?460:520)*dt);
  bullets = bullets.filter(b => b.y > -20);

  enemies.forEach(e => {
    e.y += e.speed*dt;
    e.phase += dt*3;
    e.x += Math.sin(e.phase)*22*dt;
  });

  crystals.forEach(c => c.y += c.speed*dt);

  bullets.forEach(b => enemies.forEach(e => {
    if (e.dead) return;

    if (Math.hypot(b.x-e.x,b.y-e.y) < e.radius+5) {
      e.hp -= b.damage;
      b.y = -100;

      if (e.hp <= 0) {
        e.dead = true;
        score += Math.round(e.points*(1+runUpgrades.score*.2));
        earned += e.reward;
        createParticles(e.x,e.y,12);
      }
    }
  }));

  bullets = bullets.filter(b => b.y > -50);
  enemies = enemies.filter(e => !e.dead && e.y < H+40);

  if (invincible <= 0) {
    enemies.forEach(e => {
      if (!e.dead &&
          Math.hypot(player.x-e.x,player.y-e.y) < e.radius+17) {
        e.dead = true;
        loseLife();
      }
    });
  }

  crystals.forEach(c => {
    if (Math.hypot(player.x-c.x,player.y-c.y) < 25) {
      c.collected = true;
      earned += 25;
      score += Math.round(50*(1+runUpgrades.score*.2));
      createParticles(c.x,c.y,8);
    }
  });

  crystals = crystals.filter(c => !c.collected && c.y < H+20);

  particles.forEach(p => {
    p.x += p.vx*dt;
    p.y += p.vy*dt;
    p.life -= dt;
  });

  particles = particles.filter(p => p.life > 0);

  const newLevel = Math.floor(score/500)+1;

  if (newLevel > level) {
    level = newLevel;
    invincible = 1.5;
    createParticles(player.x,player.y,20);
    updateHUD();
    showRunUpgrade();
  }

  updateHUD();
}

function spawnEnemy() {
  const tough = Math.random() < Math.min(.35,level*.035);

  enemies.push({
    x:25+Math.random()*(W-50),
    y:-30,
    radius:tough?20:15,
    hp:tough?2+Math.floor(level/3):1,
    speed:(tough?95:125)+level*7+Math.random()*35,
    points:tough?150:75,
    reward:tough?20:10,
    phase:Math.random()*6,
    tough,
    dead:false
  });
}

function loseLife() {
  if (invincible > 0) return;

  if (shieldCharges > 0) {
    shieldCharges--;
    invincible = 1.8+runUpgrades.shield*.5;
    createParticles(player.x,player.y,22);
    updateHUD();
    return;
  }

  lives--;
  invincible = 1.5+runUpgrades.shield*.5;
  createParticles(player.x,player.y,16);
  updateHUD();

  if (lives <= 0) endRun();
}

function createParticles(x,y,amount) {
  for (let i=0;i<amount;i++) {
    const angle = Math.random()*Math.PI*2;
    const speed = 40+Math.random()*170;

    particles.push({
      x,y,
      vx:Math.cos(angle)*speed,
      vy:Math.sin(angle)*speed,
      life:.3+Math.random()*.5
    });
  }
}

/* SHIP DESIGN */

function drawShip() {
  const weapon = getItem(save.equipped.weapon);
  const module = getItem(save.equipped.module);
  const engine = getItem(save.equipped.engine);
  const drone = getItem(save.equipped.drone);
  const shield = getItem(save.equipped.shield);

  const weaponColor = weapon.color || "#55edff";
  const moduleColor = module.color || "#55edff";
  const engineColor = engine.color || "#55edff";

  ctx.save();
  ctx.translate(player.x,player.y);

  if (shieldCharges > 0) {
    ctx.strokeStyle = shield.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = .4+Math.sin(gameTime*5)*.2;
    ctx.shadowColor = shield.color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0,0,34,0,Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (module.id !== "module_basic") {
    ctx.globalAlpha = .25+Math.sin(gameTime*5)*.08;
    ctx.strokeStyle = moduleColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = moduleColor;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(0,2,29,34,0,0,Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = moduleColor;
  ctx.beginPath();
  ctx.moveTo(-8,0);
  ctx.lineTo(-27,19);
  ctx.lineTo(-17,20);
  ctx.lineTo(-7,12);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(8,0);
  ctx.lineTo(27,19);
  ctx.lineTo(17,20);
  ctx.lineTo(7,12);
  ctx.closePath();
  ctx.fill();

  if (weapon.id !== "weapon_basic") {
    ctx.fillStyle = weaponColor;
    ctx.shadowColor = weaponColor;
    ctx.shadowBlur = 12;
    ctx.fillRect(-18,-10,6,23);
    ctx.fillRect(12,-10,6,23);
  }

  ctx.fillStyle = engineColor;
  ctx.shadowColor = engineColor;
  ctx.shadowBlur = 12;
  ctx.fillRect(-13,17,5,8);
  ctx.fillRect(8,17,5,8);

  ctx.fillStyle = moduleColor;
  ctx.shadowColor = moduleColor;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(0,-27);
  ctx.lineTo(20,20);
  ctx.lineTo(0,12);
  ctx.lineTo(-20,20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.moveTo(0,-15);
  ctx.lineTo(7,7);
  ctx.lineTo(-7,7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = weaponColor;
  ctx.shadowColor = weaponColor;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(0,12,4,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle = engineColor;
  ctx.beginPath();
  ctx.moveTo(-6,18);
  ctx.lineTo(0,29+Math.random()*7);
  ctx.lineTo(6,18);
  ctx.closePath();
  ctx.fill();

  if (drone.droneDamage) {
    ctx.shadowColor = drone.color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = drone.color;

    ctx.beginPath();
    ctx.arc(-29,0,5,0,Math.PI*2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(29,0,5,0,Math.PI*2);
    ctx.fill();
  }

  ctx.restore();
}

function draw() {
  ctx.clearRect(0,0,W,H);

  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,"#080b20");
  bg.addColorStop(1,"#101b3c");
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,W,H);

  for (let i=0;i<55;i++) {
    const x=(i*83)%W;
    const y=(i*137+gameTime*(25+i%4*10))%H;
    ctx.fillStyle="rgba(180,220,255,.55)";
    ctx.fillRect(x,y,2,2);
  }

  crystals.forEach(c => {
    ctx.save();
    ctx.translate(c.x,c.y);
    ctx.rotate(gameTime*2);
    ctx.fillStyle="#48f5ff";
    ctx.shadowColor="#48f5ff";
    ctx.shadowBlur=15;
    ctx.beginPath();
    ctx.moveTo(0,-10);
    ctx.lineTo(8,0);
    ctx.lineTo(0,10);
    ctx.lineTo(-8,0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  bullets.forEach(b => {
    ctx.fillStyle = b.color || "#54f6ff";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.fillRect(b.x-3,b.y-10,6,17);
  });

  ctx.shadowBlur = 0;

  enemies.forEach(e => {
    ctx.save();
    ctx.translate(e.x,e.y);
    ctx.fillStyle=e.tough?"#ff4a9a":"#ff765c";
    ctx.shadowColor=ctx.fillStyle;
    ctx.shadowBlur=14;
    ctx.beginPath();
    ctx.moveTo(0,e.radius);
    ctx.lineTo(e.radius,-e.radius);
    ctx.lineTo(0,-e.radius*.55);
    ctx.lineTo(-e.radius,-e.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  if (invincible<=0 || Math.floor(gameTime*10)%2===0) {
    drawShip();
  }

  particles.forEach(p => {
    ctx.globalAlpha=Math.max(0,p.life);
    ctx.fillStyle="#5ffaff";
    ctx.fillRect(p.x,p.y,4,4);
  });

  ctx.globalAlpha=1;
  ctx.shadowBlur=0;
}

function updateHUD() {
  if ($("score")) $("score").textContent=score.toLocaleString();
  if ($("levelHud")) $("levelHud").textContent=level;

  if ($("lives")) {
    $("lives").textContent =
      lives + (shieldCharges>0 ? ` + ${shieldCharges} 🛡️` : "");
  }
}

/* INFINITE PERMANENT UPGRADES */

const upgradeInfo = [
  {
    id:"hull",
    name:"Stronger Hull",
    description:"Every 5 levels adds one starting life.",
    base:150,
    growth:1.18
  },
  {
    id:"engine",
    name:"Engine Boost",
    description:"Every level slightly improves movement speed.",
    base:125,
    growth:1.20
  },
  {
    id:"weapon",
    name:"Weapon System",
    description:"Every level slightly increases firing speed.",
    base:200,
    growth:1.22
  },
  {
    id:"extra",
    name:"Extra Life",
    description:"Adds one starting life.",
    base:300,
    growth:1.25
  }
];

function getUpgradeCost(upgrade) {
  const currentLevel = save.upgrades[upgrade.id] || 0;

  const cost = upgrade.base *
    Math.pow(upgrade.growth,currentLevel);

  return Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.max(upgrade.base,Math.floor(cost))
  );
}

function renderUpgrades() {
  const container=$("upgradeList");
  if (!container) return;

  container.innerHTML="";

  upgradeInfo.forEach(upgrade => {
    const currentLevel=save.upgrades[upgrade.id] || 0;
    const cost=getUpgradeCost(upgrade);

    const card=document.createElement("div");
    card.className="upgrade-card";

    const title=document.createElement("h3");
    title.textContent=upgrade.name;

    const desc=document.createElement("p");
    desc.textContent=upgrade.description;

    const lvl=document.createElement("p");
    lvl.textContent=`Level ${currentLevel.toLocaleString()}`;

    const button=document.createElement("button");
    button.className="upgrade-button";
    button.textContent=`UPGRADE · ${cost.toLocaleString()} CR`;
    button.disabled=save.credits<cost;

    button.addEventListener("click",() => {
      const currentCost=getUpgradeCost(upgrade);

      if (save.credits<currentCost) return;

      save.credits-=currentCost;
      save.upgrades[upgrade.id]=(save.upgrades[upgrade.id] || 0)+1;

      saveGame();
      updateAllUI();
    });

    card.append(title,desc,lvl,button);
    container.appendChild(card);
  });
}

/* HANGAR AND INVENTORY */

let inventoryFilter="all";

const categoryNames = {
  weapon:"Weapons",
  module:"Modules",
  engine:"Engines",
  drone:"Drones",
  shield:"Shields"
};

function createCategoryFilters() {
  const container=$("inventory");
  if (!container) return;

  const parent=container.parentElement;
  if (!parent) return;

  let filterContainer=$("categoryFilters");

  if (!filterContainer) {
    filterContainer=document.createElement("div");
    filterContainer.id="categoryFilters";
    filterContainer.style.cssText=
      "display:flex;flex-wrap:wrap;gap:7px;margin:12px 0;";
    parent.insertBefore(filterContainer,container);
  }

  filterContainer.innerHTML="";

  ["all","weapon","module","engine","drone","shield"].forEach(type => {
    const button=document.createElement("button");
    button.className="filter";
    button.dataset.filter=type;
    button.textContent=type==="all"?"All":categoryNames[type];

    if (inventoryFilter===type) button.classList.add("active");

    button.addEventListener("click",() => {
      inventoryFilter=type;
      renderInventory();
      createCategoryFilters();
    });

    filterContainer.appendChild(button);
  });
}

function renderHangar() {
  const equippedItems = [
    ["weapon","Weapon"],
    ["module","Module"],
    ["engine","Engine"],
    ["drone","Drone"],
    ["shield","Shield"]
  ];

  if ($("shipName")) $("shipName").textContent="NEON FIGHTER";

  const weaponSlot=$("weaponSlots");
  const otherSlots=$("moduleSlots");

  if (weaponSlot) {
    const item=getItem(save.equipped.weapon);
    weaponSlot.innerHTML=`
      <div class="equipment-slot">
        <strong>WEAPON</strong>
        <div>${item.icon} ${item.name}</div>
        <small class="rarity-${item.rarity}">${rarityNames[item.rarity]}</small>
      </div>`;
  }

  if (otherSlots) {
    otherSlots.innerHTML=equippedItems
      .filter(([type])=>type!=="weapon")
      .map(([type,label]) => {
        const item=getItem(save.equipped[type]);
        return `
          <div class="equipment-slot">
            <strong>${label.toUpperCase()}</strong>
            <div>${item.icon} ${item.name}</div>
            <small class="rarity-${item.rarity}">
              ${rarityNames[item.rarity]}
            </small>
          </div>`;
      }).join("");
  }

  createCategoryFilters();
  renderInventory();
}

function renderInventory() {
  const container=$("inventory");
  if (!container) return;

  container.innerHTML="";

  [...new Set(save.inventory)].forEach(id => {
    const item=items[id];
    if (!item) return;

    if (inventoryFilter!=="all" && item.type!==inventoryFilter) return;

    const equipped=save.equipped[item.type]===item.id;

    const card=document.createElement("div");
    card.className="item-card";

    const icon=document.createElement("div");
    icon.className="item-icon";
    icon.textContent=item.icon;

    const name=document.createElement("strong");
    name.textContent=item.name;

    const rarity=document.createElement("p");
    rarity.className=`rarity-${item.rarity}`;
    rarity.textContent=rarityNames[item.rarity];

    const description=document.createElement("p");
    description.textContent=item.description || "";
    description.style.fontSize="12px";

    const button=document.createElement("button");
    button.textContent=equipped?"EQUIPPED":"EQUIP";
    button.disabled=equipped;

    button.addEventListener("click",() => {
      save.equipped[item.type]=item.id;
      saveGame();
      updateAllUI();
    });

    card.append(icon,name,rarity,description,button);
    container.appendChild(card);
  });
}

/* PACKS AND ANIMATION */

let packOpening=false;

function installPackAnimation() {
  if ($("packAnimationStyles")) return;

  const style=document.createElement("style");
  style.id="packAnimationStyles";

  style.textContent=`
    #packAnimation {
      display:none;
      position:fixed;
      inset:0;
      z-index:10000;
      background:rgba(3,7,25,.97);
      align-items:center;
      justify-content:center;
      flex-direction:column;
      color:white;
      font-family:Arial,sans-serif;
      text-align:center;
    }

    #packAnimation.active {
      display:flex;
    }

    .animated-pack {
      font-size:100px;
      filter:drop-shadow(0 0 25px #55edff);
      animation:packFloat .7s ease-in-out infinite alternate;
    }

    .pack-opening {
      animation:packShake .1s infinite alternate;
    }

    .pack-burst {
      animation:packBurst .65s ease-out forwards;
    }

    #packAnimation h2 {
      color:#60f4ff;
      margin-top:25px;
      font-size:25px;
      text-shadow:0 0 15px #55edff;
    }

    #packAnimation p {
      color:#cbd8ff;
    }

    @keyframes packFloat {
      from {transform:translateY(-8px) rotate(-5deg) scale(1);}
      to {transform:translateY(8px) rotate(5deg) scale(1.08);}
    }

    @keyframes packShake {
      from {transform:translateX(-8px) rotate(-8deg);}
      to {transform:translateX(8px) rotate(8deg);}
    }

    @keyframes packBurst {
      0% {transform:scale(.2);opacity:0;}
      60% {transform:scale(1.5);opacity:1;}
      100% {transform:scale(1);opacity:1;}
    }

    #packAnimation .pack-reveal-icon {
      font-size:100px;
      filter:drop-shadow(0 0 25px #ffffff);
    }
  `;

  document.head.appendChild(style);

  const overlay=document.createElement("div");
  overlay.id="packAnimation";
  overlay.innerHTML=`
    <div id="animatedPack" class="animated-pack">🎁</div>
    <h2 id="packAnimationTitle">OPENING PACK...</h2>
    <p id="packAnimationText">Something special is inside.</p>
  `;

  document.body.appendChild(overlay);
}

function randomItem(elite=false) {
  const roll=Math.random()*100;
  let rarity;

  if (elite) {
    if (roll<20) rarity="common";
    else if (roll<38) rarity="uncommon";
    else if (roll<57) rarity="rare";
    else if (roll<75) rarity="epic";
    else if (roll<88) rarity="legendary";
    else if (roll<94) rarity="mythic";
    else if (roll<97) rarity="divine";
    else if (roll<99) rarity="celestial";
    else rarity="eternal";
  } else {
    if (roll<48) rarity="common";
    else if (roll<72) rarity="uncommon";
    else if (roll<86) rarity="rare";
    else if (roll<94) rarity="epic";
    else if (roll<97.5) rarity="legendary";
    else if (roll<99) rarity="mythic";
    else if (roll<99.6) rarity="divine";
    else if (roll<99.9) rarity="celestial";
    else rarity="eternal";
  }

  const possible=Object.values(items).filter(
    item=>item.rarity===rarity
  );

  return possible.length
    ? possible[Math.floor(Math.random()*possible.length)]
    : items.weapon_basic;
}

function duplicateCredits(rarity) {
  const values={
    common:50,
    uncommon:100,
    rare:175,
    epic:300,
    legendary:600,
    mythic:1200,
    divine:2500,
    celestial:5000,
    eternal:10000
  };

  return values[rarity] || 50;
}

function sleep(ms) {
  return new Promise(resolve=>setTimeout(resolve,ms));
}

async function openPack(elite=false) {
  if (packOpening) return;

  packOpening=true;
  installPackAnimation();

  const animation=$("packAnimation");
  const pack=$("animatedPack");
  const title=$("packAnimationTitle");
  const text=$("packAnimationText");

  animation.classList.add("active");

  pack.textContent="🎁";
  pack.className="animated-pack";
  title.textContent="OPENING PACK...";
  title.style.color="#60f4ff";
  text.textContent="Something special is inside.";

  await sleep(650);

  pack.classList.add("pack-opening");
  title.textContent="UNLOCKING...";
  text.textContent="The package is opening!";

  await sleep(1100);

  const item=randomItem(elite);
  const duplicate=save.inventory.includes(item.id);
  const bonus=duplicateCredits(item.rarity);

  if (!duplicate) {
    save.inventory.push(item.id);
  } else {
    save.credits+=bonus;
  }

  saveGame();

  pack.className="pack-burst pack-reveal-icon";
  pack.textContent=item.icon;

  title.textContent=item.name;
  title.style.color=rarityColors[item.rarity] || "#ffffff";

  text.textContent=duplicate
    ? `${rarityNames[item.rarity]} · DUPLICATE · +${bonus} CREDITS`
    : `${rarityNames[item.rarity]} · ${categoryNames[item.type]}`;

  await sleep(1900);

  animation.classList.remove("active");

  if ($("packItemIcon")) $("packItemIcon").textContent=item.icon;
  if ($("packItemName")) $("packItemName").textContent=item.name;

  if ($("packRarity")) {
    $("packRarity").textContent=duplicate
      ? `${rarityNames[item.rarity]} · DUPLICATE BONUS`
      : rarityNames[item.rarity];

    $("packRarity").className=`rarity-${item.rarity}`;
  }

  if ($("packItemDesc")) {
    $("packItemDesc").textContent=duplicate
      ? `You already owned this item. You received ${bonus} bonus credits.`
      : `${categoryNames[item.type]} · ${item.description}`;
  }

  $("packResult")?.classList.remove("hidden");

  packOpening=false;
  updateAllUI();
}

function todayString() {
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function updateDailyButton() {
  const button=$("dailyBtn");
  const status=$("dailyStatus");

  if (!button) return;

  const claimed=save.dailyClaim===todayString();

  button.disabled=claimed || packOpening;
  button.textContent=claimed?"CLAIMED TODAY":"CLAIM DAILY PACK";

  if (status) {
    status.textContent=claimed
      ?"Come back tomorrow for another free pack."
      :"Your free daily pack is ready!";
  }
}

$("dailyBtn")?.addEventListener("click",() => {
  if (save.dailyClaim===todayString() || packOpening) return;

  save.dailyClaim=todayString();
  saveGame();

  openPack(false);
  updateDailyButton();
});

$("buyPackBtn")?.addEventListener("click",() => {
  if (packOpening) return;

  if (save.credits<500) {
    if ($("packItemDesc")) {
      $("packItemDesc").textContent="You need 500 credits to buy this pack.";
    }

    $("packResult")?.classList.remove("hidden");
    return;
  }

  save.credits-=500;
  saveGame();

  openPack(true);
});

$("packDoneBtn")?.addEventListener("click",() => {
  $("packResult")?.classList.add("hidden");
  updateAllUI();
});

/* BUTTONS */

$("playBtn")?.addEventListener("click",startRun);
$("startBtn")?.addEventListener("click",startRun);
$("againBtn")?.addEventListener("click",startRun);
$("pauseBtn")?.addEventListener("click",pauseGame);
$("resumeBtn")?.addEventListener("click",resumeGame);

$("quitBtn")?.addEventListener("click",() => {
  gameState="menu";
  cancelAnimationFrame(animationId);
  $("overlay")?.classList.remove("active");

  if ($("runUpgradeMenu")) {
    $("runUpgradeMenu").style.display="none";
  }

  showScreen("home");
});

/* UPDATE UI */

function updateAllUI() {
  if ($("bank")) $("bank").textContent=save.credits.toLocaleString();
  if ($("bestHome")) $("bestHome").textContent=save.best.toLocaleString();
  if ($("runsHome")) $("runsHome").textContent=save.runs;

  if ($("shipLevelHome")) {
    $("shipLevelHome").textContent=1+
      save.upgrades.hull+
      save.upgrades.engine+
      save.upgrades.weapon;
  }

  renderHangar();
  renderUpgrades();
  updateDailyButton();
  updateHUD();
}

saveGame();
updateAllUI();
showScreen("home");

console.log("NEON DRIFT loaded successfully.");
})();
