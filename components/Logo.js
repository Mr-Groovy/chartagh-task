// The چارطاق mark, ported from the agency site (static version, no animation library).
const H = 100;
const N = [100, 0];
const E = [186.6, 50];
const S = [100, 100];
const W = [13.4, 50];

const lerp2 = (o, a, b, u, v) => [o[0] + a[0] * u + b[0] * v, o[1] + a[1] * u + b[1] * v];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const pt = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

const left = (u, v) => lerp2(W, sub(S, W), [0, H], u, v);
const right = (u, v) => lerp2(S, sub(E, S), [0, H], u, v);
const top = (a, b) => lerp2(S, sub(E, S), sub(W, S), a, b);

function archFace(F, m = 0.15, sp = 0.58, ap = 0.2) {
  return (
    `M${pt(F(0, 0))} L${pt(F(1, 0))} L${pt(F(1, 1))} L${pt(F(1 - m, 1))} L${pt(F(1 - m, sp))} ` +
    `C${pt(F(1 - m, sp - 0.3))} ${pt(F(0.56, ap + 0.01))} ${pt(F(0.5, ap))} ` +
    `C${pt(F(0.44, ap + 0.01))} ${pt(F(m, sp - 0.3))} ${pt(F(m, sp))} L${pt(F(m, 1))} L${pt(F(0, 1))}Z`
  );
}
const rect = (a0, a1, b0, b1) => `M${pt(top(a0, b0))} L${pt(top(a1, b0))} L${pt(top(a1, b1))} L${pt(top(a0, b1))}Z`;

const LEFT = archFace(left);
const RIGHT = archFace(right);
const TOP = `M${pt(S)} L${pt(E)} L${pt(N)} L${pt(W)}Z`;
const CELLS = [rect(0, 1 / 3, 1 / 3, 1), rect(2 / 3, 1, 1 / 3, 2 / 3)];
const GAP = `M${pt(W)} L${pt(S)} L${pt(E)} M${pt(S)} L${pt([S[0], S[1] + H])}`;

export default function Logo({ className = '', title = 'چارطاق' }) {
  return (
    <svg className={`logo ${className}`} viewBox="8 -4 184 208" role="img" aria-label={title}>
      <path d={LEFT} fill="var(--logo-left)" />
      <path d={RIGHT} fill="var(--logo-right)" />
      <path d={TOP} fill="var(--logo-top)" />
      {CELLS.map((d) => (
        <path key={d} d={d} fill="var(--logo-cell)" />
      ))}
      <path d={GAP} fill="none" stroke="var(--logo-gap)" strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  );
}
