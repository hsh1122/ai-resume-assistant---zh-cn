export default function AuthPanel({
  authMode,
  setAuthMode,
  authUsername,
  setAuthUsername,
  authPassword,
  setAuthPassword,
  onSubmit,
  authSubmitting,
}) {
  const heading = authMode === "login" ? "Login" : "Create account";
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <section className="surface-panel mx-auto grid w-full max-w-5xl gap-6 overflow-hidden p-6 md:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.8fr)] md:p-8">
      <div className="surface-command flex flex-col justify-between gap-6 p-6 md:p-8">
        <div className="space-y-4">
          <span className="status-pill">AI Resume Assistant</span>
          <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
            Ship better resume versions from one secure workspace.
          </h2>
          <p className="max-w-md text-sm leading-7 text-slate-600">
            Sign in to restore saved optimizations, run targeted rewrites, and keep each application version organized.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="metric-card">
            <p className="metric-label">History</p>
            <p className="metric-value text-slate-950">Tracked</p>
            <p className="metric-detail text-slate-600">Every saved run stays accessible.</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Outputs</p>
            <p className="metric-value text-slate-950">Structured</p>
            <p className="metric-detail text-slate-600">Resume, analysis, and suggestions together.</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Access</p>
            <p className="metric-value text-slate-950">Per User</p>
            <p className="metric-detail text-slate-600">Personal workspace with record isolation.</p>
          </div>
        </div>
      </div>

      <div className="p-1 md:p-2">
        <div className="mb-6">
          <p className="section-kicker">Secure Access</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{heading}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">Access your history and continue from the latest workspace state.</p>
        </div>

        <div className="surface-subtle mt-6 inline-flex w-full gap-2 p-1.5">
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
              authMode === "login" ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("register")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
              authMode === "register" ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Register
          </button>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div>
            <label htmlFor="auth-username" className="field-label">Username</label>
            <input
              id="auth-username"
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Username (3+ chars)"
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="field-label">Password</label>
            <input
              id="auth-password"
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Password (6+ chars)"
              className="input-base"
            />
          </div>
          <button
            type="submit"
            disabled={authSubmitting}
            className="btn-primary mt-6 w-full"
          >
            {authSubmitting ? "Submitting..." : authMode === "login" ? "Login" : "Register"}
          </button>
        </form>
      </div>
    </section>
  );
}
