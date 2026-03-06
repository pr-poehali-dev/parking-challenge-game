import { useState } from 'react';
import GameCanvas from '@/components/GameCanvas';
import Icon from '@/components/ui/icon';
import { PlayerData, Screen, DailyQuest, WeeklyQuest, RoomState, todayDateStr, weeklyDateStr, xpForLevel } from './parkingTypes';

const MUTE_KEY = 'king_parking_muted';
function useMute() {
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === '1');
  const toggle = () => setMuted(prev => {
    const next = !prev;
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
    return next;
  });
  return { muted, toggle };
}

// ──────────────── MENU ────────────────
interface MenuScreenProps {
  player: PlayerData;
  setScreen: (s: Screen) => void;
  onPlay: () => void;
  onQuestClaim?: (questId: string) => void;
  onWeeklyQuestClaim?: (questId: string) => void;
}

export function MenuScreen({ player, setScreen, onPlay, onQuestClaim, onWeeklyQuestClaim }: MenuScreenProps) {
  const today = todayDateStr();
  const thisWeek = weeklyDateStr();
  const [questTab, setQuestTab] = useState<'daily' | 'weekly'>('daily');

  const quests: DailyQuest[] = player.dailyQuestsDate === today ? (player.dailyQuests ?? []) : [];
  const weeklyQuests: WeeklyQuest[] = player.weeklyQuestsDate === thisWeek ? (player.weeklyQuests ?? []) : [];
  const hasClaimableDaily = quests.some(q => q.progress >= q.goal && !q.claimed);
  const hasClaimableWeekly = weeklyQuests.some(q => q.progress >= q.goal && !q.claimed);
  const streak = player.loginStreak ?? 0;

  const xpIntoLevel = (() => {
    let rem = player.xp;
    let l = 1;
    while (rem >= xpForLevel(l)) { rem -= xpForLevel(l); l++; }
    return { current: rem, needed: xpForLevel(l) };
  })();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { em: '🚗', t: 'top-10 left-10', d: '0s' }, { em: '🏎️', t: 'top-20 right-16', d: '1s' },
          { em: '🚕', t: 'bottom-20 left-20', d: '2s' }, { em: '🚙', t: 'bottom-16 right-12', d: '0.5s' },
        ].map((item, i) => (
          <div key={i} className={`absolute text-5xl animate-float ${item.t}`} style={{ animationDelay: item.d }}>{item.em}</div>
        ))}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-yellow-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-orange-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-sm py-6">
        <div className="text-center animate-fade-in">
          <div className="text-7xl mb-2 animate-bounce-in">👑</div>
          <h1 className="font-russo text-4xl text-yellow-400 leading-none" style={{ textShadow: '0 0 30px rgba(255,214,0,0.6)' }}>КОРОЛЬ ПАРКОВКИ</h1>
          <p className="font-nunito text-white/40 text-xs mt-2 font-bold tracking-widest uppercase">Захвати место — стань королём!</p>
        </div>

        <button className="card-game p-3 flex items-center gap-3 w-full animate-fade-in hover:border-yellow-400/30 transition-all" onClick={() => setScreen('profile')}>
          <span className="text-3xl">{player.emoji}</span>
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-russo text-white text-sm">{player.name}</div>
              <div className="font-russo text-yellow-400 text-sm">Lv.{player.level}</div>
              {streak > 0 && <div className="text-orange-400 text-xs font-nunito">🔥 {streak}</div>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="coin-badge text-xs">🪙 {player.coins.toLocaleString()}</span>
              <span className="gem-badge text-xs">💎 {player.gems}</span>
            </div>
            <div className="mt-1.5">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (xpIntoLevel.current / xpIntoLevel.needed) * 100)}%` }}
                />
              </div>
              <div className="text-white/30 text-[10px] font-nunito mt-0.5">{xpIntoLevel.current} / {xpIntoLevel.needed} XP</div>
            </div>
          </div>
        </button>

        {(quests.length > 0 || weeklyQuests.length > 0) && (
          <div className="card-game w-full p-3 animate-fade-in">
            <div className="flex items-center gap-1 mb-2.5">
              <button
                onClick={() => setQuestTab('daily')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-russo transition-all ${questTab === 'daily' ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30' : 'text-white/40 hover:text-white/60'}`}
              >
                📋 Дневные
                {hasClaimableDaily && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />}
              </button>
              <button
                onClick={() => setQuestTab('weekly')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-russo transition-all ${questTab === 'weekly' ? 'bg-purple-400/20 text-purple-300 border border-purple-400/30' : 'text-white/40 hover:text-white/60'}`}
              >
                🏆 Недельные
                {hasClaimableWeekly && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />}
              </button>
            </div>

            {questTab === 'daily' && (
              <div className="flex flex-col gap-1.5">
                {quests.map(q => {
                  const pct = Math.min(100, (q.progress / q.goal) * 100);
                  const canClaim = q.progress >= q.goal && !q.claimed;
                  return (
                    <div key={q.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${q.claimed ? 'bg-green-500/10 border border-green-500/20 opacity-60' : canClaim ? 'bg-yellow-400/10 border border-yellow-400/30' : 'bg-white/5'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={`font-nunito text-xs ${q.claimed ? 'text-green-400' : canClaim ? 'text-yellow-300' : 'text-white/70'}`}>{q.label}</span>
                          <span className="ml-auto font-nunito text-white/40 text-xs whitespace-nowrap">{q.progress}/{q.goal}</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      {q.claimed ? (
                        <div className="shrink-0 text-green-400 text-xs">✅</div>
                      ) : canClaim ? (
                        <button className="shrink-0 bg-yellow-400 text-gray-900 font-russo text-xs px-2 py-1 rounded-lg hover:bg-yellow-300 transition-all whitespace-nowrap" onClick={() => onQuestClaim?.(q.id)}>
                          Забрать!
                        </button>
                      ) : (
                        <div className="shrink-0 text-xs font-nunito text-yellow-400/60 whitespace-nowrap">+{q.reward.coins}🪙{q.reward.gems ? ` +${q.reward.gems}💎` : ''}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {questTab === 'weekly' && (
              <div className="flex flex-col gap-1.5">
                {weeklyQuests.length === 0 && (
                  <div className="text-white/30 text-xs font-nunito text-center py-2">Начни играть — задания появятся!</div>
                )}
                {weeklyQuests.map(q => {
                  const pct = Math.min(100, (q.progress / q.goal) * 100);
                  const canClaim = q.progress >= q.goal && !q.claimed;
                  return (
                    <div key={q.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${q.claimed ? 'bg-green-500/10 border border-green-500/20 opacity-60' : canClaim ? 'bg-purple-400/10 border border-purple-400/30' : 'bg-white/5'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={`font-nunito text-xs ${q.claimed ? 'text-green-400' : canClaim ? 'text-purple-300' : 'text-white/70'}`}>{q.label}</span>
                          <span className="ml-auto font-nunito text-white/40 text-xs whitespace-nowrap">{q.progress}/{q.goal}</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-purple-400/60 text-[10px] font-nunito mt-0.5">+{q.reward.coins}🪙 +{q.reward.gems}💎</div>
                      </div>
                      {q.claimed ? (
                        <div className="shrink-0 text-green-400 text-xs">✅</div>
                      ) : canClaim ? (
                        <button className="shrink-0 bg-purple-500 text-white font-russo text-xs px-2 py-1 rounded-lg hover:bg-purple-400 transition-all whitespace-nowrap" onClick={() => onWeeklyQuestClaim?.(q.id)}>
                          Забрать!
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          <button className="btn-yellow w-full text-xl py-5 animate-fade-in" onClick={onPlay}>
            🚀 ИГРАТЬ
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-blue animate-fade-in" onClick={() => setScreen('garage')}>🔧 Гараж</button>
            <button className="btn-purple animate-fade-in" onClick={() => setScreen('shop')}>🛒 Магазин</button>
            <button className="btn-orange animate-fade-in" onClick={() => setScreen('profile')}>👤 Профиль</button>
            <button className="btn-green animate-fade-in" onClick={() => setScreen('leaderboard')}>🏆 Топ игроков</button>
            <button className="col-span-2 animate-fade-in card-game py-2.5 flex items-center justify-center gap-2 hover:border-yellow-400/30 transition-all" onClick={() => setScreen('friends')}>
              <span className="text-lg">👥</span>
              <span className="font-russo text-white/70 text-sm">Друзья</span>
              <span className="text-white/30 text-xs ml-1">+10% монет при игре вместе</span>
            </button>
          </div>

        </div>

        <p className="text-white/20 text-xs font-nunito">v0.2.0</p>
      </div>
    </div>
  );
}

// ──────────────── GAME ────────────────
interface GameScreenProps {
  player: PlayerData;
  gameKey: number;
  gameRound: number;
  gameResult: { position: number; coinsEarned: number } | null;
  inGamePhase: 'playing' | 'roundEnd';
  keys: Set<string>;
  keysRef: React.MutableRefObject<Set<string>>;
  setScreen: (s: Screen) => void;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerData>>;
  handleRoundEnd: (round: number, isPlayerEliminated: boolean, playerHp: number, playerMaxHp: number) => void;
  handleGameEnd: (position: number, roundsPlayed?: number, finalHp?: number) => void;
  notify: (msg: string) => void;
  roomState?: RoomState | null;
  localPlayerId?: string;
  onPlayerMove?: (state: { x: number; y: number; angle: number; speed: number; hp: number; orbitAngle: number; parked: boolean; parkSpot: number; eliminated: boolean }) => void;
}

export function GameScreen({
  player, gameKey, gameRound, gameResult, inGamePhase,
  keys, keysRef, setScreen, setPlayer, handleRoundEnd, handleGameEnd, notify,
  roomState, localPlayerId, onPlayerMove,
}: GameScreenProps) {
  const { muted, toggle: toggleMute } = useMute();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-2 py-2 gap-2">
      <div className="flex items-center justify-between w-full max-w-3xl">
        <button className="btn-red text-sm py-2 px-4" onClick={() => setScreen('menu')}>← Выйти</button>
        <div className={`font-russo text-lg ${gameRound === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
          {gameRound === 0 ? '🟢 Тренировка' : `Раунд ${gameRound}`}
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`rounded-xl px-3 py-2 transition-all border ${muted ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/10 border-white/20 text-white/70 hover:text-white'}`}
            onClick={toggleMute}
            title={muted ? 'Включить звук' : 'Выключить звук'}
          >
            <Icon name={muted ? 'VolumeX' : 'Volume2'} size={18} />
          </button>
          <div className="coin-badge">🪙 {player.coins.toLocaleString()}</div>
        </div>
      </div>

      <div className="w-full max-w-3xl">
        <GameCanvas
          key={gameKey}
          playerName={player.name}
          playerId={localPlayerId}
          playerHp={player.cars[player.selectedCar]?.hp}
          playerMaxHp={player.cars[player.selectedCar]?.maxHp}
          playerColor={player.cars[player.selectedCar]?.color}
          playerBodyColor={player.cars[player.selectedCar]?.bodyColor}
          playerEmoji={player.cars[player.selectedCar]?.emoji}
          playerMaxSpeed={player.cars[player.selectedCar]?.maxSpeed}
          upgrades={player.upgrades ?? { nitro: false, gps: false, bumper: false, autoRepair: false, magnet: false, turbo: false, shield: false }}
          onRoundEnd={handleRoundEnd}
          onGameEnd={handleGameEnd}
          keys={keys}
          keysRef={keysRef}
          roomState={roomState}
          onPlayerMove={onPlayerMove}
        />
      </div>

      {inGamePhase === 'roundEnd' && !gameResult && (() => {
        const car = player.cars[player.selectedCar];
        if (!car || car.hp >= car.maxHp) return null;
        const repairCost = Math.round(car.repairCost * (1 - car.hp / car.maxHp));
        const healAmt = Math.round(car.maxHp * 0.4);
        return (
          <div className="flex justify-center animate-bounce-in">
            <button
              className="btn-green px-6 py-3 text-base font-russo shadow-2xl"
              onClick={() => {
                if (player.coins >= repairCost) {
                  setPlayer(prev => {
                    const newCars = prev.cars.map((c, i) => i === prev.selectedCar ? { ...c, hp: Math.min(c.maxHp, c.hp + healAmt) } : c);
                    return { ...prev, coins: prev.coins - repairCost, cars: newCars };
                  });
                  notify(`🔧 Машина подлатана! +${healAmt} HP`);
                } else {
                  notify('❌ Недостаточно монет!');
                }
              }}
            >
              🔧 Починить {Math.round((1 - car.hp / car.maxHp) * 100)}% — {repairCost} 🪙
            </button>
          </div>
        );
      })()}

      <div className="grid grid-cols-3 gap-2 md:hidden w-full max-w-xs mx-auto select-none">
        <div />
        <button
          className="bg-white/20 active:bg-white/40 text-white rounded-2xl h-16 text-3xl font-bold touch-none"
          onTouchStart={e => { e.preventDefault(); keysRef.current.add('ArrowUp'); }}
          onTouchEnd={e => { e.preventDefault(); keysRef.current.delete('ArrowUp'); }}
          onTouchCancel={() => keysRef.current.delete('ArrowUp')}
        >↑</button>
        <div />
        <button
          className="bg-white/20 active:bg-white/40 text-white rounded-2xl h-16 text-3xl font-bold touch-none"
          onTouchStart={e => { e.preventDefault(); keysRef.current.add('ArrowLeft'); }}
          onTouchEnd={e => { e.preventDefault(); keysRef.current.delete('ArrowLeft'); }}
          onTouchCancel={() => keysRef.current.delete('ArrowLeft')}
        >←</button>
        <button
          className="bg-white/20 active:bg-white/40 text-white rounded-2xl h-16 text-3xl font-bold touch-none"
          onTouchStart={e => { e.preventDefault(); keysRef.current.add('ArrowDown'); }}
          onTouchEnd={e => { e.preventDefault(); keysRef.current.delete('ArrowDown'); }}
          onTouchCancel={() => keysRef.current.delete('ArrowDown')}
        >↓</button>
        <button
          className="bg-white/20 active:bg-white/40 text-white rounded-2xl h-16 text-3xl font-bold touch-none"
          onTouchStart={e => { e.preventDefault(); keysRef.current.add('ArrowRight'); }}
          onTouchEnd={e => { e.preventDefault(); keysRef.current.delete('ArrowRight'); }}
          onTouchCancel={() => keysRef.current.delete('ArrowRight')}
        >→</button>
      </div>

      <p className="text-white/30 text-xs text-center font-nunito hidden md:block">
        Стрелки — движение · При сигнале «ПАРКУЙСЯ!» — займи свободное место 🅿️ · Можно таранить соперников!
      </p>
    </div>
  );
}

