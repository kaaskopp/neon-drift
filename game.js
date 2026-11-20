
"use strict";

const canvas = document.getElementById("game");
const ctx = canvas?.getContext("2d");
const scoreText = document.getElementById("score");
const startButton = document.getElementById("start");

if (!canvas || !ctx || !scoreText || !startButton) {
  alert("Game error: check index.html element IDs.");
} else {
  let player = {};
  let obstacles = [];
  let coins = [];
  let score = 0;
  let lives = 3;
  let running = false;
  let animation = null;
  const keys = {};

  let highScore = Number(localStorage.getItem("neonHighScore")) || 0;

  function resetGame() {
    cancelAnimationFrame(animation);

    player = { x: 165, y: 520, width: 30, height: 35, speed: 6 };
    obstacles = [];
    coins = [];
    score = 0;
    lives = 3;
    running = true;

    startButton.textContent = "RESTART";
    loop();
  }

  function drawPlayer() {
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00f7ff";
    ctx.fillStyle = "#00f7ff";
    ctx.beginPath();
    ctx.moveTo(player.x + 15, player.y);
    ctx.lineTo(player.x + 30, player.y + 35);
    ctx.lineTo(player.x + 15, player.y + 27);
    ctx.lineTo(player.x, player.y + 35);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function spawnObjects() {
    if (Math.random() < 0.025) {
      obstacles.push({
        x: Math.random() * 320,
        y: -30,
        size: 25 + Math.random() * 15,
        speed: 3 + score / 400
      });
    }

    if (Math.random() < 0.012) {
      coins.push({
        x: 15 + Math.random() * 330,
        y: -20,
        size: 10,
        speed: 3
      });
    }
  }

  function loop() {
    if (!running) return;

    ctx.clearRect(0, 0, 360, 600);

    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = "#555577";
      ctx.fillRect((i * 71) % 360, (i * 113 + score * 2) % 600, 2, 2);
    }

    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    player.x = Math.max(0, Math.min(330, player.x));

    drawPlayer();
    spawnObjects();

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;

      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ff35c8";
      ctx.fillStyle = "#ff35c8";
      ctx.fillRect(o.x, o.y, o.size, o.size);
      ctx.shadowBlur = 0;

      if (player.x < o.x + o.size &&
          player.x + player.width > o.x &&
          player.y < o.y + o.size &&
          player.y + player.height > o.y) {
        obstacles.splice(i, 1);
        lives--;
        if (lives <= 0) {
          endGame();
          return;
        }
      } else if (o.y > 600) {
        obstacles.splice(i, 1);
      }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.y += c.speed;

      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00f7ff";
      ctx.fillStyle = "#00f7ff";
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (Math.hypot(player.x + 15 - c.x, player.y + 15 - c.y) < 25) {
        score += 25;
        coins.splice(i, 1);
      } else if (c.y > 620) {
        coins.splice(i, 1);
      }
    }

    score++;
    scoreText.textContent = score + " | ❤️ " + lives;
    animation = requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("neonHighScore", highScore);
    }

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "bold 28px Arial";
    ctx.fillText("GAME OVER", 180, 270);
    ctx.font = "16px Arial";
    ctx.fillText("Score: " + score, 180, 310);
    ctx.fillText("Best: " + highScore, 180, 340);
  }

  document.addEventListener("keydown", e => {
    keys[e.key] = true;
  });

  document.addEventListener("keyup", e => {
    keys[e.key] = false;
  });

  canvas.addEventListener("pointerdown", movePlayer);
  canvas.addEventListener("pointermove", e => {
    if (e.buttons || e.pointerType === "touch") movePlayer(e);
  });

  function movePlayer(e) {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    player.x = Math.max(0, Math.min(330,
      (e.clientX - rect.left) * canvas.width / rect.width - 15
    ));
  }

  startButton.addEventListener("click", resetGame);
}
