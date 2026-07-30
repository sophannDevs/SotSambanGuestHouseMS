"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const t = useTranslations("auth");

  const [email, setEmail] = React.useState("owner@sotsamban.local");
  const [password, setPassword] = React.useState("password123");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const DEMO_ACCOUNTS = [
    { role: t("demoRoles.owner"), email: "owner@sotsamban.local", desc: t("demoDescriptions.owner") },
    { role: t("demoRoles.manager"), email: "manager@sotsamban.local", desc: t("demoDescriptions.manager") },
    { role: t("demoRoles.receptionist"), email: "receptionist@sotsamban.local", desc: t("demoDescriptions.receptionist") },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data) {
        const { userId, propertyId, email: userEmail, displayName, roles, permissions, accessToken, refreshToken } = data.data;

        setSession(
          { userId, propertyId, email: userEmail, displayName, roles, permissions },
          accessToken,
          refreshToken
        );

        toast.success(t("welcomeBack", { name: displayName }));
        router.push("/dashboard");
      } else {
        const msg = data.message || t("invalidCredentials");
        setError(msg);
        toast.error(msg);
      }
    } catch {
      // Fallback demo login for offline local preview if API is not running
      const isOwner = email.includes("owner");
      const isManager = email.includes("manager");

      const demoRoles = isOwner ? ["OWNER"] : isManager ? ["MANAGER"] : ["RECEPTIONIST"];
      const demoPermissions = isOwner
        ? ["dashboard:view", "booking:view", "staff:view", "settings:view"]
        : isManager
        ? ["dashboard:view", "booking:view", "settings:view"]
        : ["dashboard:view", "booking:view"];

      setSession(
        {
          userId: "b0000000-0000-0000-0000-000000000001",
          propertyId: "a0000000-0000-0000-0000-000000000001",
          email,
          displayName: isOwner ? "Sot Samban (Owner)" : isManager ? "Channa Manager" : "Bopha Receptionist",
          roles: demoRoles,
          permissions: demoPermissions,
        },
        "demo-local-access-token",
        "demo-local-refresh-token"
      );

      toast.success(t("offlineSignIn"));
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-3 text-center">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mx-auto">
          <Home className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("brandTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("brandSubtitle")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("emailLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@sotsamban.local"
                  className="w-full h-11 pl-10 pr-4 text-sm bg-muted/40 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("passwordLabel")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-4 text-sm bg-muted/40 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                />
                <span>{t("rememberMe")}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <span>{t("signingIn")}</span>
              ) : (
                <>
                  <span>{t("signIn")}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="pt-4 border-t border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {t("quickDemoAccounts")}
              </span>
              <span className="text-[10px] text-muted-foreground">{t("demoPassword")}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword("password123");
                  }}
                  className="p-2.5 rounded-xl bg-muted/40 hover:bg-accent border border-border/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground group-hover:text-primary">
                    <span>{acc.role}</span>
                    <UserCheck className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
