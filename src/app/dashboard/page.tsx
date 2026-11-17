import { logout } from "@/app/dashboard/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AlbumCorner } from "@/components/album-corner";
import { PresencePanel } from "@/components/presence-panel";
import { BizCounter } from "@/components/biz-counter";
import { CoupleTodoList } from "@/components/couple-todo-list";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SkyChart } from "@/components/sky-chart";
import { LetterSection } from "@/components/letter-section";
import { MemoriesSection } from "@/components/memories-section";
import { Sparkles } from "lucide-react";

export default async function DashboardPage() {
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

  if (!user) redirect("/login");
  const client = await createServerSupabaseClient();
  const { data: account } = await client.from("couple_accounts").select("account_role,login_name").eq("user_id", user.id).single();
  if (!account) return <main className="presence-panel"><p>Bu hesabın site erişimi henüz hazır değil. Lütfen daha sonra yeniden dene.</p><form action={logout}><button type="submit" className="letter-button">Çıkış yap</button></form></main>;

  return (
    <>
      <AlbumCorner useCloudSync={Boolean(user)} showLauncher={false} />
      <main className="story-shell">
        <header className="story-nav">
          <Link href="/dashboard" className="site-brand"><Sparkles size={16} /> Bakalım, birlikte</Link>
          <nav aria-label="Anı defteri bölümleri"><a href="#home">Ana Sayfa</a><a href="#memories">Anılar</a><a href="#sky">Gökyüzümüz</a><a href="#letter">Mektubum</a></nav>
        </header>
        <PresencePanel role={account.account_role} loginName={account.login_name} />
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
        <LetterSection useCloudSync={Boolean(user)} />
        <footer className="site-footer">Aynı gökyüzü, hep bizimle… <span>✦</span><form action={logout}><button type="submit" className="logout-link">Çıkış</button></form></footer>
      </main>
    </>
  );
}
