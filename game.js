
(() => {
"use strict";

const $ = id => document.getElementById(id);
const canvas = $("game");
const ctx = canvas?.getContext("2d");

if (!canvas || !ctx) {
  console.error("Game canvas ontbreekt.");
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
  upgrades: { hull: 0, engine: 0, weapon: 0, extra: 0 },
  inventory: ["weapon_basic", "module_basic"],
  equipped: { weapon: "weapon_basic", module: "module_basic" },
  dailyClaim: ""
};

function loadSave() {
  try {
    const old = JSON.parse(localStorage.getItem(SAVE_KEY));
    return {
      ...defaults,
      ...(old || {}),
      upgrades: { ...defaults.upgrades, ...(old?.upgrades || {}) },
      equipped: { ...defaults.equipped, ...(old?.equipped || {}) },
      inventory: Array.isArray(old?.inventory) ? old.inventory : [...defaults.inventory]
    };
  } catch {
    return structuredClone(defaults);
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

const items = {
  weapon_basic: { id:"weapon_basic", name:"Pulse Blaster", type:"weapon", rarity:"common", icon:"🔫", damage:1, fireRate:.38 },
  weapon_double: { id:"weapon_double", name:"Twin Blasters", type:"weapon", rarity:"uncommon", icon:"⚔️", damage:1, fireRate:.43, double:true },
  weapon_laser: { id:"weapon_laser", name:"Laser Cannon", type:"weapon", rarity:"rare", icon:"🔆", damage:2, fireRate:.48 },
  weapon_plasma: { id:"weapon_plasma", name:"Plasma Destroyer", type:"weapon", rarity:"epic", icon:"💥", damage:3, fireRate:.42 },
  weapon_nova: { id:"weapon_nova", name:"Nova Blaster", type:"weapon", rarity:"legendary", icon:"🌟", damage:4, fireRate:.35, double:true },
  module_basic: { id:"module_basic", name:"Standard Core", type:"module", rarity:"common", icon:"🔋", health:0 },
  module_shield: { id:"module_shield", name:"Shield Core", type:"module", rarity:"uncommon", icon:"🛡️", health:1 },
  module_speed: { id:"module_speed", name:"Velocity Core", type:"module", rarity:"rare", icon:"⚡", speed:1.25 },
  module_reactor: { id:"module_reactor", name:"Reactor Core", type:"module", rarity:"epic", icon:"☢️", health:2 },
  module_phantom: { id:"module_phantom", name:"Phantom Core", type:"module", rarity:"legendary", icon:"👾", health:2, speed:1.4 }
};

const rarityNames = {
  common:"Common", uncommon:"Uncommon", rare:"Rare", epic:"Epic", legendary:"Legendary"
};

const getItem = id => items[id] || items.weapon_basic;

let gameState = "menu";
let currentScreen = "home";
let animationId = null;
let lastFrame = 0;
let score = 0, earned = 0, level = 1, lives = 3, gameTime = 0;
let spawnTimer = 0, fireTimer = 0, crystalTimer = 0, invincible = 0;
let enemies = [], bullets = [], crystals = [], particles = [];
let pointerDown = false, pointerX = W/2, pointerY = H-100;
const keys = {};

const player = { x:W/2, y:H-100, speed:260 };

function showScreen(id) {
  const target = $(id);
  if (!target) {
    console.error("Scherm niet gevonden:", id);
    return;
  }

  document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
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

  spawnTimer = .6;
  fireTimer = 0;
  crystalTimer = 2;
  invincible = 2;

  player.x = W/2;
  player.y = H-100;
  pointerDown = false;

  $("overlay")?.classList.remove("active");
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

  save.runs++;
  save.credits += earned;
  save.best = Math.max(save.best, score);
  saveGame();

  if ($("finalScore")) $("finalScore").textContent = score.toLocaleString();
  if ($("earned")) $("earned").textContent = earned.toLocaleString();
  if ($("bestResult")) $("bestResult").textContent = save.best.toLocaleString();

  $("overlay")?.classList.remove("active");
  showScreen("result");
}

function getPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x:(event.clientX-rect.left)*(W/rect.width),
    y:(event.clientY-rect.top)*(H/rect.height)
  };
}

canvas.addEventListener("pointerdown", event => {
  if (gameState !== "playing") return;
  pointerDown = true;
  const p = getPointerPosition(event);
  pointerX = p.x;
  pointerY = p.y;
  canvas.setPointerCapture?.(event.pointerId);
});

canvas.addEventListener("pointermove", event => {
  if (!pointerDown || gameState !== "playing") return;
  const p = getPointerPosition(event);
  pointerX = p.x;
  pointerY = p.y;
});

canvas.addEventListener("pointerup", () => pointerDown = false);
canvas.addEventListener("pointercancel", () => pointerDown = false);

window.addEventListener("keydown", event => {
  keys[event.key.toLowerCase()] = true;
  if (event.key === "Escape") pauseGame();
});

window.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

function gameLoop(timestamp) {
  if (gameState !== "playing") return;
  const dt = lastFrame ? Math.min((timestamp-lastFrame)/1000,.04) : .016;
  lastFrame = timestamp;
  update(dt);
  draw();
  if (gameState === "playing") animationId = requestAnimationFrame(gameLoop);
}

function update(dt) {
  gameTime += dt;
  const weapon = getItem(save.equipped.weapon);
  const module = getItem(save.equipped.module);
  const speed = (player.speed + save.upgrades.engine*18)*(module.speed || 1);

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

  fireTimer -= dt;
  if (fireTimer <= 0) {
    fireTimer = Math.max(.16,weapon.fireRate-save.upgrades.weapon*.025);
    const damage = weapon.damage || 1;
    if (weapon.double) {
      bullets.push({x:player.x-11,y:player.y-18,damage},{x:player.x+11,y:player.y-18,damage});
    } else bullets.push({x:player.x,y:player.y-20,damage});
  }

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(.32,1.05-level*.045);
  }

  crystalTimer -= dt;
  if (crystalTimer <= 0) {
    crystals.push({x:25+Math.random()*(W-50),y:-20,speed:120});
    crystalTimer = 3+Math.random()*3;
  }

  bullets.forEach(b => b.y -= 520*dt);
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
        score += e.points;
        earned += e.reward;
        createParticles(e.x,e.y,12);
      }
    }
  }));

  bullets = bullets.filter(b => b.y > -50);
  enemies = enemies.filter(e => !e.dead && e.y < H+40);

  if (invincible <= 0) enemies.forEach(e => {
    if (!e.dead && Math.hypot(player.x-e.x,player.y-e.y) < e.radius+17) {
      e.dead = true;
      loseLife();
    }
  });

  crystals.forEach(c => {
    if (Math.hypot(player.x-c.x,player.y-c.y) < 25) {
      c.collected = true;
      earned += 25;
      score += 50;
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
  lives--;
  invincible = 1.5;
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
    ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);
    ctx.closePath();ctx.fill();
    ctx.restore();
  });

  bullets.forEach(b => {
    ctx.fillStyle="#54f6ff";
    ctx.shadowColor="#54f6ff";
    ctx.shadowBlur=12;
    ctx.fillRect(b.x-3,b.y-10,6,17);
  });
  ctx.shadowBlur=0;

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
    ctx.closePath();ctx.fill();
    ctx.restore();
  });

  if (invincible<=0 || Math.floor(gameTime*10)%2===0) {
    ctx.save();
    ctx.translate(player.x,player.y);
    ctx.fillStyle="#55edff";
    ctx.shadowColor="#55edff";
    ctx.shadowBlur=18;
    ctx.beginPath();
    ctx.moveTo(0,-25);ctx.lineTo(20,20);ctx.lineTo(0,12);ctx.lineTo(-20,20);
    ctx.closePath();ctx.fill();
    ctx.fillStyle="#fff";
    ctx.beginPath();
    ctx.moveTo(0,-13);ctx.lineTo(6,8);ctx.lineTo(-6,8);
    ctx.closePath();ctx.fill();
    ctx.restore();
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
  if ($("lives")) $("lives").textContent=lives;
}

