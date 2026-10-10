"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Feather, Heart } from "lucide-react";

const STORAGE_KEY = "lila-kopru-letter-v1";
const GREETING_STORAGE_KEY = "lila-kopru-letter-greeting-v1";
const firstLetter = "Sekiz ay önce birbirimize bir “bakalım” dedik. O küçücük kelimenin, içimde böyle kocaman bir yere dönüşeceğini o gün bilmiyordum. Şimdi dönüp baktığımda bu sekiz ayın en güzel yanı takvimdeki günler değil; seninle paylaştığım heyecan, huzur ve her anın içine saklanan biz olmuş.\n\nBazen hissettiklerimin hepsini sana anlatamıyorum. Ama yaptığın her şey, attığın her adım benim için çok kıymetli. Yanımda olsan da olmasan da bana hissettirdiğin yakınlığı kalbimde taşıyorum.\n\nSeninle acele etmeden, her anın tadını çıkararak ve birbirimizi daha iyi tanıyarak büyümek istiyorum. Mesafelerin ve zamanın bir gün aşılacağına; kalplerimizin bu ilk günkü heyecanı hep koruyacağına inanıyorum.\n\nİyi ki bana “bakalım” demenin gerçekten bakabilmek olduğunu öğrettin. Sekiz ayımız kutlu olsun sevgilim. Daha nice ayları, günleri ve yıldızlı geceleri birlikte karşılayalım.\n\nİyi ki hayatıma girdin. 🤍";
const earlierLetter = "Bazen içimdekileri sana tam olarak anlatamıyorum. Yine de yaptığın her şey, attığın her adım benim için çok değerli. Senin kadar romantik cümleler kuramasam da, beni daha iyi tanıdıkça söyleyemediklerimi de anlayacağını biliyorum.\n\nYanımda olsan da olmasan da, bana hissettirdiğin heyecan ve huzur benim için çok kıymetli. Seninle acele etmeden, her anın tadını çıkararak ve birlikte büyüyerek yürümek istiyorum.\n\nMesafeler ve zaman, bir gün geride bırakacağımız şeyler. Benim dileğim, kalplerimizin bu yol boyunca ilk günkü heyecan ve mutlulukla atmaya devam etmesi.\n\nİyi ki bana “bakalım” demenin gerçekten bakabilmek olduğunu öğrettin. İyi ki hayatıma girdin. 🤍";
const previousFirstLetter = "İyi ki o gün yollarımız kesişmiş. Seninle paylaştığım her an, en sıradan günü bile güzel bir hatıraya dönüştürüyor. Birlikte keşfedeceğimiz daha çok yer, güleceğimiz daha çok an var.\n\nİyi ki biz varız.\n\nDaima seninle…";

export function LetterSection() {
  const [letter, setLetter] = useState(firstLetter);
  const [greeting, setGreeting] = useState("Sevgilim,");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== previousFirstLetter && stored !== earlierLetter) setLetter(stored);
      const storedGreeting = window.localStorage.getItem(GREETING_STORAGE_KEY);
      if (storedGreeting !== null) setGreeting(storedGreeting);
    } catch {
      setStorageError(true);
    }
  }, []);

  function saveLetter() {
    try {
      window.localStorage.setItem(STORAGE_KEY, letter);
      const cleanedGreeting = greeting.trim();
      window.localStorage.setItem(GREETING_STORAGE_KEY, cleanedGreeting);
      setGreeting(cleanedGreeting);
      setStorageError(false);
      setEditing(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch {
      setStorageError(true);
    }
  }

  return (
    <section id="letter" className="story-section letter-section">
      <p className="eyebrow">Birlikte geçen sekiz ay</p>
      <h2>Sekiz ayımız kutlu olsun</h2>
      <p className="section-intro">“Bakalım” diye başlayan hikâyemize, kalbimden küçük bir not…</p>
      <article className="letter-paper">
        <div className="letter-date">8. Ayımız · 11 Ekim 2026</div>
        <div className="letter-seal"><Heart size={18} fill="currentColor" /></div>
        {editing ? (
          <>
            <label className="letter-greeting-label">
              <span className="sr-only">Mektup hitabı</span>
              <input className="letter-greeting-editor" value={greeting} onChange={(event) => setGreeting(event.target.value)} maxLength={60} placeholder="Hitap (istersen boş bırak)" />
            </label>
            <label className="letter-editor-label">
              <span className="sr-only">Mektup metni</span>
              <textarea className="letter-editor" value={letter} onChange={(event) => setLetter(event.target.value)} rows={8} maxLength={1800} />
            </label>
          </>
        ) : (
          <>
            {greeting && <p className="letter-greeting">{greeting}</p>}
            <p className="letter-copy">{letter}</p>
          </>
        )}
        <p className="letter-signoff">Daima seninle… <Feather size={19} /></p>
      </article>
      <button className="letter-button" type="button" onClick={() => editing ? saveLetter() : setEditing(true)}>
        {editing ? "Mektubu sakla" : "Mektuba bir şeyler yaz"}<ArrowRight size={16} />
      </button>
      {saved && <p className="letter-saved" role="status">Mektubun bu cihazda saklandı.</p>}
      {storageError && <p className="letter-saved" role="alert">Tarayıcı depolaması kapalı olduğu için mektup saklanamadı. Tarayıcı ayarlarından site verilerine izin verip yeniden deneyebilirsin.</p>}
    </section>
  );
}
