/* global React, M, Icon, Button, Card, Badge, Chip, ScoreRing, ScoreBar, scoreColor, scoreLabel, MOCK */
// Mockly — session flow: Setup → Interview (with AI feedback) → Result

const { useState: useS, useEffect: useE, useRef: useR } = React;

// Question pool per topic (prototype-scripted)
function getQuestions(topicKey) {
  if (MOCK.questions[topicKey]) return MOCK.questions[topicKey];
  const generic = {
    javascript: [
      { category: 'technical', text: 'Explain the event loop. How do microtasks and macrotasks differ in execution order?', concepts: ['call stack', 'task queue', 'promises'], minutes: 3 },
      { category: 'technical', text: 'What is a closure, and give a real bug a closure can cause inside a loop.', concepts: ['scope', 'let vs var', 'captured variables'], minutes: 3 },
      { category: 'technical', text: 'Compare `==` and `===`. When is loose equality actually defensible?', concepts: ['coercion', 'type safety'], minutes: 2 },
    ],
    system_design: [
      { category: 'system_design', text: 'Design the URL-shortener. Walk me from the API surface down to how you guarantee uniqueness at scale.', concepts: ['hashing', 'collision', 'sharding', 'caching'], minutes: 5 },
      { category: 'system_design', text: 'Your read traffic is 100× your writes. How does that change your storage and caching strategy?', concepts: ['read replicas', 'CDN', 'cache invalidation'], minutes: 4 },
      { category: 'system_design', text: 'How would you add rate limiting without a single point of failure?', concepts: ['token bucket', 'distributed counters'], minutes: 4 },
    ],
    behavioral: [
      { category: 'behavioral', text: 'Tell me about a time you disagreed with a senior engineer. Use the STAR format.', concepts: ['situation', 'task', 'action', 'result'], minutes: 3 },
      { category: 'behavioral', text: 'Describe a project that slipped its deadline. What did you own, and what changed afterward?', concepts: ['accountability', 'process change'], minutes: 3 },
    ],
    react_native: [
      { category: 'technical', text: 'How does the React Native bridge work, and what does the new architecture (JSI/Fabric) change?', concepts: ['bridge', 'JSI', 'Fabric'], minutes: 4 },
      { category: 'technical', text: 'A FlatList stutters with 5,000 rows. Which props do you reach for and why?', concepts: ['windowing', 'getItemLayout', 'keyExtractor'], minutes: 3 },
    ],
    mixed: [
      { category: 'technical', text: 'Explain the difference between debounce and throttle, with a UI case for each.', concepts: ['rate limiting', 'UX'], minutes: 3 },
      { category: 'behavioral', text: 'Tell me about a time you simplified something overly complex.', concepts: ['STAR', 'tradeoffs'], minutes: 3 },
    ],
  };
  return generic[topicKey] || generic.mixed;
}

// Scripted feedback variants (cycled per question)
const FEEDBACKS = [
  MOCK.sampleFeedback,
  {
    score: 5.4, score_structure: 5.0, score_technical: 6.2, score_clarity: 5.0,
    summary: 'You identified the right primitives but the answer wandered. There was a correct idea buried under restarts and filler — tighten the delivery.',
    strengths: ['Named the correct underlying mechanism', 'Caught your own mistake mid-answer'],
    weaknesses: ['No clear opening statement of the answer', 'Trailed off without a concrete example'],
    recommendation: 'Lead with a one-sentence answer, then justify it. Interviewers grade the first 10 seconds.',
  },
  {
    score: 8.6, score_structure: 9.0, score_technical: 8.5, score_clarity: 8.3,
    summary: 'Excellent. Structured, technically precise, and you proactively addressed the edge case before being asked. This reads as senior-level.',
    strengths: ['Opened with a crisp thesis, then proved it', 'Volunteered a tradeoff without prompting'],
    weaknesses: ['Slightly long — could cut the second example'],
    recommendation: 'Keep this structure. To go further, quantify impact ("cut renders ~40%").',
  },
];

// ─── Session chrome ───────────────────────────────────────────
function SessionBar({ index, total, onClose, seconds }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <div style={{ background: M.blue800, padding: '8px 16px 14px', color: M.white }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.14)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="x" size={18} color={M.white} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: M.font, fontWeight: 600, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
          <Icon name="clock" size={15} color="rgba(255,255,255,0.7)" />{mm}:{ss}
        </div>
        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 14, opacity: 0.85 }}>{index + 1}/{total}</div>
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= index ? '#5BC98A' : 'rgba(255,255,255,0.22)', transition: 'background 300ms' }} />
        ))}
      </div>
    </div>
  );
}