/* Upgrades */

const upgradeInfo = [
  {id:"hull",name:"Stronger Hull",description:"Improves ship durability.",base:150,max:5},
  {id:"engine",name:"Engine Boost",description:"Increases movement speed.",base:125,max:5},
  {id:"weapon",name:"Weapon System",description:"Increases firing speed.",base:200,max:5},
  {id:"extra",name:"Extra Life",description:"Start with an extra life.",base:300,max:3}
];

function renderUpgrades() {
  const container=$("upgradeList");
  if (!container) return;
  container.innerHTML="";

  upgradeInfo.forEach(upgrade => {
    const level=save.upgrades[upgrade.id];
    const cost=upgrade.base*(level+1);
    const card=document.createElement("div");
    card.className="upgrade-card";

    const title=document.createElement("h3");
    title.textContent=upgrade.name;
    const desc=document.createElement("p");
    desc.textContent=upgrade.description;
    const lvl=document.createElement("p");
    lvl.textContent=`Level ${level}/${upgrade.max}`;
    const button=document.createElement("button");
    button.className="upgrade-button";
    button.textContent=level>=upgrade.max?"MAX LEVEL":`UPGRADE · ${cost} CR`;
    button.disabled=level>=upgrade.max || save.credits<cost;

    button.addEventListener("click",() => {
      if (level>=upgrade.max || save.credits<cost) return;
      save.credits-=cost;
      save.upgrades[upgrade.id]++;
      saveGame();
      updateAllUI();
    });

    card.append(title,desc,lvl,button);
    container.appendChild(card);
  });
}

/* Hangar */

let inventoryFilter="all";

