import React from 'react';
import { PlayerData, Screen, xpForLevel } from './parkingTypes';
import { ProfileCard } from './LoginScreen';
import FriendsPanel from '@/components/FriendsPanel';

interface ProfileScreenProps {
  player: PlayerData;
  setScreen: (s: Screen) => void;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerData>>;
  notify: (msg: string) => void;
}

const STREAK_ACHIEVEMENTS = [
  { id: 'streak_10',  days: 10, gems: 5,  emoji: '📅', title: '10 дней подряд',  desc: 'Заходи в игру 10 дней подряд' },
  { id: 'streak_20',  days: 20, gems: 10, emoji: '🗓️', title: '20 дней подряд', desc: 'Заходи в игру 20 дней подряд' },
  { id: 'streak_30',  days: 30, gems: 20, emoji: '👑', title: 'Целый месяц!',   desc: 'Заходи в игру 30 дней подряд' },
];
const STREAK_ACH_KEY = 'parking_streak_ach_v1';

function getClaimedStreakAchs(): string[] {
  try { return JSON.parse(localStorage.getItem(STREAK_ACH_KEY) ?? '[]'); } catch { return []; }
}
function claimStreakAch(id: string) {
  const claimed = getClaimedStreakAchs();
  if (!claimed.includes(id)) localStorage.setItem(STREAK_ACH_KEY, JSON.stringify([...claimed, id]));
}

export function ProfileScreen({ player, setScreen, setPlayer, notify }: ProfileScreenProps) {
  const xpInLevel = player.xp % xpForLevel(player.level);
  const xpNeeded = xpForLevel(player.level);
  const claimedStreaks = getClaimedStreakAchs();

  const achievements = [
    { emoji: '🎮', title: 'Первая игра', desc: 'Сыграй 1 игру', done: player.gamesPlayed >= 1 },
    { emoji: '🏆', title: 'Первая победа', desc: 'Выиграй 1 игру', done: player.wins >= 1 },
    { emoji: '🚗', title: 'Коллекционер', desc: 'Купи 3 машины', done: player.cars.filter(c => c.owned).length >= 3 },
    { emoji: '💰', title: 'Богач', desc: 'Накопи 5000 монет', done: player.coins >= 5000 },
    { emoji: '⚡', title: 'Стремительный', desc: 'Займи место первым', done: player.bestPosition === 1 },
    { emoji: '💀', title: 'Выживший', desc: 'Дойди до финального раунда', done: player.gamesPlayed >= 1 && player.wins >= 1 },
  ];

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 gap-5 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button className="btn-game bg-white/10 text-white border-b-white/20 py-2 px-4" onClick={() => setScreen('menu')}>←</button>
        <h2 className="font-russo text-2xl text-yellow-400">👤 Профиль</h2>
      </div>

      <ProfileCard
        player={player}
        xpInLevel={xpInLevel}
        xpNeeded={xpNeeded}
        onEmojiChange={em => setPlayer(prev => ({ ...prev, emoji: em }))}
        onNameChange={name => { setPlayer(prev => ({ ...prev, name, nicknameChanges: (prev.nicknameChanges ?? 0) + 1 })); notify('✅ Имя изменено!'); }}
      />

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '🎮', val: player.gamesPlayed, label: 'Игр сыграно' },
          { icon: '🏆', val: player.wins, label: 'Побед' },
          { icon: '🥇', val: player.bestPosition === 99 ? '—' : `#${player.bestPosition}`, label: 'Лучшее место' },
          { icon: '🪙', val: player.coins.toLocaleString(), label: 'Монет' },
        ].map(s => (
          <div key={s.label} className="card-game p-4 flex flex-col gap-1">
            <div className="text-2xl">{s.icon}</div>
            <div className="font-russo text-white text-lg">{s.val}</div>
            <div className="text-white/30 text-xs font-nunito">{s.label}</div>
          </div>
        ))}
      </div>

      <h3 className="font-russo text-white/40 text-xs uppercase tracking-wider">🏅 Достижения</h3>
      <div className="space-y-2">
        {achievements.map((ach, i) => (
          <div key={i} className={`card-game p-4 flex items-center gap-4 ${!ach.done ? 'opacity-40' : ''}`}>
            <div className="text-3xl">{ach.emoji}</div>
            <div className="flex-1">
              <div className={`font-russo text-sm ${ach.done ? 'text-yellow-400' : 'text-white/60'}`}>{ach.title}</div>
              <div className="text-white/30 text-xs font-nunito">{ach.desc}</div>
            </div>
            {ach.done && <div className="text-green-400 text-xl">✅</div>}
          </div>
        ))}
      </div>

      <h3 className="font-russo text-white/40 text-xs uppercase tracking-wider">🔥 Серия входов</h3>
      <div className="space-y-2">
        {STREAK_ACHIEVEMENTS.map(ach => {
          const done = player.loginStreak >= ach.days;
          const claimed = claimedStreaks.includes(ach.id);
          const canClaim = done && !claimed;
          return (
            <div key={ach.id} className={`card-game p-4 flex items-center gap-4 ${!done ? 'opacity-40' : ''}`}>
              <div className="text-3xl">{ach.emoji}</div>
              <div className="flex-1">
                <div className={`font-russo text-sm ${done ? 'text-yellow-400' : 'text-white/60'}`}>{ach.title}</div>
                <div className="text-white/30 text-xs font-nunito">
                  {ach.desc} · Текущая серия: <span className="text-white/60">{player.loginStreak} дн.</span>
                </div>
              </div>
              {claimed && <div className="text-green-400 text-sm font-russo shrink-0">✅ Получено</div>}
              {canClaim && (
                <button
                  className="shrink-0 bg-purple-500/20 border border-purple-400/50 hover:bg-purple-500/30 rounded-xl px-3 py-1.5 font-russo text-purple-300 text-xs transition-all"
                  onClick={() => {
                    claimStreakAch(ach.id);
                    setPlayer(prev => ({ ...prev, gems: prev.gems + ach.gems }));
                    notify(`💎 +${ach.gems} кристаллов за достижение "${ach.title}"!`);
                  }}
                >
                  💎 +{ach.gems}
                </button>
              )}
              {!done && (
                <div className="shrink-0 text-xs font-russo text-white/20">{player.loginStreak}/{ach.days}</div>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="font-russo text-white/40 text-xs uppercase tracking-wider">👥 Друзья</h3>
      <FriendsPanel playerName={player.name} playerEmoji={player.emoji} notify={notify} />
    </div>
  );
}

export default ProfileScreen;
