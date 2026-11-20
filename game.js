
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
const SAVE_KEY = "neonDriftSpaceArcade_v1";

canvas.width = W;
canvas.height = H;

const starterItems = [
  "weapon_basic",
  "module_basic",
  "engine_basic",
  "drone_basic",
  "shield_basic"
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
  personalBonusClaimed: false,
  megaBonusClaimed: false
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

    if (old && !old.megaBonusClaimed) {
      result.credits += 1000000;
      result.megaBonusClaimed = true;
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
  } catch (e) {
    console.warn(e);
  }
}

const items = {
  weapon_basic:{id:"weapon_basic",name:"Pulse Blaster",type:"weapon",rarity:"common",icon:"🔫",damage:1,fireRate:.38,color:"#55edff",description:"Your standard space weapon."},
  weapon_double:{id:"weapon_double",name:"Twin Blasters",type:"weapon",rarity:"uncommon",icon:"⚔️",damage:1,fireRate:.43,double:true,color:"#65ffbd",description:"Fires two shots at once."},
  weapon_laser:{id:"weapon_laser",name:"Laser Cannon",type:"weapon",rarity:"rare",icon:"🔆",damage:2,fireRate:.48,color:"#a77bff",description:"Powerful precision shots."},
  weapon_plasma:{id:"weapon_plasma",name:"Plasma Destroyer",type:"weapon",rarity:"epic",icon:"💥",damage:3,fireRate:.42,color:"#ff55c8",description:"Heavy plasma damage."},
  weapon_nova:{id:"weapon_nova",name:"Nova Blaster",type:"weapon",rarity:"legendary",icon:"🌟",damage:4,fireRate:.35,double:true,color:"#ffd45c",description:"A legendary double blaster."},
  weapon_storm:{id:"weapon_storm",name:"Storm Repeater",type:"weapon",rarity:"rare",icon:"🌩️",damage:2,fireRate:.31,color:"#55cfff",description:"Rapid electrical shots."},
  weapon_comet:{id:"weapon_comet",name:"Comet Launcher",type:"weapon",rarity:"epic",icon:"☄️",damage:4,fireRate:.47,color:"#ff8b58",description:"Launches heavy comet energy."},
  weapon_solar:{id:"weapon_solar",name:"Solar Flare",type:"weapon",rarity:"legendary",icon:"☀️",damage:5,fireRate:.34,double:true,color:"#ffe27a",description:"Twin blasts of solar energy."},
  weapon_void:{id:"weapon_void",name:"Void Reaper",type:"weapon",rarity:"mythic",icon:"🌑",damage:6,fireRate:.32,color:"#d78aff",description:"A weapon forged in the void."},
  weapon_omega:{id:"weapon_omega",name:"Omega Ray",type:"weapon",rarity:"divine",icon:"⚡",damage:7,fireRate:.29,double:true,color:"#fff18a",description:"A divine beam of immense power."},
  weapon_quasar:{id:"weapon_quasar",name:"Quasar Annihilator",type:"weapon",rarity:"celestial",icon:"🌌",damage:9,fireRate:.28,double:true,color:"#55eaff",description:"A celestial burst of energy."},
  weapon_infinity:{id:"weapon_infinity",name:"Infinity Edge",type:"weapon",rarity:"eternal",icon:"♾️",damage:11,fireRate:.25,double:true,color:"#ffffff",description:"An almost impossible weapon to find."},

  module_basic:{id:"module_basic",name:"Standard Core",type:"module",rarity:"common",icon:"🔋",health:0,color:"#55edff",description:"Your standard ship core."},
  module_shield:{id:"module_shield",name:"Shield Core",type:"module",rarity:"uncommon",icon:"🛡️",health:1,color:"#55aaff",description:"Adds one starting life."},
  module_speed:{id:"module_speed",name:"Velocity Core",type:"module",rarity:"rare",icon:"⚡",speed:1.25,color:"#65ffbd",description:"Improves ship speed."},
  module_reactor:{id:"module_reactor",name:"Reactor Core",type:"module",rarity:"epic",icon:"☢️",health:2,color:"#ff55c8",description:"A powerful reactor with extra health."},
  module_phantom:{id:"module_phantom",name:"Phantom Core",type:"module",rarity:"legendary",icon:"👾",health:2,speed:1.4,color:"#b18aff",description:"An advanced phantom reactor."},
  module_bastion:{id:"module_bastion",name:"Bastion Core",type:"module",rarity:"rare",icon:"🏰",health:1,color:"#55aaff",description:"A reinforced defensive core."},
  module_nebula:{id:"module_nebula",name:"Nebula Core",type:"module",rarity:"epic",icon:"🌫️",health:1,speed:1.2,color:"#c17aff",description:"Balances speed and protection."},
  module_titan:{id:"module_titan",name:"Titan Core",type:"module",rarity:"legendary",icon:"💠",health:3,color:"#ffb34d",description:"A mighty ship core."},
  module_abyss:{id:"module_abyss",name:"Abyssal Core",type:"module",rarity:"mythic",icon:"🌀",health:3,speed:1.35,color:"#ff62bd",description:"A rare core from deep space."},
  module_seraph:{id:"module_seraph",name:"Seraph Core",type:"module",rarity:"divine",icon:"😇",health:4,speed:1.4,color:"#fff18a",description:"A divine fusion core."},
  module_cosmos:{id:"module_cosmos",name:"Cosmos Core",type:"module",rarity:"celestial",icon:"🌠",health:4,speed:1.5,color:"#55eaff",description:"A core powered by the stars."},
  module_eternity:{id:"module_eternity",name:"Eternity Core",type:"module",rarity:"eternal",icon:"💫",health:5,speed:1.6,color:"#ffffff",description:"The ultimate eternal core."},

  engine_basic:{id:"engine_basic",name:"Standard Engine",type:"engine",rarity:"common",icon:"🚀",speed:1,color:"#55edff",description:"A reliable standard engine."},
  engine_boost:{id:"engine_boost",name:"Boost Engine",type:"engine",rarity:"uncommon",icon:"💨",speed:1.12,color:"#65ffbd",description:"A little extra movement speed."},
  engine_vortex:{id:"engine_vortex",name:"Vortex Engine",type:"engine",rarity:"rare",icon:"🌀",speed:1.22,color:"#638cff",description:"A faster and more advanced engine."},
  engine_photon:{id:"engine_photon",name:"Photon Engine",type:"engine",rarity:"epic",icon:"✨",speed:1.35,color:"#c17aff",description:"High-speed photon propulsion."},
  engine_inferno:{id:"engine_inferno",name:"Inferno Engine",type:"engine",rarity:"legendary",icon:"🔥",speed:1.48,color:"#ff8b38",description:"A legendary high-speed engine."},
  engine_galaxy:{id:"engine_galaxy",name:"Galaxy Engine",type:"engine",rarity:"legendary",icon:"🌌",speed:1.55,color:"#e1a0ff",description:"A second legendary engine."},
  engine_celestial:{id:"engine_celestial",name:"Celestial Engine",type:"engine",rarity:"mythic",icon:"🌠",speed:1.68,color:"#ff62bd",description:"An incredibly rare engine."},
  engine_divine:{id:"engine_divine",name:"Divine Engine",type:"engine",rarity:"divine",icon:"☀️",speed:1.78,color:"#fff18a",description:"An engine of extraordinary power."},
  engine_eternal:{id:"engine_eternal",name:"Eternal Engine",type:"engine",rarity:"eternal",icon:"♾️",speed:1.9,color:"#ffffff",description:"One of the rarest engines in existence."},
  engine_tempest:{id:"engine_tempest",name:"Tempest Engine",type:"engine",rarity:"rare",icon:"🌪️",speed:1.3,color:"#55cfff",description:"A storm-powered engine."},
  engine_phoenix:{id:"engine_phoenix",name:"Phoenix Engine",type:"engine",rarity:"epic",icon:"🪽",speed:1.42,color:"#ff8b58",description:"A reborn engine with fiery thrust."},
  engine_solaris:{id:"engine_solaris",name:"Solaris Engine",type:"engine",rarity:"legendary",icon:"🌞",speed:1.62,color:"#ffe27a",description:"A second-generation solar engine."},
  engine_singularity:{id:"engine_singularity",name:"Singularity Drive",type:"engine",rarity:"mythic",icon:"🕳️",speed:1.75,color:"#ff62bd",description:"A mythic gravity drive."},
  engine_omega:{id:"engine_omega",name:"Omega Drive",type:"engine",rarity:"divine",icon:"🔱",speed:1.88,color:"#fff18a",description:"A divine propulsion system."},
  engine_infinity:{id:"engine_infinity",name:"Infinity Drive",type:"engine",rarity:"celestial",icon:"♾️",speed:2,color:"#55eaff",description:"A drive beyond normal space."},
  engine_absolute:{id:"engine_absolute",name:"Absolute Engine",type:"engine",rarity:"eternal",icon:"💫",speed:2.12,color:"#ffffff",description:"The rarest class of engine."},

  drone_basic:{id:"drone_basic",name:"Scout Drone",type:"drone",rarity:"common",icon:"🛸",droneDamage:1,droneRate:1.5,color:"#55edff",description:"A small drone that helps you attack."},
  drone_guardian:{id:"drone_guardian",name:"Guardian Drone",type:"drone",rarity:"uncommon",icon:"🤖",droneDamage:1,droneRate:1.25,color:"#65ffbd",description:"A reliable combat companion."},
  drone_hunter:{id:"drone_hunter",name:"Hunter Drone",type:"drone",rarity:"rare",icon:"🎯",droneDamage:2,droneRate:1.2,color:"#638cff",description:"A stronger attacking drone."},
  drone_destroyer:{id:"drone_destroyer",name:"Destroyer Drone",type:"drone",rarity:"epic",icon:"💀",droneDamage:3,droneRate:1.1,color:"#c17aff",description:"A powerful combat drone."},
  drone_phantom:{id:"drone_phantom",name:"Phantom Drone",type:"drone",rarity:"legendary",icon:"👻",droneDamage:4,droneRate:.95,color:"#ff8bff",description:"A fast and powerful legendary drone."},
  drone_titan:{id:"drone_titan",name:"Titan Drone",type:"drone",rarity:"legendary",icon:"⚙️",droneDamage:5,droneRate:.9,color:"#ffb34d",description:"A second legendary combat drone."},
  drone_mythic:{id:"drone_mythic",name:"Mythic Drone",type:"drone",rarity:"mythic",icon:"🐉",droneDamage:6,droneRate:.8,color:"#ff62bd",description:"An extremely rare companion."},
  drone_divine:{id:"drone_divine",name:"Divine Drone",type:"drone",rarity:"divine",icon:"🪽",droneDamage:7,droneRate:.72,color:"#fff18a",description:"A nearly unmatched combat drone."},
  drone_eternal:{id:"drone_eternal",name:"Eternal Drone",type:"drone",rarity:"eternal",icon:"👑",droneDamage:9,droneRate:.65,color:"#ffffff",description:"The ultimate drone."},
  drone_spark:{id:"drone_spark",name:"Spark Drone",type:"drone",rarity:"rare",icon:"⚡",droneDamage:2,droneRate:1,color:"#55cfff",description:"A quick electric assistant."},
  drone_bomber:{id:"drone_bomber",name:"Bomber Drone",type:"drone",rarity:"epic",icon:"💣",droneDamage:4,droneRate:1.05,color:"#c17aff",description:"Heavy explosive energy shots."},
  drone_wraith:{id:"drone_wraith",name:"Wraith Drone",type:"drone",rarity:"legendary",icon:"🌫️",droneDamage:5,droneRate:.82,color:"#ffb34d",description:"A stealthy legendary companion."},
  drone_leviathan:{id:"drone_leviathan",name:"Leviathan Drone",type:"drone",rarity:"mythic",icon:"🐲",droneDamage:7,droneRate:.75,color:"#ff62bd",description:"A mythic heavy-assault drone."},
  drone_archangel:{id:"drone_archangel",name:"Archangel Drone",type:"drone",rarity:"divine",icon:"👼",droneDamage:8,droneRate:.68,color:"#fff18a",description:"A divine guardian companion."},
  drone_starseer:{id:"drone_starseer",name:"Starseer Drone",type:"drone",rarity:"celestial",icon:"🔭",droneDamage:10,droneRate:.62,color:"#55eaff",description:"A celestial precision drone."},
  drone_primordial:{id:"drone_primordial",name:"Primordial Drone",type:"drone",rarity:"eternal",icon:"🐣",droneDamage:12,droneRate:.55,color:"#ffffff",description:"An ancient and nearly unobtainable drone."},

  shield_basic:{id:"shield_basic",name:"Standard Shield",type:"shield",rarity:"common",icon:"🔰",charges:0,color:"#55edff",description:"Standard ship protection."},
  shield_bubble:{id:"shield_bubble",name:"Bubble Shield",type:"shield",rarity:"uncommon",icon:"🫧",charges:1,color:"#65ffbd",description:"Blocks one hit per run."},
  shield_energy:{id:"shield_energy",name:"Energy Shield",type:"shield",rarity:"rare",icon:"🛡️",charges:2,color:"#638cff",description:"Blocks two hits per run."},
  shield_crystal:{id:"shield_crystal",name:"Crystal Shield",type:"shield",rarity:"epic",icon:"💎",charges:3,color:"#c17aff",description:"Three extra protections."},
  shield_nova:{id:"shield_nova",name:"Nova Shield",type:"shield",rarity:"legendary",icon:"🌟",charges:4,color:"#ffb34d",description:"A powerful four-charge shield."},
  shield_aurora:{id:"shield_aurora",name:"Aurora Shield",type:"shield",rarity:"legendary",icon:"🌈",charges:5,color:"#ff8bff",description:"A second legendary shield."},
  shield_mythic:{id:"shield_mythic",name:"Mythic Shield",type:"shield",rarity:"mythic",icon:"🔮",charges:6,color:"#ff62bd",description:"Extremely powerful protection."},
  shield_divine:{id:"shield_divine",name:"Divine Shield",type:"shield",rarity:"divine",icon:"✨",charges:7,color:"#fff18a",description:"Exceptional protection."},
  shield_eternal:{id:"shield_eternal",name:"Eternal Shield",type:"shield",rarity:"eternal",icon:"♾️",charges:9,color:"#ffffff",description:"The strongest shield available."},
  shield_aegis:{id:"shield_aegis",name:"Aegis Shield",type:"shield",rarity:"rare",icon:"🧿",charges:3,color:"#55cfff",description:"A reinforced energy barrier."},
  shield_prism:{id:"shield_prism",name:"Prism Shield",type:"shield",rarity:"epic",icon:"🔷",charges:4,color:"#c17aff",description:"A shield that refracts incoming energy."},
  shield_solar:{id:"shield_solar",name:"Solar Shield",type:"shield",rarity:"legendary",icon:"🌞",charges:6,color:"#ffe27a",description:"A powerful solar barrier."},
  shield_abyss:{id:"shield_abyss",name:"Abyss Shield",type:"shield",rarity:"mythic",icon:"🌑",charges:8,color:"#ff62bd",description:"A mythic shield from the void."},
  shield_seraph:{id:"shield_seraph",name:"Seraph Shield",type:"shield",rarity:"divine",icon:"🪽",charges:9,color:"#fff18a",description:"A divine protective field."},
  shield_universe:{id:"shield_universe",name:"Universe Shield",type:"shield",rarity:"celestial",icon:"🌌",charges:11,color:"#55eaff",description:"A celestial defensive field."},
  shield_immortal:{id:"shield_immortal",name:"Immortal Shield",type:"shield",rarity:"eternal",icon:"💠",charges:13,color:"#ffffff",description:"The rarest protection in the universe."}
};

