"use client";

import { useEffect, useRef, useState } from "react";

const LAT = 38.34825;
const LON = 38.36421;
const UTC_INSTANT = "2026-02-11T18:35:00Z";

type CatalogStar = { ra: number; dec: number; mag: number; pmra: number; pmdec: number; hip: number; ci: number; name: string; named: boolean; con: string };
type VisibleStar = CatalogStar & { altitude: number; azimuth: number; apparentRaHours: number; apparentDecDegrees: number; x: number; y: number };
const STAR_WHISPERS = [
  "Bir “bakalım” dedik; kalbim o gün sana doğru yürümeye başladı.",
  "Seninle acele etmeden, her güzel anın içinde biraz daha büyümek istiyorum.",
  "Yanımda olsan da olmasan da, içimde bıraktığın huzur hep benimle.",
  "Geleceği düşününce aklıma ilk seninle kuracağımız küçük mutluluklar geliyor.",
  "Sana baktığımda, dünyanın telaşı bir anlığına susuyor.",
  "Seninle konuşmak, günün sonunda eve dönmek gibi.",
  "Mesafeler aramızda olabilir; kalbimin yönü hep sana dönük.",
  "Birlikte geçirdiğimiz en sıradan gün bile, hatırlamaya değer oluyor.",
  "Senin gülüşün, içimdeki gecelere usulca ışık bırakıyor.",
  "Her yeni günde seni yeniden tanımak ve yeniden seçmek istiyorum.",
  "İyi ki o gün birbirimize “bakalım” demişiz.",
  "Sana anlatamadığım duyguların bile içinde sen varsın.",
  "Elini tuttuğum her yol, nereye giderse gitsin güzel.",
  "Seninle kurduğum hayallerin en güzeli, onları birlikte yaşamak.",
  "Bazen tek bir mesajın bütün günümü güzelleştirmeye yetiyor.",
  "Kalbim, yanında kendisi olmayı senden öğrendi.",
  "Daha keşfedecek çok yerimiz, anlatacak çok hikâyemiz var.",
  "Seninle zaman geçmiyor; içimde güzel bir yere dönüşüyor.",
  "Yolumuz uzun olsa da, aynı gökyüzüne bakıyor olmak güzel.",
  "Dünyanın bütün yıldızları sönse, sana duyduğum şey yolumu buldurur.",
  "Birlikte büyümek, kalbimin en sevdiği gelecek planı.",
  "Senin varlığın, en yoğun günümde bile içime sakinlik veriyor.",
  "Sana ayırdığım yer, kalbimin en güzel manzarası.",
  "Bugün de, yarın da, her yeni başlangıçta da yan yana olalım.",
  "Birlikte kurduğumuz minicik anılar, ömrümün en kıymetli hazinesi.",
  "Gözlerinle buluştuğum her an, içimde yeni bir yıldız yanıyor.",
  "Sana giden yolların hepsini, sabırla ve sevgiyle yürürüm.",
  "Seninle hayat, cevabını birlikte bulduğumuz güzel bir soru gibi.",
  "İçimdeki en güzel cümleler, fark etmeden sana çıkıyor.",
  "Uzaklık yalnızca haritada; sen hep kalbimin yakınındasın.",
  "Bir gün bu geceyi hatırlayıp, iyi ki diye birbirimize sarılalım.",
  "Seninle her şeyin bir zamanı var; ben o zamanı seninle beklerim.",
  "Senin yanında sessizlik bile bana güzel şeyler anlatıyor.",
  "Her yıldız bir dilek olsa, hepsinde yine seni dilerdim.",
  "Kalbimin en sevdiği yön, senin olduğun taraf.",
  "Bu küçük haritaya sığmayan kocaman bir sevgim var sana.",
  "Ne kadar zaman geçerse geçsin, sana bakarken içimdeki heyecan kalsın.",
  "Seninle bir ömür, acele etmeden öğrenmek istediğim en güzel şey.",
  "İyi ki varsın; iyi ki yollarımız aynı hikâyede buluşmuş.",
  "Bu yıldız sana benden küçük bir not taşıyor: seni çok seviyorum.",
] as const;

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

