import { DAILY_STREAK_REWARDS } from '@/pages/parkingTypes';
import { t, getLang } from '@/i18n';
import { CoinIcon, GemIcon } from '@/components/ui/CoinIcon';

interface DailyBonusModalProps {
  streak: number;
  coinsEarned: number;
  gemsEarned: number;
  onClose: () => void;
}

export default function DailyBonusModal({ streak, coinsEarned, gemsEarned, onClose }: DailyBonusModalProps) {
  const days = [1, 2, 3, 4, 5, 6, 7];
  const currentDay = Math.min(streak, 7);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="card-game w-full max-w-sm flex flex-col items-center gap-5 p-6 animate-bounce-in">
        <div className="text-6xl animate-float">🎁</div>
        <div className="text-center">
          <h2 className="font-russo text-2xl text-yellow-400">{t('daily_bonus_title')}</h2>
          <p className="font-nunito text-white/50 text-sm mt-1">
            {streak >= 7 ? t('daily_streak_max') : t('daily_streak_tip')}
          </p>
        </div>

        <div className="grid grid-cols-7 gap-1.5 w-full">
          {days.map(day => {
            const reward = DAILY_STREAK_REWARDS[day - 1];
            const isToday = day === currentDay;
            const isPast = day < currentDay;
            return (
              <div
                key={day}
                className={`flex flex-col items-center rounded-xl p-1.5 border transition-all ${
                  isToday
                    ? 'border-yellow-400 bg-yellow-400/20 scale-105'
                    : isPast
                    ? 'border-white/10 bg-white/5 opacity-50'
                    : 'border-white/10 bg-white/5 opacity-40'
                }`}
              >
                <span className="text-xs font-russo text-white/50">{day}</span>
                {reward.gems > 0 ? (
                  <GemIcon size={16} />
                ) : (
                  <CoinIcon size={16} />
                )}
                <span className="text-[10px] font-nunito text-white/70 leading-tight text-center">
                  {reward.gems > 0 ? `+${reward.gems}` : `+${reward.coins}`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 items-center justify-center">
          {coinsEarned > 0 && (
            <div className="coin-badge text-lg px-4 py-2">+{coinsEarned} <CoinIcon size={18} /></div>
          )}
          {gemsEarned > 0 && (
            <div className="gem-badge text-lg px-4 py-2">+{gemsEarned} <GemIcon size={18} /></div>
          )}
        </div>

        <div className="font-nunito text-white/40 text-xs text-center">
          🔥 {t('streak_label')}: {streak} {getLang() === 'en' ? t('streak_days_5') : (streak === 1 ? t('streak_day') : streak <= 4 ? t('streak_days_2_4') : t('streak_days_5'))}
        </div>

        <button className="btn-yellow w-full py-3 text-base" onClick={onClose}>
          {t('daily_collect')}
        </button>
      </div>
    </div>
  );
}