// Celestial en Eternal blijven bestaan, maar worden Divine.
Object.values(items).forEach(item => {
  if (item.rarity === "celestial" || item.rarity === "eternal") {
    item.rarity = "divine";
  }
});

const rarityNames = {
  common:"Common",
  uncommon:"Uncommon",
  rare:"Rare",
  epic:"Epic",
  legendary:"Legendary",
  mythic:"Mythic",
  divine:"Divine"
};

const rarityColors = {
  common:"#a0a0a0",
  uncommon:"#35c779",
  rare:"#3988ff",
  epic:"#b15aff",
  legendary:"#ffb52e",
  mythic:"#c477ff",
  divine:"#fff2c2"
};

const rarityOrder = {
  common:0,
  uncommon:1,
  rare:2,
  epic:3,
  legendary:4,
  mythic:5,
  divine:6
};

const categoryNames = {
  weapon:"Weapons",
  module:"Modules",
  engine:"Engines",
  drone:"Drones",
  shield:"Shields"
};

const getItem = id => items[id] || items.weapon_basic;

function installRarityStyles() {
  if ($("rarityStyles")) return;

  const s = document.createElement("style");
  s.id = "rarityStyles";

  s.textContent = Object.entries(rarityColors)
    .map(([n,c]) => `.rarity-${n}{color:${c}!important;font-weight:700;text-shadow:0 0 8px ${c}44}`)
    .join("\n");

  document.head.appendChild(s);
}