function renderHangar() {
  const weapon=getItem(save.equipped.weapon);
  const module=getItem(save.equipped.module);

  if ($("shipName")) $("shipName").textContent="NEON FIGHTER";

  if ($("weaponSlots")) {
    $("weaponSlots").innerHTML=`
      <div class="equipment-slot">
        <strong>WEAPON</strong>
        <div>${weapon.icon} ${weapon.name}</div>
        <small class="rarity-${weapon.rarity}">${rarityNames[weapon.rarity]}</small>
      </div>`;
  }

  if ($("moduleSlots")) {
    $("moduleSlots").innerHTML=`
      <div class="equipment-slot">
        <strong>MODULE</strong>
        <div>${module.icon} ${module.name}</div>
        <small class="rarity-${module.rarity}">${rarityNames[module.rarity]}</small>
      </div>`;
  }

  renderInventory();
}

function renderInventory() {
  const container=$("inventory");
  if (!container) return;
  container.innerHTML="";

  [...new Set(save.inventory)].forEach(id => {
    const item=getItem(id);
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

    const button=document.createElement("button");
    button.textContent=equipped?"EQUIPPED":"EQUIP";
    button.disabled=equipped;
    button.addEventListener("click",() => {
      save.equipped[item.type]=item.id;
      saveGame();
      updateAllUI();
    });

    card.append(icon,name,rarity,button);
    container.appendChild(card);
  });
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click",() => {
    inventoryFilter=button.dataset.filter||"all";
    document.querySelectorAll(".filter").forEach(b => b.classList.toggle("active",b===button));
    renderInventory();
  });
});

/* Packs */

function randomItem(elite=false) {
  const roll=Math.random()*100;
  let rarity;

  if (elite) {
    if (roll<30) rarity="common";
    else if (roll<55) rarity="uncommon";
    else if (roll<80) rarity="rare";
    else if (roll<95) rarity="epic";
    else rarity="legendary";
  } else {
    if (roll<60) rarity="common";
    else if (roll<85) rarity="uncommon";
    else if (roll<95) rarity="rare";
    else if (roll<99) rarity="epic";
    else rarity="legendary";
  }

  const possible=Object.values(items).filter(item=>item.rarity===rarity);
  return possible[Math.floor(Math.random()*possible.length)];
}

function openPack(elite=false) {
  const item=randomItem(elite);
  const duplicate=save.inventory.includes(item.id);

  if (!duplicate) save.inventory.push(item.id);
  else save.credits+=item.rarity==="legendary"?150:50;

  saveGame();

  if ($("packItemIcon")) $("packItemIcon").textContent=item.icon;
  if ($("packItemName")) $("packItemName").textContent=item.name;
  if ($("packRarity")) {
    $("packRarity").textContent=duplicate?`${rarityNames[item.rarity]} · DUPLICATE BONUS`:rarityNames[item.rarity];
    $("packRarity").className=`rarity-${item.rarity}`;
  }
  if ($("packItemDesc")) {
    $("packItemDesc").textContent=duplicate
      ? "You already owned this item. You received bonus credits."
      : item.description||"A new item for your ship!";
  }
  $("packResult")?.classList.remove("hidden");
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
  button.disabled=claimed;
  button.textContent=claimed?"CLAIMED TODAY":"CLAIM DAILY PACK";
  if (status) status.textContent=claimed?"Come back tomorrow for another free pack.":"Your free daily pack is ready!";
}

$("dailyBtn")?.addEventListener("click",() => {
  if (save.dailyClaim===todayString()) return;
  save.dailyClaim=todayString();
  openPack(false);
  updateDailyButton();
});

$("buyPackBtn")?.addEventListener("click",() => {
  if (save.credits<500) {
    if ($("packItemDesc")) $("packItemDesc").textContent="You need 500 credits to buy this pack.";
    $("packResult")?.classList.remove("hidden");
    return;
  }
  save.credits-=500;
  openPack(true);
});

$("packDoneBtn")?.addEventListener("click",() => {
  $("packResult")?.classList.add("hidden");
  updateAllUI();
});

/* BUTTONS — PLAY NOW STARTS THE GAME DIRECTLY */

$("playBtn")?.addEventListener("click",startRun);
$("startBtn")?.addEventListener("click",startRun);
$("againBtn")?.addEventListener("click",startRun);
$("pauseBtn")?.addEventListener("click",pauseGame);
$("resumeBtn")?.addEventListener("click",resumeGame);

$("quitBtn")?.addEventListener("click",() => {
  gameState="menu";
  cancelAnimationFrame(animationId);
  $("overlay")?.classList.remove("active");
  showScreen("home");
});

function updateAllUI() {
  if ($("bank")) $("bank").textContent=save.credits.toLocaleString();
  if ($("bestHome")) $("bestHome").textContent=save.best.toLocaleString();
  if ($("runsHome")) $("runsHome").textContent=save.runs;
  if ($("shipLevelHome")) {
    $("shipLevelHome").textContent=1+save.upgrades.hull+save.upgrades.engine+save.upgrades.weapon;
  }
  renderHangar();
  renderUpgrades();
  updateDailyButton();
  updateHUD();
}

updateAllUI();
showScreen("home");
console.log("NEON DRIFT loaded successfully.");
})();
