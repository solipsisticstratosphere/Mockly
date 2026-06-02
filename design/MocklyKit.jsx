/* global React */
// Mockly UI Kit — components built on the Mobile UI Kit tokens (colors_and_type.css)
// Deep-navy primary (#1B448B), emphasis blue (#0159A6), green success (#1E8A4C),
// cool neutrals, Mulish type. Flat surfaces, navy hero. Score scale red→amber→green.

const { useState, useEffect, useRef } = React;

const M = {
  blue700: '#0159A6',
  blue800: '#1B448B',
  blue900: '#122F61',
  green: '#1E8A4C',
  greenSoft: 'rgba(30,138,76,0.12)',
  amber: '#C9821B',
  red: '#C0312B',
  white: '#FFFFFF',
  n10: '#FDFDFD',
  n20: '#ECF1F6',
  n30: '#E3E9ED',
  n40: '#D1D8DD',
  n70: '#78828A',
  n100: '#1F2C37',
  font: "'Mulish', 'Proxima Nova', -apple-system, system-ui, sans-serif",
};

// Score → color on the 0–10 rubric
function scoreColor(s) {
  if (s == null) return M.n70;
  if (s >= 7.5) return M.green;
  if (s >= 5) return M.amber;
  return M.red;
}
function scoreLabel(s) {
  if (s == null) return '—';
  if (s >= 8.5) return 'Excellent';
  if (s >= 7) return 'Strong';
  if (s >= 5) return 'Developing';
  if (s >= 3) return 'Needs work';
  return 'Weak';
}

// ─── Icon ─────────────────────────────────────────────────────
function Icon({ name, size = 22, color = 'currentColor', stroke = 1.75, fill = false }) {
  const paths = {
    home: <><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></>,
    chart: <><line x1="6" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/></>,
    history: <><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
    chevR: <><polyline points="9 6 15 12 9 18"/></>,
    chevL: <><polyline points="15 6 9 12 15 18"/></>,
    chevDown: <><polyline points="6 9 12 15 18 9"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    minus: <><line x1="5" y1="12" x2="19" y2="12"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    arrowUp: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    mic: <><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></>,
    message: <><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    code: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    flame: <><path d="M12 2c1 3-1.5 4.5-1.5 7A3.5 3.5 0 0 0 14 12c.5-1 .3-2.2-.2-3 2 1 3.2 3.1 3.2 5.5a5 5 0 1 1-10 0c0-3.2 2.4-4.8 3-7.5.3-1.3.2-2.8 0-5z"/></>,
    sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></>,
    play: <><polygon points="6 4 20 12 6 20 6 4"/></>,
    skip: <><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    trend: <><polyline points="3 17 9 11 13 15 21 7"/><polyline points="21 12 21 7 16 7"/></>,
    award: <><circle cx="12" cy="8" r="6"/><path d="M8.2 13.5L7 22l5-3 5 3-1.2-8.5"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></>,
    moon: <><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    refresh: <><polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={fill ? color : 'none'} stroke={fill ? 'none' : color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      {paths[name] || null}
    </svg>
  );
}

// ─── Button ───────────────────────────────────────────────────
function Button({ variant = 'primary', size = 'md', children, onClick, disabled, full, leadingIcon, trailingIcon, style }) {
  const [pressed, setPressed] = useState(false);
  const sizes = { sm: { h: 36, padX: 14, fs: 14 }, md: { h: 48, padX: 20, fs: 16 }, lg: { h: 54, padX: 24, fs: 17 } };
  const s = sizes[size];
  const variants = {
    primary:   { bg: pressed ? M.blue900 : M.blue800, color: M.white, border: 'transparent' },
    secondary: { bg: pressed ? M.n20 : M.white, color: M.blue800, border: M.n40 },
    ghost:     { bg: pressed ? M.n20 : 'transparent', color: M.blue700, border: 'transparent' },
    success:   { bg: pressed ? '#176E3D' : M.green, color: M.white, border: 'transparent' },
    light:     { bg: pressed ? 'rgba(255,255,255,0.85)' : M.white, color: M.blue800, border: 'transparent' },
  };
  const v = variants[variant];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: s.h, padding: `0 ${s.padX}px`,
        borderRadius: 8, border: `1.5px solid ${v.border}`,
        background: v.bg, color: v.color,
        fontFamily: M.font, fontWeight: 600, fontSize: s.fs, lineHeight: 1, whiteSpace: 'nowrap',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        width: full ? '100%' : undefined,
        transition: 'background 180ms cubic-bezier(0.22,1,0.36,1), transform 120ms',
        transform: pressed && !disabled ? 'scale(0.985)' : 'none',
        ...style,
      }}>
      {leadingIcon && <Icon name={leadingIcon} size={18} color={v.color} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={18} color={v.color} />}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────