installRarityStyles();

let gameState = "menu";
let currentScreen = "home";
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
let droneTimer = 0;
let shieldCharges = 0;

let enemies = [];
let bullets = [];
let crystals = [];
let particles = [];

let pointerDown = false;
let pointerX = W/2;
let pointerY = H-100;

const keys = {};
const player = { x:W/2, y:H-100, speed:260 };

let runUpgrades = {
  damage:0,
  fireRate:0,
  speed:0,
  maxLives:0,
  shield:0,
  score:0
};

function showScreen(id) {
  const target = $(id);
  if (!target) return;

  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

  target.classList.add("active");
  currentScreen = id;
  updateAllUI();
}

document.querySelectorAll("[data-open]").forEach(b => {
  b.addEventListener("click", () => {
    if (gameState === "playing") pauseGame();
    showScreen(b.dataset.open);
  });
});

function createUpgradeMenu() {
  if ($("runUpgradeMenu")) return;

  const s = document.createElement("style");

  s.textContent = `
    #runUpgradeMenu {
      display:none;
      position:fixed;
      inset:0;
      z-index:9999;
      background:rgba(3,7,25,.94);
      color:white;
      align-items:center;
      justify-content:center;
      padding:18px;
      font-family:Arial
    }
    #runUpgradeMenu .upgrade-panel {
      width:min(100%,520px);
      text-align:center;
      background:#111a38;
      border:1px solid #3c65a5;
      border-radius:20px;
      padding:24px
    }
    #runUpgradeMenu h2 { color:#5ffaff }
    .run-upgrade-choice {
      display:block;
      width:100%;
      margin:10px 0;
      padding:16px;
      border:1px solid #41649b;
      border-radius:12px;
      background:#1b2a50;
      color:white;
      text-align:left;
      font-size:15px
    }
    .run-upgrade-choice strong {
      display:block;
      color:#68f4ff;
      font-size:17px;
      margin-bottom:5px
    }
    .run-upgrade-choice span { color:#c2cde4 }
  `;

  document.head.appendChild(s);

  const m = document.createElement("div");
  m.id = "runUpgradeMenu";
  m.innerHTML = `
    <div class="upgrade-panel">
      <h2>LEVEL UP!</h2>
      <p>Choose one upgrade for this run.</p>
      <div id="runUpgradeChoices"></div>
    </div>
  `;

  document.body.appendChild(m);
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

  [...temporaryUpgradeOptions]
    .sort(() => Math.random()-.5)
    .slice(0,3)
    .forEach(u => {
      const b = document.createElement("button");
      b.className = "run-upgrade-choice";

      const strong = document.createElement("strong");
      const span = document.createElement("span");

      strong.textContent = u.name;
      span.textContent = u.desc;

      b.append(strong,span);

      b.addEventListener("click", () => {
        u.apply();
        menu.style.display = "none";
        gameState = "playing";
        updateHUD();
        lastFrame = 0;
        animationId = requestAnimationFrame(gameLoop);
      });

      choices.appendChild(b);
    });

  menu.style.display = "flex";
  gameState = "choosing";
  cancelAnimationFrame(animationId);
}

