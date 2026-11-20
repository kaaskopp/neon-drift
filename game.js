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
const LEVEL_DURATION = 300;

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
  level: 1,
  inbox: [],
  upgrades: { hull: 0, engine: 0, weapon: 0, fortune: 0 },
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
      level: Math.max(1, Number(old?.level) || 1),
      inbox: Array.isArray(old?.inbox) ? old.inbox : [],
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
      inventory: [...starterItems],
      inbox: []
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
  weapon_omega:{id:"weapon_omega",name:"Omega Ray",type:"weapon",rarity:"divine",icon:"⚡",damage:7,fireRate:.29,double:true,color:"#fff18a",description:"A powerful beam of immense power."},
  weapon_quasar:{id:"weapon_quasar",name:"Quasar Annihilator",type:"weapon",rarity:"celestial",icon:"🌌",damage:9,fireRate:.28,double:true,color:"#55eaff",description:"A celestial burst of energy."},
  weapon_infinity:{id:"weapon_infinity",name:"Infinity Edge",type:"weapon",rarity:"eternal",icon:"♾️",damage:11,fireRate:.25,double:true,color:"#ffffff",description:"An almost impossible weapon to find."},

  module_basic:{id:"module_basic",name:"Standard Core",type:"module",rarity:"common",icon:"🔋",health:0,color:"#55edff",description:"Your standard ship core."},
  module_shield:{id:"module_shield",name:"Shield Core",type:"module",rarity:"uncommon",icon:"🛡️",health:1,color:"#55aaff",description:"A reinforced defensive core."},
  module_speed:{id:"module_speed",name:"Velocity Core",type:"module",rarity:"rare",icon:"⚡",speed:1.25,color:"#65ffbd",description:"Improves ship speed."},
  module_reactor:{id:"module_reactor",name:"Reactor Core",type:"module",rarity:"epic",icon:"☢️",health:2,color:"#ff55c8",description:"A powerful reactor."},
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
  drone_bomber:{id:"drone_bomber",name:"Bomber Drone",type:"drone",rarity:"epic",icon:"💣",droneDamage:4,droneRate:1.05,color:"#c17aff",description:"Heavy energy shots."},
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

const rarityColors = {
  common:"#a0a0a0",
  uncommon:"#35c779",
  rare:"#3988ff",
  epic:"#b15aff",
  legendary:"#ffb52e",
  mythic:"#c477ff",
  divine:"#fff2c2",
  celestial:"#55eaff",
  eternal:"#ff5bd6"
};

const rarityOrder = {
  common:0,
  uncommon:1,
  rare:2,
  epic:3,
  legendary:4,
  mythic:5,
  divine:6,
  celestial:7,
  eternal:8
};

const categoryNames = {
  weapon:"Weapons",
  module:"Modules",
  engine:"Engines",
  drone:"Drones",
  shield:"Shields"
};

const extraItemNames = {
  weapon: {
    common:["Mini Blaster","Spark Shooter"],
    uncommon:["Twin Spark","Pulse Repeater"],
    rare:["Thunder Cannon","Frost Blaster"],
    epic:["Void Launcher","Nova Repeater"],
    legendary:["Solar Destroyer","Golden Reaper"],
    mythic:["Dark Matter Cannon","Phantom Ray"],
    divine:["Celestial Beam","Infinity Cannon"],
    celestial:["Starbreaker Cannon","Cosmic Destroyer"],
    eternal:["Eternity Blaster","Absolute Annihilator"]
  },
  module: {
    common:["Compact Core","Basic Reactor"],
    uncommon:["Power Core","Guard Core"],
    rare:["Storm Core","Quantum Core"],
    epic:["Fusion Core","Nebula Reactor"],
    legendary:["Titan Reactor","Solar Core"],
    mythic:["Void Reactor","Eclipse Core"],
    divine:["Infinity Core","Genesis Core"],
    celestial:["Astral Core","Cosmic Reactor"],
    eternal:["Eternity Core","Absolute Core"]
  },
  engine: {
    common:["Micro Engine","Starter Thruster"],
    uncommon:["Turbo Engine","Wind Drive"],
    rare:["Thunder Drive","Quantum Engine"],
    epic:["Hyper Drive","Photon Thruster"],
    legendary:["Solar Drive","Titan Engine"],
    mythic:["Void Drive","Eclipse Engine"],
    divine:["Infinity Thruster","Genesis Drive"],
    celestial:["Astral Drive","Cosmic Thruster"],
    eternal:["Eternity Drive","Absolute Engine"]
  },
  drone: {
    common:["Mini Scout","Repair Drone"],
    uncommon:["Pulse Drone","Defender Drone"],
    rare:["Storm Drone","Blitz Drone"],
    epic:["Nova Drone","Quantum Drone"],
    legendary:["Solar Drone","Titan Drone"],
    mythic:["Void Drone","Eclipse Drone"],
    divine:["Seraph Drone","Infinity Drone"],
    celestial:["Astral Drone","Cosmic Guardian"],
    eternal:["Eternity Drone","Absolute Sentinel"]
  },
  shield: {
    common:["Mini Shield","Basic Barrier"],
    uncommon:["Pulse Barrier","Guard Shield"],
    rare:["Storm Barrier","Prism Guard"],
    epic:["Nova Barrier","Quantum Shield"],
    legendary:["Solar Barrier","Titan Shield"],
    mythic:["Void Barrier","Eclipse Shield"],
    divine:["Infinity Barrier","Genesis Shield"],
    celestial:["Astral Barrier","Cosmic Shield"],
    eternal:["Eternity Barrier","Absolute Protection"]
  }
};

