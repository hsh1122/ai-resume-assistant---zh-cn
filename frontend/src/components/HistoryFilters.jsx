export default function HistoryFilters({
  searchKeyword,
  setSearchKeyword,
  historyStyleFilter,
  setHistoryStyleFilter,
  allStyle,
  styleOptions,
  onApplyFilters,
}) {
  return (
    <div className="surface-subtle mb-5 grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr),220px,auto]">
      <div>
        <label className="field-label">Search</label>
        <input
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Search resume, JD, or analysis keywords..."
          className="input-base"
        />
      </div>
      <div>
        <label className="field-label">Style</label>
        <select
          value={historyStyleFilter}
          onChange={(e) => setHistoryStyleFilter(e.target.value)}
          className="select-base w-full"
        >
          <option value={allStyle}>{allStyle}</option>
          {styleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <button type="button" onClick={onApplyFilters} className="btn-secondary w-full lg:w-auto">
          Apply
        </button>
      </div>
    </div>
  );
}
