"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Presence = { sharing: boolean; last_seen_at: string | null; last_login_at: string | null; is_online: boolean };
function dateLabel(value: string | null) {
  return value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(value)) : "Henüz yok";
}

export function PresencePanel({ role, loginName }: { role: "subject" | "viewer"; loginName: string }) {
  const [presence, setPresence] = useState<Presence | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const changing = useRef(false);
  const refresh = useCallback(async () => {
    if (document.visibilityState !== "visible" || changing.current) return;
    const version = ++request.current;
    try {
      const client = createBrowserSupabaseClient();
      // No row exists for the viewer. Subject heartbeats only update after opt-in.
      if (role === "subject") {
        const { error: heartbeatError } = await client.rpc("presence_heartbeat");
        if (heartbeatError) throw heartbeatError;
      }
      const { data, error: readError } = await client.rpc("read_couple_presence");
      if (readError) throw readError;
      if (version !== request.current) return;
      setPresence(data?.[0] ?? null);
      setError("");
    } catch {
      if (version !== request.current) return;
      setPresence(null); // Never label stale data as currently online.
      setError("Durum şu anda alınamıyor. Bağlantı gelince yeniden denenecek.");
    }
  }, [role]);

  useEffect(() => {
    void refresh();
    const onRefresh = () => { void refresh(); };
    const timer = window.setInterval(onRefresh, 20000);
    document.addEventListener("visibilitychange", onRefresh);
    window.addEventListener("online", onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      ++request.current;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onRefresh);
      window.removeEventListener("online", onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, [refresh]);

  async function changeSharing() {
    if (changing.current || !presence) return;
    changing.current = true;
    ++request.current;
    setBusy(true);
    setError("");
    try {
      const { data, error: changeError } = await createBrowserSupabaseClient().rpc("set_presence_sharing", { enabled: !presence.sharing });
      if (changeError || !data?.length) throw changeError ?? new Error("Ayar kaydedilemedi");
      setPresence({ ...data[0], is_online: data[0].sharing });
    } catch {
      setError("Paylaşım ayarı değiştirilemedi. Yeniden dene.");
    } finally {
      changing.current = false;
      setBusy(false);
    }
  }

  return (
    <aside className="presence-panel" aria-label="Sitedeki durum">
      <div className="presence-account">{loginName} olarak giriş yaptın</div>
      {role === "subject" ? (
        <>
          <h2>Durum paylaşımın</h2>
          <p>İstersen sitedeki çevrimiçi durumunu, son görülmeni ve son giriş zamanını Hüseyin’le paylaşabilirsin. Yalnızca bu sitedeki aktifliğin paylaşılır.</p>
          <button type="button" className="letter-button" aria-pressed={presence?.sharing ?? false} disabled={busy || !presence} onClick={() => void changeSharing()}>
            {busy ? "Kaydediliyor…" : presence?.sharing ? "Paylaşımı kapat" : "Durumumu Hüseyin’le paylaş"}
          </button>
          <p className="presence-note" role="status">{presence ? presence.sharing ? "Paylaşım açık: Hüseyin durumunu görebiliyor. Kapattığında son görülme ve son giriş bilgilerin de kaldırılır." : "Paylaşım kapalı. Durumun ve giriş zamanların paylaşılmıyor." : "Durum yükleniyor…"}</p>
        </>
      ) : (
        <>
          <h2>Onun sitedeki durumu</h2>
          {!presence ? <p role="status">{error ? "Durum bilinmiyor" : "Durum yükleniyor…"}</p> : !presence.sharing ? <p>Durum paylaşımı kapalı.</p> : (
            <>
              <p className="presence-current"><span className={presence.is_online ? "presence-dot is-online" : "presence-dot"} />{presence.is_online ? "Şu an çevrimiçi" : "Şu an çevrimdışı"}</p>
              <dl><div><dt>Son görülme</dt><dd>{dateLabel(presence.last_seen_at)}</dd></div><div><dt>Son giriş</dt><dd>{dateLabel(presence.last_login_at)}</dd></div></dl>
              <p className="presence-note">Saatler Türkiye saatidir. Çevrimdışı durumuna geçiş yaklaşık bir dakika sürebilir. Son giriş yalnızca paylaşım açıkken yapılan yeni girişleri gösterir.</p>
            </>
          )}
          <p className="presence-note">Senin çevrimiçi durumun ve son girişin paylaşılmıyor.</p>
        </>
      )}
      {error && <p className="presence-error" role="alert">{error}</p>}
    </aside>
  );
}
