import { useEffect, useMemo, useState } from "react";
import "./App.css";
import exercisesRaw from "./data/exercises.json";
import type { Exercise } from "./types/Exercise";
import { pickRandom } from "./utils/pickRandom";
import { ExerciseCard } from "./components/ExerciseCard";
import { SnowOverlay } from "./components/SnowOverlay";
import coinImg from "./assets/coin.png";

export default function App() {
    const exercises = exercisesRaw as Exercise[];

    const [current, setCurrent] = useState<Exercise>(() =>
        pickRandom(exercises)
    );
    // Track total XP (persists from localStorage)
    const [experience, setExperience] = useState(() => {
        if (typeof window === "undefined") return 0;
        const stored = window.localStorage.getItem("polski-xp");
        const parsed = stored ? Number(stored) : 0;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    });
    // Keep track of exercises already awarded XP
    const [completedIds, setCompletedIds] = useState<Set<string>>(
        () => new Set()
    );
    // Trigger coin spin animation when XP increases
    const [coinSpin, setCoinSpin] = useState(false);
    // Track elapsed time in seconds since app opened
    const [timeElapsed, setTimeElapsed] = useState(0);

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem("polski-xp", String(experience));
    }, [experience]);

    // Increment timer every second
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeElapsed((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Pick a new random exercise different from the current one
    function nextRandom() {
        if (exercises.length <= 1) return;
        let next = pickRandom(exercises);
        while (next.id === current.id) next = pickRandom(exercises);
        setCurrent(next);
    }

    // Award XP once per exercise and spin the coin when earned
    function handleCorrect(exerciseId: string) {
        // Skip if already completed
        if (completedIds.has(exerciseId)) return;

        // Mark as completed
        setCompletedIds((prev) => {
            const next = new Set(prev);
            next.add(exerciseId);
            return next;
        });

        // Award XP and trigger coin spin
        setExperience((prev) => prev + 5);
        setCoinSpin(true);
        window.setTimeout(() => setCoinSpin(false), 700);
    }

    // Deduct XP on wrong answers until the exercise is completed
    function handleIncorrect(exerciseId: string) {
        setExperience((prev) => {
            if (completedIds.has(exerciseId)) return prev; // skip penalties after success
            const next = prev - 5;
            return next > 0 ? next : 0; // clamp at zero
        });
    }

    // Format elapsed time as mm:ss
    const formattedTime = useMemo(() => {
        const mins = Math.floor(timeElapsed / 60);
        const secs = timeElapsed % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }, [timeElapsed]);

    return (
        <div>
            <SnowOverlay enabled={true} />

            <div className="exercises-counter">
                <div className="exercises-counter__item">
                    TIMER: <b>{formattedTime}</b>
                </div>
                <div className="exercises-counter__item">
                    <span
                        className={`exercises-counter__icon${
                            coinSpin ? " coin-spin" : ""
                        }`}
                        style={{ backgroundImage: `url(${coinImg})` }}
                        aria-hidden
                    />
                    XP: <b>{experience}</b>
                </div>
            </div>

            <ExerciseCard
                exercise={current}
                onNext={nextRandom}
                onCorrect={handleCorrect}
                onIncorrect={handleIncorrect}
            />
        </div>
    );
}