// ─── SETUP ────────────────────────────────────────────────────
function SetupScreen({ onClose, onStart }) {
  const [mode, setMode] = useS('text');
  const [topic, setTopic] = useS('react');
  const [count, setCount] = useS(8);
  const p = MOCK.profile;

  return (
    <div style={{ background: M.n10, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: M.white, borderBottom: `1px solid ${M.n30}`, padding: '8px 12px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, background: 'none', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="x" size={20} color={M.n100} /></button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: M.font, fontWeight: 700, fontSize: 17, color: M.n100 }}>New Session</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '8px 16px 16px' }}>
        {/* target banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(1,89,166,0.07)', borderRadius: 10, marginBottom: 18 }}>
          <Icon name="target" size={17} color={M.blue700} />
          <span style={{ fontFamily: M.font, fontSize: 13, color: M.n100 }}>Tuned for <strong>{p.level} {p.role}</strong> — difficulty adapts to your answers</span>
        </div>

        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: M.n70, marginBottom: 10 }}>Mode</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {MOCK.modes.map(m => {
            const on = mode === m.key;
            return (
              <button key={m.key} onClick={() => setMode(m.key)} style={{
                display: 'flex', alignItems: 'center', gap: 13, padding: 14, textAlign: 'left',
                background: M.white, borderRadius: 12, cursor: 'pointer',
                border: `1.5px solid ${on ? M.blue700 : M.n30}`,
                boxShadow: on ? '0 0 0 3px rgba(1,89,166,0.12)' : 'none', transition: 'all 160ms',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: on ? M.blue800 : M.n20, color: on ? M.white : M.blue800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={m.icon} size={21} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 15, color: M.n100 }}>{m.name}</div>
                  <div style={{ fontFamily: M.font, fontSize: 12.5, color: M.n70, marginTop: 2 }}>{m.desc}</div>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: 999, border: `2px solid ${on ? M.blue700 : M.n40}`, background: on ? M.blue700 : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {on && <Icon name="check" size={13} color={M.white} stroke={3} />}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: M.n70, marginBottom: 10 }}>Topic</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {MOCK.topicOptions.map(t => <Chip key={t.key} active={topic === t.key} onClick={() => setTopic(t.key)}>{t.name}</Chip>)}
        </div>

        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: M.n70, marginBottom: 10 }}>Questions</div>
        <Card padding={14} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 26, color: M.n100, fontVariantNumeric: 'tabular-nums' }}>{count}</div>
              <div style={{ fontFamily: M.font, fontSize: 12, color: M.n70 }}>≈ {Math.round(count * 1.8)} min</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <StepBtn icon="minus" disabled={count <= 5} onClick={() => setCount(c => Math.max(5, c - 1))} />
              <StepBtn icon="plus" disabled={count >= 15} onClick={() => setCount(c => Math.min(15, c + 1))} />
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${M.n30}`, background: M.white }}>
        <Button full size="lg" leadingIcon="play" onClick={() => onStart({ mode, topic, count })}>Start Interview</Button>
      </div>
    </div>
  );
}

function StepBtn({ icon, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      width: 44, height: 44, borderRadius: 11, border: `1.5px solid ${M.n40}`, background: M.white,
      display: 'grid', placeItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
    }}><Icon name={icon} size={20} color={M.blue800} /></button>
  );
}

// ─── INTERVIEW ────────────────────────────────────────────────
function InterviewScreen({ config, onClose, onComplete }) {
  const questions = getQuestions(config.topic).slice();
  // pad/truncate to count by cycling
  const list = Array.from({ length: config.count }, (_, i) => questions[i % questions.length]);
  const [index, setIndex] = useS(0);
  const [answer, setAnswer] = useS('');
  const [phase, setPhase] = useS('answering'); // answering | analyzing | feedback
  const [seconds, setSeconds] = useS(0);
  const [scores, setScores] = useS([]);
  const scrollRef = useR(null);

  const q = list[index];
  const fb = FEEDBACKS[index % FEEDBACKS.length];

  // timer
  useE(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // scroll to top on new question / feedback
  useE(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [index, phase]);

  const submit = () => {
    setPhase('analyzing');
    setTimeout(() => setPhase('feedback'), 1700);
  };
  const skip = () => advance(null);
  const advance = (score) => {
    const next = score == null ? scores : [...scores, score];
    setScores(next);
    if (index + 1 >= config.count) {
      const valid = next.filter(s => s != null);
      const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
      onComplete({ config, avg, scores: next, seconds, answered: valid.length });
    } else {
      setIndex(i => i + 1);
      setAnswer('');
      setPhase('answering');
    }
  };

  const isVoice = config.mode === 'voice';

  return (
    <div style={{ background: M.n10, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <SessionBar index={index} total={config.count} onClose={onClose} seconds={seconds} />

      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 16px 8px' }}>
        {/* Question */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Badge tone={q.category === 'behavioral' ? 'info' : q.category === 'system_design' ? 'amber' : 'success'}>
            {q.category === 'system_design' ? 'System Design' : q.category[0].toUpperCase() + q.category.slice(1)}
          </Badge>
          <span style={{ fontFamily: M.font, fontSize: 12, color: M.n70 }}>~{q.minutes} min</span>
        </div>
        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 21, lineHeight: '29px', color: M.n100, textWrap: 'pretty' }}>{q.text}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {q.concepts.map(c => (
            <span key={c} style={{ fontFamily: M.font, fontSize: 11.5, fontWeight: 600, color: M.n70, background: M.n20, padding: '4px 9px', borderRadius: 999 }}>{c}</span>
          ))}
        </div>

        {/* Feedback */}
        {phase === 'feedback' && <FeedbackCard fb={fb} />}
      </div>

      {/* Bottom: input or feedback actions */}
      <div style={{ borderTop: `1px solid ${M.n30}`, background: M.white, padding: 14 }}>
        {phase === 'answering' && !isVoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={answer} onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer…"
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: 84, maxHeight: 120, resize: 'none',
                border: `1px solid ${M.n30}`, borderRadius: 10, padding: '11px 13px',
                fontFamily: M.font, fontSize: 15, lineHeight: '21px', color: M.n100, outline: 'none',
              }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" leadingIcon="skip" onClick={skip} style={{ flex: '0 0 auto' }}>Skip</Button>
              <Button full leadingIcon="send" disabled={!answer.trim()} onClick={submit}>Submit Answer</Button>
            </div>
          </div>
        )}

        {phase === 'answering' && isVoice && (
          <VoiceAnswer onSkip={skip} onSubmit={submit} />
        )}

        {phase === 'analyzing' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 84 }}>
            <Spinner />
            <span style={{ fontFamily: M.font, fontWeight: 600, fontSize: 15, color: M.blue700 }}>Analyzing your answer…</span>
          </div>
        )}

        {phase === 'feedback' && (
          <Button full trailingIcon={index + 1 >= config.count ? 'check' : 'arrowRight'} onClick={() => advance(fb.score)}>
            {index + 1 >= config.count ? 'See Results' : 'Next Question'}
          </Button>
        )}
      </div>
    </div>
  );
}

