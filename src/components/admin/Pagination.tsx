interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, pageSize, onChange }: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <span className="text-sm text-gray-400">
        {from}–{to} trong số <strong className="text-gray-600 font-semibold">{total}</strong> kết quả
      </span>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={() => onChange(page - 1)} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            ←
          </button>

          {start > 1 && (
            <>
              <button onClick={() => onChange(1)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">1</button>
              {start > 2 && <span className="text-gray-400 px-1 text-sm">…</span>}
            </>
          )}

          {pages.map((p) => (
            <button key={p} onClick={() => onChange(p)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
              style={p === page
                ? { backgroundColor: "#1a5276", color: "#fff", borderColor: "#1a5276" }
                : { backgroundColor: "#fff", color: "#4b5563", borderColor: "#e5e7eb" }}>
              {p}
            </button>
          ))}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="text-gray-400 px-1 text-sm">…</span>}
              <button onClick={() => onChange(totalPages)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">{totalPages}</button>
            </>
          )}

          <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            →
          </button>
        </div>
      )}
    </div>
  );
}