function startRun() {
  score = 0;
  earned = 0;
  level = 1;
  gameTime = 0;

  runUpgrades = {
    damage:0,
    fireRate:0,
    speed:0,
    maxLives:0,
    shield:0,
    score:0
  };

  const module = getItem(save.equipped.module);
  const shield = getItem(save.equipped.shield);

  lives = 3 + Math.floor(save.upgrades.hull/5) + save.upgrades.extra + (module.health || 0);
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

  if ($("runUpgradeMenu")) {
    $("runUpgradeMenu").style.display = "none";
  }

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

  if ($("runUpgradeMenu")) {
    $("runUpgradeMenu").style.display = "none";
  }

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

function getPointerPosition(e) {
  const r = canvas.getBoundingClientRect();

  return {
    x:(e.clientX-r.left)*(W/r.width),
    y:(e.clientY-r.top)*(H/r.height)
  };
}

canvas.addEventListener("pointerdown",e => {
  if (gameState !== "playing") return;

  pointerDown = true;

  const p = getPointerPosition(e);
  pointerX = p.x;
  pointerY = p.y;

  canvas.setPointerCapture?.(e.pointerId);
});

canvas.addEventListener("pointermove",e => {
  if (!pointerDown || gameState !== "playing") return;

  const p = getPointerPosition(e);
  pointerX = p.x;
  pointerY = p.y;
});

canvas.addEventListener("pointerup",() => pointerDown = false);
canvas.addEventListener("pointercancel",() => pointerDown = false);

window.addEventListener("keydown",e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "Escape") pauseGame();
});

