import { useRef, useState } from 'react';
import { GameState, GameCanvasProps, CANVAS_W, CANVAS_H } from './gameTypes';
import { createInitialState } from './gameLogic';
import { useBotAI } from './useBotAI';
import { useGameSync } from './useGameSync';
import { useGameLoop } from './useGameLoop';

export default function GameCanvas({
  playerName, playerId, playerHp, playerMaxHp,
  playerColor, playerBodyColor, playerEmoji, playerMaxSpeed,
  upgrades, onRoundEnd, onGameEnd, keys, keysRef, roomState, onPlayerMove,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState(playerName, playerHp, playerMaxHp, playerColor, playerBodyColor, playerEmoji, playerMaxSpeed));
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const moveThrottleRef = useRef<number>(0);
  const localId = playerId || 'local_player';

  const [aliveCollapsed, setAliveCollapsed] = useState(true);
  const aliveCollapsedRef = useRef(true);

  const handleToggleAlive = () => {
    const next = !aliveCollapsed;
    aliveCollapsedRef.current = next;
    setAliveCollapsed(next);
  };

  const botAI = useBotAI();

  useGameSync({ stateRef, upgrades, playerHp, localId, roomState });

  useGameLoop({
    canvasRef, stateRef, animRef, timeRef, moveThrottleRef,
    playerName, upgrades, keys, keysRef, onRoundEnd, onGameEnd, onPlayerMove, botAI,
    aliveCollapsedRef,
  });

  // Canvas scale for overlay button positioning
  const canvasAspect = CANVAS_H / CANVAS_W;

  return (
    <div className="relative w-full" style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-2xl border-2 border-white/20 w-full h-full"
        style={{ display: 'block' }}
      />
      {/* Кнопка-тоггл для списка ЖИВЫЕ — позиционируется в правом верхнем углу */}
      <button
        onClick={handleToggleAlive}
        className="absolute top-[1.5%] right-[1.5%] text-[10px] font-russo px-2 py-0.5 rounded-lg bg-black/40 border border-yellow-400/30 text-yellow-300 hover:bg-black/60 transition-all"
        style={{ fontSize: 'clamp(8px, 1.2vw, 11px)' }}
      >
        {aliveCollapsed ? '👥 ▼' : '👥 ▲'}
      </button>
    </div>
  );
}
