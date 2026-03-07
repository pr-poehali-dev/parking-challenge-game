import { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'intro' | 'out'>('intro');
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  // Через 2.8с начинаем fade-out, через 3.4с вызываем onDone
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'), 2800);
    const t2 = setTimeout(() => onDone(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    startRef.current = performance.now();

    // Цвета машинок для украшений
    const carColors = ['#FF2D55','#007AFF','#34C759','#FF6B35','#AF52DE','#5AC8FA','#FFD600','#FF3B30'];

    const draw = (now: number) => {
      const t = (now - startRef.current) / 1000;
      ctx.clearRect(0, 0, W, H);

      // --- Фон: тёмный асфальт с радиальным градиентом ---
      const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.85);
      bg.addColorStop(0, '#1a1a2e');
      bg.addColorStop(0.5, '#13131f');
      bg.addColorStop(1, '#0a0a12');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // --- Полосы разметки (диагональные) ---
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      for (let i = -H; i < W + H; i += 55) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.stroke();
      }
      ctx.restore();

      // --- Орбита пунктиром ---
      const orbR = Math.min(W, H) * 0.34;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,45,85,0.18)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 14]);
      ctx.beginPath();
      ctx.arc(W/2, H/2, orbR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // --- Машинки на орбите ---
      const carCount = 8;
      for (let i = 0; i < carCount; i++) {
        const baseAngle = (i / carCount) * Math.PI * 2;
        const a = baseAngle + t * 0.55;
        const cx = W/2 + Math.cos(a) * orbR;
        const cy = H/2 + Math.sin(a) * orbR;
        const carAngle = a + Math.PI;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(carAngle);

        // Тень
        ctx.shadowColor = carColors[i % carColors.length];
        ctx.shadowBlur = 10;

        // Кузов
        ctx.fillStyle = carColors[i % carColors.length];
        ctx.beginPath();
        ctx.roundRect(-8, -14, 16, 28, 4);
        ctx.fill();

        // Крыша
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.roundRect(-5, -8, 10, 14, 3);
        ctx.fill();

        // Фары
        ctx.fillStyle = '#FFEE88';
        ctx.shadowColor = '#FFD600';
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.roundRect(-6, -14, 4, 3, 1); ctx.fill();
        ctx.beginPath(); ctx.roundRect(2, -14, 4, 3, 1); ctx.fill();

        ctx.restore();
      }

      // --- Корона (пульсирует) ---
      const crownScale = 1 + Math.sin(t * 3) * 0.06;
      const crownY = H/2 - 60 + Math.sin(t * 1.5) * 4;
      ctx.save();
      ctx.translate(W/2, crownY);
      ctx.scale(crownScale, crownScale);
      ctx.font = `${Math.round(H * 0.12)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#FFD600';
      ctx.shadowBlur = 30 + 15 * Math.sin(t * 4);
      ctx.fillText('👑', 0, 0);
      ctx.restore();

      // --- Заголовок ---
      const titleY = H/2 + 14;
      const titleSize = Math.round(Math.min(W * 0.09, 48));
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${titleSize}px 'Russo One', sans-serif`;

      // Glow
      ctx.shadowColor = '#FFD600';
      ctx.shadowBlur = 28;
      const grad = ctx.createLinearGradient(W/2 - 160, 0, W/2 + 160, 0);
      grad.addColorStop(0, '#FFD600');
      grad.addColorStop(0.5, '#FFFFFF');
      grad.addColorStop(1, '#FFD600');
      ctx.fillStyle = grad;
      ctx.fillText('КОРОЛЬ ПАРКОВКИ', W/2, titleY);
      ctx.restore();

      // --- Подзаголовок ---
      const subY = titleY + titleSize + 10;
      const subAlpha = Math.min(1, t * 1.5 - 0.3);
      ctx.save();
      ctx.globalAlpha = Math.max(0, subAlpha);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.round(titleSize * 0.38)}px 'Nunito', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText('Паркуйся быстрее всех!', W/2, subY);
      ctx.restore();

      // --- Индикатор загрузки ---
      const loadY = H - Math.min(H * 0.12, 60);
      const barW = Math.min(W * 0.5, 200);
      const loadProgress = Math.min(1, t / 2.4);
      const dotAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 3));
      ctx.save();
      ctx.globalAlpha = Math.min(1, t * 2);

      // Трек
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.roundRect(W/2 - barW/2, loadY, barW, 4, 2);
      ctx.fill();

      // Заполнение
      const barGrad = ctx.createLinearGradient(W/2 - barW/2, 0, W/2 + barW/2, 0);
      barGrad.addColorStop(0, '#FF6B35');
      barGrad.addColorStop(1, '#FFD600');
      ctx.fillStyle = barGrad;
      ctx.shadowColor = '#FFD600';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(W/2 - barW/2, loadY, barW * loadProgress, 4, 2);
      ctx.fill();

      // Точки
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255,255,255,${dotAlpha})`;
      ctx.font = `${Math.round(titleSize * 0.3)}px 'Nunito', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const dots = '.'.repeat((Math.floor(t * 3) % 3) + 1);
      ctx.fillText(`Загрузка${dots}`, W/2, loadY - 14);
      ctx.restore();

      // --- Частицы (звёздочки летят) ---
      for (let i = 0; i < 6; i++) {
        const pa = (i / 6) * Math.PI * 2 + t * 0.4;
        const pr = orbR * (0.55 + 0.1 * Math.sin(t * 2 + i));
        const px = W/2 + Math.cos(pa) * pr;
        const py = H/2 + Math.sin(pa) * pr;
        const alpha = 0.3 + 0.3 * Math.sin(t * 3 + i * 1.2);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', px, py);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        transition: 'opacity 0.6s ease-out',
        opacity: phase === 'out' ? 0 : 1,
      }}
    >
      <canvas
        ref={canvasRef}
        width={480}
        height={640}
        className="w-full h-full object-cover"
        style={{ display: 'block' }}
      />
    </div>
  );
}