const extraItemIcons = {
  weapon:["🔫","⚡"],
  module:["🔋","💠"],
  engine:["🚀","🌪️"],
  drone:["🛸","🤖"],
  shield:["🛡️","🔮"]
};

const extraRarityStats = {
  common:1,
  uncommon:1.12,
  rare:1.25,
  epic:1.42,
  legendary:1.65,
  mythic:1.9,
  divine:2.2,
  celestial:2.55,
  eternal:3
};

const extraItemColors = rarityColors;

Object.entries(extraItemNames).forEach(([type,rarities]) => {
  Object.entries(rarities).forEach(([rarity,names]) => {
    names.forEach((name,index) => {
      const id = `extra_${type}_${rarity}_${index+1}`;
      const power = extraRarityStats[rarity];

      const item = {
        id,
        name,
        type,
        rarity,
        icon:extraItemIcons[type][index],
        color:extraItemColors[rarity],
        description:`A ${rarity} ${type} customization.`
      };

      if (type === "weapon") {
        item.damage = Math.max(1,Math.round(power*2));
        item.fireRate = Math.max(.2,.42-(power*.055));
        item.double = index === 1 && power >= 1.25;
      }

      if (type === "module") {
        item.speed = 1+(power-.9)*.25;
      }

      if (type === "engine") {
        item.speed = 1+(power-.9)*.55;
      }

      if (type === "drone") {
        item.droneDamage = Math.max(1,Math.round(power*2));
        item.droneRate = Math.max(.5,1.5-(power*.35));
      }

      if (type === "shield") {
        item.charges = Math.max(0,Math.round(power*3)-1);
      }

      items[id] = item;
    });
  });
});

const getItem = id => items[id] || items.weapon_basic;

function installRarityStyles() {
  if ($("rarityStyles")) return;

  const s = document.createElement("style");
  s.id = "rarityStyles";

  s.textContent = Object.entries(rarityColors)
    .map(([n,c]) => `
      .rarity-${n} {
        color:${c}!important;
        font-weight:700;
        text-shadow:0 0 8px ${c}66;
      }
      .rarity-dot.rarity-${n} {
        display:block;
        width:42px;
        height:6px;
        margin:7px auto;
        border-radius:10px;
        background:${c};
        box-shadow:0 0 10px ${c}99;
        color:transparent!important;
        text-shadow:none!important;
      }
    `)
    .join("\n");

  document.head.appendChild(s);
}

installRarityStyles();

/* GAME STATE */

let gameState = "menu";
let currentScreen = "home";
let animationId = null;
let lastFrame = 0;

let score = 0;
let earned = 0;
let level = Math.max(1,save.level || 1);
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
  shield:0,
  score:0,
  magnet:0
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
  b.addEventListener("click",() => {
    if (gameState === "playing") pauseGame();
    showScreen(b.dataset.open);
  });
});

