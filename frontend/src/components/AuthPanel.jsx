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
  const heading = authMode === "login" ? "登录" : "创建账户";
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
          <span className="status-pill">智能简历助手</span>
          <h2 className="font-display text-4xl leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
            在一个安全工作区里产出更好的简历版本。
          </h2>
          <p className="max-w-md text-sm leading-7 text-slate-600">
            登录后即可恢复已保存的优化结果、执行定向改写，并整理每个投递版本。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="metric-card">
            <p className="metric-label">历史记录</p>
            <p className="metric-value text-slate-950">已追踪</p>
            <p className="metric-detail text-slate-600">每次保存的运行记录都可随时访问。</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">输出结果</p>
            <p className="metric-value text-slate-950">已结构化</p>
            <p className="metric-detail text-slate-600">简历、分析与建议集中呈现。</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">访问方式</p>
            <p className="metric-value text-slate-950">按用户隔离</p>
            <p className="metric-detail text-slate-600">个人工作区与记录彼此隔离。</p>
          </div>
        </div>
      </div>

      <div className="p-1 md:p-2">
        <div className="mb-6">
          <p className="section-kicker">安全访问</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{heading}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">查看历史记录，并从最近一次工作区状态继续。</p>
        </div>

        <div className="surface-subtle mt-6 inline-flex w-full gap-2 p-1.5">
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
              authMode === "login" ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("register")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
              authMode === "register" ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            注册
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
            <label htmlFor="auth-username" className="field-label">用户名</label>
            <input
              id="auth-username"
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="用户名（至少 3 个字符）"
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="field-label">密码</label>
            <input
              id="auth-password"
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="密码（至少 6 个字符）"
              className="input-base"
            />
          </div>
          <button
            type="submit"
            disabled={authSubmitting}
            className="btn-primary mt-6 w-full"
          >
            {authSubmitting ? "提交中..." : authMode === "login" ? "登录" : "注册"}
          </button>
        </form>
      </div>
    </section>
  );
}
