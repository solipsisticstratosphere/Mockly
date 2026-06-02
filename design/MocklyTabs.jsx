/* global React, M, Icon, Button, Card, SectionHeader, Badge, Chip, ListRow, ScoreRing, ScoreBar, scoreColor, scoreLabel, MOCK */
// Mockly — main tab screens: Home, History, Analytics (Progress), Profile

// Small helpers ------------------------------------------------
function modeMeta(mode) {
  return { text: { icon: 'message', label: 'Text' }, voice: { icon: 'mic', label: 'Voice' }, rapid: { icon: 'zap', label: 'Rapid' } }[mode] || { icon: 'message', label: 'Text' };
}

// ─── HERO HEADER (shared navy top) ────────────────────────────
function HeroHeader({ children, pad = '16px 20px 24px' }) {
  return (
    <div style={{ background: M.blue800, color: M.white, padding: pad, position: 'relative' }}>
      {children}
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────
function HomeScreen({ onStart, onOpenSession, onTab }) {
  const p = MOCK.profile;
  const recents = MOCK.sessions.slice(0, 3);
  const weakest = [...MOCK.topics].sort((a, b) => a.score - b.score)[0];

  return (
    <div style={{ background: M.n10, minHeight: '100%', paddingBottom: 24 }}>
      <HeroHeader pad="14px 20px 56px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.16)', display: 'grid', placeItems: 'center', fontFamily: M.font, fontWeight: 700, fontSize: 14 }}>{p.initials}</div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1 }}>Good morning</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>{p.name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 34, padding: '0 11px', borderRadius: 999, background: 'rgba(255,255,255,0.14)' }}>
              <Icon name="flame" size={16} color="#FFB454" fill />
              <span style={{ fontFamily: M.font, fontWeight: 700, fontSize: 14 }}>{p.streak}</span>
            </div>
            <button style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.14)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="bell" size={17} color={M.white} /></button>
          </div>
        </div>

        {/* Readiness */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ScoreRing
            value={p.readiness} max={100} size={120} stroke={11} color="#5BC98A"
            label={<span style={{ fontFamily: M.font, fontWeight: 800, fontSize: 34, color: M.white, lineHeight: 1 }}>{p.readiness}</span>}
            sub={<span style={{ fontFamily: M.font, fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>Ready</span>}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: M.font, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7 }}>Interview readiness</div>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: '24px', marginTop: 6 }}>You're getting there for <span style={{ color: '#9FD5FF' }}>{p.level} {p.role}</span> roles.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 13 }}>
              <Icon name="arrowUp" size={14} color="#7BE5A5" />
              <span style={{ color: '#7BE5A5', fontWeight: 700 }}>+{p.readinessDelta}</span>
              <span style={{ opacity: 0.7 }}>this week</span>
            </div>
          </div>
        </div>
      </HeroHeader>

      {/* Start CTA — overlaps hero */}
      <div style={{ padding: '0 16px', marginTop: -36 }}>
        <Card padding={16} style={{ boxShadow: '0 8px 24px rgba(31,44,55,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: 'rgba(1,89,166,0.10)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="sparkle" size={22} color={M.blue700} fill />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 15, color: M.n100 }}>Start a mock interview</div>
              <div style={{ fontFamily: M.font, fontSize: 12.5, color: M.n70, marginTop: 2 }}>AI picks questions for your level</div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Button full size="md" leadingIcon="play" onClick={onStart}>Begin Session</Button>
          </div>
        </Card>
      </div>

      {/* Focus area */}
      <SectionHeader>Today's focus</SectionHeader>
      <div style={{ padding: '0 16px' }}>
        <Card padding={0} onClick={() => onTab('analytics')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: 'rgba(201,130,27,0.12)', display: 'grid', placeItems: 'center', flexShrink: 0, color: M.amber }}>
              <Icon name={weakest.icon} size={21} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: M.font, fontWeight: 700, fontSize: 15, color: M.n100, whiteSpace: 'nowrap' }}>{weakest.name}</span>
                <Badge tone="amber">Weakest</Badge>
              </div>
              <div style={{ fontFamily: M.font, fontSize: 12.5, color: M.n70, marginTop: 3, lineHeight: '17px' }}>Avg {weakest.score.toFixed(1)} across {weakest.count} questions — drill this next</div>
            </div>
            <Icon name="chevR" size={18} color={M.n70} />
          </div>
        </Card>
      </div>

      {/* Recent sessions */}
      <SectionHeader action={<button onClick={() => onTab('history')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: M.font, fontWeight: 600, fontSize: 13, color: M.blue700 }}>See all</button>}>Recent sessions</SectionHeader>
      <div style={{ margin: '0 16px', background: M.white, borderRadius: 12, border: `1px solid ${M.n30}`, overflow: 'hidden' }}>
        {recents.map((s, i) => (
          <SessionRow key={s.id} s={s} last={i === recents.length - 1} onClick={() => onOpenSession(s)} />
        ))}
      </div>
    </div>
  );
}

