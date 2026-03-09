import React from 'react';
import { PlayerData, Screen, RARITIES, UPGRADE_COSTS, UPGRADE_BONUS } from './parkingTypes';
import { t } from '@/i18n';
import { CoinIcon, GemIcon } from '@/components/ui/CoinIcon';

interface GarageScreenProps {
  player: PlayerData;
  setScreen: (s: Screen) => void;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerData>>;
  notify: (msg: string) => void;
}

export function GarageScreen({ player, setScreen, setPlayer, notify }: GarageScreenProps) {
  const sel = player.cars[player.selectedCar];
  return (
    <div className="min-h-screen flex flex-col px-4 py-6 gap-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button className="btn-game bg-white/10 text-white border-b-white/20 py-2 px-4" onClick={() => setScreen('menu')}>←</button>
        <h2 className="font-russo text-2xl text-yellow-400">{t('garage_title')}</h2>
        <div className="ml-auto flex gap-2">
          <div className="coin-badge"><CoinIcon size={14} /> {player.coins.toLocaleString()}</div>
          <div className="gem-badge"><GemIcon size={14} /> {player.gems}</div>
        </div>
      </div>

      <div className={`card-game-solid p-6 flex flex-col items-center gap-4 border-2 ${RARITIES[sel.rarity].border}`}>
        <div className="text-6xl animate-float">{sel.emoji}</div>
        <div className="text-center">
          <div className={`font-russo text-xl ${RARITIES[sel.rarity].color}`}>{sel.name}</div>
          <div className={`text-xs font-nunito font-bold uppercase tracking-wider mt-1 ${RARITIES[sel.rarity].color}`}>{t(`rarity_${sel.rarity}`)}</div>
        </div>

        {/* Прочность */}
        <div className="w-full">
          <div className="flex justify-between text-xs font-nunito font-bold mb-1">
            <span className="text-white/50">{t('durability')}</span>
            <span className="text-white">{sel.hp} / {sel.maxHp} <span className="text-white/30">(Lv.{sel.hpLevel})</span></span>
          </div>
          <div className="damage-bar mb-2">
            <div className="hp-bar" style={{ width: `${(sel.hp / sel.maxHp) * 100}%`, backgroundColor: '#34C759' }} />
          </div>
          {sel.hpLevel < UPGRADE_COSTS.hp.length ? (
            <button className="w-full bg-green-500/15 border border-green-500/40 hover:bg-green-500/25 rounded-xl px-3 py-2 flex items-center justify-between transition-all"
              onClick={() => {
                const cost = UPGRADE_COSTS.hp[sel.hpLevel];
                if (player.coins >= cost) {
                  setPlayer(prev => ({ ...prev, coins: prev.coins - cost, cars: prev.cars.map((c, i) => {
                    if (i !== prev.selectedCar) return c;
                    const newLevel = c.hpLevel + 1;
                    const newMaxHp = c.baseMaxHp + newLevel * UPGRADE_BONUS.hp;
                    return { ...c, hpLevel: newLevel, maxHp: newMaxHp, hp: Math.min(c.hp, newMaxHp) };
                  }) }));
                  notify(`${t('notify_hp_up')} +${UPGRADE_BONUS.hp} HP`);
                } else notify(t('not_enough_coins'));
              }}>
              <span className="font-russo text-green-400 text-xs">⬆ +{UPGRADE_BONUS.hp} HP</span>
              <span className="font-russo text-yellow-400 text-xs">{UPGRADE_COSTS.hp[sel.hpLevel]} <CoinIcon size={12} /></span>
            </button>
          ) : (
            <div className="text-center text-green-400 text-xs font-russo">{t('max_durability')}</div>
          )}
        </div>

        {/* Броня */}
        <div className="w-full">
          <div className="flex justify-between text-xs font-nunito font-bold mb-1">
            <span className="text-white/50">{t('armor')}</span>
            <span className="text-white">{sel.armor.toFixed(1)} <span className="text-white/30">(Lv.{sel.armorLevel})</span></span>
          </div>
          <div className="damage-bar mb-2">
            <div className="hp-bar" style={{ width: `${(sel.armor / 6) * 100}%`, backgroundColor: '#007AFF' }} />
          </div>
          {sel.armorLevel < UPGRADE_COSTS.armor.length ? (
            <button className="w-full bg-blue-500/15 border border-blue-500/40 hover:bg-blue-500/25 rounded-xl px-3 py-2 flex items-center justify-between transition-all"
              onClick={() => {
                const cost = UPGRADE_COSTS.armor[sel.armorLevel];
                if (player.coins >= cost) {
                  setPlayer(prev => ({ ...prev, coins: prev.coins - cost, cars: prev.cars.map((c, i) => {
                    if (i !== prev.selectedCar) return c;
                    const newLevel = c.armorLevel + 1;
                    const newArmor = parseFloat((c.baseArmor + newLevel * UPGRADE_BONUS.armor).toFixed(1));
                    return { ...c, armorLevel: newLevel, armor: newArmor };
                  }) }));
                  notify(`${t('notify_armor_up')} +${UPGRADE_BONUS.armor}`);
                } else notify(t('not_enough_coins'));
              }}>
              <span className="font-russo text-blue-400 text-xs">⬆ +{UPGRADE_BONUS.armor} брони</span>
              <span className="font-russo text-yellow-400 text-xs">{UPGRADE_COSTS.armor[sel.armorLevel]} <CoinIcon size={12} /></span>
            </button>
          ) : (
            <div className="text-center text-blue-400 text-xs font-russo">{t('max_armor')}</div>
          )}
        </div>

        {/* Скорость */}
        <div className="w-full">
          <div className="flex justify-between text-xs font-nunito font-bold mb-1">
            <span className="text-white/50">{t('speed')}</span>
            <span className="text-white">{sel.maxSpeed.toFixed(1)} <span className="text-white/30">(Lv.{sel.speedLevel})</span></span>
          </div>
          <div className="damage-bar mb-2">
            <div className="hp-bar" style={{ width: `${(sel.maxSpeed / 7) * 100}%`, backgroundColor: '#FF6B35' }} />
          </div>
          {sel.speedLevel < UPGRADE_COSTS.speed.length ? (
            <button className="w-full bg-orange-500/15 border border-orange-500/40 hover:bg-orange-500/25 rounded-xl px-3 py-2 flex items-center justify-between transition-all"
              onClick={() => {
                const cost = UPGRADE_COSTS.speed[sel.speedLevel];
                if (player.coins >= cost) {
                  setPlayer(prev => ({ ...prev, coins: prev.coins - cost, cars: prev.cars.map((c, i) => {
                    if (i !== prev.selectedCar) return c;
                    const newLevel = c.speedLevel + 1;
                    const newMaxSpeed = parseFloat((c.baseMaxSpeed + newLevel * UPGRADE_BONUS.speed).toFixed(2));
                    return { ...c, speedLevel: newLevel, maxSpeed: newMaxSpeed, speed: newMaxSpeed };
                  }) }));
                  notify(`${t('notify_speed_up')} +${UPGRADE_BONUS.speed}`);
                } else notify(t('not_enough_coins'));
              }}>
              <span className="font-russo text-orange-400 text-xs">⬆ +{UPGRADE_BONUS.speed} скорости</span>
              <span className="font-russo text-yellow-400 text-xs">{UPGRADE_COSTS.speed[sel.speedLevel]} <CoinIcon size={12} /></span>
            </button>
          ) : (
            <div className="text-center text-orange-400 text-xs font-russo">{t('max_speed')}</div>
          )}
        </div>

        {/* Ремонт */}
        {sel.hp < sel.maxHp ? (
          <button className="btn-green w-full"
            onClick={() => {
              if (player.coins >= sel.repairCost) {
                setPlayer(prev => ({ ...prev, coins: prev.coins - sel.repairCost, cars: prev.cars.map((c, i) => i === prev.selectedCar ? { ...c, hp: c.maxHp } : c) }));
                notify(t('repaired_ok'));
              } else notify(t('not_enough_coins'));
            }}>
            {t('repair_car')} — {sel.repairCost} <CoinIcon size={14} />
          </button>
        ) : (
          <div className="text-green-400 font-russo text-sm">{t('car_perfect')}</div>
        )}
      </div>

      <h3 className="font-russo text-white/40 text-xs uppercase tracking-wider">{t('collection')}</h3>
      <div className="grid grid-cols-3 gap-3">
        {player.cars.map((car, idx) => {
          const r = RARITIES[car.rarity];
          const isSel = idx === player.selectedCar;
          return (
            <button key={car.id}
              onClick={() => {
                if (car.owned) { setPlayer(prev => ({ ...prev, selectedCar: idx })); }
                else if (player.coins >= car.price) {
                  setPlayer(prev => ({ ...prev, coins: prev.coins - car.price, cars: prev.cars.map((c, i) => i === idx ? { ...c, owned: true } : c), selectedCar: idx }));
                  notify(`${t('notify_car_bought')} ${car.name}!`);
                } else notify(t('not_enough_coins'));
              }}
              className={`${r.bg} border-2 ${isSel ? r.border : 'border-white/10'} rounded-2xl p-3 flex flex-col items-center gap-1 transition-all hover:scale-105 ${isSel ? 'scale-105' : ''}`}>
              <div className="text-3xl">{car.emoji}</div>
              <div className={`font-russo text-xs text-center ${r.color}`}>{car.name}</div>
              <div className={`text-[10px] font-nunito uppercase ${r.color} opacity-70`}>{t(`rarity_${car.rarity}`)}</div>
              {!car.owned && <div className="text-yellow-400 text-xs font-russo mt-1 flex items-center gap-0.5 justify-center">{car.price} <CoinIcon size={12} /></div>}
              {car.owned && isSel && <div className="text-green-400 text-xs font-bold">✓</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GarageScreen;