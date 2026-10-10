"use client";

import { useEffect, useRef, useState } from "react";

const LAT = 38.34825;
const LON = 38.36421;
const UTC_INSTANT = "2026-02-11T18:35:00Z";

type CatalogStar = { ra: number; dec: number; mag: number; pmra: number; pmdec: number; hip: number; ci: number; name: string; named: boolean; con: string };
type VisibleStar = CatalogStar & { altitude: number; azimuth: number; x: number; y: number };
const LOVE_IN_MANY_LANGUAGES = [
  { language: "English", text: "I love you" },
  { language: "Français", text: "Je t’aime" },
  { language: "Español", text: "Te amo" },
  { language: "Italiano", text: "Ti amo" },
  { language: "Português", text: "Eu te amo" },
  { language: "Deutsch", text: "Ich liebe dich" },
  { language: "Nederlands", text: "Ik hou van jou" },
  { language: "Svenska", text: "Jag älskar dig" },
  { language: "Norsk", text: "Jeg elsker deg" },
  { language: "Dansk", text: "Jeg elsker dig" },
  { language: "Suomi", text: "Rakastan sinua" },
  { language: "Ελληνικά", text: "Σ’ αγαπώ" },
  { language: "Русский", text: "Я тебя люблю" },
  { language: "Українська", text: "Я тебе кохаю" },
  { language: "Polski", text: "Kocham cię" },
  { language: "Čeština", text: "Miluji tě" },
  { language: "Magyar", text: "Szeretlek" },
  { language: "Română", text: "Te iubesc" },
  { language: "Shqip", text: "Të dua" },
  { language: "العربية", text: "أحبك" },
  { language: "فارسی", text: "دوستت دارم" },
  { language: "日本語", text: "愛してる" },
  { language: "한국어", text: "사랑해" },
  { language: "中文", text: "我爱你" },
  { language: "বাংলা", text: "আমি তোমায় ভালোবাসি" },
  { language: "ไทย", text: "ฉันรักคุณ" },
  { language: "Tiếng Việt", text: "Anh yêu em" },
  { language: "Bahasa Indonesia", text: "Aku cinta kamu" },
  { language: "Filipino", text: "Mahal kita" },
  { language: "Kiswahili", text: "Nakupenda" },
  { language: "Afrikaans", text: "Ek is lief vir jou" },
  { language: "Català", text: "T’estimo" },
  { language: "Euskara", text: "Maite zaitut" },
  { language: "Gaeilge", text: "Tá grá agam duit" },
  { language: "Esperanto", text: "Mi amas vin" },
  { language: "Latina", text: "Te amo" },
];

const CONSTELLATIONS = [
  [27989, 25336], [25336, 26207], [27989, 26727], [26727, 26311], [26311, 25930],
  [26727, 27366], [24436, 27366], [27989, 24436], [24608, 28380],
  [37826, 36850], [15863, 14576], [113963, 113881], [113881, 677], [677, 5447],
  [54061, 53910], [53910, 58001], [58001, 59774], [59774, 62956], [62956, 65378], [65378, 67301],
  [49669, 50583], [50583, 54879], [54879, 57632], [21421, 25428],
  [32349, 30324], [30324, 33579], [33579, 34444], [34444, 35904],
  [746, 3179], [3179, 4427], [4427, 6686], [6686, 8886], [8886, 746],
];

