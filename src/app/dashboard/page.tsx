import { logout } from "@/app/dashboard/actions";
import { LOCAL_SESSION_COOKIE, LOCAL_SESSION_VALUE } from "@/lib/local-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AlbumCorner } from "@/components/album-corner";
import { BizCounter } from "@/components/biz-counter";
import { CoupleTodoList } from "@/components/couple-todo-list";
import { DigitalPostits } from "@/components/digital-postits";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SkyChart } from "@/components/sky-chart";
import { LetterSection } from "@/components/letter-section";
import { MemoriesSection } from "@/components/memories-section";
import { Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const localOk =
    cookieStore.get(LOCAL_SESSION_COOKIE)?.value === LOCAL_SESSION_VALUE;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user = null;
  if (url && key) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  }

  if (!user && !localOk) redirect("/login");

  return (
    <>
      {localOk && !user ? (
        <div
          className="pointer-events-none fixed left-0 right-0 top-0 z-[60] flex justify-center px-4 pt-3"
          role="status"
        >
          <p className="max-w-md rounded-2xl border border-amber-400/35 bg-amber-950/80 px-4 py-2 text-center text-xs leading-snug text-amber-100/95 shadow-lg backdrop-blur-md">
            Yerel oturumdasın: Supabase oturumu yok, albüm ve yapılacaklar bu cihaza
            yazılıyor. Çıkış yap → yeniden giriş yap; giriş sayfasında kırmızı hata
            çıkarsa `npm run supabase:create-user` veya Auth’ta{" "}
            <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_AUTH_EMAIL_DOMAIN</code>{" "}
            ile aynı e-postayı kullan. Vercel’de{" "}
            <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_SUPABASE_*</code>{" "}
            tanımlı olsun.
          </p>
        </div>
      ) : null}
      <AlbumCorner useCloudSync={Boolean(user)} showLauncher={false} />
      <main className="story-shell">
        <div className="postit-layer">
          <DigitalPostits userEmail={user?.email ?? null} localSession={localOk} />
        </div>
        <header className="story-nav">
          <Link href="/dashboard" className="site-brand"><Sparkles size={16} /> Bakalım, birlikte</Link>
          <nav aria-label="Anı defteri bölümleri"><a href="#home">Ana Sayfa</a><a href="#memories">Anılar</a><a href="#sky">Gökyüzümüz</a><a href="#letter">Mektubum</a></nav>
        </header>
        <section className="story-hero" id="home">
          <div className="story-hero-copy"><p className="eyebrow">11 ŞUBAT 2026’DAN BERİ</p><h1>Bir “bakalım”la<br />başlayan hikâyemiz.</h1><p className="landing-subtitle">Birbirimize bakmayı, anlamayı ve acele etmeden birlikte büyümeyi seçtiğimiz her gün…</p>
            <div className="counter-card"><p className="card-kicker">Sonsuzluğa doğru, her saniye birlikte</p><BizCounter /></div>
          </div>
          <span className="hero-moon" aria-hidden="true">☾</span><span className="hero-star hero-star-one" aria-hidden="true">✦</span><span className="hero-star hero-star-two" aria-hidden="true">✧</span>
        </section>
        <section className="memory-grid" id="memories">
          <MemoriesSection />
          <div className="memory-card plans-card"><p className="eyebrow">SIRADAKİ GÜZEL ŞEYLER</p><h2>Planlarımız</h2><p>Daha keşfedecek çok şey var.</p><CoupleTodoList useCloudSync={Boolean(user)} /></div>
        </section>
        <SkyChart />
        <LetterSection />
        <footer className="site-footer">Aynı gökyüzü, hep bizimle… <span>✦</span><form action={logout}><button type="submit" className="logout-link">Çıkış</button></form></footer>
      </main>
    </>
  );
}
