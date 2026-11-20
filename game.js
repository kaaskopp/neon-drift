
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

  // IMPORTANT: the game loop requires this exact state.
  state = "playing";

  lastFrame = performance.now();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
}
