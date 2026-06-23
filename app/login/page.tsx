import { signInWithGoogle } from "@/lib/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(68,71,72,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(68,71,72,0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded border border-outline-variant flex items-center justify-center bg-surface-container-low">
            <span className="material-symbols-outlined text-on-surface" style={{ fontSize: 20 }}>hub</span>
          </div>
          <div className="text-center">
            <h1 className="text-headline-sm font-headline-sm text-on-surface tracking-tight">SYNAPSE OS</h1>
            <p className="text-mono-label font-mono-label text-on-surface-variant mt-1 uppercase tracking-widest">
              Mission Control · v2.4.1
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="glass-panel w-full p-8">
          <div className="mb-6">
            <p className="text-mono-label font-mono-label text-on-surface-variant uppercase tracking-widest mb-1">
              // AUTHENTICATION
            </p>
            <h2 className="text-on-surface text-sm font-medium">Sign in to your workspace</h2>
          </div>

          {params.error && (
            <div className="mb-4 px-3 py-2 rounded border border-error/30 bg-error/10 text-xs text-error font-mono-label">
              {params.error}
            </div>
          )}

          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded border border-outline-variant bg-surface-container px-4 py-3 text-mono-label font-mono-label text-on-surface hover:bg-surface-container-high hover:border-outline transition-all"
            >
              <GoogleIcon />
              CONTINUE WITH GOOGLE
            </button>
          </form>

          <p className="text-center text-on-surface-variant/50 text-[10px] font-mono-label mt-5 uppercase tracking-wide">
            Secure · Encrypted · Private
          </p>
        </div>

        <p className="text-on-surface-variant/40 text-[10px] font-mono-label uppercase tracking-widest">
          © 2024 Synapse OS · All rights reserved
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
