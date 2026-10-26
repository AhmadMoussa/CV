// Hero sketch: Truchet tiles clipped to a circle. Click to regenerate.
(() => {
  const canvas = document.querySelector('.sketch');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue('--accent').trim();
  const onAccent = css.getPropertyValue('--on-accent').trim();

  const arc = (x, y, r, a) => {
    ctx.beginPath();
    ctx.arc(x, y, r, a, a + Math.PI / 2);
    ctx.stroke();
  };

  function draw() {
    const size = canvas.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const n = 2 + Math.floor(Math.random() * 5); // 2–6 tiles per side
    const t = size / n;
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.clip();
    ctx.strokeStyle = onAccent;
    ctx.lineWidth = size / 30;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const px = x * t, py = y * t;
        if (Math.random() < 0.5) {
          arc(px, py, t / 2, 0);
          arc(px + t, py + t, t / 2, Math.PI);
        } else {
          arc(px + t, py, t / 2, Math.PI / 2);
          arc(px, py + t, t / 2, -Math.PI / 2);
        }
      }
    }
    ctx.restore();
  }

  canvas.title = 'Click to regenerate';
  canvas.addEventListener('click', draw);
  draw();
})();
