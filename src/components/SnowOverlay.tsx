import { useEffect, useRef } from "react";

type Props = {
    enabled?: boolean; // turn on/off
    intensity?: number; // number of flakes (default: auto)
    wind?: number; // horizontal drift
};

type Flake = {
    x: number;
    y: number;
    r: number; // radius
    vy: number; // falling speed
    vx: number; // horizontal speed
    wobble: number;
    wobbleSpeed: number;
    alpha: number;
};

export function SnowOverlay({ enabled = true, intensity, wind = 0.25 }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let w = 0;
        let h = 0;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const flakes: Flake[] = [];

        function resize() {
            w = window.innerWidth;
            h = window.innerHeight;

            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Create flakes if empty or if intensity changes
            const targetCount =
                typeof intensity === "number"
                    ? intensity
                    : Math.max(80, Math.min(220, Math.floor((w * h) / 12000)));

            if (flakes.length === 0) {
                for (let i = 0; i < targetCount; i++) {
                    flakes.push(makeFlake(true));
                }
            } else {
                // adjust count smoothly
                while (flakes.length < targetCount)
                    flakes.push(makeFlake(true));
                while (flakes.length > targetCount) flakes.pop();
            }
        }

        function rand(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        function makeFlake(randomY: boolean): Flake {
            const r = rand(1.2, 4.2);
            return {
                x: rand(0, w),
                y: randomY ? rand(0, h) : -r - rand(0, 30),
                r,
                vy: rand(0.6, 1.8) + r * 0.12,
                vx: rand(-0.25, 0.25) + wind,
                wobble: rand(0, Math.PI * 2),
                wobbleSpeed: rand(0.008, 0.02),
                alpha: rand(0.55, 0.95),
            };
        }

        function tick() {
            // clear
            ctx.clearRect(0, 0, w, h);

            // draw flakes
            for (let i = 0; i < flakes.length; i++) {
                const f = flakes[i];

                f.wobble += f.wobbleSpeed;
                const wobbleX = Math.sin(f.wobble) * (f.r * 1.25);

                f.x += f.vx + wobbleX * 0.03;
                f.y += f.vy;

                // wrap
                if (f.y - f.r > h) {
                    flakes[i] = makeFlake(false);
                    continue;
                }
                if (f.x < -10) f.x = w + 10;
                if (f.x > w + 10) f.x = -10;

                ctx.beginPath();
                ctx.globalAlpha = f.alpha;
                ctx.fillStyle = "#ffffff";
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;

            rafRef.current = window.requestAnimationFrame(tick);
        }

        resize();
        window.addEventListener("resize", resize);

        // Optional: pause when tab not visible
        const onVis = () => {
            if (document.hidden) {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            } else if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };
        document.addEventListener("visibilitychange", onVis);

        rafRef.current = window.requestAnimationFrame(tick);

        return () => {
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", onVis);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [enabled, intensity, wind]);

    if (!enabled) return null;

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999, // on top of everything
                pointerEvents: "none", // doesn't block clicks/typing
            }}
        />
    );
}