function Card({ children, padding = 16, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: M.white, borderRadius: 12, border: `1px solid ${M.n30}`,
      padding, cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────
function SectionHeader({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 8px' }}>
      <div style={{ fontFamily: M.font, fontWeight: 600, fontSize: 12, lineHeight: '16px', textTransform: 'uppercase', letterSpacing: '0.06em', color: M.n70 }}>{children}</div>
      {action}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────
function Badge({ tone = 'neutral', children, style }) {
  const map = {
    neutral: { bg: M.n30, fg: M.n100 },
    info:    { bg: M.n20, fg: M.blue800 },
    success: { bg: M.greenSoft, fg: M.green },
    amber:   { bg: 'rgba(201,130,27,0.14)', fg: M.amber },
    red:     { bg: 'rgba(192,49,43,0.12)', fg: M.red },
    outline: { bg: 'transparent', fg: M.n100, border: M.n40 },
    onDark:  { bg: 'rgba(255,255,255,0.16)', fg: M.white },
  };
  const m = map[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 10px',
      borderRadius: 999, background: m.bg, color: m.fg,
      border: m.border ? `1px solid ${m.border}` : 'none',
      fontFamily: M.font, fontWeight: 700, fontSize: 11, lineHeight: 1, letterSpacing: '0.02em',
      ...style,
    }}>{children}</span>
  );
}

// ─── Chip ─────────────────────────────────────────────────────
function Chip({ active, onClick, children, icon }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px',
      borderRadius: 999, background: active ? M.blue800 : M.white,
      color: active ? M.white : M.n100, border: `1px solid ${active ? M.blue800 : M.n40}`,
      fontFamily: M.font, fontWeight: 600, fontSize: 13, cursor: 'pointer',
      whiteSpace: 'nowrap', transition: 'all 160ms', flexShrink: 0,
    }}>
      {icon && <Icon name={icon} size={15} color={active ? M.white : M.n70} />}
      {children}
    </button>
  );
}

// ─── ListRow ──────────────────────────────────────────────────
function ListRow({ icon, iconTone = 'neutral', title, sub, meta, metaTone = 'fg', onClick, last, trailing }) {
  const iconBg = iconTone === 'success' ? M.greenSoft : iconTone === 'accent' ? 'rgba(1,89,166,0.10)' : iconTone === 'amber' ? 'rgba(201,130,27,0.12)' : M.n20;
  const iconColor = iconTone === 'success' ? M.green : iconTone === 'accent' ? M.blue700 : iconTone === 'amber' ? M.amber : M.blue800;
  const metaColor = metaTone === 'success' ? M.green : metaTone === 'muted' ? M.n70 : metaTone === 'amber' ? M.amber : M.n100;
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
      borderBottom: last ? 'none' : `1px solid ${M.n30}`,
      cursor: onClick ? 'pointer' : 'default', background: M.white,
    }}>
      {icon && (
        <div style={{ width: 38, height: 38, borderRadius: 9, background: iconBg, color: iconColor, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name={icon} size={19} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: M.font, fontSize: 15, fontWeight: 600, color: M.n100, lineHeight: 1.3 }}>{title}</div>
        {sub && <div style={{ fontFamily: M.font, fontSize: 13, color: M.n70, marginTop: 2, lineHeight: 1.3 }}>{sub}</div>}
      </div>
      {trailing != null ? trailing : (
        <>
          {meta != null && <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 14, color: metaColor, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{meta}</div>}
          {onClick && meta == null && <Icon name="chevR" size={16} color={M.n70} />}
        </>
      )}
    </div>
  );
}