window.addEventListener("keyup",e => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop(t) {
  if (gameState !== "playing") return;

  const dt = lastFrame
    ? Math.min((t-lastFrame)/1000,.04)
    : .016;

  lastFrame = t;

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

  const speed = player.speed
    * (1+save.upgrades.engine*.005)
    * (module.speed||1)
    * (engine.speed||1)
    * (1+runUpgrades.speed*.15);

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
    fireTimer = Math.max(.08,weapon.fireRate*Math.pow(.995,save.upgrades.weapon))
      * Math.pow(.85,runUpgrades.fireRate);

    const damage = (weapon.damage||1)+runUpgrades.damage;

    if (weapon.double) {
      bullets.push(
        {x:player.x-11,y:player.y-18,damage,color:weapon.color},
        {x:player.x+11,y:player.y-18,damage,color:weapon.color}
      );
    } else {
      bullets.push({
        x:player.x,
        y:player.y-20,
        damage,
        color:weapon.color
      });
    }
  }

  droneTimer -= dt;

  if (droneTimer <= 0 && drone.droneDamage) {
    droneTimer = drone.droneRate || 1.5;

    bullets.push(
      {x:player.x-27,y:player.y-8,damage:drone.droneDamage,color:drone.color,droneShot:true},
      {x:player.x+27,y:player.y-8,damage:drone.droneDamage,color:drone.color,droneShot:true}
    );
  }

  spawnTimer -= dt;

  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(.32,1.05-level*.045);
  }

  crystalTimer -= dt;

  if (crystalTimer <= 0) {
    crystals.push({
      x:25+Math.random()*(W-50),
      y:-20,
      speed:120
    });

    crystalTimer = 3+Math.random()*3;
  }

  bullets.forEach(b => {
    b.y -= (b.droneShot?460:520)*dt;
  });

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
      if (!e.dead && Math.hypot(player.x-e.x,player.y-e.y) < e.radius+17) {
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

  const next = Math.floor(score/500)+1;

  if (next > level) {
    level = next;
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

function createParticles(x,y,n) {
  for (let i=0;i<n;i++) {
    const a = Math.random()*Math.PI*2;
    const s = 40+Math.random()*170;

    particles.push({
      x,y,
      vx:Math.cos(a)*s,
      vy:Math.sin(a)*s,
      life:.3+Math.random()*.5
    });
  }
}

function drawShip() {
  const weapon = getItem(save.equipped.weapon);
  const module = getItem(save.equipped.module);
  const engine = getItem(save.equipped.engine);
  const drone = getItem(save.equipped.drone);
  const shield = getItem(save.equipped.shield);

  const wc = weapon.color||"#55edff";
  const mc = module.color||"#55edff";
  const ec = engine.color||"#55edff";

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
    ctx.strokeStyle = mc;
    ctx.lineWidth = 3;
    ctx.shadowColor = mc;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(0,2,29,34,0,0,Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = mc;
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
    ctx.fillStyle = wc;
    ctx.shadowColor = wc;
    ctx.shadowBlur = 12;
    ctx.fillRect(-18,-10,6,23);
    ctx.fillRect(12,-10,6,23);
  }

  ctx.fillStyle = ec;
  ctx.shadowColor = ec;
  ctx.shadowBlur = 12;
  ctx.fillRect(-13,17,5,8);
  ctx.fillRect(8,17,5,8);

  ctx.fillStyle = mc;
  ctx.shadowColor = mc;
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

  ctx.fillStyle = wc;
  ctx.shadowColor = wc;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(0,12,4,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle = ec;
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
    const x = (i*83)%W;
    const y = (i*137+gameTime*(25+i%4*10))%H;

    ctx.fillStyle = "rgba(180,220,255,.55)";
    ctx.fillRect(x,y,2,2);
  }

  crystals.forEach(c => {
    ctx.save();
    ctx.translate(c.x,c.y);
    ctx.rotate(gameTime*2);
    ctx.fillStyle = "#48f5ff";
    ctx.shadowColor = "#48f5ff";
    ctx.shadowBlur = 15;
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
    ctx.fillStyle = b.color||"#54f6ff";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.fillRect(b.x-3,b.y-10,6,17);
  });

  ctx.shadowBlur = 0;

  enemies.forEach(e => {
    ctx.save();
    ctx.translate(e.x,e.y);
    ctx.fillStyle = e.tough?"#ff4a9a":"#ff765c";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(0,e.radius);
    ctx.lineTo(e.radius,-e.radius);
    ctx.lineTo(0,-e.radius*.55);
    ctx.lineTo(-e.radius,-e.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  if (invincible <= 0 || Math.floor(gameTime*10)%2 === 0) {
    drawShip();
  }

  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0,p.life);
    ctx.fillStyle = "#5ffaff";
    ctx.fillRect(p.x,p.y,4,4);
  });

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function updateHUD() {
  if ($("score")) $("score").textContent = score.toLocaleString();
  if ($("levelHud")) $("levelHud").textContent = level;
  if ($("lives")) {
    $("lives").textContent = lives+(shieldCharges>0?` + ${shieldCharges} 🛡️`:"");
  }
}

/* PERMANENT UPGRADES */

const upgradeInfo = [
  {id:"hull",name:"Stronger Hull",description:"Every 5 levels adds one starting life.",base:150,growth:1.18},
  {id:"engine",name:"Engine Boost",description:"Every level slightly improves movement speed.",base:125,growth:1.20},
  {id:"weapon",name:"Weapon System",description:"Every level slightly increases firing speed.",base:200,growth:1.22},
  {id:"extra",name:"Extra Life",description:"Adds one starting life per purchase.",base:300,growth:1.25}
];

function getUpgradeCost(u) {
  const n = save.upgrades[u.id]||0;

  return Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.max(u.base,Math.floor(u.base*Math.pow(u.growth,n)))
  );
}

function renderUpgrades() {
  const c = $("upgradeList");
  if (!c) return;

  c.innerHTML = "";

  upgradeInfo.forEach(u => {
    const n = save.upgrades[u.id]||0;
    const cost = getUpgradeCost(u);
    const card = document.createElement("div");
    card.className = "upgrade-card";

    const h = document.createElement("h3");
    const p = document.createElement("p");
    const lvl = document.createElement("p");
    const b = document.createElement("button");

    h.textContent = u.name;
    p.textContent = u.description;
    lvl.textContent = `Level ${n.toLocaleString()}`;

    b.className = "upgrade-button";
    b.textContent = `UPGRADE · ${cost.toLocaleString()} CR`;
    b.disabled = save.credits < cost;

    b.addEventListener("click",() => {
      const price = getUpgradeCost(u);

      if (save.credits < price) return;

      save.credits -= price;
      save.upgrades[u.id] = (save.upgrades[u.id]||0)+1;

      saveGame();
      updateAllUI();
    });

    card.append(h,p,lvl,b);
    c.appendChild(card);
  });
}

/* HANGAR */

let inventoryFilter = "all";

function createCategoryFilters() {
  const inv = $("inventory");
  if (!inv?.parentElement) return;

  const parent = inv.parentElement;
  let box = $("categoryFilters");

  if (!box) {
    box = document.createElement("div");
    box.id = "categoryFilters";
    box.style.cssText = "display:flex;flex-wrap:wrap;gap:7px;margin:12px 0;";
    parent.insertBefore(box,inv);
  }

  box.innerHTML = "";

  ["all","weapon","module","engine","drone","shield"].forEach(type => {
    const b = document.createElement("button");

    b.className = "filter";
    b.dataset.filter = type;
    b.textContent = type==="all"?"All":categoryNames[type];

    if (inventoryFilter===type) b.classList.add("active");

    b.addEventListener("click",() => {
      inventoryFilter = type;
      renderInventory();
      createCategoryFilters();
    });

    box.appendChild(b);
  });
}

function renderHangar() {
  const slots = [
    ["weapon","Weapon"],
    ["module","Module"],
    ["engine","Engine"],
    ["drone","Drone"],
    ["shield","Shield"]
  ];

  if ($("shipName")) $("shipName").textContent = "NEON FIGHTER";

  const w = $("weaponSlots");
  const o = $("moduleSlots");

  if (w) {
    const i = getItem(save.equipped.weapon);

    w.innerHTML = `
      <div class="equipment-slot">
        <strong>WEAPON</strong>
        <div>${i.icon} ${i.name}</div>
        <small class="rarity-${i.rarity}">${rarityNames[i.rarity]}</small>
      </div>
    `;
  }

  if (o) {
    o.innerHTML = slots
      .filter(([t])=>t!=="weapon")
      .map(([t,label]) => {
        const i = getItem(save.equipped[t]);

        return `
          <div class="equipment-slot">
            <strong>${label.toUpperCase()}</strong>
            <div>${i.icon} ${i.name}</div>
            <small class="rarity-${i.rarity}">${rarityNames[i.rarity]}</small>
          </div>
        `;
      }).join("");
  }

  createCategoryFilters();
  renderInventory();
}

function renderInventory() {
  const c = $("inventory");
  if (!c) return;

  c.innerHTML = "";

  [...new Set(save.inventory)].forEach(id => {
    const i = items[id];

    if (!i || (inventoryFilter!=="all" && i.type!==inventoryFilter)) return;

    const equipped = save.equipped[i.type]===i.id;
    const card = document.createElement("div");
    card.className = "item-card";

    const icon = document.createElement("div");
    const name = document.createElement("strong");
    const rarity = document.createElement("p");
    const desc = document.createElement("p");
    const b = document.createElement("button");

    icon.className = "item-icon";
    icon.textContent = i.icon;

    name.textContent = i.name;

    rarity.className = `rarity-${i.rarity}`;
    rarity.textContent = rarityNames[i.rarity];

    desc.textContent = i.description;
    desc.style.fontSize = "12px";

    b.textContent = equipped?"EQUIPPED":"EQUIP";
    b.disabled = equipped;

    b.addEventListener("click",() => {
      save.equipped[i.type] = i.id;
      saveGame();
      updateAllUI();
    });

    card.append(icon,name,rarity,desc,b);
    c.appendChild(card);
  });
}

/* COLLECTION */

function installCollectionStyles() {
  if ($("collectionStyles")) return;

  const s = document.createElement("style");
  s.id = "collectionStyles";

  s.textContent = `
    #collectionGrid {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px;
    }

    .collection-card {
      background:#111a30;
      border:1px solid #34466c;
      border-radius:13px;
      padding:13px;
      text-align:center;
      min-width:0;
      overflow:hidden;
    }

    .collection-card.locked {
      background:#03040a;
      border:1px solid #171a25;
      color:white;
    }

    .collection-question {
      font-size:36px;
      font-weight:800;
      padding:12px 0;
      color:#fff;
      letter-spacing:4px;
    }

    .collection-card .item-icon {
      font-size:35px;
      margin-bottom:8px;
    }

    .collection-card strong {
      display:block;
      font-size:13px;
      overflow-wrap:anywhere;
    }

    .collection-card p {
      font-size:11px;
      color:#aab8d4;
    }

    #collectionStats {
      margin:14px 0;
      padding:14px;
      background:#111a38;
      border:1px solid #304b7a;
      border-radius:12px;
      color:#60f4ff;
      font-weight:bold;
    }
  `;

  document.head.appendChild(s);
}

function renderCollection() {
  const grid = $("collectionGrid");
  const stats = $("collectionStats");

  if (!grid) return;

  installCollectionStyles();
  grid.innerHTML = "";

  const allItems = Object.values(items).sort((a,b) => {
    return rarityOrder[a.rarity]-rarityOrder[b.rarity]
      || a.name.localeCompare(b.name);
  });

  const owned = new Set(save.inventory);
  const discovered = allItems.filter(item => owned.has(item.id)).length;

  if (stats) {
    stats.textContent = `DISCOVERED: ${discovered} / ${allItems.length} ITEMS`;
  }

  allItems.forEach(item => {
    const isOwned = owned.has(item.id);
    const card = document.createElement("div");

    card.className = "collection-card"+(isOwned?"":" locked");

    if (isOwned) {
      const icon = document.createElement("div");
      icon.className = "item-icon";
      icon.textContent = item.icon;

      const name = document.createElement("strong");
      name.textContent = item.name;

      const rarity = document.createElement("p");
      rarity.className = `rarity-${item.rarity}`;
      rarity.textContent = rarityNames[item.rarity];

      const description = document.createElement("p");
      description.textContent = item.description;

      card.append(icon,name,rarity,description);
    } else {
      const question = document.createElement("div");
      question.className = "collection-question";
      question.textContent = "???";

      const name = document.createElement("strong");
      name.textContent = "???";

      const rarity = document.createElement("p");
      rarity.className = `rarity-${item.rarity}`;
      rarity.textContent = rarityNames[item.rarity];

      const description = document.createElement("p");
      description.textContent = "Undiscovered item";

      card.append(question,name,rarity,description);
    }

    grid.appendChild(card);
  });
}

/* PACK ANIMATION */

let packOpening = false;
let packSkipResolver = null;
let packSkipRequested = false;

function installPackAnimation() {
  if ($("packAnimationStyles")) return;

  const s = document.createElement("style");
  s.id = "packAnimationStyles";

  s.textContent = `
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
      font-family:Arial;
      text-align:center;
      overflow:hidden;
      padding:20px;
      box-sizing:border-box;
    }

    #packAnimation.active { display:flex }

    .animated-pack {
      font-size:100px;
      filter:drop-shadow(0 0 25px #55edff);
      animation:packFloat .7s ease-in-out infinite alternate;
      position:relative;
      z-index:2;
    }

    .pack-opening { animation:packShake .1s infinite alternate }
    .pack-burst { animation:packBurst .65s ease-out forwards }

    #packAnimation h2 {
      color:#60f4ff;
      margin-top:25px;
      font-size:25px;
      text-shadow:0 0 15px #55edff;
      position:relative;
      z-index:2;
    }

    #packAnimation p {
      color:#cbd8ff;
      position:relative;
      z-index:2;
    }

    #packSkipButton {
      margin-top:28px;
      padding:13px 24px;
      border:1px solid #5ffaff;
      border-radius:30px;
      background:#142b50;
      color:#fff;
      font-weight:800;
      letter-spacing:1px;
      cursor:pointer;
      box-shadow:0 0 15px #55edff66;
      position:relative;
      z-index:5;
    }

    #packSkipButton:active { transform:scale(.96) }

    #packAnimation.tier-legendary {
      background:radial-gradient(circle,#49300b 0%,#171020 48%,#03040d 100%);
    }

    #packAnimation.tier-mythic {
      background:radial-gradient(circle,#48145f 0%,#1a0a35 48%,#03040d 100%);
    }

    #packAnimation.tier-divine {
      background:radial-gradient(circle,#66552b 0%,#28213a 40%,#03040d 100%);
    }

    #packAnimation.tier-legendary .animated-pack {
      filter:drop-shadow(0 0 35px #ffb52e);
    }

    #packAnimation.tier-mythic .animated-pack {
      filter:drop-shadow(0 0 40px #c477ff);
    }

    #packAnimation.tier-divine .animated-pack {
      filter:drop-shadow(0 0 50px #fff2c2);
    }

    #packAnimation.tier-legendary h2 {
      color:#ffd45c;
      text-shadow:0 0 22px #ffb52e;
    }

    #packAnimation.tier-mythic h2 {
      color:#e0a5ff;
      text-shadow:0 0 22px #c477ff;
    }

    #packAnimation.tier-divine h2 {
      color:#fff2c2;
      text-shadow:0 0 25px #fff2c2;
    }

    .pack-ring {
      position:absolute;
      width:160px;
      height:160px;
      border:3px solid currentColor;
      border-radius:50%;
      opacity:0;
      pointer-events:none;
      z-index:1;
    }

    .tier-legendary .pack-ring {
      color:#ffbd3f;
      animation:packRing 1.5s ease-out infinite;
    }

    .tier-mythic .pack-ring {
      color:#c477ff;
      animation:packRing 1.3s ease-out infinite;
    }

    .tier-divine .pack-ring {
      color:#fff2c2;
      animation:packRing 1.1s ease-out infinite;
    }

    .pack-flash {
      animation:packFlash .55s ease-out;
    }

    @keyframes packFloat {
      from { transform:translateY(-8px) rotate(-5deg) }
      to { transform:translateY(8px) rotate(5deg) scale(1.08) }
    }

    @keyframes packShake {
      from { transform:translateX(-8px) rotate(-8deg) }
      to { transform:translateX(8px) rotate(8deg) }
    }

    @keyframes packBurst {
      0% { transform:scale(.2);opacity:0 }
      60% { transform:scale(1.5);opacity:1 }
      100% { transform:scale(1);opacity:1 }
    }

    @keyframes packRing {
      0% { transform:scale(.4);opacity:0 }
      30% { opacity:.8 }
      100% { transform:scale(2.8);opacity:0 }
    }

    @keyframes packFlash {
      0% { filter:brightness(1) }
      35% { filter:brightness(2.5) }
      100% { filter:brightness(1) }
    }
  `;

  document.head.appendChild(s);

  const o = document.createElement("div");
  o.id = "packAnimation";

  o.innerHTML = `
    <div class="pack-ring"></div>
    <div class="pack-ring"></div>
    <div id="animatedPack" class="animated-pack">🎁</div>
    <h2 id="packAnimationTitle">OPENING PACK...</h2>
    <p id="packAnimationText">Something special is inside.</p>
    <button id="packSkipButton" type="button">SKIP ANIMATION</button>
  `;

  document.body.appendChild(o);

  $("packSkipButton").addEventListener("click", () => {
    if (!packOpening || !packSkipResolver) return;

    packSkipRequested = true;
    packSkipResolver();
    packSkipResolver = null;
  });
}

function waitForPackStage(duration,canSkip) {
  if (canSkip && packSkipRequested) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;

      if (packSkipResolver === finish) {
        packSkipResolver = null;
      }

      resolve();
    };

    if (canSkip) {
      packSkipResolver = finish;
    }

    setTimeout(finish,duration);
  });
}

