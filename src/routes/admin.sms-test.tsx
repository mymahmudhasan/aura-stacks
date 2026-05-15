import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageSquare, CheckCircle2, XCircle, ArrowLeft, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendTestSms } from "@/lib/phone-otp-test.functions";

export const Route = createFileRoute("/admin/sms-test")({
  component: SmsTestPage,
  head: () => ({
    meta: [
      { title: "SMS Test — NovaTrad.Ai Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Result = Awaited<ReturnType<typeof sendTestSms>>;

function SmsTestPage() {
  const sendFn = useServerFn(sendTestSms);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  const normalize = (raw: string) => {
    const p = raw.replace(/[\s-()]/g, "");
    return p.startsWith("+") ? p : `+${p}`;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const to = normalize(phone);
    if (!/^\+[1-9]\d{6,14}$/.test(to)) {
      setError("Enter a valid phone number in international format, e.g. +14155552671");
      return;
    }
    setLoading(true);
    try {
      const r = await sendFn({ data: { phone: to } });
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-[80vh] px-5 py-16">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-[image:var(--gradient-aurora)]" />
      <div className="relative max-w-2xl mx-auto">
        <Link
          to="/admin"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-3 h-3" /> Admin
        </Link>

        <div className="glass-strong rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">SMS Delivery Test</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Sends a sample 6-digit code via Twilio and reports each step. Admin only.
          </p>

          {authed === false && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
              You must be signed in as an admin to use this tool.{" "}
              <Link to="/login" className="text-primary underline">
                Sign in
              </Link>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Recipient phone (E.164)</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl bg-input/50 border border-border focus-within:border-primary px-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <input
                  required
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+14155552671"
                  className="flex-1 py-3 bg-transparent outline-none text-sm font-mono"
                />
              </div>
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              disabled={loading || authed === false}
              className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send test SMS
            </button>
          </form>

          {result && <ResultPanel result={result} />}

          <div className="mt-6 text-xs text-muted-foreground space-y-1">
            <p>Trial Twilio accounts can only send to verified caller IDs.</p>
            <p>SMS charges apply per Twilio's pricing for the destination country.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultPanel({ result }: { result: Result }) {
  const ok = result.ok;
  return (
    <div
      className={`mt-6 rounded-2xl border p-5 ${
        ok ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {ok ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <XCircle className="w-5 h-5 text-destructive" />
        )}
        <h2 className="font-semibold">
          {ok ? "Sent successfully" : `Failed at: ${result.stage}`}
        </h2>
      </div>
      {!ok && <p className="text-sm mb-3">{result.message}</p>}

      <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-xs font-mono">
        {ok && (
          <>
            <dt className="text-muted-foreground">Sent code</dt>
            <dd className="text-foreground tracking-widest">{result.sentCode}</dd>
            <dt className="text-muted-foreground">Twilio SID</dt>
            <dd className="break-all">{result.sid ?? "—"}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{result.status ?? "—"}</dd>
            <dt className="text-muted-foreground">To</dt>
            <dd>{result.to ?? "—"}</dd>
            <dt className="text-muted-foreground">From</dt>
            <dd>{result.from ?? "—"}</dd>
          </>
        )}
        {"latency_ms" in result && result.latency_ms !== undefined && (
          <>
            <dt className="text-muted-foreground">Latency</dt>
            <dd>{result.latency_ms} ms</dd>
          </>
        )}
        {!ok && "twilioCode" in result && result.twilioCode !== undefined && (
          <>
            <dt className="text-muted-foreground">Twilio code</dt>
            <dd>{result.twilioCode}</dd>
          </>
        )}
        {!ok && "moreInfo" in result && result.moreInfo && (
          <>
            <dt className="text-muted-foreground">More info</dt>
            <dd>
              <a href={result.moreInfo} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                {result.moreInfo}
              </a>
            </dd>
          </>
        )}
      </dl>

      {"env" in result && result.env && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-1">Environment check</p>
          <ul className="text-xs space-y-0.5">
            {Object.entries(result.env).map(([k, v]) => (
              <li key={k} className="font-mono">
                <span className={v ? "text-success" : "text-destructive"}>{v ? "✓" : "✗"}</span>{" "}
                {k}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
