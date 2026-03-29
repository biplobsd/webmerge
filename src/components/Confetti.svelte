<script lang="ts">
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement | undefined = $state();

  const COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#c77dff", "#ff9f43", "#ff6fd8"];

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotSpeed: number;
    opacity: number;
    shape: "rect" | "circle" | "strip";
  }

  onMount(() => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);

    const particles: Particle[] = Array.from({ length: 140 }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * 220,
      vx: (Math.random() - 0.5) * 4,
      vy: 1.5 + Math.random() * 3.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 5 + Math.random() * 9,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.18,
      opacity: 0.75 + Math.random() * 0.25,
      shape: (["rect", "circle", "strip"] as const)[Math.floor(Math.random() * 3)],
    }));

    let animId: number;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      let alive = false;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.995;
        p.rotation += p.rotSpeed;
        if (p.y < H + 30) alive = true;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size / 2.5, p.size / 4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3);
        }

        ctx.restore();
      }

      if (alive) animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animId);
  });
</script>

<canvas bind:this={canvas} class="pointer-events-none absolute inset-0 h-full w-full"></canvas>