function showPackStage(rarity,titleText,description) {
  const overlay = $("packAnimation");
  const title = $("packAnimationTitle");
  const text = $("packAnimationText");
  const pack = $("animatedPack");

  overlay.className = "active tier-"+rarity;

  title.textContent = titleText;
  text.textContent = description;

  title.style.color = rarityColors[rarity] || "#60f4ff";

  pack.className = "animated-pack";
  pack.textContent = "🎁";

  const skip = $("packSkipButton");
  if (skip) {
    skip.style.display = rarityOrder[rarity] <= rarityOrder.epic
      ? "block"
      : "none";
  }
}

async function openPack(elite=false,minimumRarity="common") {
  if (packOpening) return;

  packOpening = true;
  packSkipRequested = false;
  packSkipResolver = null;

  updateDailyButton();
  updatePackButtons();

  installPackAnimation();

  const overlay = $("packAnimation");
  const pack = $("animatedPack");
  const title = $("packAnimationTitle");
  const text = $("packAnimationText");
  const skip = $("packSkipButton");

  const item = randomItem(elite,minimumRarity);
  const duplicate = save.inventory.includes(item.id);
  const bonus = duplicateCredits(item.rarity);
  const rarity = item.rarity;

  const canSkip = rarityOrder[rarity] <= rarityOrder.epic;

  showPackStage(
    rarity,
    "OPENING "+rarityNames[rarity].toUpperCase()+" PACK...",
    "Something special is waiting inside."
  );

  overlay.classList.add("active");

  pack.textContent = "🎁";

  if (skip) {
    skip.style.display = canSkip ? "block" : "none";
  }

  if (rarity === "legendary") {
    await waitForPackStage(900,false);

    pack.classList.add("pack-opening");
    title.textContent = "LEGENDARY ENERGY...";
    text.textContent = "A golden light is building.";

    await waitForPackStage(1200,false);

    overlay.classList.add("pack-flash");
    title.textContent = "GOLDEN REVEAL";
    text.textContent = "A legendary item has appeared!";

    await waitForPackStage(1100,false);
  } else if (rarity === "mythic") {
    await waitForPackStage(1100,false);

    pack.classList.add("pack-opening");
    title.textContent = "MYTHIC ENERGY...";
    text.textContent = "The space around the pack is changing.";

    await waitForPackStage(1500,false);

    overlay.classList.add("pack-flash");
    title.textContent = "MYTHIC AWAKENING";
    text.textContent = "An extraordinary item is being revealed!";

    await waitForPackStage(1500,false);
  } else if (rarity === "divine") {
    await waitForPackStage(1400,false);

    pack.classList.add("pack-opening");
    title.textContent = "DIVINE POWER...";
    text.textContent = "An incredible energy is gathering.";

    await waitForPackStage(1800,false);

    overlay.classList.add("pack-flash");
    title.textContent = "DIVINE AWAKENING";
    text.textContent = "The rarest level of equipment...";

    await waitForPackStage(1700,false);

    title.textContent = "ULTIMATE REVEAL";
    text.textContent = "A Divine item has arrived.";

    await waitForPackStage(1300,false);
  } else {
    await waitForPackStage(650,true);

    pack.classList.add("pack-opening");
    title.textContent = "UNLOCKING...";
    text.textContent = "The package is opening!";

    await waitForPackStage(1100,true);
  }

  packSkipResolver = null;

  if (!save.inventory.includes(item.id)) {
    save.inventory.push(item.id);
  } else {
    save.credits += bonus;
  }

  saveGame();

  overlay.classList.remove("pack-flash");

  pack.className = "pack-burst animated-pack";
  pack.textContent = item.icon;

  title.textContent = item.name;
  title.style.color = rarityColors[rarity];

  text.textContent = duplicate
    ? `${rarityNames[rarity]} · DUPLICATE · +${bonus} CREDITS`
    : `${rarityNames[rarity]} · ${categoryNames[item.type]}`;

  if (skip) skip.style.display = "none";

  const revealTime = rarity === "divine" ? 2600
    : rarity === "mythic" ? 2200
    : rarity === "legendary" ? 1900
    : 1200;

  await waitForPackStage(revealTime,false);

  overlay.className = "";

  if ($("packItemIcon")) $("packItemIcon").textContent = item.icon;
  if ($("packItemName")) $("packItemName").textContent = item.name;

  if ($("packRarity")) {
    $("packRarity").textContent = duplicate
      ? `${rarityNames[rarity]} · DUPLICATE BONUS`
      : rarityNames[rarity];

    $("packRarity").className = `rarity-${rarity}`;
  }

  if ($("packItemDesc")) {
    $("packItemDesc").textContent = duplicate
      ? `You already owned this item. You received ${bonus} bonus credits.`
      : `${categoryNames[item.type]} · ${item.description}`;
  }

  $("packResult")?.classList.remove("hidden");

  packOpening = false;
  packSkipRequested = false;

  updateAllUI();
}