const CONSTELLATION_NAMES: Record<string, string> = {
  And: "Andromeda", Aql: "Kartal", Aqr: "Kova", Ari: "Koç", Aur: "Arabacı",
  Boo: "Çoban", CMa: "Büyük Köpek", Cnc: "Yengeç", CVn: "Av Köpekleri",
  Cas: "Kraliçe", Cen: "Erboğa", Cep: "Kral", Cet: "Balina", CrB: "Kuzey Tacı",
  Crv: "Karga", Crt: "Kupa", Cyg: "Kuğu", Dra: "Ejderha", Eri: "Irmak",
  Gem: "İkizler", Her: "Herkül", Hya: "Su Yılanı", Leo: "Aslan", Lep: "Tavşan",
  Lib: "Terazi", Lyr: "Çalgı", Oph: "Yılancı", Ori: "Avcı", Peg: "Kanatlı At",
  Per: "Perseus", Psc: "Balıklar", Sgr: "Yay", Sco: "Akrep", Ser: "Yılan",
  Tau: "Boğa", UMa: "Büyük Ayı", UMi: "Küçük Ayı", Vir: "Başak",
};
const COMPASS_DIRECTIONS = ["Kuzey", "Kuzeydoğu", "Doğu", "Güneydoğu", "Güney", "Güneybatı", "Batı", "Kuzeybatı"];

function pad(value: number, digits = 2) {
  return String(value).padStart(digits, "0");
}

function rightAscensionLabel(hours: number) {
  const wrapped = (hours + 24) % 24;
  const h = Math.floor(wrapped);
  const minutes = (wrapped - h) * 60;
  const m = Math.floor(minutes);
  return `${pad(h)}sa ${pad(m)}d ${(((minutes - m) * 60).toFixed(1))}s`;
}

function declinationLabel(degrees: number) {
  const sign = degrees < 0 ? "−" : "+";
  const absolute = Math.abs(degrees);
  const d = Math.floor(absolute);
  const minutes = (absolute - d) * 60;
  const m = Math.floor(minutes);
  return `${sign}${pad(d)}° ${pad(m)}′ ${((minutes - m) * 60).toFixed(1)}″`;
}

function magnitudeLabel(magnitude: number) {
  if (magnitude <= 0) return "Gökyüzünün en parlak yıldızlarından";
  if (magnitude <= 1.5) return "Çok parlak; şehir ışığında da seçilebilir";
  if (magnitude <= 3) return "Karanlık bir gökte kolayca seçilebilir";
  if (magnitude <= 4.5) return "Karanlık gökte fark edilir";
  return "Çıplak göz sınırında; dikkatle bakınca seçilir";
}

function colorLabel(index: number) {
  if (index < 0) return "Mavi-beyaz";
  if (index < 0.35) return "Beyaz";
  if (index < 0.8) return "Sarı-beyaz";
  if (index < 1.25) return "Altın";
  return "Turuncu-kızıl";
}

