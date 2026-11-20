(() => {
"use strict";
const $ = id => document.getElementById(id);
const canvas = $("game"), ctx = canvas.getContext("2d");
const SAVE_KEY = "neonDriftAfterburn_v1";
const defaults = {credits:0,best:0,runs:0,upgrades:{hull:0,engine:0,magnet:0}};
let save;
try { save = {...defaults,...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}")}; save.upgrades={...defaults.upgrades,...(save.upgrades||{})}; }
catch { save = structuredClone(defaults); }
const upgradeInfo = [
  {id:"hull",name:"REINFORCED HULL",desc:"Een extra leven aan het begin van elke run.",base:90,max:3},
  {id:"engine",name:"ION ENGINE",desc:"Je schip beweegt sneller en reageert scherper.",base:70,max:4},
  {id:"magnet",name:"CREDIT MAGNET",desc:"Trek gouden credits van iets verder weg aan.",base:100,max:3}
];
let player,rocks=[],orbs=[],powerups=[],particles=[],score=0,lives=3,runCredits=0,frame=0,raf=0,active=false,paused=false,shield=0,slow=0,keys={},lastTime=0;
function persist(){localStorage.setItem(SAVE_KEY,JSON.stringify(save));updateMeta();}
function updateMeta(){
  $("bank").textContent=save.credits; $("shopBank").textContent=save.credits;
  $("bestHome").textContent=save.best; $("runsHome").textContent=save.runs;
  $("levelHome").textContent=1+save.upgrades.hull+save.upgrades.engine+save.upgrades.magnet;
  $("bestHud").textContent=save.best;
}
function showScreen(id){document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.id===id));}
document.querySelectorAll("[data-screen]").forEach(b=>b.addEventListener("click",()=>{showScreen(b.dataset.screen);if(b.dataset.screen==="shop")renderShop();}));
function renderShop(){
  $("shopBank").textContent=save.credits;
  $("upgradeList").innerHTML="";
  upgradeInfo.forEach(u=>{
    const lvl=save.upgrades[u.id], cost=u.base*(lvl+1);
    const el=document.createElement("article");el.className="upgrade";
    el.innerHTML=`<div class="upgrade-head"><h3>${u.name}</h3><span class="level">LVL ${lvl}/${u.max}</span></div><p>${u.desc}</p><div class="upgrade-foot"><span class="level">${lvl===u.max?"MAX LEVEL":"◆ "+cost+" CREDITS"}</span><button class="buy" ${lvl>=u.max||save.credits<cost?"disabled":""}>${lvl===u.max?"MAXED":"UPGRADE"}</button></div>`;
    el.querySelector("button").addEventListener("click",()=>{if(lvl>=u.max||save.credits<cost)return;save.credits-=cost;save.upgrades[u.id]++;persist();renderShop();});
    $("upgradeList").appendChild(el);
  });
}
function startRun(){
  cancelAnimationFrame(raf);showScreen("gameScreen");
  player={x:165,y:520,w:30,h:36,speed:6+save.upgrades.engine*.8};
  rocks=[];orbs=[];powerups=[];particles=[];score=0;runCredits=0;
  lives=3+save.upgrades.hull;shield=0;slow=0;frame=0;active=true;paused=false;lastTime=0;
  $("score").textContent="0";$("lives").textContent="♥".repeat(lives);$("overlay").classList.add("hidden");
  raf=requestAnimationFrame(loop);
}
function endRun(){
  active=false;cancelAnimationFrame(raf);
  const earned=runCredits+Math.floor(score/100);
  save.credits+=earned;save.runs++;save.best=Math.max(save.best,score);persist();
  $("finalScore").textContent=score;$("earned").textContent=earned;$("bestResult").textContent=save.best;
  showScreen("result");
}
function spawn(){
  const difficulty=Math.min(0.075,.018+score/18000);
  if(Math.random()<difficulty)rocks.push({x:Math.random()*326,y:-35,size:22+Math.random()*19,speed:(2.7+Math.random()*1.8+score/900)*(slow>0?.55:1),rot:Math.random()*1.5});
  if(Math.random()<.014)orbs.push({x:15+Math.random()*330,y:-15,r:8,speed:2.8});
  if(Math.random()<.0025)powerups.push({x:20+Math.random()*320,y:-20,r:12,type:Math.random()<.5?"shield":"slow",speed:2.4});
}
function hit(a,b,pad=0){return a.x+pad<b.x+b.size&&a.x+a.w-pad>b.x&&a.y+pad<b.y+b.size&&a.y+a.h-pad>b.y;}
function burst(x,y,color,count=10){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5,life:25+Math.random()*15,color});}
function drawShip(){
  ctx.save();ctx.translate(player.x+15,player.y+18);ctx.shadowBlur=20;ctx.shadowColor="#52f6ff";ctx.fillStyle="#52f6ff";
  ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(14,17);ctx.lineTo(0,10);ctx.lineTo(-14,17);ctx.closePath();ctx.fill();
  ctx.fillStyle="#fff";ctx.fillRect(-2,-3,4,9);
  if(shield>0){ctx.strokeStyle="#52f6ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}
function moveTo(e){if(!active||paused)return;const r=canvas.getBoundingClientRect();player.x=Math.max(0,Math.min(330,(e.clientX-r.left)*360/r.width-15));}
function loop(t){
 if(!active||paused)return;const dt=lastTime?Math.min(2,(t-lastTime)/16.67):1;lastTime=t;frame++;
 ctx.clearRect(0,0,360,600);
 ctx.fillStyle="#080a19";ctx.fillRect(0,0,360,600);
 for(let i=0;i<48;i++){let y=(i*83+frame*(1+i%3)*.35)%600;ctx.fillStyle=i%4===0?"#3b8190":"#333653";ctx.fillRect((i*67)%360,y,2,2);}
 if(keys.ArrowLeft||keys.a||keys.A)player.x-=player.speed*dt;
 if(keys.ArrowRight||keys.d||keys.D)player.x+=player.speed*dt;
 player.x=Math.max(0,Math.min(330,player.x));
 spawn();drawShip();
 for(let i=rocks.length-1;i>=0;i--){let o=rocks[i];o.y+=o.speed*dt;ctx.save();ctx.translate(o.x+o.size/2,o.y+o.size/2);ctx.rotate(o.rot);ctx.shadowBlur=14;ctx.shadowColor="#ff4fc8";ctx.fillStyle="#ff4fc8";ctx.fillRect(-o.size/2,-o.size/2,o.size,o.size);ctx.restore();
 if(hit(player,o,5)){rocks.splice(i,1);if(shield>0){shield=0;burst(player.x+15,player.y+15,"#52f6ff",18);}else{lives--;burst(player.x+15,player.y+15,"#ff4fc8",15);$("lives").textContent="♥".repeat(Math.max(0,lives));if(lives<=0){endRun();return;}}}else if(o.y>620)rocks.splice(i,1);}
 for(let i=orbs.length-1;i>=0;i--){let c=orbs[i];c.y+=c.speed*dt;ctx.shadowBlur=15;ctx.shadowColor="#ffd166";ctx.fillStyle="#ffd166";ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,7);ctx.fill();ctx.shadowBlur=0;
 const dist=Math.hypot(player.x+15-c.x,player.y+15-c.y);
 if(dist< (save.upgrades.magnet?38+save.upgrades.magnet*18:18)){c.x+=(player.x+15-c.x)*.12;c.y+=(player.y+15-c.y)*.12;}
 if(dist<23){runCredits++;score+=25;burst(c.x,c.y,"#ffd166",7);orbs.splice(i,1);}else if(c.y>620)orbs.splice(i,1);}
 for(let i=powerups.length-1;i>=0;i--){let p=powerups[i];p.y+=p.speed*dt;ctx.fillStyle=p.type==="shield"?"#52f6ff":"#bd8aff";ctx.shadowBlur=18;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();ctx.shadowBlur=0;
 if(Math.hypot(player.x+15-p.x,player.y+15-p.y)<25){if(p.type==="shield")shield=600;else slow=600;burst(p.x,p.y,"#bd8aff",12);powerups.splice(i,1);}else if(p.y>620)powerups.splice(i,1);}
 if(shield>0)shield-=dt;if(slow>0)slow-=dt;
 for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;ctx.globalAlpha=Math.max(0,p.life/35);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);ctx.globalAlpha=1;if(p.life<=0)particles.splice(i,1);}
 score+=Math.max(1,Math.floor(dt));$("score").textContent=score;
 raf=requestAnimationFrame(loop);
}
function pause(){if(!active)return;paused=true;cancelAnimationFrame(raf);$("overlayTag").textContent="PAUSED";$("overlayTitle").textContent="RUN PAUSED";$("overlayText").textContent="Je run staat even stil."; $("resumeBtn").textContent="VERDER SPELEN";$("overlay").classList.remove("hidden");}
function resume(){if(!active)return;paused=false;$("overlay").classList.add("hidden");lastTime=0;raf=requestAnimationFrame(loop);}
$("playBtn").addEventListener("click",startRun);$("againBtn").addEventListener("click",startRun);
$("pauseBtn").addEventListener("click",pause);$("resumeBtn").addEventListener("click",resume);
$("quitBtn").addEventListener("click",()=>{if(active){active=false;cancelAnimationFrame(raf);showScreen("home");}});
canvas.addEventListener("pointerdown",e=>{canvas.setPointerCapture?.(e.pointerId);moveTo(e);});
canvas.addEventListener("pointermove",e=>{if(e.buttons||e.pointerType==="touch")moveTo(e);});
document.addEventListener("keydown",e=>{keys[e.key]=true;if(e.key==="Escape"&&active){paused?resume():pause();}});
document.addEventListener("keyup",e=>{keys[e.key]=false;});
updateMeta();renderShop();
})();
