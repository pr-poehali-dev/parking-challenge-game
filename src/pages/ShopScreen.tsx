import React from 'react';
import { PlayerData, Screen } from './parkingTypes';

interface ShopScreenProps {
  player: PlayerData;
  setScreen: (s: Screen) => void;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerData>>;
  notify: (msg: string) => void;
}

export function ShopScreen({ player, setScreen, setPlayer, notify }: ShopScreenProps) {
  const gemPacks = [
    { gems: 100, price: '79₽', popular: false },
    { gems: 300, price: '199₽', bonus: '+50 бонус', popular: true },
    { gems: 700, price: '399₽', bonus: '+150 бонус', popular: false },
    { gems: 1500, price: '799₽', bonus: '+500 бонус', popular: false },
  ];
  const coinPacks = [
    { coins: 1000, gems: 10 }, { coins: 3000, gems: 25 },
    { coins: 7000, gems: 50 }, { coins: 20000, gems: 120 },
  ];
  const upgrades: { name: string; desc: string; price: number; icon: string; key: keyof typeof player.upgrades; tag?: string }[] = [
    { name: 'Нитро-ускорение', desc: 'Зажми Space при сигнале — рывок +40% скорости', price: 150, icon: '⚡', key: 'nitro' },
    { name: 'GPS-радар', desc: 'Золотая стрелка к ближайшему свободному месту', price: 200, icon: '📡', key: 'gps' },
    { name: 'Усиленный бампер', desc: '-30% урона при столкновениях', price: 250, icon: '🛡️', key: 'bumper' },
    { name: 'Авто-ремонт', desc: 'Восстанавливает +15 HP после каждого раунда', price: 300, icon: '🔧', key: 'autoRepair' },
    { name: 'Магнит парковки', desc: 'Автоматически притягивает к месту в радиусе 50px', price: 400, icon: '🧲', key: 'magnet', tag: 'НОВИНКА' },
    { name: 'Турбо-старт', desc: 'После сигнала мгновенный разгон x2 на 2 сек', price: 350, icon: '🚀', key: 'turbo', tag: 'НОВИНКА' },
    { name: 'Силовое поле', desc: 'Первый удар за раунд — без урона', price: 500, icon: '🔵', key: 'shield', tag: 'ХИТ' },
  ];

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 gap-5 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button className="btn-game bg-white/10 text-white border-b-white/20 py-2 px-4" onClick={() => setScreen('menu')}>←</button>
        <h2 className="font-russo text-2xl text-yellow-400">🛒 Магазин</h2>
      </div>
      <div className="flex gap-3">
        <div className="coin-badge flex-1 justify-center py-2 text-sm">🪙 {player.coins.toLocaleString()}</div>
        <div className="gem-badge flex-1 justify-center py-2 text-sm">💎 {player.gems}</div>
      </div>

      <div>
        <h3 className="font-russo text-white/40 text-xs uppercase tracking-wider mb-3">💎 Кристаллы (реальные деньги)</h3>
        <div className="grid grid-cols-2 gap-3">
          {gemPacks.map((pack, i) => (
            <button key={i} onClick={() => notify('💳 Оплата скоро будет доступна!')}
              className={`card-game-solid p-4 flex flex-col items-center gap-2 border-2 hover:scale-105 transition-all ${pack.popular ? 'border-yellow-500/60' : 'border-white/10'}`}>
              {pack.popular && <div className="bg-yellow-400 text-gray-900 font-russo text-xs px-2 py-0.5 rounded-full -mt-7 mb-1">ХИТ</div>}
              <div className="text-3xl">💎</div>
              <div className="font-russo text-white text-lg">{pack.gems}</div>
              {'bonus' in pack && pack.bonus && <div className="text-green-400 text-xs font-bold">{pack.bonus}</div>}
              <div className="btn-yellow text-sm py-1.5 px-4 w-full text-center rounded-xl">{pack.price}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-russo text-white/40 text-xs uppercase tracking-wider mb-3">🪙 Монеты за кристаллы</h3>
        <div className="grid grid-cols-2 gap-3">
          {coinPacks.map((pack, i) => (
            <button key={i} onClick={() => {
              if (player.gems >= pack.gems) {
                setPlayer(prev => ({ ...prev, gems: prev.gems - pack.gems, coins: prev.coins + pack.coins }));
                notify(`✅ Получено ${pack.coins.toLocaleString()} монет!`);
              } else notify('❌ Недостаточно кристаллов!');
            }}
              className="card-game p-3 flex flex-col items-center gap-1 border border-white/10 hover:border-yellow-500/40 transition-all rounded-2xl">
              <div className="font-russo text-yellow-400">{pack.coins.toLocaleString()} 🪙</div>
              <div className="text-white/30 text-xs">за {pack.gems} 💎</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-russo text-white/40 text-xs uppercase tracking-wider mb-3">⚡ Улучшения машины</h3>
        <div className="space-y-2">
          {upgrades.map((upg, i) => {
            const owned = player.upgrades[upg.key];
            return (
              <div key={i} className={`card-game p-4 flex items-center gap-3 relative overflow-hidden ${owned ? 'border border-green-500/30 bg-green-500/5' : ''}`}>
                {upg.tag && !owned && (
                  <div className="absolute top-1 right-1 bg-orange-500 text-white font-russo text-[9px] px-1.5 py-0.5 rounded-full">{upg.tag}</div>
                )}
                <div className="text-3xl">{upg.icon}</div>
                <div className="flex-1">
                  <div className="font-russo text-white text-sm">{upg.name}</div>
                  <div className="text-white/30 text-xs font-nunito">{upg.desc}</div>
                </div>
                {owned ? (
                  <div className="text-green-400 font-russo text-sm">✅ Куплено</div>
                ) : (
                  <button className="btn-orange text-sm py-2 px-3"
                    onClick={() => {
                      if (player.coins >= upg.price) {
                        setPlayer(prev => ({
                          ...prev,
                          coins: prev.coins - upg.price,
                          upgrades: { ...prev.upgrades, [upg.key]: true },
                        }));
                        notify(`✅ ${upg.name} куплено!`);
                      } else notify('❌ Недостаточно монет!');
                    }}>
                    {upg.price} 🪙
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ShopScreen;
