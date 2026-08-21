import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { arcadeAudio } from "@/lib/audio/arcade-audio";
import { PixelHorse } from "./PixelHorse";

interface PixelRunnerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LeaderboardEntry {
  id: string;
  player_tag: string;
  score: number;
  created_at: string;
}

export function PixelRunnerModal({ isOpen, onClose }: PixelRunnerProps) {
  const [activeTab, setActiveTab] = useState<"game" | "leaderboard">("game");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [horseY, setHorseY] = useState(0); // 0 = ground
  const [obstacleX, setObstacleX] = useState(400);

  // Initials submission state
  const [initials, setInitials] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const jumpingRef = useRef(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("frankys.runner.highscore");
      if (saved) setHighScore(Number(saved) || 0);
    } catch {
      // localStorage may be unavailable; ignore.
    }
  }, []);

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch("/api/arcade/scores");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.error("Failed to load leaderboard", e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "leaderboard") {
      void fetchLeaderboard();
    }
  }, [isOpen, activeTab]);

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
    setHasSubmitted(false);
    setInitials("");
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
            } catch {
              // localStorage may be unavailable; ignore.
            }
          } else if (next === 200) {
            arcadeAudio.playVictory();
            toast.success("★ 200 PTS CHAMPION! SECRET UNLOCKED: 'CHAMP20' (20% OFF) ★");
            try {
              localStorage.setItem("frankys.promo.code", "CHAMP20");
            } catch {
              // localStorage may be unavailable; ignore.
            }
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
          } catch {
            // localStorage may be unavailable; ignore.
          }
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
      if (!isOpen || activeTab !== "game") return;
      if (e.code === "Space" || e.code === "ArrowUp") {
        if (!gameOver) {
          e.preventDefault();
          if (!isPlaying) startGame();
          else jump();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initials.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/arcade/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerTag: initials.trim().toUpperCase(), score }),
      });

      if (res.ok) {
        const data = await res.json();
        setHasSubmitted(true);
        arcadeAudio.playVictory();
        toast.success(`SCORE SUBMITTED FOR [${initials.trim().toUpperCase()}]!`);
        if (data.rewardCode) {
          toast.success(`★ REWARD UNLOCKED: '${data.rewardCode}' (${data.discountPercent}% OFF) ★`);
        }
        void fetchLeaderboard();
      } else {
        toast.error("COULD NOT SUBMIT SCORE");
      }
    } catch {
      toast.error("NETWORK ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs">
      <div
        className="max-w-md w-full bg-cream border-2 border-ink rounded-card p-6 arcade-bevel flex flex-col gap-4"
        style={{ fontFamily: "var(--font-arcade)" }}
      >
        {/* Header & Tabs */}
        <div className="flex justify-between items-center border-b border-ink pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("game")}
              className={`px-3 py-1.5 rounded-btn border border-ink arcade-bevel text-xs ${
                activeTab === "game" ? "bg-marquee text-ink font-bold" : "bg-cream text-muted"
              }`}
            >
              🎮 RUNNER
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("leaderboard");
                void fetchLeaderboard();
              }}
              className={`px-3 py-1.5 rounded-btn border border-ink arcade-bevel text-xs ${
                activeTab === "leaderboard"
                  ? "bg-marquee text-ink font-bold"
                  : "bg-cream text-muted"
              }`}
            >
              🏆 HALL OF FAME
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-btn border border-ink flex items-center justify-center bg-cream hover:bg-ink hover:text-cream text-xs"
          >
            ✕
          </button>
        </div>

        {activeTab === "game" ? (
          <>
            <div className="flex justify-between text-xs font-bold px-1">
              <span>SCORE: {score}</span>
              <span>HIGH: {highScore}</span>
            </div>

            {/* GAME CANVAS */}
            <div
              onClick={() => {
                if (!isPlaying && !gameOver) startGame();
                else if (isPlaying) jump();
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
                  <span className="text-sm font-bold animate-pulse">
                    PRESS SPACE OR TAP TO JUMP
                  </span>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream/95 text-center gap-2 p-3">
                  <span className="text-red-600 font-bold" style={{ fontSize: 13 }}>
                    GAME OVER
                  </span>
                  <span className="text-xs">FINAL SCORE: {score}</span>

                  {!hasSubmitted ? (
                    <form
                      onSubmit={handleSubmitScore}
                      className="flex flex-col items-center gap-2 mt-1"
                    >
                      <span style={{ fontSize: 9 }}>ENTER INITIALS:</span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          maxLength={3}
                          placeholder="ABC"
                          autoFocus
                          value={initials}
                          onChange={(e) => setInitials(e.target.value.toUpperCase())}
                          className="w-20 border-2 border-ink px-2 py-1 text-center bg-white uppercase text-base font-bold tracking-widest"
                          style={{ fontFamily: "VT323, monospace", fontSize: 20 }}
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting || initials.trim().length === 0}
                          className="bg-buy text-cream px-3 py-1 border border-ink rounded-btn text-xs arcade-bevel disabled:opacity-40"
                        >
                          {isSubmitting ? "..." : "SUBMIT"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <span className="text-buy text-xs font-bold">
                      ★ SCORE SAVED TO HALL OF FAME ★
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={startGame}
                    className="mt-1 border border-pixel bg-cream px-3 py-1 rounded-btn text-xs hover:bg-ink hover:text-cream"
                  >
                    PLAY AGAIN
                  </button>
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
          </>
        ) : (
          /* HALL OF FAME TAB */
          <div className="flex flex-col gap-3">
            <h3 style={{ fontSize: 11, letterSpacing: 1 }} className="text-center">
              ★ TOP 10 ARCADE PLAYERS ★
            </h3>

            {loadingLeaderboard ? (
              <div className="h-44 flex items-center justify-center text-xs animate-pulse">
                LOADING SCORES...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-muted">
                NO RECORDS YET. BE THE FIRST!
              </div>
            ) : (
              <ul className="border border-pixel rounded-card bg-white p-3 flex flex-col gap-1.5 text-xs">
                {leaderboard.map((item, idx) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center px-2 py-1 border-b border-pixel/30 last:border-0"
                    style={{
                      color: idx === 0 ? "#faa21f" : idx === 1 ? "#128e44" : "#111",
                      fontWeight: idx < 3 ? 700 : 400,
                    }}
                  >
                    <div className="flex gap-3 items-center">
                      <span className="w-5 text-muted">#{idx + 1}</span>
                      <span className="tracking-widest">{item.player_tag}</span>
                    </div>
                    <span style={{ fontFamily: "VT323, monospace", fontSize: 18 }}>
                      {item.score} PTS
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("game")}
              className="bg-ink text-cream py-2 rounded-btn border border-ink text-xs arcade-bevel"
            >
              PLAY NOW TO BEAT THE RECORD
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