function VoiceAnswer({ onSkip, onSubmit }) {
  const [recording, setRecording] = useS(false);
  const [t, setT] = useS(0);
  useE(() => {
    if (!recording) return;
    const id = setInterval(() => setT(x => x + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {recording && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: M.red, animation: 'mpulse 1s infinite' }} />
          <span style={{ fontFamily: M.font, fontWeight: 700, fontSize: 15, color: M.n100, fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</span>
        </div>
      )}
      {!recording && t === 0 && <span style={{ fontFamily: M.font, fontSize: 13, color: M.n70 }}>Tap to record your spoken answer</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {(recording || t > 0) && <button onClick={onSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: M.font, fontWeight: 600, fontSize: 14, color: M.n70 }}>Skip</button>}
        <button onClick={() => setRecording(r => !r)} style={{
          width: 64, height: 64, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: recording ? M.red : M.blue800, display: 'grid', placeItems: 'center',
          boxShadow: recording ? '0 0 0 6px rgba(192,49,43,0.15)' : '0 6px 16px rgba(27,68,139,0.35)', transition: 'all 200ms',
        }}>
          {recording ? <div style={{ width: 22, height: 22, borderRadius: 5, background: M.white }} /> : <Icon name="mic" size={26} color={M.white} />}
        </button>
        {(t > 0 && !recording) && <button onClick={onSubmit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: M.font, fontWeight: 700, fontSize: 14, color: M.blue700 }}>Submit</button>}
        {recording && <div style={{ width: 40 }} />}
      </div>
    </div>
  );
}

function Spinner() {
  return <div style={{ width: 22, height: 22, borderRadius: 999, border: `2.5px solid ${M.n30}`, borderTopColor: M.blue700, animation: 'mspin 0.7s linear infinite' }} />;
}

// Inline feedback card (appears after analyzing)
function FeedbackCard({ fb }) {
  const col = scoreColor(fb.score);
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon name="sparkle" size={16} color={M.blue700} fill />
        <span style={{ fontFamily: M.font, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: M.n70 }}>AI Feedback</span>
        <div style={{ flex: 1, height: 1, background: M.n30 }} />
      </div>
      <Card padding={16}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{ width: 58, height: 58, borderRadius: 14, background: `${col}14`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: M.font, fontWeight: 800, fontSize: 24, color: col, fontVariantNumeric: 'tabular-nums' }}>{fb.score.toFixed(1)}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 15, color: col }}>{scoreLabel(fb.score)}</div>
            <div style={{ fontFamily: M.font, fontSize: 13, color: M.n70, marginTop: 2, lineHeight: '18px' }}>{fb.summary}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0', borderTop: `1px solid ${M.n30}`, borderBottom: `1px solid ${M.n30}` }}>
          <ScoreBar label="Structure" value={fb.score_structure} />
          <ScoreBar label="Technical" value={fb.score_technical} />
          <ScoreBar label="Clarity" value={fb.score_clarity} />
        </div>

        <FbList tone="success" icon="check" title="Strengths" items={fb.strengths} />
        <FbList tone="amber" icon="target" title="To improve" items={fb.weaknesses} />

        <div style={{ display: 'flex', gap: 9, marginTop: 12, padding: 12, background: 'rgba(1,89,166,0.07)', borderRadius: 10 }}>
          <Icon name="sparkle" size={16} color={M.blue700} fill />
          <span style={{ fontFamily: M.font, fontSize: 13, color: M.n100, lineHeight: '19px' }}>{fb.recommendation}</span>
        </div>
      </Card>
    </div>
  );
}

