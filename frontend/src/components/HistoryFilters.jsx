export default function HistoryFilters({
  searchKeyword,
  setSearchKeyword,
  historyStyleFilter,
  setHistoryStyleFilter,
  allStyle,
  allStyleLabel,
  styleOptions,
  styleLabels,
  onApplyFilters,
}) {
  return (
    <div className="surface-subtle mb-5 grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr),220px,auto]">
      <div>
        <label className="field-label">搜索</label>
        <input
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="搜索简历、职位描述或分析关键词..."
          className="input-base"
        />
      </div>
      <div>
        <label className="field-label">模式</label>
        <select
          value={historyStyleFilter}
          onChange={(e) => setHistoryStyleFilter(e.target.value)}
          className="select-base w-full"
        >
          <option value={allStyle}>{allStyleLabel || allStyle}</option>
          {styleOptions.map((option) => (
            <option key={option} value={option}>
              {styleLabels?.[option] || option}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <button type="button" onClick={onApplyFilters} className="btn-secondary w-full lg:w-auto">
          应用筛选
        </button>
      </div>
    </div>
  );
}