// ─── ScoreRing — circular progress (0–100 or 0–10) ────────────
function ScoreRing({ value, max = 100, size = 132, stroke = 11, label, sub, color, animate = true }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const [draw, setDraw] = useState(animate ? 0 : pct);
  useEffect(() => {
    if (!animate) { setDraw(pct); return; }
    const id = requestAnimationFrame(() => setDraw(pct));
    return () => cancelAnimationFrame(id);
  }, [pct, animate]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ringColor = color || M.blue700;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringColor} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - draw)}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {label}
        {sub}
      </div>
    </div>
  );
}

// ─── ScoreBar — horizontal sub-score bar (0–10) ───────────────
function ScoreBar({ label, value, animate = true }) {
  const pct = Math.max(0, Math.min(1, value / 10));
  const [draw, setDraw] = useState(animate ? 0 : pct);
  useEffect(() => {
    if (!animate) { setDraw(pct); return; }
    const id = setTimeout(() => setDraw(pct), 60);
    return () => clearTimeout(id);
  }, [pct, animate]);
  const col = scoreColor(value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: M.font, fontSize: 13, fontWeight: 600, color: M.n100 }}>{label}</span>
        <span style={{ fontFamily: M.font, fontSize: 13, fontWeight: 700, color: col, fontVariantNumeric: 'tabular-nums' }}>{value.toFixed(1)}</span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: M.n20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${draw * 100}%`, borderRadius: 999, background: col, transition: 'width 800ms cubic-bezier(0.22,1,0.36,1)' }} />
      </div>
    </div>
  );
}

// ─── TabBar — Mockly 4 tabs + center start (FAB-in-bar) ───────
function TabBar({ active, onChange, onStart }) {
  const left = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'history', label: 'History', icon: 'history' },
  ];
  const right = [
    { id: 'analytics', label: 'Progress', icon: 'chart' },
    { id: 'profile', label: 'Profile', icon: 'user' },
  ];
  const tabBtn = (t) => {
    const on = active === t.id;
    return (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px',
        color: on ? M.blue700 : M.n70, fontFamily: M.font, fontWeight: 600, fontSize: 11,
      }}>
        <Icon name={t.icon} size={23} color={on ? M.blue700 : M.n70} stroke={on ? 2.1 : 1.75} />
        <span>{t.label}</span>
      </button>
    );
  };
  return (
    <div style={{
      borderTop: `1px solid ${M.n30}`, background: M.white, padding: '8px 8px 24px',
      display: 'flex', alignItems: 'center', boxShadow: '0 -2px 10px rgba(31,44,55,0.05)', position: 'relative',
    }}>
      {left.map(tabBtn)}
      <div style={{ width: 76, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <button onClick={onStart} aria-label="Start interview" style={{
          width: 58, height: 58, borderRadius: 999, background: M.blue800, border: '4px solid ' + M.white,
          marginTop: -34, cursor: 'pointer', display: 'grid', placeItems: 'center',
          boxShadow: '0 6px 16px rgba(27,68,139,0.4)',
        }}>
          <Icon name="play" size={22} color={M.white} fill />
        </button>
      </div>
      {right.map(tabBtn)}
    </div>
  );
}

Object.assign(window, {
  M, scoreColor, scoreLabel,
  Icon, Button, Card, SectionHeader, Badge, Chip, ListRow,
  ScoreRing, ScoreBar, TabBar,
});