/* TEMPORARY UPGRADE MENU */

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
  {name:"Crystal Magnet",desc:"Collect crystals from further away",apply:()=>runUpgrades.magnet++},
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

      b.addEventListener("click",() => {
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

/* START LEVEL */

function startRun() {
  if (gameState === "playing" || gameState === "choosing") return;

  score = 0;
  earned = 0;
  level = Math.max(1,save.level || 1);
  gameTime = 0;

  runUpgrades = {
    damage:0,
    fireRate:0,
    speed:0,
    shield:0,
    score:0,
    magnet:0
  };

  const shield = getItem(save.equipped.shield);

  lives = 3;
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

/* LEVEL COMPLETED */

function finishLevel() {
  if (gameState !== "playing") return;

  gameState = "over";
  cancelAnimationFrame(animationId);

  if ($("runUpgradeMenu")) {
    $("runUpgradeMenu").style.display = "none";
  }

  const completedLevel = level;
  const levelReward = 250 + completedLevel * 100;
  const creditMultiplier = 1 + (save.upgrades.fortune || 0) * .05;
  const totalReward = Math.floor((earned + levelReward) * creditMultiplier);

  save.credits += totalReward;
  save.runs++;
  save.level = completedLevel + 1;
  save.best = Math.max(save.best,score);

  saveGame();

  if ($("finalScore")) $("finalScore").textContent = score.toLocaleString();
  if ($("earned")) $("earned").textContent = totalReward.toLocaleString();
  if ($("bestResult")) $("bestResult").textContent = save.best.toLocaleString();
  if ($("resultTitle")) $("resultTitle").textContent = `LEVEL ${completedLevel} COMPLETED!`;

  $("overlay")?.classList.remove("active");
  showScreen("result");
}

/* PLAYER DEFEATED */

function endRun() {
  if (gameState !== "playing") return;

  gameState = "over";
  cancelAnimationFrame(animationId);

  if ($("runUpgradeMenu")) {
    $("runUpgradeMenu").style.display = "none";
  }

  save.runs++;

  const creditMultiplier = 1+(save.upgrades.fortune||0)*.05;
  const totalReward = Math.floor(earned*creditMultiplier);

  save.credits += totalReward;
  save.best = Math.max(save.best,score);
  save.level = level;

  saveGame();

  if ($("finalScore")) $("finalScore").textContent = score.toLocaleString();
  if ($("earned")) $("earned").textContent = totalReward.toLocaleString();
  if ($("bestResult")) $("bestResult").textContent = save.best.toLocaleString();
  if ($("resultTitle")) $("resultTitle").textContent = "RUN OVER";

  $("overlay")?.classList.remove("active");
  showScreen("result");
}
  /* CONTROLS */

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

/* GAME LOOP */

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

/* GAME UPDATE */

function update(dt) {
  gameTime += dt;

  if (gameTime >= LEVEL_DURATION) {
    gameTime = LEVEL_DURATION;
    updateHUD();
    finishLevel();
    return;
  }

  const levelProgress = gameTime / LEVEL_DURATION;
  const difficulty = (level - 1) * .12 + levelProgress * .9;

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

    spawnTimer = Math.max(
      .28,
      1.15 - (level-1)*.025 - levelProgress*.55
    );
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

  const magnetRadius = 25
    + runUpgrades.magnet*15
    + (save.upgrades.hull||0)*3;

  crystals.forEach(c => {
    if (Math.hypot(player.x-c.x,player.y-c.y) < magnetRadius) {
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

  updateHUD();
}

/* ENEMY SPAWNING */

function spawnEnemy() {
  const progress = Math.min(1,gameTime/LEVEL_DURATION);
  const difficulty = (level-1)*.12 + progress*.9;

  const toughChance = Math.min(.75,.12+difficulty*.22);
  const tough = Math.random() < toughChance;

  enemies.push({
    x:25+Math.random()*(W-50),
    y:-30,
    radius:tough?20:15,
    hp:tough
      ? 2+Math.floor(difficulty*1.5)
      : 1+Math.floor(difficulty*.45),
    speed:(tough?100:125)+difficulty*32+Math.random()*35,
    points:tough?150:75,
    reward:tough?20:10,
    phase:Math.random()*6,
    tough,
    dead:false
  });
}

/* PLAYER DAMAGE */

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

/* PARTICLES */

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

/* DRAW SHIP */

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

/* DRAW GAME */

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

/* HUD */

function updateHUD() {
  if ($("score")) {
    $("score").textContent = score.toLocaleString();
  }

  if ($("levelHud")) {
    const remaining = Math.max(0,LEVEL_DURATION-gameTime);
    const minutes = Math.floor(remaining/60);
    const seconds = Math.floor(remaining%60);

    $("levelHud").textContent =
      `LEVEL ${level} · ${minutes}:${String(seconds).padStart(2,"0")}`;
  }

  if ($("lives")) {
    $("lives").textContent =
      lives+(shieldCharges>0?` + ${shieldCharges} 🛡️`:"");
  }
}

/* PERMANENT UPGRADES */

const upgradeInfo = [
  {id:"hull",name:"Crystal Magnet",description:"Collect crystals from further away.",base:150,growth:1.18},
  {id:"engine",name:"Engine Boost",description:"Every level slightly improves movement speed.",base:125,growth:1.20},
  {id:"weapon",name:"Weapon System",description:"Every level slightly increases firing speed.",base:200,growth:1.22},
  {id:"fortune",name:"Credit Bonus",description:"Earn 5% more credits per upgrade level.",base:300,growth:1.25}
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
        <small class="rarity-dot rarity-${i.rarity}" aria-label="Rarity"></small>
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
            <small class="rarity-dot rarity-${i.rarity}" aria-label="Rarity"></small>
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
    rarity.className = `rarity-dot rarity-${i.rarity}`;
    rarity.textContent = "";
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
      rarity.className = `rarity-dot rarity-${item.rarity}`;
      rarity.textContent = "";

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
      rarity.className = `rarity-dot rarity-${item.rarity}`;
      rarity.textContent = "";

      const description = document.createElement("p");
      description.textContent = "Undiscovered item";

      card.append(question,name,rarity,description);
    }

    grid.appendChild(card);
  });
}

/* INBOX DATA */

function addToInbox(item) {
  if (!Array.isArray(save.inbox)) {
    save.inbox = [];
  }

  save.inbox.unshift({
    id:item.id,
    receivedAt:Date.now()
  });

  save.inbox = save.inbox.slice(0,100);
}

function renderInbox() {
  const inbox = $("inbox");
  if (!inbox) return;

  inbox.innerHTML = "";

  if (!save.inbox.length) {
    inbox.textContent = "Your inbox is empty.";
    return;
  }

  save.inbox.forEach(entry => {
    const id = typeof entry === "string" ? entry : entry.id;
    const item = items[id];

    if (!item) return;

    const card = document.createElement("div");
    card.className = "item-card";

    const icon = document.createElement("div");
    icon.className = "item-icon";
    icon.textContent = item.icon;

    const name = document.createElement("strong");
    name.textContent = item.name;

    const rarity = document.createElement("p");
    rarity.className = `rarity-dot rarity-${item.rarity}`;

    const type = document.createElement("p");
    type.textContent = categoryNames[item.type];

    card.append(icon,name,rarity,type);
    inbox.appendChild(card);
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
      --pack-color:#a0a0a0;
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
      filter:drop-shadow(0 0 35px var(--pack-color));
      animation:packFloat .7s ease-in-out infinite alternate;
      position:relative;
      z-index:2;
    }

    .pack-opening { animation:packShake .1s infinite alternate }
    .pack-burst { animation:packBurst .65s ease-out forwards }

    #packAnimation h2 {
      color:var(--pack-color);
      margin-top:25px;
      font-size:25px;
      text-shadow:0 0 22px var(--pack-color);
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
      border:1px solid var(--pack-color);
      border-radius:30px;
      background:#142b50;
      color:#fff;
      font-weight:800;
      letter-spacing:1px;
      cursor:pointer;
      box-shadow:0 0 15px var(--pack-color);
      position:relative;
      z-index:5;
    }

    #packSkipButton:active { transform:scale(.96) }

    #packAnimation.tier-common {
      background:radial-gradient(circle,#303039 0%,#171020 48%,#03040d 100%);
    }

    #packAnimation.tier-uncommon {
      background:radial-gradient(circle,#12452f 0%,#10251e 48%,#03040d 100%);
    }

    #packAnimation.tier-rare {
      background:radial-gradient(circle,#123a70 0%,#101a38 48%,#03040d 100%);
    }

    #packAnimation.tier-epic {
      background:radial-gradient(circle,#40145f 0%,#1a0a35 48%,#03040d 100%);
    }

    #packAnimation.tier-legendary {
      background:radial-gradient(circle,#49300b 0%,#171020 48%,#03040d 100%);
    }

    #packAnimation.tier-mythic {
      background:radial-gradient(circle,#48145f 0%,#1a0a35 48%,#03040d 100%);
    }

    #packAnimation.tier-divine {
      background:radial-gradient(circle,#66552b 0%,#28213a 40%,#03040d 100%);
    }

    #packAnimation.tier-celestial {
      background:radial-gradient(circle,#07546b 0%,#10203d 45%,#03040d 100%);
    }

    #packAnimation.tier-eternal {
      background:radial-gradient(circle,#66134f 0%,#28102e 45%,#03040d 100%);
    }

    .pack-ring {
      position:absolute;
      width:160px;
      height:160px;
      border:3px solid var(--pack-color);
      border-radius:50%;
      opacity:0;
      pointer-events:none;
      z-index:1;
      animation:packRing 1.5s ease-out infinite;
    }

    #packAnimation.tier-legendary .animated-pack {
      filter:drop-shadow(0 0 40px #ffb52e);
    }

    #packAnimation.tier-mythic .animated-pack {
      filter:drop-shadow(0 0 45px #c477ff);
    }

    #packAnimation.tier-divine .animated-pack {
      filter:drop-shadow(0 0 55px #fff2c2);
    }

    #packAnimation.tier-celestial .animated-pack {
      filter:drop-shadow(0 0 65px #55eaff);
    }

    #packAnimation.tier-eternal .animated-pack {
      filter:drop-shadow(0 0 75px #ff5bd6);
    }

    #packAnimation.tier-legendary .pack-ring {
      animation-duration:1.1s;
      border-width:4px;
    }

    #packAnimation.tier-mythic .pack-ring {
      animation-duration:.9s;
      border-width:4px;
    }

    #packAnimation.tier-divine .pack-ring {
      animation-duration:.7s;
      border-width:5px;
    }

    #packAnimation.tier-celestial .pack-ring {
      animation-duration:.55s;
      border-width:5px;
    }

    #packAnimation.tier-eternal .pack-ring {
      animation-duration:.4s;
      border-width:6px;
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

    #packAnimation.tier-celestial h2 {
      color:#55eaff;
      text-shadow:0 0 25px #55eaff;
    }

    #packAnimation.tier-eternal h2 {
      color:#ff5bd6;
      text-shadow:0 0 28px #ff5bd6;
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

  $("packSkipButton").addEventListener("click",() => {
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
  overlay.style.setProperty("--pack-color",rarityColors[rarity] || "#ffffff");

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
    "OPENING PACK...",
    "Something special is waiting inside."
  );

  overlay.classList.add("active");
  pack.textContent = "🎁";

  if (skip) {
    skip.style.display = canSkip ? "block" : "none";
  }

  if (rarity === "eternal") {
    await waitForPackStage(1800,false);
    pack.classList.add("pack-opening");
    title.textContent = "ETERNAL ENERGY...";
    text.textContent = "Reality itself seems to bend around the package.";
    await waitForPackStage(2400,false);
    overlay.classList.add("pack-flash");
    title.textContent = "COSMIC AWAKENING";
    text.textContent = "An extraordinary energy is breaking through.";
    await waitForPackStage(2200,false);
    title.textContent = "THE FINAL REVEAL";
    text.textContent = "Something beyond imagination is inside.";
    await waitForPackStage(1800,false);

  } else if (rarity === "celestial") {
    await waitForPackStage(1500,false);
    pack.classList.add("pack-opening");
    title.textContent = "COSMIC ENERGY...";
    text.textContent = "A wave of stellar energy surrounds the package.";
    await waitForPackStage(1900,false);
    overlay.classList.add("pack-flash");
    title.textContent = "STELLAR AWAKENING";
    text.textContent = "A powerful cosmic item is emerging.";
    await waitForPackStage(1600,false);

  } else if (rarity === "divine") {
    await waitForPackStage(1400,false);
    pack.classList.add("pack-opening");
    title.textContent = "WHITE-GOLD ENERGY...";
    text.textContent = "An incredible energy is gathering.";
    await waitForPackStage(1800,false);
    overlay.classList.add("pack-flash");
    title.textContent = "ULTIMATE AWAKENING";
    text.textContent = "A powerful item is being revealed...";
    await waitForPackStage(1700,false);
    title.textContent = "ULTIMATE REVEAL";
    text.textContent = "An extraordinary piece of equipment has arrived.";
    await waitForPackStage(1300,false);

  } else if (rarity === "mythic") {
    await waitForPackStage(1100,false);
    pack.classList.add("pack-opening");
    title.textContent = "VIOLET ENERGY...";
    text.textContent = "The space around the pack is changing.";
    await waitForPackStage(1500,false);
    overlay.classList.add("pack-flash");
    title.textContent = "VIOLET AWAKENING";
    text.textContent = "An extraordinary item is being revealed!";
    await waitForPackStage(1500,false);

  } else if (rarity === "legendary") {
    await waitForPackStage(900,false);
    pack.classList.add("pack-opening");
    title.textContent = "GOLDEN ENERGY...";
    text.textContent = "A golden light is building.";
    await waitForPackStage(1200,false);
    overlay.classList.add("pack-flash");
    title.textContent = "GOLDEN REVEAL";
    text.textContent = "A special item has appeared!";
    await waitForPackStage(1100,false);

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
    addToInbox(item);
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
    ? `DUPLICATE · +${bonus} CREDITS`
    : categoryNames[item.type];

  if (skip) skip.style.display = "none";

  const revealTime =
    rarity === "eternal" ? 4200 :
    rarity === "celestial" ? 3400 :
    rarity === "divine" ? 2800 :
    rarity === "mythic" ? 2300 :
    rarity === "legendary" ? 1900 :
    1200;

  await waitForPackStage(revealTime,false);

  overlay.className = "";

  if ($("packItemIcon")) $("packItemIcon").textContent = item.icon;
  if ($("packItemName")) $("packItemName").textContent = item.name;

  if ($("packRarity")) {
    $("packRarity").textContent = "";
    $("packRarity").className = `rarity-dot rarity-${rarity}`;
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
    if (roll<30) rarity="common";
    else if (roll<55) rarity="uncommon";
    else if (roll<75) rarity="rare";
    else if (roll<88) rarity="epic";
    else if (roll<95) rarity="legendary";
    else if (roll<98) rarity="mythic";
    else if (roll<99.5) rarity="divine";
    else if (roll<99.95) rarity="celestial";
    else rarity="eternal";
  } else {
    if (roll<55) rarity="common";
    else if (roll<79) rarity="uncommon";
    else if (roll<91) rarity="rare";
    else if (roll<97) rarity="epic";
    else if (roll<99) rarity="legendary";
    else if (roll<99.7) rarity="mythic";
    else if (roll<99.9) rarity="divine";
    else if (roll<99.99) rarity="celestial";
    else rarity="eternal";
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
    divine:2500,
    celestial:5000,
    eternal:10000
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

/* RARITY SYSTEM */

function installRarityLegend() {
  if ($("rarityLegend")) return;

  const heading = [...document.querySelectorAll("h1,h2,h3,h4")]
    .find(el => el.textContent.trim().toLowerCase() === "rarity system");

  if (!heading) return;

  const legend = document.createElement("div");
  legend.id = "rarityLegend";

  legend.style.cssText = `
    display:grid;
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:12px;
    margin:14px 0;
    padding:15px;
    background:#0d1630;
    border:1px solid #30466e;
    border-radius:14px;
  `;

  const rarities = [
    ["common","Common"],
    ["uncommon","Uncommon"],
    ["rare","Rare"],
    ["epic","Epic"],
    ["legendary","Legendary"],
    ["mythic","Mythic"],
    ["divine","Divine"],
    ["celestial","Celestial"],
    ["eternal","Eternal"]
  ];

  rarities.forEach(([rarity,name]) => {
    const item = document.createElement("div");
    item.style.cssText = "text-align:center;min-width:0;";

    const color = document.createElement("div");
    color.style.cssText = `
      height:8px;
      width:100%;
      border-radius:10px;
      background:${rarityColors[rarity]};
      box-shadow:0 0 12px ${rarityColors[rarity]};
      margin-bottom:7px;
    `;

    const label = document.createElement("strong");
    label.textContent = name;
    label.style.cssText = `
      font-size:11px;
      color:${rarityColors[rarity]};
      text-shadow:0 0 8px ${rarityColors[rarity]};
    `;

    item.append(color,label);
    legend.appendChild(item);
  });

  heading.insertAdjacentElement("afterend",legend);
}

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
  renderInbox();

  updateDailyButton();
  updatePackButtons();
  installRarityLegend();
  updateHUD();
}

saveGame();
updateAllUI();
showScreen("home");

console.log("NEON DRIFT loaded successfully.");

})();
