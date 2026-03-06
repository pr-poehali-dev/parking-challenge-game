import React, { useState, useEffect } from 'react';
import { PlayerData, Screen } from './parkingTypes';

interface ShopScreenProps {
  player: PlayerData;
  setScreen: (s: Screen) => void;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerData>>;
  notify: (msg: string) => void;
}

type ShopTab = 'upgrades' | 'coins' | 'gems';

const UPGRADE_DURATION_MS = 24 * 60 * 60 * 1000;

function formatTimer(msLeft: number): string {
  if (msLeft <= 0) return '00:00:00';
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  const s = Math.floor((msLeft % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ShopScreen({ player, setScreen, setPlayer, notify }: ShopScreenProps) {
  const [tab, setTab] = useState<ShopTab>('upgrades');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const expiry = player.upgradeExpiry ?? {};
    const upgrades = player.upgrades;
    let changed = false;
    const newUpgrades = { ...upgrades };
    const newExpiry = { ...expiry };

    (Object.keys(expiry) as (keyof typeof expiry)[]).forEach(key => {
      const exp = expiry[key];
      if (exp && exp < now && newUpgrades[key]) {
        newUpgrades[key] = false;
        delete newExpiry[key];
        changed = true;
      }
    });

    if (changed) {
      setPlayer(prev => ({ ...prev, upgrades: newUpgrades, upgradeExpiry: newExpiry }));
    }
  }, [now, player.upgradeExpiry, player.upgrades, setPlayer]);

  const gemPacks = [
    { gems: 100, price: '79₽', popular: false },
    { gems: 300, price: '199₽', bonus: '+50 бонус', popular: true },
    { gems: 700, price: '399₽', bonus: '+150 бонус', popular: false },
    { gems: 1500, price: '799₽', bonus: '+500 бонус', popular: false },
  ];

  const coinPacks = [
    { coins: 1000, gems: 10 },
    { coins: 3000, gems: 25 },
    { coins: 7000, gems: 50 },
    { coins: 20000, gems: 120 },
  ];

  const upgrades: { name: string; desc: string; price: number; icon: string; key: keyof typeof player.upgrades; tag?: string }[] = [
    { name: 'Нитро-ускорение', desc: 'Зажми Space — рывок +40% скорости', price: 150, icon: '⚡', key: 'nitro' },
    { name: 'GPS-радар', desc: 'Стрелка к ближайшему свободному месту', price: 200, icon: '📡', key: 'gps' },
    { name: 'Усиленный бампер', desc: '-30% урона при столкновениях', price: 250, icon: '🛡️', key: 'bumper' },
    { name: 'Авто-ремонт', desc: '+15 HP после каждого раунда', price: 300, icon: '🔧', key: 'autoRepair' },
    { name: 'Магнит парковки', desc: 'Притягивает к месту в радиусе 50px', price: 400, icon: '🧲', key: 'magnet', tag: 'НОВИНКА' },
    { name: 'Турбо-старт', desc: 'После сигнала мгновенный разгон x2 на 2 сек', price: 350, icon: '🚀', key: 'turbo', tag: 'НОВИНКА' },
    { name: 'Силовое поле', desc: 'Первый удар за раунд — без урона', price: 500, icon: '🔵', key: 'shield', tag: 'ХИТ' },
  ];

  const handleBuyUpgrade = (upg: typeof upgrades[0]) => {
    if (player.coins < upg.price) { notify('❌ Недостаточно монет!'); return; }
    const expiresAt = Date.now() + UPGRADE_DURATION_MS;
    setPlayer(prev => ({
      ...prev,
      coins: prev.coins - upg.price,
      upgrades: { ...prev.upgrades, [upg.key]: true },
      upgradeExpiry: { ...(prev.upgradeExpiry ?? {}), [upg.key]: expiresAt },
    }));
    notify(`✅ ${upg.name} куплено на 24 часа!`);
  };

  const tabs: { id: ShopTab; label: string; emoji: string }[] = [
    { id: 'upgrades', label: 'Улучшения', emoji: '⚡' },
    { id: 'coins', label: 'Монеты', emoji: '🪙' },
    { id: 'gems', label: 'Кристаллы', emoji: '💎' },
  ];

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 gap-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button className="btn-game bg-white/10 text-white border-b-white/20 py-2 px-4" onClick={() => setScreen('menu')}>←</button>
        <h2 className="font-russo text-2xl text-yellow-400">🛒 Магазин</h2>
      </div>

      <div className="flex gap-3">
        <div className="coin-badge flex-1 justify-center py-2 text-sm">🪙 {player.coins.toLocaleString()}</div>
        <div className="gem-badge flex-1 justify-center py-2 text-sm">💎 {player.gems}</div>
      </div>

      <div className="flex gap-1 bg-white/5 rounded-2xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-russo text-sm transition-all ${
              tab === t.id
                ? 'bg-yellow-400 text-gray-900'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <span>{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'upgrades' && (
        <div className="space-y-2">
          <p className="text-white/30 text-xs font-nunito text-center">Действует 24 часа с момента покупки</p>
          {upgrades.map((upg, i) => {
            const owned = player.upgrades[upg.key];
            const expiry = player.upgradeExpiry?.[upg.key];
            const msLeft = expiry ? expiry - now : 0;
            const isActive = owned && msLeft > 0;

            return (
              <div key={i} className={`card-game p-4 flex items-center gap-3 relative overflow-hidden ${isActive ? 'border border-green-500/40 bg-green-500/5' : ''}`}>
                {upg.tag && !isActive && (
                  <div className="absolute top-1 right-1 bg-orange-500 text-white font-russo text-[9px] px-1.5 py-0.5 rounded-full">{upg.tag}</div>
                )}
                <div className="text-3xl">{upg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-russo text-white text-sm">{upg.name}</div>
                  <div className="text-white/30 text-xs font-nunito">{upg.desc}</div>
                  {isActive && (
                    <div className="text-green-400 text-xs font-nunito font-bold mt-0.5">
                      ⏱ {formatTimer(msLeft)}
                    </div>
                  )}
                </div>
                {isActive ? (
                  <div className="text-green-400 font-russo text-sm shrink-0">✅</div>
                ) : (
                  <button
                    className="btn-orange text-sm py-2 px-3 shrink-0"
                    onClick={() => handleBuyUpgrade(upg)}
                  >
                    {upg.price} 🪙
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'coins' && (
        <div className="grid grid-cols-2 gap-3">
          {coinPacks.map((pack, i) => (
            <button
              key={i}
              onClick={() => {
                if (player.gems >= pack.gems) {
                  setPlayer(prev => ({ ...prev, gems: prev.gems - pack.gems, coins: prev.coins + pack.coins }));
                  notify(`✅ Получено ${pack.coins.toLocaleString()} монет!`);
                } else {
                  notify('❌ Недостаточно кристаллов!');
                }
              }}
              className="card-game p-4 flex flex-col items-center gap-2 border border-white/10 hover:border-yellow-500/40 transition-all rounded-2xl"
            >
              <div className="text-3xl">🪙</div>
              <div className="font-russo text-yellow-400 text-lg">{pack.coins.toLocaleString()}</div>
              <div className="text-white/30 text-xs">за {pack.gems} 💎</div>
              <div className="bg-purple-500/20 border border-purple-500/30 text-purple-300 font-russo text-sm py-1.5 px-4 w-full text-center rounded-xl">
                {pack.gems} 💎
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === 'gems' && (
        <div className="grid grid-cols-2 gap-3">
          {gemPacks.map((pack, i) => (
            <button
              key={i}
              onClick={() => notify('💳 Оплата скоро будет доступна!')}
              className={`card-game-solid p-4 flex flex-col items-center gap-2 border-2 hover:scale-105 transition-all ${pack.popular ? 'border-yellow-500/60' : 'border-white/10'}`}
            >
              {pack.popular && (
                <div className="bg-yellow-400 text-gray-900 font-russo text-xs px-2 py-0.5 rounded-full -mt-7 mb-1">ХИТ</div>
              )}
              <div className="text-3xl">💎</div>
              <div className="font-russo text-white text-lg">{pack.gems}</div>
              {'bonus' in pack && pack.bonus && (
                <div className="text-green-400 text-xs font-bold">{pack.bonus}</div>
              )}
              <div className="btn-yellow text-sm py-1.5 px-4 w-full text-center rounded-xl">{pack.price}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShopScreen;
