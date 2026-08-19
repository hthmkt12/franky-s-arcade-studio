import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { arcadeAudio } from "@/lib/audio/arcade-audio";
import { PixelHorse } from "./PixelHorse";

interface PixelRunnerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PixelRunnerModal({ isOpen, onClose }: PixelRunnerProps) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [horseY, setHorseY] = useState(0); // 0 = ground
  const [obstacleX, setObstacleX] = useState(400);

  const jumpingRef = useRef(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("frankys.runner.highscore");
      if (saved) setHighScore(Number(saved) || 0);
    } catch {}
  }, []);

  const jump = () => {
    if (!isPlaying || jumpingRef.current || gameOver) return;
    jumpingRef.current = true;
    arcadeAudio.playJump();

    let height = 0;
    const upInterval = setInterval(() => {
      height += 6;
      setHorseY(height);
      if (height >= 60) {
        clearInterval(upInterval);
        const downInterval = setInterval(() => {
          height -= 5;
          setHorseY(height);
          if (height <= 0) {
            clearInterval(downInterval);
            setHorseY(0);
            jumpingRef.current = false;
          }
        }, 20);
      }
    }, 20);
  };

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setObstacleX(400);
    setHorseY(0);
    arcadeAudio.playBeep(600, "square", 0.1);
  };

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    let obsX = 400;
    const loop = () => {
      obsX -= 4;
      if (obsX <= -20) {
        obsX = 350 + Math.random() * 80;
        setScore((s) => {
          const next = s + 10;
          if (next === 100) {
            arcadeAudio.playVictory();
            toast.success("100 PTS BONUS! CHEAT UNLOCKED: 'RUNNER15' (15% OFF)");
            try {
              localStorage.setItem("frankys.promo.code", "RUNNER15");
            } catch {}
          } else {
            arcadeAudio.playBeep(700, "square", 0.04);
          }
          return next;
        });
      }
      setObstacleX(obsX);

      // Collision box check (Horse is at X=40..80, Y=0..horseY)
      if (obsX >= 35 && obsX <= 75 && horseY < 25) {
        arcadeAudio.playHit();
        setGameOver(true);
        setIsPlaying(false);
        setHighScore((prev) => {
          const nh = Math.max(prev, score);
          try {
            localStorage.setItem("frankys.runner.highscore", String(nh));
          } catch {}
          return nh;
        });
        return;
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, gameOver, horseY, score]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!isPlaying) startGame();
        else jump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs">
      <div
        className="max-w-md w-full bg-cream border-2 border-ink rounded-card p-6 arcade-bevel flex flex-col gap-4"
        style={{ fontFamily: "var(--font-arcade)" }}
      >
        <div className="flex justify-between items-center border-b border-ink pb-3">
          <div>
            <h2 style={{ fontSize: 14, letterSpacing: 2, margin: 0 }}>★ PIXEL RUNNER ★</h2>
            <span className="text-muted text-xs" style={{ fontSize: 8 }}>REACH 100 PTS FOR SECRET 15% DISCOUNT</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-btn border border-ink flex items-center justify-center bg-cream hover:bg-ink hover:text-cream text-xs"
          >
            ✕
          </button>
        </div>

        <div className="flex justify-between text-xs font-bold px-1">
          <span>SCORE: {score}</span>
          <span>HIGH: {highScore}</span>
        </div>

        {/* GAME CANVAS */}
        <div
          onClick={() => {
            if (!isPlaying) startGame();
            else jump();
          }}
          className="relative w-full h-44 border-2 border-ink bg-cream rounded-btn overflow-hidden cursor-pointer flex flex-col justify-end"
          style={{ background: "#f3e5df" }}
        >
          {/* Ground rule */}
          <div className="w-full h-3 border-t-2 border-ink bg-black" />

          {/* Horse */}
          <div
            className="absolute left-8 transition-none"
            style={{ bottom: `${12 + horseY}px` }}
          >
            <PixelHorse size={5} />
          </div>

          {/* Obstacle (Pixel hurdle) */}
          <div
            className="absolute w-4 h-7 bg-ink border border-pixel"
            style={{ bottom: "12px", left: `${obstacleX}px` }}
          />

          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream/80 text-center p-2">
              <span className="text-sm font-bold animate-pulse">PRESS SPACE OR TAP TO JUMP</span>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream/90 text-center gap-2 p-2">
              <span className="text-red-600 font-bold" style={{ fontSize: 13 }}>GAME OVER</span>
              <span className="text-xs">SCORE: {score}</span>
              <span className="text-xs animate-pulse">TAP TO TRY AGAIN</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-xs text-muted">
          <span>[SPACE / TAP] JUMP</span>
          <button
            onClick={onClose}
            className="border border-pixel px-3 py-1 rounded-btn text-xs hover:bg-ink hover:text-cream"
          >
            EXIT GAME
          </button>
        </div>
      </div>
    </div>
  );
}