// Session list row with score pill
function SessionRow({ s, last, onClick }) {
  const mm = modeMeta(s.mode);
  const col = scoreColor(s.score);
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderBottom: last ? 'none' : `1px solid ${M.n30}`, cursor: 'pointer', background: M.white }}>
      <div style={{ width: 38, height: 38, borderRadius: 9, background: M.n20, color: M.blue800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={mm.icon} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: M.font, fontSize: 15, fontWeight: 600, color: M.n100, lineHeight: 1.3 }}>{s.topic}</div>
        <div style={{ fontFamily: M.font, fontSize: 12.5, color: M.n70, marginTop: 2 }}>{mm.label} · {s.questions} questions · {s.date}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ minWidth: 44, height: 30, padding: '0 9px', borderRadius: 8, background: `${col}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <span style={{ fontFamily: M.font, fontWeight: 800, fontSize: 15, color: col, fontVariantNumeric: 'tabular-nums' }}>{s.score.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── HISTORY ──────────────────────────────────────────────────
function HistoryScreen({ onOpenSession }) {
  const [filter, setFilter] = React.useState('all');
  const all = MOCK.sessions;
  const filtered = filter === 'all' ? all : all.filter(s => s.mode === filter);
  const groups = [
    { label: 'Today', items: filtered.filter(s => s.when === 'today') },
    { label: 'Yesterday', items: filtered.filter(s => s.when === 'yesterday') },
    { label: 'Earlier', items: filtered.filter(s => s.when === 'earlier') },
  ].filter(g => g.items.length);

  return (
    <div style={{ background: M.n10, minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ background: M.white, borderBottom: `1px solid ${M.n30}`, padding: '8px 16px 12px' }}>
        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 22, color: M.n100, padding: '4px 0 12px' }}>History</div>
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
          {[['all', 'All'], ['text', 'Text'], ['voice', 'Voice'], ['rapid', 'Rapid']].map(([k, l]) => (
            <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{l}</Chip>
          ))}
        </div>
      </div>
      {groups.map(g => (
        <div key={g.label}>
          <SectionHeader>{g.label}</SectionHeader>
          <div style={{ margin: '0 16px', background: M.white, borderRadius: 12, border: `1px solid ${M.n30}`, overflow: 'hidden' }}>
            {g.items.map((s, i) => <SessionRow key={s.id} s={s} last={i === g.items.length - 1} onClick={() => onOpenSession(s)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ANALYTICS / PROGRESS ─────────────────────────────────────
function AnalyticsScreen() {
  const p = MOCK.profile;
  const trend = MOCK.trend;
  return (
    <div style={{ background: M.n10, minHeight: '100%', paddingBottom: 24 }}>
      <HeroHeader pad="14px 20px 22px">
        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 22, color: M.white, marginBottom: 18 }}>Progress</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ScoreRing
            value={p.readiness} max={100} size={104} stroke={10} color="#5BC98A"
            label={<span style={{ fontFamily: M.font, fontWeight: 800, fontSize: 30, color: M.white, lineHeight: 1 }}>{p.readiness}</span>}
            sub={<span style={{ fontFamily: M.font, fontWeight: 600, fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Ready</span>}
          />
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 10px' }}>
            <HeroStat value={p.avgScore.toFixed(1)} label="Avg score" />
            <HeroStat value={p.streak} label="Day streak" />
            <HeroStat value={p.sessionsTotal} label="Sessions" />
            <HeroStat value={p.questionsTotal} label="Questions" />
          </div>
        </div>
      </HeroHeader>

      <SectionHeader>Score over time</SectionHeader>
      <div style={{ padding: '0 16px' }}>
        <Card padding={16}>
          <TrendChart data={trend} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: M.font, fontSize: 11, color: M.n70 }}>
            <span>8 sessions ago</span>
            <span>Latest</span>
          </div>
        </Card>
      </div>

      <SectionHeader>Topic mastery</SectionHeader>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MOCK.topics.map(t => (
          <Card key={t.key} padding={14}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${scoreColor(t.score)}14`, color: scoreColor(t.score), display: 'grid', placeItems: 'center' }}>
                <Icon name={t.icon} size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 15, color: M.n100 }}>{t.name}</div>
                <div style={{ fontFamily: M.font, fontSize: 12, color: M.n70, marginTop: 1 }}>{t.count} questions · {scoreLabel(t.score)}</div>
              </div>
              <span style={{ fontFamily: M.font, fontWeight: 800, fontSize: 18, color: scoreColor(t.score), fontVariantNumeric: 'tabular-nums' }}>{t.score.toFixed(1)}</span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: M.n20, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${t.score * 10}%`, borderRadius: 999, background: scoreColor(t.score) }} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HeroStat({ value, label }) {
  return (
    <div>
      <div style={{ fontFamily: M.font, fontWeight: 800, fontSize: 20, color: M.white, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontFamily: M.font, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// SVG area+line chart for the score trend
function TrendChart({ data }) {
  const w = 310, h = 120, pad = 8;
  const max = 10, min = 0;
  const xs = data.map((_, i) => pad + (i * (w - pad * 2)) / (data.length - 1));
  const ys = data.map(v => pad + (1 - (v - min) / (max - min)) * (h - pad * 2));
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const area = `${line} L${xs[xs.length - 1].toFixed(1)},${h - pad} L${xs[0].toFixed(1)},${h - pad} Z`;
  const last = data[data.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {[2.5, 5, 7.5].map(g => {
        const y = pad + (1 - g / 10) * (h - pad * 2);
        return <line key={g} x1={pad} y1={y} x2={w - pad} y2={y} stroke={M.n30} strokeWidth="1" strokeDasharray="3 4" />;
      })}
      <path d={area} fill="rgba(1,89,166,0.10)" />
      <path d={line} fill="none" stroke={M.blue700} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={i === data.length - 1 ? 4.5 : 3} fill={i === data.length - 1 ? M.blue700 : M.white} stroke={M.blue700} strokeWidth="2" />
      ))}
      <g>
        <rect x={xs[xs.length - 1] - 18} y={ys[ys.length - 1] - 26} width="36" height="19" rx="5" fill={M.blue800} />
        <text x={xs[xs.length - 1]} y={ys[ys.length - 1] - 13} textAnchor="middle" fontFamily={M.font} fontSize="11" fontWeight="700" fill="#fff">{last.toFixed(1)}</text>
      </g>
    </svg>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────
function ProfileScreen({ onSignOut }) {
  const p = MOCK.profile;
  return (
    <div style={{ background: M.n10, minHeight: '100%', paddingBottom: 24 }}>
      <HeroHeader pad="14px 20px 24px">
        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 22, color: M.white, marginBottom: 18 }}>Profile</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: 999, background: 'rgba(255,255,255,0.16)', color: M.white, display: 'grid', placeItems: 'center', fontFamily: M.font, fontWeight: 700, fontSize: 22 }}>{p.initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 18, color: M.white }}>{p.name}</div>
            <div style={{ fontFamily: M.font, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>{p.email}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Badge tone="onDark">{p.role}</Badge>
              <Badge tone="onDark">{p.level}</Badge>
            </div>
          </div>
        </div>
      </HeroHeader>

      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 10 }}>
        <MiniStat icon="flame" tone="amber" value={p.streak} label="Day streak" />
        <MiniStat icon="award" tone="accent" value={p.bestStreak} label="Best streak" />
        <MiniStat icon="trend" tone="success" value={p.avgScore.toFixed(1)} label="Avg score" />
      </div>

      <SectionHeader>Interview target</SectionHeader>
      <div style={{ margin: '0 16px', background: M.white, borderRadius: 12, border: `1px solid ${M.n30}`, overflow: 'hidden' }}>
        <ListRow icon="user" iconTone="accent" title="Role" meta={p.role} metaTone="muted" onClick={() => {}} />
        <ListRow icon="layers" iconTone="accent" title="Level" meta={p.level} metaTone="muted" onClick={() => {}} last />
      </div>

      <SectionHeader>Practice</SectionHeader>
      <div style={{ margin: '0 16px', background: M.white, borderRadius: 12, border: `1px solid ${M.n30}`, overflow: 'hidden' }}>
        <ListRow icon="bell" title="Daily reminder" sub="Every day at 9:00 AM" trailing={<Toggle on />} />
        <ListRow icon="book" title="Question bank" sub="Browse 600+ questions" onClick={() => {}} />
        <ListRow icon="moon" title="Dark mode" trailing={<Toggle on={false} />} last />
      </div>

      <SectionHeader>Account</SectionHeader>
      <div style={{ margin: '0 16px', background: M.white, borderRadius: 12, border: `1px solid ${M.n30}`, overflow: 'hidden' }}>
        <ListRow icon="settings" title="Settings" onClick={() => {}} />
        <ListRow icon="logout" title="Sign out" onClick={onSignOut} last />
      </div>
    </div>
  );
}

function MiniStat({ icon, tone, value, label }) {
  const col = tone === 'amber' ? M.amber : tone === 'success' ? M.green : M.blue700;
  const bg = tone === 'amber' ? 'rgba(201,130,27,0.12)' : tone === 'success' ? M.greenSoft : 'rgba(1,89,166,0.10)';
  return (
    <div style={{ flex: 1, background: M.white, borderRadius: 12, border: `1px solid ${M.n30}`, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, color: col, display: 'grid', placeItems: 'center' }}><Icon name={icon} size={17} fill={icon === 'flame'} /></div>
      <div style={{ fontFamily: M.font, fontWeight: 800, fontSize: 18, color: M.n100, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontFamily: M.font, fontSize: 11, color: M.n70, textAlign: 'center' }}>{label}</div>
    </div>
  );
}

function Toggle({ on: initial }) {
  const [on, setOn] = React.useState(initial);
  return (
    <button onClick={() => setOn(!on)} style={{
      width: 46, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 3,
      background: on ? M.green : M.n40, transition: 'background 180ms', display: 'flex',
      justifyContent: on ? 'flex-end' : 'flex-start',
    }}>
      <div style={{ width: 22, height: 22, borderRadius: 999, background: M.white, boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'all 180ms' }} />
    </button>
  );
}

Object.assign(window, { HomeScreen, HistoryScreen, AnalyticsScreen, ProfileScreen, SessionRow, modeMeta });
