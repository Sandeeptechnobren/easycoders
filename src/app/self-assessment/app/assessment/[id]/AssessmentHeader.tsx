export default function AssessmentHeader({ title, timeLeft, onSubmit }: any) {
  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  const isUrgent = timeLeft > 0 && timeLeft <= 300;
  const isCritical = timeLeft > 0 && timeLeft <= 60;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: '#fff',
        padding: '0 28px',
        height: 68,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Left: icon + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          📋
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Assessment
          </p>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: 0,
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 420,
            }}
          >
            {title}
          </h2>
        </div>
      </div>

      {/* Right: timer + submit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {/* Timer pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: isCritical
              ? 'rgba(239,68,68,0.25)'
              : isUrgent
              ? 'rgba(249,115,22,0.2)'
              : 'rgba(255,255,255,0.1)',
            border: `1px solid ${isCritical ? 'rgba(239,68,68,0.5)' : isUrgent ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.18)'}`,
            padding: '8px 16px',
            borderRadius: 12,
            transition: 'all 0.3s',
          }}
        >
          <span style={{ fontSize: 14 }}>⏱</span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: 2,
              color: isCritical ? '#fca5a5' : isUrgent ? '#fdba74' : '#fff',
              transition: 'color 0.3s',
            }}
          >
            {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
          </span>
        </div>

        {/* Submit button */}
        <button
          onClick={onSubmit}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            border: 'none',
            padding: '9px 22px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            letterSpacing: '0.02em',
            boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(239,68,68,0.4)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(239,68,68,0.3)';
          }}
        >
          Submit Assessment
        </button>
      </div>
    </div>
  );
}
