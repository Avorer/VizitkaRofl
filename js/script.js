(() => {
  if (navigator.maxTouchPoints > 0 || "ontouchstart" in window) {
    document.documentElement.classList.add("touch");
  }

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayText = document.getElementById("overlay-text");

  const CELLS = 20;
  const SIZE = canvas.width / CELLS;
  const SPEED = 120;

  let snake, dir, nextDir, food, score, best = 0, timer = null, state = "idle";

  const DIRS = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
  };

  function reset() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = nextDir = DIRS.right;
    score = 0;
    scoreEl.textContent = score;
    placeFood();
    draw();
  }

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * CELLS), y: Math.floor(Math.random() * CELLS) };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
  }

  function setDir(name) {
    const d = DIRS[name];
    if (!d) return;
    if (d.x === -dir.x && d.y === -dir.y) return; // нельзя развернуться на 180°
    nextDir = d;
  }

  function step() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    const hitWall = head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS;
    const hitSelf = snake.some(s => s.x === head.x && s.y === head.y);
    if (hitWall || hitSelf) return gameOver();

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function draw() {
    ctx.fillStyle = "#0a0214";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // сетка
    ctx.strokeStyle = "rgba(139, 47, 201, .18)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= CELLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * SIZE, 0); ctx.lineTo(i * SIZE, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * SIZE); ctx.lineTo(canvas.width, i * SIZE); ctx.stroke();
    }

    // еда
    ctx.shadowColor = "#ff8a1f";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ff8a1f";
    ctx.fillRect(food.x * SIZE + 4, food.y * SIZE + 4, SIZE - 8, SIZE - 8);

    // змейка
    snake.forEach((s, i) => {
      ctx.shadowColor = "#b565f0";
      ctx.shadowBlur = i === 0 ? 14 : 6;
      ctx.fillStyle = i === 0 ? "#ffb347" : "#b565f0";
      ctx.fillRect(s.x * SIZE + 1, s.y * SIZE + 1, SIZE - 2, SIZE - 2);
    });
    ctx.shadowBlur = 0;
  }

  function showOverlay(text) {
    overlayText.innerHTML = text;
    overlay.classList.remove("hidden");
  }

  function start() {
    if (state === "over" || state === "idle") reset();
    state = "play";
    overlay.classList.add("hidden");
    clearInterval(timer);
    timer = setInterval(step, SPEED);
  }

  function pause() {
    state = "pause";
    clearInterval(timer);
    showOverlay("ПАУЗА");
  }

  function gameOver() {
    state = "over";
    clearInterval(timer);
    if (score > best) { best = score; bestEl.textContent = best; }
    showOverlay("GAME OVER<br><small>ПРОБЕЛ — ЕЩЁ РАЗ</small>");
  }

  function toggle() {
    if (state === "play") pause(); else start();
  }

  document.addEventListener("keydown", e => {
    const map = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      w: "up", s: "down", a: "left", d: "right",
      W: "up", S: "down", A: "left", D: "right"
    };
    if (e.code === "Space") { e.preventDefault(); toggle(); return; }
    if (map[e.key]) {
      e.preventDefault();
      setDir(map[e.key]);
      if (state === "idle") start();
    }
  });

  // экранные кнопки: pointerdown реагирует быстрее, чем click
  document.querySelectorAll(".pad button").forEach(btn => {
    btn.addEventListener("pointerdown", e => {
      e.preventDefault();
      setDir(btn.dataset.dir);
      if (state !== "play") start();
    });
  });

  overlay.addEventListener("click", toggle);

  // свайпы по полю
  const screenEl = document.querySelector(".screen");
  let touchStart = null;
  screenEl.addEventListener("touchstart", e => {
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  screenEl.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
  screenEl.addEventListener("touchend", e => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; // это тап, его обработает overlay
    setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    if (state !== "play") start();
  });

  // ставим на паузу, если вкладку свернули
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "play") pause();
  });

  reset();
  showOverlay("НАЖМИ ПРОБЕЛ");
})();
