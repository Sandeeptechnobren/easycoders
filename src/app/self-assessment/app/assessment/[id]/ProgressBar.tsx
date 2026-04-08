export default function ProgressBar({ current, total }: any) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div
      style={{
        padding: '10px 28px',
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {/* Bar */}
      <div
        style={{
          flex: 1,
          height: 8,
          background: '#e2e8f0',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background:
              percent === 100
                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                : 'linear-gradient(90deg, #4f46e5, #7c3aed)',
            borderRadius: 999,
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: percent === 100 ? '#16a34a' : '#4f46e5',
          }}
        >
          {current}/{total}
        </span>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>answered</span>
        {percent > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: percent === 100 ? '#dcfce7' : '#ede9fe',
              color: percent === 100 ? '#16a34a' : '#7c3aed',
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            {percent}%
          </span>
        )}
      </div>
    </div>
  );
}
