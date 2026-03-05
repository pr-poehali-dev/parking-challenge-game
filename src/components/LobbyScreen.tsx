import { useEffect, useState } from 'react';
import type { RoomState } from '@/pages/parkingTypes';

interface LobbyScreenProps {
  room: RoomState;
  localPlayerId: string;
  onCancel: () => void;
}

export default function LobbyScreen({ room, localPlayerId, onCancel }: LobbyScreenProps) {
  const [dots, setDots] = useState('');
  const [secs, setSecs] = useState(Math.max(0, Math.ceil((room.timerEnd - Date.now()) / 1000)));
  const realPlayers = room.players.filter(p => !p.is_bot);

  useEffect(() => {
    const t = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
      setSecs(Math.max(0, Math.ceil((room.timerEnd - Date.now()) / 1000)));
    }, 500);
    return () => clearInterval(t);
  }, [room.timerEnd]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 gap-6 bg-gray-950/95 backdrop-blur-sm animate-fade-in">
      <div className="text-center animate-fade-in">
        <div className="text-6xl mb-3 animate-float">🅿️</div>
        <h2 className="font-russo text-3xl text-yellow-400">Поиск игроков{dots}</h2>
        <p className="font-nunito text-white/50 text-sm mt-2">
          Ожидаем других участников. Старт через {secs}с или когда наберётся 10 игроков
        </p>
      </div>

      <div className="card-game w-full max-w-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-russo text-white/70 text-sm">Игроки в комнате</span>
          <span className="font-russo text-yellow-400">{realPlayers.length} / 10</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {realPlayers.map(p => (
            <div
              key={p.player_id}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                p.player_id === localPlayerId ? 'bg-yellow-400/15 border border-yellow-400/30' : 'bg-white/5'
              }`}
            >
              <span className="text-xl">{p.emoji}</span>
              <span className={`font-nunito text-sm ${p.player_id === localPlayerId ? 'text-yellow-400 font-bold' : 'text-white/80'}`}>
                {p.name}
                {p.player_id === localPlayerId && ' (ты)'}
              </span>
              <span className="ml-auto text-green-400 text-xs">●</span>
            </div>
          ))}

          {/* Пустые слоты */}
          {Array.from({ length: Math.max(0, 10 - realPlayers.length) }).map((_, i) => (
            <div key={`empty_${i}`} className="flex items-center gap-2 rounded-lg px-3 py-1.5 bg-white/3 border border-dashed border-white/10">
              <span className="text-white/20 text-xl">🚗</span>
              <span className="font-nunito text-white/20 text-sm">Ожидание{dots}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-red px-8 py-3" onClick={onCancel}>
        Отмена
      </button>
    </div>
  );
}