export function SkyChart({ ambient = false }: { ambient?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visibleRef = useRef<VisibleStar[]>([]);
  const [catalog, setCatalog] = useState<CatalogStar[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [selected, setSelected] = useState<VisibleStar | null>(null);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);

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
      return { star, ...horizontal(current.raHours, current.decDegrees, lst), apparentRaHours: current.raHours, apparentDecDegrees: current.decDegrees };
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
      const visible: VisibleStar[] = positioned.map(({ star, altitude, azimuth, apparentRaHours, apparentDecDegrees }) => {
        const radius = (90 - altitude) / 90;
        const angle = azimuth * Math.PI / 180;
        return { ...star, altitude, azimuth, apparentRaHours, apparentDecDegrees, x: center + Math.sin(angle) * radius * horizon * zoom, y: center - Math.cos(angle) * radius * horizon * zoom };
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
        const radius = Math.max(0.5, Math.min(3.5, (0.6 + (6 - star.mag) * 0.45) * Math.sqrt(zoom)));
        const color = star.ci < 0 ? "#b7d8ff" : star.ci < 0.45 ? "#e2eaff" : star.ci < 0.85 ? "#fff2dc" : star.ci < 1.2 ? "#ffd8a8" : "#ffb79e";
        const halo = context.createRadialGradient(star.x, star.y, 0, star.x, star.y, radius * 4.8);
        halo.addColorStop(0, `${color}55`); halo.addColorStop(0.35, `${color}20`); halo.addColorStop(1, `${color}00`);
        context.beginPath(); context.arc(star.x, star.y, radius * 4.8, 0, Math.PI * 2); context.fillStyle = halo; context.fill();
        context.beginPath(); context.arc(star.x, star.y, radius, 0, Math.PI * 2); context.fillStyle = color; context.fill();
        if (star.mag < 1.3) {
          context.strokeStyle = `${color}8a`; context.lineWidth = 0.7;
          context.beginPath(); context.moveTo(star.x - radius * 2.7, star.y); context.lineTo(star.x + radius * 2.7, star.y); context.moveTo(star.x, star.y - radius * 2.7); context.lineTo(star.x, star.y + radius * 2.7); context.stroke();
        }
        if (star.named && star.mag < 2.4) { context.fillStyle = "#f3d9b6"; context.font = `500 ${Math.max(9, size / 62)}px Georgia`; context.fillText(star.name, star.x + radius + 5, star.y - radius - 4); }
      }
      const selectedStar = selected ? visible.find((star) => star.hip === selected.hip) : null;
      if (selectedStar) {
        context.beginPath(); context.arc(selectedStar.x, selectedStar.y, 13 + Math.sin(Date.now() / 450) * 1.5, 0, Math.PI * 2);
        context.strokeStyle = "#f4c8eb"; context.lineWidth = 1.5; context.stroke();
        context.beginPath(); context.arc(selectedStar.x, selectedStar.y, 19, 0, Math.PI * 2);
        context.strokeStyle = "#f4c8eb55"; context.lineWidth = 1; context.stroke();
      }
      context.restore();
      context.beginPath(); context.arc(center, center, horizon, 0, Math.PI * 2); context.strokeStyle = "#c9a7f588"; context.lineWidth = 1; context.stroke();
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [catalog, zoom, selected?.hip]);

  function selectNearest(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left; const y = event.clientY - rect.top;
    let nearest: VisibleStar | null = null; let distance = 28;
    for (const star of visibleRef.current) { const d = Math.hypot(star.x - x, star.y - y); if (d < distance) { nearest = star; distance = d; } }
    setSelected(nearest);
  }

  function selectBrightest() {
    const brightest = visibleRef.current.reduce<VisibleStar | null>((best, star) => !best || star.mag < best.mag ? star : best, null);
    setSelected(brightest);
  }

  const chart = <div className={`sky-disc${expanded ? " is-expanded" : ""}`}>
    <span className="sky-direction north">K</span><span className="sky-direction east">D</span><span className="sky-direction south">G</span><span className="sky-direction west">B</span>
    <canvas ref={canvasRef} className="sky-canvas" onClick={selectNearest} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectBrightest(); } }} role="button" tabIndex={ambient ? -1 : 0} aria-label="Gerçek gökyüzü haritası. Bir yıldızın yakınına dokunarak adını ve ayrıntılarını gör." />
    <span className="zenith-label">ZENİT</span>
  </div>;

  if (ambient) return <div className="sky-ambient" aria-hidden="true">{chart}</div>;

  return (
    <section id="sky" className="story-section sky-section">
      <p className="eyebrow">11 Şubat 2026 · 21:35 · UTC+3</p>
      <h2>O gece gökyüzü</h2>
      <p className="section-intro">Tanıştığımız anda, bulunduğumuz yerden ufkun üzerinde görünen yıldızlar.</p>
      <div className="sky-toolbar" aria-label="Harita kontrolleri">
        <div className="sky-zoom-control">
          <button type="button" onClick={() => setZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))))} disabled={zoom <= 1} aria-label="Haritayı uzaklaştır">−</button>
          <label htmlFor="sky-zoom">Yakınlaştır<input id="sky-zoom" type="range" min="1" max="3" step="0.25" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
          <button type="button" onClick={() => setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))} disabled={zoom >= 3} aria-label="Haritayı yakınlaştır">+</button>
          <output>{zoom.toFixed(2).replace(".", ",")}×</output>
        </div>
        <button className="sky-expand-button" type="button" onClick={() => setExpanded((value) => !value)} aria-pressed={expanded}>{expanded ? "Haritayı küçült" : "Haritayı büyüt"} <span aria-hidden="true">{expanded ? "↙" : "↗"}</span></button>
      </div>
      {chart}
      {loading ? <p className="sky-caption" role="status">Yıldız kataloğu yükleniyor…</p> : catalog.length === 0 ? <div className="sky-error" role="alert"><p>Gökyüzü haritası şu anda yüklenemedi.</p><button className="catalog-retry" type="button" onClick={() => setCatalogAttempt((attempt) => attempt + 1)}>Yeniden dene</button></div> : <div className="sky-meta"><span>38.34825° K, 38.36421° D</span><span>{visibleCount.toLocaleString("tr-TR")} katalog yıldızı ufkun üzerinde</span></div>}
      {selected && (() => {
        const love = STAR_WHISPERS[selected.hip % STAR_WHISPERS.length]!;
        const constellation = CONSTELLATION_NAMES[selected.con] || selected.con || "Takımyıldız bilgisi katalogda yok";
        const direction = COMPASS_DIRECTIONS[Math.round(selected.azimuth / 45) % 8];
        return (
          <article className="sky-selection" aria-live="polite" aria-label="Seçilen yıldızın bilgileri">
            <div className="sky-selection-heading">
              <span className="sky-star-glyph" aria-hidden="true">✦</span>
              <div><p className="sky-selection-kicker">SANA BU YILDIZDAN BİR NOT</p><h3>{selected.name || `Yıldız HIP ${selected.hip}`}</h3></div>
              <span className="sky-star-magnitude">✧ {selected.mag.toFixed(2)} kadir</span>
            </div>
            <p className="sky-love-line"><span aria-hidden="true">♡</span><strong>{love}</strong></p>
            <p className="sky-star-visibility">{magnitudeLabel(selected.mag)}. <span>Yıldız rengi: {colorLabel(selected.ci)}.</span></p>
            <div className="sky-detail-grid">
              <div><span>Takımyıldız</span><strong>{constellation}</strong></div>
              <div><span>Ufkun üstünde</span><strong>{selected.altitude.toFixed(1)}° · {direction}</strong></div>
              <div><span>Azimut</span><strong>{selected.azimuth.toFixed(1)}°</strong></div>
              <div><span>Sağ açıklık</span><strong>{rightAscensionLabel(selected.apparentRaHours)}</strong></div>
              <div><span>Dik açıklık</span><strong>{declinationLabel(selected.apparentDecDegrees)}</strong></div>
              <div><span>Katalog numarası</span><strong>HIP {selected.hip}</strong></div>
            </div>
          </article>
        );
      })()}
      {!selected && <p className="sky-caption">Bir yıldıza dokun yavrum</p>}
      <details className="sky-caption sky-preparation-note">
        <summary>Bu haritayı nasıl hazırladım?</summary>
        <p>“11 Şubat 2026, saat 21.35’te, tanıştığımız yerde gökyüzünün nasıl göründüğünü bulmak için yıldızları tek tek o ana taşıdım. Bu haritadaki her nokta, o gecenin gerçek gökyüzünden.”</p>
      </details>
    </section>
  );
}
