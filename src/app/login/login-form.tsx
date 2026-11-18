"use client";

import { usernameToEmail } from "@/lib/auth-helpers";
import { resolveAllowedLoginUsername } from "@/lib/login-users";
import {
  clearLocalSessionCookieClient,
} from "@/lib/local-auth";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const easeOutBezier = [0.22, 1, 0.36, 1] as const;

const inputClass = cn(
  "w-full border-0 border-b border-[#c9a7f5]/35 bg-transparent pb-2.5 text-base text-[#fff8ef] placeholder:text-white/45",
  "outline-none transition-[border-color,box-shadow]",
  "focus:border-[#c9a7f5] focus:shadow-[0_4px_24px_-8px_rgba(201,167,245,0.45)]"
);

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUsernameError(null);
    setPasswordError(null);
    const u = username.trim();
    if (!u) setUsernameError("Aramızdaki o kelimeyi hatırla…");
    if (!password) setPasswordError("Kalbine bir daha bak…");
    if (!u || !password) {
      return;
    }

    const allowedUser = resolveAllowedLoginUsername(u);
    if (!allowedUser) {
      setUsernameError("Aramızdaki o kelimeyi hatırla…");
      return;
    }
    setLoading(true);
    const email = usernameToEmail(allowedUser);

    try {
      const supabase = createBrowserSupabaseClient();

      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signError) {
        setLoading(false);
        setError("Giriş yapılamadı. Kullanıcı adını, şifreni ve bağlantını kontrol edip yeniden dene.");
        return;
      }

      clearLocalSessionCookieClient();
      await supabase.auth.getSession();
      // The database records this only for the consenting subject account.
      await supabase.rpc("record_presence_login");
      setLoading(false);
      router.refresh();
      router.replace("/dashboard");
    } catch {
      setError("Giriş tamamlanamadı. Bağlantını kontrol edip yeniden deneyebilirsin.");
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [...easeOutBezier] },
      }}
      className="login-form-frame"
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
        <div>
          <label
            htmlFor="username"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/45"
          >
            Kullanıcı adı
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError(null);
            }}
            disabled={loading}
            className={inputClass}
            aria-invalid={Boolean(usernameError)}
            aria-describedby={usernameError ? "username-error" : undefined}
            placeholder="aramızdaki o kelime"
          />
          {usernameError && <p id="username-error" className="login-field-error" role="alert">{usernameError}</p>}
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/45"
          >
            Şifre
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(null);
            }}
            disabled={loading}
            className={inputClass}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? "password-error" : undefined}
            placeholder="kalbindeki tarih"
          />
          {passwordError && <p id="password-error" className="login-field-error" role="alert">{passwordError}</p>}
        </div>

        {error && (
          <p
            className="login-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-[#0F172A] sm:py-4 sm:text-base",
            "bg-gradient-to-r from-[#c9a7f5] via-[#eadbff] to-[#a98ad4]",
            "shadow-lg transition-shadow hover:shadow-[0_0_20px_rgba(201,167,245,0.35)]",
            "disabled:opacity-70"
          )}
        >
          {loading ? (
            <>
              <Loader2
                className="h-5 w-5 shrink-0 animate-spin text-[#0F172A]/80"
                aria-hidden
              />
              <span>Kalpler birleşiyor...</span>
            </>
          ) : (
            "Giriş yap"
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
