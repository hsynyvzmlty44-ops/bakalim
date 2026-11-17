"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Feather, Heart } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useEffectiveCloudSync } from "@/lib/use-effective-cloud-sync";
import { fetchLetterRemote, readLocalLetter, saveLetterRemote, writeLocalLetter, type Letter } from "@/lib/letter-store";

export function LetterSection({ useCloudSync = false }: { useCloudSync?: boolean }) {
  const { effectiveCloudSync, clientChecked } = useEffectiveCloudSync(useCloudSync);
  const [letter, setLetter] = useState<Letter>({ greeting: "Sevgilim,", content: "" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const busy = useRef(false);
  const request = useRef(0);

  useEffect(() => {
    try {
      const local = readLocalLetter(window.localStorage);
      if (local) setLetter(local);
    } catch { /* Cloud saving still works when browser storage is blocked. */ }
  }, []);

  useEffect(() => {
    if (!clientChecked) return;
    if (!effectiveCloudSync) {
      setLoading(false);
      setError("Ortak mektuba ulaşmak için çıkış yapıp yeniden giriş yap. Bu cihazdaki metnin korunuyor.");
      return;
    }
    let cancelled = false;
    async function refresh() {
      if (busy.current || document.visibilityState === "hidden") return;
      const version = ++request.current;
      try {
        const remote = await fetchLetterRemote(createBrowserSupabaseClient());
        if (cancelled || busy.current || version !== request.current) return;
        if (remote) {
          setLetter(remote);
        } else {
          setMessage("Mektubunu ikinizin de görebilmesi için düzenleyip Mektubu sakla’ya bas.");
        }
        setError("");
      } catch {
        if (!cancelled && !busy.current && version === request.current) {
          setError("Ortak mektup yüklenemedi. Görünen metin bu cihazdaki kopya olabilir; bağlantı gelince yeniden denenecek.");
        }
      } finally {
        if (!cancelled && version === request.current) setLoading(false);
      }
    }
    void refresh();
    const onRefresh = () => { void refresh(); };
    window.addEventListener("focus", onRefresh);
    window.addEventListener("online", onRefresh);
    document.addEventListener("visibilitychange", onRefresh);
    const interval = window.setInterval(onRefresh, 15000);
    return () => {
      cancelled = true;
      ++request.current;
      window.clearInterval(interval);
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("online", onRefresh);
      document.removeEventListener("visibilitychange", onRefresh);
    };
  }, [clientChecked, effectiveCloudSync]);

  function startEditing() {
    busy.current = true;
    ++request.current; // Prevent late reads from replacing a draft or a later save.
    setMessage("");
    setEditing(true);
  }

  async function saveLetter() {
    if (saving) return;
    setSaving(true);
    setMessage("");
    setError("");
    const draft = { ...letter, greeting: letter.greeting.trim() };
    let localSaved = false;
    try {
      writeLocalLetter(window.localStorage, draft);
      localSaved = true;
    } catch { /* A full local store must not prevent the cloud save. */ }
    try {
      if (!effectiveCloudSync) throw new Error("Ortak oturum yok.");
      const confirmed = await saveLetterRemote(createBrowserSupabaseClient(), draft);
      setLetter(confirmed);
      setEditing(false);
      busy.current = false;
      setMessage("Mektubun kaydedildi. İkiniz de aynı mektubu görebilirsiniz.");
    } catch {
      setError(localSaved
        ? "Mektup bu cihazda korundu ama ortak kayıt tamamlanamadı. Bağlantını ve girişini kontrol edip yeniden Mektubu sakla’ya bas."
        : "Mektup kaydedilemedi. Metnin düzenleme alanında duruyor; bu sayfayı kapatmadan yeniden dene.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="letter" className="story-section letter-section">
      <h2 className="letter-title">BAKALIM DİYE BAŞLAYAN HİKAYEMİZE KALBİMDEN KÜÇÜK Bİ NOT.</h2>
      <article className="letter-paper" aria-busy={loading || saving}>
        <div className="letter-seal"><Heart size={18} fill="currentColor" /></div>
        {loading ? <p className="letter-copy" role="status">Mektubun yükleniyor…</p> : editing ? (
          <>
            <label className="letter-greeting-label">
              <span className="sr-only">Mektup hitabı</span>
              <input className="letter-greeting-editor" value={letter.greeting} onChange={(event) => setLetter({ ...letter, greeting: event.target.value })} disabled={saving} maxLength={60} placeholder="Hitap (istersen boş bırak)" />
            </label>
            <label className="letter-editor-label">
              <span className="sr-only">Mektup metni</span>
              <textarea className="letter-editor" value={letter.content} onChange={(event) => setLetter({ ...letter, content: event.target.value })} disabled={saving} rows={12} maxLength={10000} />
            </label>
          </>
        ) : (
          <>
            {letter.greeting && <p className="letter-greeting">{letter.greeting}</p>}
            <p className="letter-copy">{letter.content || "Kalbinden geçenleri buraya yazabilirsin…"}</p>
          </>
        )}
        <p className="letter-signoff">Daima seninle… <Feather size={19} /></p>
      </article>
      <button className="letter-button" type="button" disabled={loading || saving} onClick={() => editing ? void saveLetter() : startEditing()}>
        {saving ? "Kaydediliyor…" : editing ? "Mektubu sakla" : "Mektuba bir şeyler yaz"}<ArrowRight size={16} />
      </button>
      {message && <p className="letter-saved" role="status">{message}</p>}
      {error && <p className="letter-saved" role="alert">{error}</p>}
    </section>
  );
}
