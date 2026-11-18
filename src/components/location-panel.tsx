"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Snapshot = { latitude: number | null; longitude: number | null; accuracy: number | null; shared_at: string | null; expires_at: string | null };
const label = (date: string) => new Intl.DateTimeFormat("tr-TR", { timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(date));

export function LocationPanel({ role }: { role: "subject" | "viewer" }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const version = useRef(0);
  const changing = useRef(false);
  const refresh = useCallback(async () => {
    setNow(Date.now());
    if (changing.current || document.visibilityState !== "visible") return;
    const request = ++version.current;
    try {
      const { data, error: readError } = await createBrowserSupabaseClient().from("couple_location").select("latitude,longitude,accuracy,shared_at,expires_at").maybeSingle();
      if (readError) throw readError;
      if (request === version.current) { setSnapshot(data); setError(""); }
    } catch {
      if (request === version.current) { setSnapshot(null); setError("Konum bilgisi alınamadı. Bağlantını kontrol et."); }
    }
  }, []);
  useEffect(() => {
    const run = () => { void refresh(); };
    run();
    const timer = window.setInterval(run, 10000);
    document.addEventListener("visibilitychange", run);
    return () => { ++version.current; window.clearInterval(timer); document.removeEventListener("visibilitychange", run); };
  }, [refresh]);

  async function share() {
    if (changing.current) return;
    if (!navigator.geolocation) { setError("Bu tarayıcı konum paylaşımını desteklemiyor."); return; }
    changing.current = true;
    const request = ++version.current;
    setBusy(true); setError("");
    try {
      // Called only by the sharing user's explicit button press, never on page load.
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }));
      if (request !== version.current) return;
      const { data, error: writeError } = await createBrowserSupabaseClient().rpc("share_location_snapshot", { lat: position.coords.latitude, lng: position.coords.longitude, accuracy_m: position.coords.accuracy });
      if (writeError || !data?.length) throw new Error("Konum kaydedilemedi.");
      if (request === version.current) { setSnapshot(data[0]); setNow(Date.now()); }
    } catch {
      if (request === version.current) setError("Yeni konum paylaşılmadı. Konum iznini ve internet bağlantını kontrol edip tekrar dene.");
    } finally { changing.current = false; setBusy(false); }
  }
  async function clear() {
    if (changing.current) return;
    changing.current = true; ++version.current; setBusy(true); setError("");
    try {
      const { error: clearError } = await createBrowserSupabaseClient().rpc("clear_location_snapshot");
      if (clearError) throw clearError;
      setSnapshot(null);
    } catch { setError("Paylaşım kaldırılamadı. Bağlantını kontrol edip tekrar dene; mevcut paylaşım en geç süresi dolunca gizlenir."); }
    finally { changing.current = false; setBusy(false); }
  }
  const active = Boolean(snapshot?.expires_at && new Date(snapshot.expires_at).getTime() > now && snapshot.latitude !== null && snapshot.longitude !== null);
  return <aside className="presence-panel" aria-label="İsteğe bağlı konum paylaşımı">
    <h2>{role === "subject" ? "Konum paylaşımın" : "Onun paylaştığı konum"}</h2>
    {role === "subject" ? <>
      <p>Düğmeye basıp telefonunun konum iznini verdiğinde, bulunduğun yer Hüseyin’in bakalım2 hesabına 15 dakika gösterilir. Konum otomatik yenilenmez; yeni bir konum göndermek için tekrar basabilirsin.</p>
      <button className="letter-button" type="button" disabled={busy} onClick={() => void share()}>{busy ? "İşleniyor…" : "Konumumu 15 dakika Hüseyin’le paylaş"}</button>
      {snapshot?.latitude !== null && snapshot?.latitude !== undefined && <button className="letter-button" type="button" disabled={busy} onClick={() => void clear()}>Paylaşımı kaldır ve konumu sil</button>}
      <p className="presence-note" role="status">{active && snapshot?.expires_at ? `Paylaşım açık. Saat ${label(snapshot.expires_at)} itibarıyla gizlenecek.` : "Aktif konum paylaşımın yok."}</p>
    </> : active && snapshot?.shared_at ? <>
      <p>Paylaşılan anın konumu · {label(snapshot.shared_at)} (Türkiye saati)</p>
      <p>Yaklaşık doğruluk: {Math.round(snapshot.accuracy ?? 0)} metre.</p>
      <a className="letter-button" href={`https://www.google.com/maps?q=${snapshot.latitude},${snapshot.longitude}`} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Google Haritalar’da aç</a>
      <p className="presence-note">Haritayı açarsan bu koordinatlar Google’a gönderilir.</p>
    </> : <p>Şu anda paylaşılan bir konum yok.</p>}
    <p className="presence-note">Bu bir canlı takip veya acil durum hizmeti değildir. Konum, paylaşım anına aittir; kişi sonrasında hareket etmiş olabilir. Geçmiş rota tutulmaz.</p>
    {error && <p className="presence-error" role="alert">{error}</p>}
  </aside>;
}
