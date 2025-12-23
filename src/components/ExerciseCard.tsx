import { useEffect, useState, useRef } from "react";
import type { Exercise } from "../types/Exercise";
import { checkAnswer } from "../utils/checkAnswer";

type Props = {
    exercise: Exercise;
    onNext: () => void;
    onCorrect?: (exerciseId: string) => void;
    onIncorrect?: (exerciseId: string) => void;
};

export function ExerciseCard({
    exercise,
    onNext,
    onCorrect,
    onIncorrect,
}: Props) {
    // Track user input, check state, and correctness result
    const [value, setValue] = useState("");
    const [checked, setChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    // DOM refs for focus control, overlays, and confetti
    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const errorOverlayRef = useRef<HTMLDivElement | null>(null);
    const confettiRef = useRef<HTMLCanvasElement | null>(null);

    // Reset input, state, and focus whenever the exercise changes
    useEffect(() => {
        setValue("");
        setChecked(false);
        setIsCorrect(null);

        const t = window.setTimeout(() => {
            if (exercise.choices?.length) {
                containerRef.current?.focus();
            } else {
                inputRef.current?.focus();
            }
        }, 0);

        return () => window.clearTimeout(t);
    }, [exercise.id, exercise.choices?.length]);

    // Draw a short confetti burst on the fullscreen canvas
    function shootConfetti() {
        const canvas = confettiRef.current;
        const container = containerRef.current;

        if (!canvas) return;
        const safeCanvas = canvas;

        safeCanvas.width = window.innerWidth;
        safeCanvas.height = window.innerHeight;

        const ctx = safeCanvas.getContext("2d");
        if (!ctx) return;

        const containerRect = container?.getBoundingClientRect();
        const startX = containerRect
            ? containerRect.left + containerRect.width / 2
            : window.innerWidth / 2;
        const startY = containerRect
            ? containerRect.top + containerRect.height / 3
            : window.innerHeight / 3;

        const pieces = Array.from({ length: 120 }).map(() => ({
            x: startX,
            y: startY,
            vx: (Math.random() - 0.5) * 10,
            vy: Math.random() * -10 - 4,
            size: Math.random() * 6 + 4,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.25,
            life: 0,
            ttl: 180 + Math.floor(Math.random() * 120),
            hue: Math.floor(Math.random() * 360),
        }));

        let frame = 0;

        function tick(context: CanvasRenderingContext2D) {
            frame++;
            context.clearRect(0, 0, safeCanvas.width, safeCanvas.height);

            for (const p of pieces) {
                p.life++;
                p.vy += 0.15;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;

                const alpha = 1 - p.life / p.ttl;
                if (alpha <= 0) continue;

                context.save();
                context.globalAlpha = alpha;
                context.translate(p.x, p.y);
                context.rotate(p.rot);

                context.fillStyle = `hsl(${p.hue}, 90%, 60%)`;
                context.fillRect(
                    -p.size / 2,
                    -p.size / 2,
                    p.size,
                    p.size * 0.65
                );

                context.restore();
            }

            if (frame < 280) requestAnimationFrame(() => tick(context));
            else context.clearRect(0, 0, safeCanvas.width, safeCanvas.height);
        }

        requestAnimationFrame(() => tick(ctx));
    }

    // Restart the success pulse on the green overlay
    function triggerWowSuccess() {
        const card = cardRef.current;
        const container = containerRef.current;

        if (!card || !container) return;

        container.classList.remove("wow-error");
        card.classList.remove("wow-success");
        void card.offsetWidth; // force reflow to restart animation
        card.classList.add("wow-success");
    }

    // Restart the red error pulse overlay
    function triggerErrorPulse() {
        const errorOverlay = errorOverlayRef.current;
        if (!errorOverlay) return;

        errorOverlay.classList.remove("wow-error");
        void errorOverlay.offsetWidth;
        errorOverlay.classList.add("wow-error");
    }

    // Validate the current answer and trigger feedback
    function handleCheck() {
        const ok = checkAnswer(value, exercise.answer);
        setIsCorrect(ok);
        setChecked(true);

        if (ok) {
            triggerWowSuccess();
            shootConfetti();
            onCorrect?.(exercise.id);
        } else {
            triggerErrorPulse();
            onIncorrect?.(exercise.id);
        }
    }

    // On Enter, attempt to check if there is input
    function handleEnter() {
        if (value.trim()) handleCheck();
    }

    // Support keyboard shortcuts for enter and choice navigation
    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleEnter();
            return;
        }

        if (exercise.choices?.length) {
            const n = Number(e.key);
            if (!Number.isNaN(n) && n >= 1 && n <= exercise.choices.length) {
                e.preventDefault();
                setValue(exercise.choices[n - 1]);
                return;
            }

            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const len = exercise.choices.length;
                if (len === 0) return;

                const currentIndex = exercise.choices.findIndex(
                    (c) => c === value
                );
                const cur = currentIndex >= 0 ? currentIndex : 0;

                const next =
                    e.key === "ArrowDown"
                        ? (cur + 1) % len
                        : (cur - 1 + len) % len;

                setValue(exercise.choices[next]);
                return;
            }
        }
    }

    return (
        <>
            <div
                ref={cardRef}
                style={{
                    position: "fixed",
                    inset: 0,
                    width: "100vw",
                    height: "100vh",
                    pointerEvents: "none",
                    zIndex: 999,
                }}
            />

            <div
                ref={errorOverlayRef}
                style={{
                    position: "fixed",
                    inset: 0,
                    width: "100vw",
                    height: "100vh",
                    pointerEvents: "none",
                    zIndex: 999,
                }}
            />

            <div
                style={{
                    minHeight: "60vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "48px 16px",
                }}
            >
                <canvas
                    ref={confettiRef}
                    style={{
                        position: "fixed",
                        inset: 0,
                        width: "100vw",
                        height: "100vh",
                        pointerEvents: "none",
                        zIndex: 998,
                    }}
                />

                <div
                    ref={containerRef}
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                    style={{
                        width: "100%",
                        maxWidth: 700,
                        margin: 0,
                        padding: 20,
                        border: "1px solid #ddd",
                        borderRadius: 12,
                        outline: "none",
                        position: "relative", // required for canvas overlay positioning
                        overflow: "hidden", // keeps confetti inside the card
                    }}
                >
                    <h2 style={{ marginTop: 0 }}>{exercise.prompt}</h2>

                    {exercise.choices?.length ? (
                        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                            {exercise.choices.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => {
                                        setValue(c);
                                        setChecked(false);
                                        setIsCorrect(null);
                                    }}
                                    type="button"
                                    style={{
                                        padding: 12,
                                        borderRadius: 12,
                                        border:
                                            value === c
                                                ? "2px solid #4ade80"
                                                : "1px solid #ccc",
                                        background:
                                            value === c ? "#f0fdf4" : "white",
                                        color: "#111",
                                        fontSize: 16,
                                        fontWeight: 500,
                                        textAlign: "left",
                                        cursor: "pointer",
                                    }}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <input
                            ref={inputRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                setChecked(false);
                                setIsCorrect(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleEnter();
                                }
                            }}
                            placeholder="Escribe tu respuesta…"
                            style={{
                                width: "90%",
                                padding: 12,
                                fontSize: 16,
                                borderRadius: 10,
                                border: "1px solid #ccc",
                                marginTop: 12,
                            }}
                        />
                    )}

                    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                        <button
                            onClick={handleCheck}
                            disabled={!value.trim()}
                            type="button"
                            style={{
                                padding: "10px 14px",
                                borderRadius: 10,
                                cursor: "pointer",
                            }}
                        >
                            Check
                        </button>

                        <button
                            onClick={onNext}
                            type="button"
                            style={{
                                padding: "10px 14px",
                                borderRadius: 10,
                                cursor: "pointer",
                            }}
                        >
                            Next
                        </button>
                    </div>

                    {checked && (
                        <div
                            style={{
                                marginTop: 14,
                                padding: 12,
                                borderRadius: 10,
                                border: "1px solid #ccc",
                            }}
                        >
                            {isCorrect ? (
                                <div
                                    style={{
                                        marginTop: 8,
                                        opacity: 0.85,
                                        padding: 10,
                                        fontSize: 20,
                                        textAlign: "center",
                                    }}
                                >
                                    ✅ <b>Correcto</b>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        marginTop: 8,
                                        opacity: 0.85,
                                        padding: 10,
                                        fontSize: 20,
                                        textAlign: "center",
                                    }}
                                >
                                    ❌ <b>Incorrecto</b>. Respuesta correcta:{" "}
                                    <b
                                        style={{
                                            marginTop: 8,
                                            opacity: 0.85,
                                            padding: 10,
                                            fontSize: 20,
                                            textAlign: "center",
                                        }}
                                    >
                                        {exercise.answer}
                                    </b>
                                </div>
                            )}

                            {exercise.explanation && (
                                <div
                                    style={{
                                        marginTop: 8,
                                        opacity: 0.85,
                                        padding: 10,
                                        fontSize: 20,
                                        textAlign: "center",
                                    }}
                                >
                                    {exercise.explanation}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