function julianDay(date: Date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function localSiderealDegrees(date: Date) {
  const d = julianDay(date) - 2451545;
  const t = d / 36525;
  const gmst = 280.46061837 + 360.98564736629 * d + 0.000387933 * t * t - t * t * t / 38710000;
  return ((gmst + LON) % 360 + 360) % 360;
}

function precessToDate(raHours: number, decDegrees: number, date: Date) {
  const t = (julianDay(date) - 2451545) / 36525;
  const arcsec = Math.PI / (180 * 3600);
  const zeta = (2306.2181 * t + 0.30188 * t * t + 0.017998 * t * t * t) * arcsec;
  const z = (2306.2181 * t + 1.09468 * t * t + 0.018203 * t * t * t) * arcsec;
  const theta = (2004.3109 * t - 0.42665 * t * t - 0.041833 * t * t * t) * arcsec;
  const a = raHours * Math.PI / 12;
  const d = decDegrees * Math.PI / 180;
  const aa = Math.cos(d) * Math.sin(a + zeta);
  const b = Math.cos(theta) * Math.cos(d) * Math.cos(a + zeta) - Math.sin(theta) * Math.sin(d);
  const c = Math.sin(theta) * Math.cos(d) * Math.cos(a + zeta) + Math.cos(theta) * Math.sin(d);
  return { raHours: ((Math.atan2(aa, b) + z + 2 * Math.PI) % (2 * Math.PI)) * 12 / Math.PI, decDegrees: Math.asin(c) * 180 / Math.PI };
}

function horizontal(raHours: number, decDegrees: number, lstDegrees: number) {
  const rad = Math.PI / 180;
  const hourAngle = (lstDegrees - raHours * 15) * rad;
  const dec = decDegrees * rad;
  const lat = LAT * rad;
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(hourAngle);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const azimuth = Math.atan2(
    -Math.cos(dec) * Math.sin(hourAngle),
    Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(hourAngle),
  );
  return { altitude: altitude / rad, azimuth: (azimuth / rad + 360) % 360 };
}

export function SkyChart({ ambient = false }: { ambient?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visibleRef = useRef<VisibleStar[]>([]);
  const [catalog, setCatalog] = useState<CatalogStar[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [selected, setSelected] = useState<VisibleStar | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch("/star-catalog.json", { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("catalog"); return response.json() as Promise<CatalogStar[]>; })
      .then((data) => setCatalog(data))
      .catch(() => { if (!controller.signal.aborted) setCatalog([]); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [catalogAttempt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || catalog.length === 0) return;
    const date = new Date(UTC_INSTANT);
    const lst = localSiderealDegrees(date);
    const years = (julianDay(date) - 2451545) / 365.25;
    const positioned = catalog.map((star) => {
      const decWithMotion = star.dec + star.pmdec * years / 3600000;
      const cosDec = Math.max(0.01, Math.cos(star.dec * Math.PI / 180));
      const raWithMotion = star.ra + star.pmra * years / (3600000 * 15 * cosDec);
      const current = precessToDate(raWithMotion, decWithMotion, date);
      return { star, ...horizontal(current.raHours, current.decDegrees, lst) };
    }).filter((item) => item.altitude > 0);

    const draw = () => {
      const size = canvas.clientWidth;
      if (!size) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const center = size / 2;
      const horizon = size * 0.455;
      const visible: VisibleStar[] = positioned.map(({ star, altitude, azimuth }) => {
        const radius = (90 - altitude) / 90;
        const angle = azimuth * Math.PI / 180;
        return { ...star, altitude, azimuth, x: center + Math.sin(angle) * radius * horizon, y: center - Math.cos(angle) * radius * horizon };
      });
      visibleRef.current = visible;
      setVisibleCount(visible.length);
      context.clearRect(0, 0, size, size);
      context.save();
      context.beginPath(); context.arc(center, center, horizon, 0, Math.PI * 2); context.clip();
      const glow = context.createRadialGradient(center, center, 0, center, center, horizon);
      glow.addColorStop(0, "#16283a"); glow.addColorStop(1, "#09131f");
      context.fillStyle = glow; context.fillRect(0, 0, size, size);
      for (const fraction of [1, 2 / 3, 1 / 3]) {
        context.beginPath(); context.arc(center, center, horizon * fraction, 0, Math.PI * 2);
        context.strokeStyle = fraction === 1 ? "#c9a7f588" : "#c9a7f535"; context.lineWidth = 1; context.setLineDash(fraction === 1 ? [] : [3, 6]); context.stroke();
      }
      context.setLineDash([]); context.strokeStyle = "#c9a7f525"; context.lineWidth = 1;
      context.beginPath(); context.moveTo(center - horizon, center); context.lineTo(center + horizon, center); context.moveTo(center, center - horizon); context.lineTo(center, center + horizon); context.stroke();
      const byHip = new Map<number, VisibleStar>(visible.map((star): [number, VisibleStar] => [star.hip, star]));
      context.strokeStyle = "#cdb5f670"; context.lineWidth = Math.max(0.7, size / 850);
      for (const [a, b] of CONSTELLATIONS) {
        const first = byHip.get(a); const second = byHip.get(b);
        if (!first || !second) continue;
        context.beginPath(); context.moveTo(first.x, first.y); context.lineTo(second.x, second.y); context.stroke();
      }
      for (const star of visible) {
        const radius = Math.max(0.45, Math.min(3.1, 0.55 + (6 - star.mag) * 0.42));
        const color = star.ci < 0 ? "#b7d8ff" : star.ci < 0.45 ? "#e2eaff" : star.ci < 0.85 ? "#fff2dc" : star.ci < 1.2 ? "#ffd8a8" : "#ffb79e";
        context.beginPath(); context.arc(star.x, star.y, radius * 2.6, 0, Math.PI * 2); context.fillStyle = `${color}18`; context.fill();
        context.beginPath(); context.arc(star.x, star.y, radius, 0, Math.PI * 2); context.fillStyle = color; context.fill();
        if (star.named && star.mag < 2.05) { context.fillStyle = "#efcfaa"; context.font = `${Math.max(9, size / 64)}px Georgia`; context.fillText(star.name, star.x + 7, star.y - 6); }
      }
      context.restore();
      context.beginPath(); context.arc(center, center, horizon, 0, Math.PI * 2); context.strokeStyle = "#c9a7f588"; context.lineWidth = 1; context.stroke();
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [catalog]);

  function selectNearest(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left; const y = event.clientY - rect.top;
    let nearest: VisibleStar | null = null; let distance = 18;
    for (const star of visibleRef.current) { const d = Math.hypot(star.x - x, star.y - y); if (d < distance) { nearest = star; distance = d; } }
    setSelected(nearest);
  }

  function selectBrightest() {
    const brightest = visibleRef.current.reduce<VisibleStar | null>((best, star) => !best || star.mag < best.mag ? star : best, null);
    setSelected(brightest);
  }

  const chart = <div className="sky-disc">
    <span className="sky-direction north">K</span><span className="sky-direction east">D</span><span className="sky-direction south">G</span><span className="sky-direction west">B</span>
    <canvas ref={canvasRef} className="sky-canvas" onClick={selectNearest} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectBrightest(); } }} role="button" tabIndex={ambient ? -1 : 0} aria-label="Haritada bir yıldız seç. Klavyeyle en parlak yıldızı seçmek için Enter'a bas." />
    <span className="zenith-label">ZENİT</span>
  </div>;

  if (ambient) return <div className="sky-ambient" aria-hidden="true">{chart}</div>;

  return (
    <section id="sky" className="story-section sky-section">
      <p className="eyebrow">11 Şubat 2026 · 21:35 · UTC+3</p>
      <h2>O gece gökyüzü</h2>
      <p className="section-intro">Tanıştığımız anda, bulunduğumuz yerden ufkun üzerinde görünen yıldızlar.</p>
      {chart}
      {loading ? <p className="sky-caption" role="status">Yıldız kataloğu yükleniyor…</p> : catalog.length === 0 ? <div className="sky-error" role="alert"><p>Gökyüzü haritası şu anda yüklenemedi.</p><button className="catalog-retry" type="button" onClick={() => setCatalogAttempt((attempt) => attempt + 1)}>Yeniden dene</button></div> : <div className="sky-meta"><span>38.34825° K, 38.36421° D</span><span>{visibleCount.toLocaleString("tr-TR")} katalog yıldızı ufkun üzerinde</span></div>}
      {selected && (() => {
        const love = LOVE_IN_MANY_LANGUAGES[selected.hip % LOVE_IN_MANY_LANGUAGES.length]!;
        return (
          <div className="sky-selection" role="status" aria-live="polite">
            <p className="sky-selection-star">{selected.name || `HIP ${selected.hip}`} · {selected.altitude.toFixed(1)}° yükseklik · {selected.azimuth.toFixed(1)}° azimut · kadir {selected.mag.toFixed(1)}</p>
            <p className="sky-love-line"><span aria-hidden="true">♡</span><strong>{love.text}</strong><small>{love.language}</small></p>
          </div>
        );
      })()}
      <p className="sky-caption">HYG 4.1 kataloğunun çıplak göz sınırındaki (+6 kadir) yıldızları; özdevinim, presesyon ve yerel yıldız zamanı ile bu tarih ve konuma taşındı. Bir yıldıza dokunarak gökyüzündeki konumunu görebilirsin.</p>
      <a className="catalog-credit" href="https://github.com/astronexus/HYG-Database" target="_blank" rel="noreferrer">HYG 4.1 · CC BY-SA 4.0 · Katalog kaynağı</a>
    </section>
  );
}
