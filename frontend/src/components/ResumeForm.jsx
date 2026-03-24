function countCharacters(text) {
  return text.replace(/\s+/g, "").length;
}

export default function ResumeForm({
  resumeText,
  setResumeText,
  jdText,
  setJdText,
  style,
  setStyle,
  styleOptions,
  styleCopy,
  styleLabels,
  onCopyAll,
  onExportMarkdown,
  onExportPdf,
  onOptimize,
  submitting,
}) {
  const stats = [
    { label: "简历字数", value: countCharacters(resumeText) },
    { label: "职位描述字数", value: countCharacters(jdText) },
    { label: "模式数", value: styleOptions.length },
  ];

  return (
    <section className="surface-panel p-6 md:p-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">优化工作区</p>
            <h2 className="section-heading mt-3">原始内容工作区</h2>
            <p className="section-copy mt-3">
              在发起新一轮优化前，先准备原始材料并定义输出风格。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="surface-subtle min-w-[118px] px-4 py-4">
                <p className="metric-label">{item.label}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="field-shell p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="field-label">原始简历</p>
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">当前简历草稿</h3>
              </div>
              <span className="status-pill status-pill-soft">{countCharacters(resumeText)} 字</span>
            </div>
            <p className="mb-4 text-sm leading-6 text-slate-600">粘贴你希望针对下一目标岗位进行优化的当前版本。</p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={12}
              placeholder="请粘贴你的简历内容..."
              className="textarea-base"
            />
          </div>

          <div className="field-shell p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="field-label">目标岗位</p>
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">职位描述摘要</h3>
              </div>
              <span className="status-pill status-pill-soft">{countCharacters(jdText)} 字</span>
            </div>
            <p className="mb-4 text-sm leading-6 text-slate-600">粘贴完整岗位描述或要求，方便优化时对齐措辞与重点。</p>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={12}
              placeholder="请粘贴目标职位描述..."
              className="textarea-base"
            />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="surface-subtle p-5 md:p-6">
            <p className="section-kicker">输出内容</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">分享或导出当前工作区结果</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              让最新优化结果可随时带走，不打断主编辑流程。
            </p>
            <div className="mt-5 grid gap-3">
              <button onClick={onCopyAll} className="btn-secondary w-full justify-between px-4">
                <span>复制全部结果</span>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">剪贴板</span>
              </button>
              <button onClick={onExportMarkdown} className="btn-secondary w-full justify-between px-4">
                <span>导出 Markdown</span>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">.md</span>
              </button>
              <button onClick={onExportPdf} className="btn-secondary w-full justify-between px-4">
                <span>导出 PDF</span>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">.pdf</span>
              </button>
            </div>
          </div>

          <div className="surface-subtle p-5 md:p-6">
            <p className="section-kicker">工作流控制</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">操作中心</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              将导出、模式选择与运行控制放在一起，让常见桌面宽度下的工作区保持紧凑。
            </p>

            <div className="mt-5 min-w-0">
              <label className="field-label">优化模式</label>
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3" role="group" aria-label="优化模式">
                {styleOptions.map((option) => {
                  const isActive = style === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStyle(option)}
                      aria-label={styleLabels?.[option] || option}
                      aria-pressed={isActive}
                      className={`style-toggle h-full ${isActive ? "style-toggle-active" : ""}`}
                    >
                      <span className="block text-sm font-semibold text-current">{styleLabels?.[option] || option}</span>
                      <span className="mt-2 block text-xs leading-6 text-current/75">{styleCopy?.[option] || "定向改写模式。"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <div className="surface-subtle p-5 md:p-6">
            <p className="field-label">已选模式</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{styleLabels?.[style] || style}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{styleCopy?.[style] || "定向改写模式。"}</p>
          </div>

          <div className="rounded-[24px] bg-slate-950 px-5 py-5 text-white md:px-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <p className="field-label text-slate-400">就绪检查</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">发起新一轮优化</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  当前原始内容和所选模式将被提交，现有 API 流程不会发生变化。
                </p>
              </div>
              <button
                type="button"
                onClick={onOptimize}
                disabled={submitting}
                className="btn-primary min-w-[220px] w-full lg:w-auto"
              >
                {submitting ? "优化中..." : "开始优化"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