// ──────────────── GAME OVER ────────────────
interface GameOverScreenProps {
  gameResult: { position: number; coinsEarned: number } | null;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOverScreen({ gameResult, onRestart, onMenu }: GameOverScreenProps) {
  if (!gameResult) return null;
  const { position, coinsEarned } = gameResult;
  const isWin = position === 1;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-game-solid p-8 flex flex-col items-center gap-5 w-full max-w-sm animate-bounce-in">
        <div className="text-7xl">{isWin ? '🏆' : position <= 3 ? '🥈' : '😅'}</div>
        <div className="text-center">
          <div className={`font-russo text-4xl ${isWin ? 'text-yellow-400' : 'text-white'}`} style={isWin ? { textShadow: '0 0 20px rgba(255,214,0,0.7)' } : {}}>
            {isWin ? 'ПОБЕДА!' : position <= 3 ? 'ПРИЗЁР!' : `МЕСТО #${position}`}
          </div>
          <div className="text-white/40 font-nunito text-sm mt-1">
            {isWin ? 'Ты лучший парковщик города!' : position <= 5 ? 'Неплохо, тренируйся!' : 'Паркуйся быстрее!'}
          </div>
        </div>
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center bg-white/5 rounded-2xl p-3">
            <span className="text-white/50 font-nunito text-sm">Место</span>
            <span className="font-russo text-white">#{position}</span>
          </div>
          <div className="flex justify-between items-center bg-yellow-500/10 rounded-2xl p-3">
            <span className="text-white/50 font-nunito text-sm">Монеты</span>
            <span className="font-russo text-yellow-400">+{coinsEarned} 🪙</span>
          </div>
        </div>
        <div className="flex gap-3 w-full">
          <button className="btn-yellow flex-1" onClick={onRestart}>🔄 Ещё раз</button>
          <button className="btn-blue flex-1" onClick={onMenu}>🏠 Меню</button>
        </div>
      </div>
    </div>
  );
}