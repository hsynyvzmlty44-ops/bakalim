import { LoginForm } from "@/app/login/login-form";
import { SkyChart } from "@/components/sky-chart";

export function LoginScreen() {
  return (
    <main className="login-screen">
      <div className="login-scenic" aria-hidden="true" />
      <div className="login-stars" aria-hidden="true"><SkyChart ambient /></div>
      <section className="login-panel">
        <p className="login-intro">İyi ki o gün birbirimize “bakalım” dedik.</p>
        <LoginForm />
        <p className="login-date">11 Şubat 2026 <span>·</span> 21:35</p>
      </section>
    </main>
  );
}