/* PACK DROP RATES */

function randomItem(elite=false,minimumRarity="common") {
  const roll = Math.random()*100;
  let rarity;

  if (elite) {
    if (roll<8) rarity="common";
    else if (roll<20) rarity="uncommon";
    else if (roll<40) rarity="rare";
    else if (roll<62) rarity="epic";
    else if (roll<80) rarity="legendary";
    else if (roll<91) rarity="mythic";
    else rarity="divine";
  } else {
    if (roll<38) rarity="common";
    else if (roll<60) rarity="uncommon";
    else if (roll<77) rarity="rare";
    else if (roll<89) rarity="epic";
    else if (roll<96) rarity="legendary";
    else if (roll<98.5) rarity="mythic";
    else rarity="divine";
  }

  if (rarityOrder[rarity] < rarityOrder[minimumRarity]) {
    rarity = minimumRarity;
  }

  const pool = Object.values(items).filter(i => i.rarity===rarity);

  return pool[Math.floor(Math.random()*pool.length)] || items.weapon_basic;
}

function duplicateCredits(r) {
  return {
    common:50,
    uncommon:100,
    rare:175,
    epic:300,
    legendary:600,
    mythic:1200,
    divine:2500
  }[r] || 50;
}

/* PACK BUTTONS */

function buyPack(price,elite,minimumRarity="common") {
  if (packOpening) return;

  if (save.credits < price) {
    if ($("packItemDesc")) {
      $("packItemDesc").textContent =
        `You need ${price.toLocaleString()} credits to buy this pack.`;
    }

    $("packResult")?.classList.remove("hidden");
    return;
  }

  save.credits -= price;
  saveGame();
  updateAllUI();

  openPack(elite,minimumRarity);
}

