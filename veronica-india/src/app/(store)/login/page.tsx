"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { backend, BackendAuthError } from "@/lib/backend";
import { useCartStore } from "@/store/cartStore";

function LoginFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") || "/";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [digits, setDigits] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const phone = `+91${digits}`;

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendOtp = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await backend.sendOtp(phone);
      setStep("otp");
      setResendIn(45); // resend unlocks after a 45s countdown
    } catch (err) {
      if (err instanceof BackendAuthError && err.status === 429) {
        setError("Too many attempts. Try again in a minute.");
      } else {
        setError("Couldn’t send the code. Check the number and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [phone, router]);

  async function verify(submittedCode?: string) {
    const otp = submittedCode ?? code;
    if (otp.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      await backend.verifyOtp(phone, otp);
      await useCartStore.getState().syncWithServer(); // merge guest cart into server
      router.replace(returnTo);
    } catch (err) {
      if (err instanceof BackendAuthError && err.status === 401) {
        setError("That code isn’t right. Try again.");
        setCode("");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-black">
          Sign in to <span className="text-brand-orange">Veronica</span>
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {step === "phone" ? "We’ll text you a one-time code" : `Code sent to ${phone}`}
        </p>
      </div>

      {step === "phone" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (digits.length === 10) sendOtp();
          }}
          className="space-y-4"
        >
          <div>
            <label className="input-label">Phone number</label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-3 rounded-xl bg-surface-dim text-text-secondary font-semibold text-sm">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoFocus
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number"
                className="input flex-1"
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger font-medium">{error}</p>}

          <button
            type="submit"
            disabled={digits.length !== 10 || loading}
            className="btn btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Continue"}
          </button>

          <Link href="/" className="block text-center text-sm text-text-muted hover:text-brand-black">
            Continue as guest
          </Link>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 6) verify();
          }}
          className="space-y-4"
        >
          <OtpInput value={code} onChange={setCode} onComplete={(c) => verify(c)} />

          {error && <p className="text-sm text-danger font-medium text-center">{error}</p>}

          <button
            type="submit"
            disabled={code.length !== 6 || loading}
            className="btn btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Verify & continue"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError("");
              }}
              className="flex items-center gap-1 text-text-muted hover:text-brand-black"
            >
              <ArrowLeft size={14} /> Change number
            </button>
            <button
              type="button"
              disabled={resendIn > 0 || loading}
              onClick={sendOtp}
              className="text-brand-orange font-medium disabled:text-text-muted"
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
            </button>
          </div>

          <p className="text-center text-[11px] text-text-muted">
            We’ll try to autofill from SMS on supported phones.
          </p>
        </form>
      )}
    </div>
  );
}

/** 6-box OTP input: auto-advance, backspace, full-code paste, SMS autofill. */
function OtpInput({
  value,
  onChange,
  onComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: (code: string) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setChar(i: number, char: string) {
    const next = (value.slice(0, i) + char + value.slice(i + 1)).slice(0, 6);
    onChange(next);
    if (char && i < 5) refs.current[i + 1]?.focus();
    if (next.length === 6) onComplete(next);
  }

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[i] ?? ""}
          autoFocus={i === 0}
          onChange={(e) => setChar(i, e.target.value.replace(/\D/g, "").slice(-1))}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (pasted) {
              onChange(pasted);
              if (pasted.length === 6) onComplete(pasted);
              else refs.current[pasted.length]?.focus();
            }
          }}
          className="w-11 h-12 text-center text-lg font-bold input px-0"
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <LoginFlow />
    </Suspense>
  );
}