function FbList({ tone, icon, title, items }) {
  const col = tone === 'success' ? M.green : M.amber;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 13, color: M.n100, marginBottom: 7 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <div style={{ width: 18, height: 18, borderRadius: 999, background: `${col}1f`, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
              <Icon name={icon} size={11} color={col} stroke={2.6} />
            </div>
            <span style={{ fontFamily: M.font, fontSize: 13.5, color: M.n100, lineHeight: '19px' }}>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RESULT ───────────────────────────────────────────────────
function ResultScreen({ result, onDone, onAgain }) {
  const avg = result.avg;
  const col = scoreColor(avg);
  const mm = Math.floor(result.seconds / 60);
  const topicName = (MOCK.topicOptions.find(t => t.key === result.config.topic) || {}).name || 'Mixed';
  const delta = +(avg / 10 * 2 + 0.4).toFixed(1); // playful readiness bump

  return (
    <div style={{ background: M.n10, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: M.blue800, color: M.white, padding: '20px 20px 32px', textAlign: 'center' }}>
        <div style={{ fontFamily: M.font, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7, marginBottom: 16 }}>Session complete</div>
        <div style={{ display: 'inline-block' }}>
          <ScoreRing
            value={avg} max={10} size={148} stroke={13} color={avg >= 7.5 ? '#5BC98A' : avg >= 5 ? '#E6B450' : '#E88'}
            label={<span style={{ fontFamily: M.font, fontWeight: 800, fontSize: 46, color: M.white, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{avg.toFixed(1)}</span>}
            sub={<span style={{ fontFamily: M.font, fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>out of 10</span>}
          />
        </div>
        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 22, marginTop: 14 }}>{scoreLabel(avg)} session</div>
        <div style={{ fontFamily: M.font, fontSize: 14, opacity: 0.8, marginTop: 4 }}>{topicName} · {result.answered} answered · {mm} min</div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16 }}>
        <Card padding={16} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, background: M.greenSoft, borderColor: 'transparent' }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: M.white, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="trend" size={22} color={M.green} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 15, color: M.n100 }}>Readiness +{delta}</div>
            <div style={{ fontFamily: M.font, fontSize: 12.5, color: M.n70, marginTop: 1 }}>Your streak is now {MOCK.profile.streak + 1} days 🔥</div>
          </div>
        </Card>

        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: M.n70, margin: '6px 0 10px' }}>Per question</div>
        <div style={{ background: M.white, borderRadius: 12, border: `1px solid ${M.n30}`, overflow: 'hidden' }}>
          {result.scores.map((s, i) => {
            const c = scoreColor(s);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i === result.scores.length - 1 ? 'none' : `1px solid ${M.n30}` }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: M.n20, display: 'grid', placeItems: 'center', fontFamily: M.font, fontWeight: 700, fontSize: 12, color: M.n70, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, height: 7, borderRadius: 999, background: M.n20, overflow: 'hidden' }}>
                  {s != null && <div style={{ height: '100%', width: `${s * 10}%`, borderRadius: 999, background: c }} />}
                </div>
                <span style={{ fontFamily: M.font, fontWeight: 700, fontSize: 14, color: s == null ? M.n70 : c, fontVariantNumeric: 'tabular-nums', minWidth: 30, textAlign: 'right' }}>{s == null ? 'Skip' : s.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${M.n30}`, background: M.white, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button full size="lg" onClick={onDone}>Done</Button>
        <Button full variant="ghost" leadingIcon="refresh" onClick={onAgain}>Practice again</Button>
      </div>
    </div>
  );
}

// ─── SESSION DETAIL (read-only, from History/Home) ───────────
function SessionDetailScreen({ session, onClose, onAgain }) {
  const mm = { text: { icon: 'message', label: 'Text' }, voice: { icon: 'mic', label: 'Voice' }, rapid: { icon: 'zap', label: 'Rapid' } }[session.mode];
  const col = scoreColor(session.score);
  // synthesize per-question scores around the average
  const qs = Array.from({ length: session.questions }, (_, i) => {
    const jitter = ((i * 37) % 20) / 10 - 1; // -1..+0.9
    return Math.max(2, Math.min(10, +(session.score + jitter).toFixed(1)));
  });
  return (
    <div style={{ background: M.n10, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: M.blue800, color: M.white, padding: '8px 12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.14)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="chevL" size={20} color={M.white} /></button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: M.font, fontWeight: 700, fontSize: 16 }}>Session detail</div>
          <div style={{ width: 36 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 8px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: M.font, fontWeight: 800, fontSize: 26, color: M.white, fontVariantNumeric: 'tabular-nums' }}>{session.score.toFixed(1)}</span>
          </div>
          <div>
            <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 20 }}>{session.topic}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Badge tone="onDark"><Icon name={mm.icon} size={12} color={M.white} /> {mm.label}</Badge>
              <span style={{ fontFamily: M.font, fontSize: 13, opacity: 0.8, whiteSpace: 'nowrap' }}>{session.questions} Q · {session.duration}</span>
            </div>
            <div style={{ fontFamily: M.font, fontSize: 12.5, opacity: 0.7, marginTop: 6 }}>{session.date}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16 }}>
        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: M.n70, marginBottom: 10 }}>Per question</div>
        <div style={{ background: M.white, borderRadius: 12, border: `1px solid ${M.n30}`, overflow: 'hidden' }}>
          {qs.map((s, i) => {
            const c = scoreColor(s);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i === qs.length - 1 ? 'none' : `1px solid ${M.n30}` }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: M.n20, display: 'grid', placeItems: 'center', fontFamily: M.font, fontWeight: 700, fontSize: 12, color: M.n70, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, height: 7, borderRadius: 999, background: M.n20, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s * 10}%`, borderRadius: 999, background: c }} />
                </div>
                <span style={{ fontFamily: M.font, fontWeight: 700, fontSize: 14, color: c, fontVariantNumeric: 'tabular-nums', minWidth: 30, textAlign: 'right' }}>{s.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${M.n30}`, background: M.white }}>
        <Button full leadingIcon="refresh" onClick={onAgain}>Practice this topic again</Button>
      </div>
    </div>
  );
}

Object.assign(window, { SetupScreen, InterviewScreen, ResultScreen, SessionDetailScreen });