function updatePackButtons() {
  const packButtons = [
    ["buyPackBtn",500,"ELITE PACK · 500 CR"],
    ["buyUncommonPackBtn",1500,"ADVANCED PACK · 1,500 CR"],
    ["buyRarePackBtn",3500,"PREMIUM PACK · 3,500 CR"]
  ];

  packButtons.forEach(([id,price,label]) => {
    const button = $(id);
    if (!button) return;

    button.textContent = label;
    button.disabled = packOpening || save.credits < price;
  });
}

function reconnectPackButton(id,callback) {
  const oldButton = $(id);
  if (!oldButton || !oldButton.parentNode) return;

  const newButton = oldButton.cloneNode(true);
  oldButton.parentNode.replaceChild(newButton,oldButton);

  newButton.addEventListener("click",callback);
}

function todayString() {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function updateDailyButton() {
  const b = $("dailyBtn");
  const s = $("dailyStatus");

  if (!b) return;

  const claimed = save.dailyClaim===todayString();

  b.disabled = claimed || packOpening;
  b.textContent = claimed?"CLAIMED TODAY":"CLAIM DAILY PACK";

  if (s) {
    s.textContent = claimed
      ? "Come back tomorrow for another free pack."
      : "Your free daily pack is ready!";
  }
}

$("dailyBtn")?.addEventListener("click",() => {
  if (save.dailyClaim===todayString() || packOpening) return;

  save.dailyClaim = todayString();
  saveGame();

  openPack(false);
  updateDailyButton();
});

reconnectPackButton("buyPackBtn",() => {
  buyPack(500,true,"common");
});

reconnectPackButton("buyUncommonPackBtn",() => {
  buyPack(1500,false,"uncommon");
});

reconnectPackButton("buyRarePackBtn",() => {
  buyPack(3500,true,"rare");
});

$("packDoneBtn")?.addEventListener("click",() => {
  $("packResult")?.classList.add("hidden");
  updateAllUI();
});

/* GAME BUTTONS */

$("playBtn")?.addEventListener("click",startRun);
$("startBtn")?.addEventListener("click",startRun);
$("againBtn")?.addEventListener("click",startRun);
$("pauseBtn")?.addEventListener("click",pauseGame);
$("resumeBtn")?.addEventListener("click",resumeGame);

$("quitBtn")?.addEventListener("click",() => {
  gameState = "menu";

  cancelAnimationFrame(animationId);

  $("overlay")?.classList.remove("active");

  if ($("runUpgradeMenu")) {
    $("runUpgradeMenu").style.display = "none";
  }

  showScreen("home");
});

/* UPDATE ALL UI */

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
      1+save.upgrades.hull+save.upgrades.engine+save.upgrades.weapon;
  }

  renderHangar();
  renderUpgrades();
  renderCollection();
  updateDailyButton();
  updatePackButtons();
  updateHUD();
}

saveGame();
updateAllUI();
showScreen("home");

console.log("NEON DRIFT loaded successfully.");

})();
