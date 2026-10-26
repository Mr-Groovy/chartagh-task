'use client';
import { useState } from 'react';
import { fa, fmtDur } from '@/lib/date';

const W = 760;
const H = 250;
const AXIS = 34; // y labels on the right (start side in RTL)
const TOP = 12;
const BASE = H - 40;

function niceStep(maxH) {
  if (maxH <= 4) return 1;
  if (maxH <= 8) return 2;
  if (maxH <= 16) return 4;
  return 6;
}

// Bar with only its data end rounded, anchored square to the baseline
function bar(x, y, w, h, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, h, w / 2);
  return `M${x} ${y + h}V${y + rr}Q${x} ${y} ${x + rr} ${y}H${x + w - rr}Q${x + w} ${y} ${x + w} ${y + rr}V${y + h}Z`;
}

// Hours per day per person. Day 1 sits on the right, like the rest of the RTL page.
// mode 'grouped' puts the two people side by side, 'stacked' piles them into a team total.
export default function HoursChart({ groups, users, mode = 'grouped', label }) {
  const [hover, setHover] = useState(null);
  const n = groups.length;
  const totals = groups.map((g) => users.reduce((s, u) => s + (g.values[u.id] ?? 0), 0));
  const peak = mode === 'stacked' ? Math.max(...totals) : Math.max(...groups.flatMap((g) => users.map((u) => g.values[u.id] ?? 0)));
  const step = niceStep(peak / 3600e3);
  const maxH = Math.max(step * 2, Math.ceil(peak / 3600e3 / step) * step);
  const y = (ms) => BASE - ((ms / 3600e3) / maxH) * (BASE - TOP);
  const plotW = W - AXIS - 4;
  const gw = plotW / n;
  // group i's slot, counted from the right edge of the plot
  const gx = (i) => W - AXIS - (i + 1) * gw;
  const ticks = Array.from({ length: maxH / step + 1 }, (_, i) => i * step);
  const bw = mode === 'stacked' ? Math.min(22, gw * 0.62) : Math.min(16, (gw * 0.72 - 2) / 2);

  return (
    <div className="chart" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={4} x2={W - AXIS} y1={y(t * 3600e3)} y2={y(t * 3600e3)} />
            <text className="axis-label" x={W - 4} y={y(t * 3600e3) + 4} textAnchor="end">
              {fa(t)}
            </text>
          </g>
        ))}
        {groups.map((g, i) => {
          const cx = gx(i) + gw / 2;
          let marks;
          if (mode === 'stacked') {
            let acc = 0;
            const segs = users.map((u) => ({ u, ms: g.values[u.id] ?? 0 })).filter((s) => s.ms > 0);
            marks = segs.map((s, k) => {
              const y0 = y(acc + s.ms);
              const h = y(acc) - y0 - (k > 0 ? 2 : 0); // 2px surface gap between stacked fills
              acc += s.ms;
              const top = k === segs.length - 1;
              return <path key={s.u.id} className="bar" d={top ? bar(cx - bw / 2, y0, bw, h) : `M${cx - bw / 2} ${y0}h${bw}v${h}h${-bw}Z`} fill={`var(--c-${s.u.color})`} opacity={hover === null || hover === i ? 1 : 0.45} />;
            });
          } else {
            // first person on the right of the pair, 2px gap between the two bars
            marks = users.map((u, k) => {
              const ms = g.values[u.id] ?? 0;
              const x = cx + (k === 0 ? 1 : -1 - bw);
              return <path key={u.id} className="bar" d={bar(x, y(ms), bw, BASE - y(ms))} fill={`var(--c-${u.color})`} opacity={hover === null || hover === i ? 1 : 0.45} />;
            });
          }
          return (
            <g key={g.key}>
              <rect className="hit" x={gx(i) + 1} y={TOP - 6} width={gw - 2} height={H - TOP} rx="8" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${g.label}: ${fmtDur(totals[i])}`} />
              {marks}
              <text className={`axis-label ${g.isToday ? 'axis-label--strong' : ''}`} x={cx} y={BASE + 18} textAnchor="middle" pointerEvents="none">
                {g.label}
              </text>
              {g.sub && (
                <text className="axis-label" x={cx} y={BASE + 33} textAnchor="middle" pointerEvents="none">
                  {g.sub}
                </text>
              )}
              {g.isToday && !g.sub && <circle className="today-mark" cx={cx} cy={BASE + 30} r="2.5" />}
            </g>
          );
        })}
        <line x1={4} x2={W - AXIS} y1={BASE} y2={BASE} stroke="var(--line-2)" />
      </svg>
      {hover !== null && (
        <div className="tip" style={{ right: `${((W - gx(hover) - gw / 2) / W) * 100}%`, top: `${(y(Math.max(totals[hover], 0)) / H) * 100}%` }} role="status">
          <b>{groups[hover].title ?? groups[hover].label}</b>
          {users.map((u) => (
            <span key={u.id} className="tip__row" style={{ '--c': `var(--c-${u.color})` }}>
              <i />
              <span>{u.name}</span>
              {fmtDur(groups[hover].values[u.id] ?? 0)}
            </span>
          ))}
          {users.length > 1 && (
            <span className="tip__row" style={{ opacity: 0.75 }}>
              <span>جمع</span>
              {fmtDur(totals[hover])}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
