"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ImagePlus } from "lucide-react";
import type { AlbumPageData } from "@/lib/album-types";

export function MemoriesSection() {
  const [pages, setPages] = useState<AlbumPageData[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let receivedAlbumSnapshot = false;
    const onAlbumPages = (event: Event) => {
      if (cancelled) return;
      const detail = (event as CustomEvent<AlbumPageData[]>).detail;
      if (!Array.isArray(detail)) return;
      receivedAlbumSnapshot = true;
      setPages(detail);
      setReady(true);
    };
    window.addEventListener("keepsake-album-pages", onAlbumPages);
    const fallbackTimer = window.setTimeout(() => { if (!receivedAlbumSnapshot) setReady(true); }, 3000);
    return () => { cancelled = true; window.clearTimeout(fallbackTimer); window.removeEventListener("keepsake-album-pages", onAlbumPages); };
  }, []);

  const photos = pages.filter((page) => page.image).slice(0, 3);
  const openAlbum = () => window.dispatchEvent(new Event("open-keepsake-album"));

  return (
    <article className="memory-card photo-card">
      <div className="memory-card-head"><div><p className="eyebrow">BİRLİKTE BİRİKTİRDİKLERİMİZ</p><h2>Anılar</h2><p>Fotoğraflarımız, küçük notlarımız, güzel günlerimiz.</p></div><span className="card-arrow" aria-hidden="true">↗</span></div>
      <div className="memory-photo-grid" aria-label="Albümdeki anı fotoğrafları">
        {!ready ? <div className="memory-empty">Anılarımız hazırlanıyor…</div> : photos.length ? photos.map((page, index) => <figure className={`memory-polaroid memory-polaroid-${index + 1}`} key={`${index}-${page.date}`}><img src={page.image!} alt={page.quote || page.date || `Albüm fotoğrafı ${index + 1}`} /><figcaption>{page.date || "Birlikte güzel bir gün"}</figcaption></figure>) : <div className="memory-empty"><ImagePlus size={25} /><span>Birlikte biriktirdiğimiz ilk fotoğraflar burada yer alacak.</span></div>}
      </div>
      <button className="card-link" type="button" onClick={openAlbum}>{photos.length ? "Tüm anılarımıza bak" : "İlk anımızı ekle"}<ArrowRight size={15} /></button>
    </article>
  );
}
