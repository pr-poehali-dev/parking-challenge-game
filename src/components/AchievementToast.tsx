import { useEffect, useState, useRef } from 'react';
import { PlayerData } from '@/pages/parkingTypes';
import { ALL_ACHIEVEMENTS } from '@/pages/ProfileScreen';
import { t } from '@/i18n';
import { CoinIcon, GemIcon } from '@/components/ui/CoinIcon';

const SEEN_KEY = 'parking_ach_seen_v2';

function getSeenAchs(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]'); } catch { return []; }
}
function markSeen(id: string) {
  const seen = getSeenAchs();
  if (!seen.includes(id)) localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]));
}

interface Props {
  player: PlayerData;
}

interface ToastItem {
  id: string;
  emoji: string;
  title: string;
  rewardCoins: number;
  rewardGems: number;
  key: number;
}

export default function AchievementToast({ player }: Props) {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [visible, setVisible] = useState<ToastItem | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRef = useRef(0);

  useEffect(() => {
    const seen = getSeenAchs();
    const newlyDone = ALL_ACHIEVEMENTS.filter(a => a.check(player) && !seen.includes(a.id));
    if (newlyDone.length === 0) return;
    newlyDone.forEach(a => markSeen(a.id));
    const toasts: ToastItem[] = newlyDone.map(a => ({
      id: a.id,
      emoji: a.emoji,
      title: a.title,
      rewardCoins: a.reward.coins ?? 0,
      rewardGems: a.reward.gems ?? 0,
      key: ++keyRef.current,
    }));
    setQueue(prev => [...prev, ...toasts]);
  }, [player.gamesPlayed, player.wins, player.level, player.coins, player.gems, player.loginStreak]);

  useEffect(() => {
    if (visible || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setVisible(next);
    timerRef.current = setTimeout(() => setVisible(null), 3500);
  }, [queue, visible]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (!visible) return null;

  return (
    <div
      key={visible.key}
      className="fixed top-16 left-0 right-0 flex justify-center z-50 pointer-events-none animate-achievement-pop"
    >
      <div className="flex items-center gap-3 bg-gray-900/95 border-2 border-yellow-500/60 rounded-2xl px-5 py-3 shadow-2xl"
        style={{ boxShadow: '0 0 24px rgba(255,214,0,0.3)' }}>
        <div className="text-3xl">{visible.emoji}</div>
        <div>
          <div className="text-yellow-300 font-russo text-xs uppercase tracking-wider">{t('ach_toast_title')}</div>
          <div className="text-white font-russo text-sm">{visible.title}</div>
          {(visible.rewardCoins > 0 || visible.rewardGems > 0) && (
            <div className="text-yellow-400/80 text-xs font-nunito flex items-center gap-1">
              {visible.rewardCoins > 0 && <><span>+{visible.rewardCoins}</span><CoinIcon size={12} /></>}
              {visible.rewardGems > 0 && <><span>+{visible.rewardGems}</span><GemIcon size={12} /></>}
              <span>— {t('ach_toast_claim')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}