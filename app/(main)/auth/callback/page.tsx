"use client";

import { Suspense, useEffect, useState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeOAuthLogin, useAuth } from "@/lib/context/auth-context";
import { useI18n } from "@/lib/context/i18n-context";
import { PageTitle } from "@/components/ui/PageTitle";

function AuthCallbackInner() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { applySession } = useAuth();
  const [error, setError] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError || !code) {
      startTransition(() => setError(true));
      return;
    }

    let cancelled = false;
    completeOAuthLogin(code, state)
      .then((user) => {
        if (cancelled) return;
        applySession(user);
        router.replace("/");
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, applySession]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => router.replace("/"), 2000);
    return () => window.clearTimeout(timer);
  }, [error, router]);

  return (
    <>
      <PageTitle>{t.nav.signIn}</PageTitle>
      <div className="auth-callback">
        {error ? (
          <p className="auth-callback__error">{t.auth.failed}</p>
        ) : (
          <>
            <div className="auth-callback__spinner" aria-hidden="true" />
            <p className="auth-callback__text">{t.auth.signingIn}</p>
          </>
        )}
      </div>
    </>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-callback">
          <div className="auth-callback__spinner" aria-hidden="true" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
