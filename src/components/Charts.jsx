import React, { useEffect, useMemo, useState } from 'react';
import { toBRL, toCompactBRL } from '../data/seed';

export function AnimatedNumber({ value, formatter = n => Math.round(n).toString(), duration = 650 }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const startVal = 0;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(startVal + (value - startVal) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span>{formatter(display)}</span>;
}

function buildSmoothPath(pts) {
  if (!pts.length) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function SkymetricsSplineChart({
  series,
  primaryKey = 'revenue',
  primaryLabel = 'Faturamento',
  secondaryKey = 'costs',
  secondaryLabel = 'Custos Totais',
  tertiaryKey = 'profit',
  tertiaryLabel = 'Lucro Líquido',
  onPointClick
}) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const width = 680;
  const height = 230;
  const pad = { top: 20, right: 20, bottom: 32, left: 56 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const data = series.length ? series : [{ label: 'Sem dados', revenue: 0, costs: 0, profit: 0 }];
  const maxVal = Math.max(
    1000,
    ...data.map(d => Math.max(d[primaryKey] || 0, d[secondaryKey] || 0, tertiaryKey ? (d[tertiaryKey] || 0) : 0))
  );
  const niceMax = Math.ceil(maxVal / 1000) * 1000;

  const toXY = (key) =>
    data.map((d, i) => ({
      x: pad.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW),
      y: pad.top + plotH - ((d[key] || 0) / niceMax) * plotH,
      val: d[key] || 0,
      label: d.label
    }));

  const ptsPrimary = useMemo(() => toXY(primaryKey), [data, niceMax, primaryKey]);
  const ptsSecondary = useMemo(() => toXY(secondaryKey), [data, niceMax, secondaryKey]);
  const ptsTertiary = useMemo(() => (tertiaryKey ? toXY(tertiaryKey) : []), [data, niceMax, tertiaryKey]);

  const pathPrimary = buildSmoothPath(ptsPrimary);
  const pathSecondary = buildSmoothPath(ptsSecondary);
  const pathTertiary = tertiaryKey ? buildSmoothPath(ptsTertiary) : '';

  const areaPrimary = ptsPrimary.length
    ? `${pathPrimary} L ${ptsPrimary[ptsPrimary.length - 1].x.toFixed(1)} ${(pad.top + plotH).toFixed(1)} L ${ptsPrimary[0].x.toFixed(1)} ${(pad.top + plotH).toFixed(1)} Z`
    : '';

  const defaultIdx = data.length > 0 ? Math.max(0, data.length - 2) : 0;
  const activeIdx = hoverIdx !== null && data[hoverIdx] ? hoverIdx : defaultIdx;
  const activePt = ptsPrimary[activeIdx] || { x: pad.left, y: pad.top + plotH, val: 0, label: '' };
  const activeDatum = data[activeIdx];

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginBottom: 6, fontSize: 12, color: 'var(--tx-dim)', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ac)' }} />
          {primaryLabel}
        </span>
        {tertiaryKey && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--blue)' }} />
            {tertiaryLabel}
          </span>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--mu)', opacity: 0.55 }} />
          {secondaryLabel}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="skyAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ac)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--ac)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {yTicks.map((t, idx) => {
          const y = pad.top + plotH * (1 - t);
          return (
            <g key={idx}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke="var(--bd)"
                strokeDasharray={t === 0 ? undefined : '4 4'}
                strokeWidth="1"
              />
              <text
                x={pad.left - 10}
                y={y + 4}
                textAnchor="end"
                fill="var(--mu)"
                fontSize="10.5"
                fontFamily="var(--font-mono)"
              >
                {toCompactBRL(niceMax * t).replace('R$ ', '')}
              </text>
            </g>
          );
        })}

        {areaPrimary && <path d={areaPrimary} fill="url(#skyAreaGrad)" />}

        <path
          d={pathSecondary}
          fill="none"
          stroke="var(--mu)"
          strokeOpacity="0.45"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-draw-path"
          style={{ '--dash-len': 1400, '--draw-delay': 1 }}
        />

        {tertiaryKey && (
          <path
            d={pathTertiary}
            fill="none"
            stroke="var(--blue)"
            strokeWidth="2"
            strokeDasharray="5 4"
            strokeLinecap="round"
            className="animate-draw-path"
            style={{ '--dash-len': 1400, '--draw-delay': 2 }}
          />
        )}

        <path
          d={pathPrimary}
          fill="none"
          stroke="var(--ac)"
          strokeWidth="2.8"
          strokeLinecap="round"
          className="animate-draw-path"
          style={{ '--dash-len': 1400, '--draw-delay': 0 }}
        />

        {/* Active vertical crosshair */}
        <line
          x1={activePt.x}
          y1={pad.top}
          x2={activePt.x}
          y2={pad.top + plotH}
          stroke="var(--bd)"
          strokeDasharray="3 3"
          strokeWidth="1.2"
        />

        {ptsPrimary.map((pt, i) => (
          <g key={i}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={i === activeIdx ? 5.5 : 3.2}
              fill={i === activeIdx ? 'var(--sf)' : 'var(--ac)'}
              stroke="var(--ac)"
              strokeWidth={i === activeIdx ? 2.8 : 0}
              style={{ transition: 'r 0.18s ease' }}
            />
            <text
              x={pt.x}
              y={height - 8}
              textAnchor="middle"
              fill={i === activeIdx ? 'var(--tx)' : 'var(--mu)'}
              fontWeight={i === activeIdx ? '600' : '500'}
              fontSize="11"
            >
              {pt.label}
            </text>
            <rect
              x={pt.x - Math.max(18, plotW / Math.max(2, data.length * 2))}
              y={pad.top}
              width={Math.max(36, plotW / Math.max(1, data.length))}
              height={plotH + 24}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverIdx(i)}
              onClick={() => onPointClick && onPointClick(data[i])}
            />
          </g>
        ))}

        {/* Floating Skymetrics Glass Pill Tooltip */}
        {activeDatum && (
          <g
            transform={`translate(${Math.min(width - 155, Math.max(pad.left + 8, activePt.x - 62))}, ${Math.max(4, activePt.y - 54)})`}
            style={{ pointerEvents: 'none', transition: 'transform 0.22s var(--ease-spring)' }}
          >
            <rect
              x="0"
              y="0"
              width="138"
              height="44"
              rx="10"
              fill="var(--sf)"
              stroke="var(--bd)"
              filter="drop-shadow(0 6px 16px rgba(15, 23, 42, 0.12))"
            />
            <text x="12" y="17" fill="var(--mu)" fontSize="10.5" fontWeight="500">
              {activeDatum.label} ({activeDatum.count} obra{activeDatum.count === 1 ? '' : 's'})
            </text>
            <text x="12" y="34" fill="var(--tx)" fontSize="12.5" fontWeight="700" fontFamily="var(--font-mono)">
              {toBRL(activeDatum[primaryKey] || 0)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export function SkymetricsDonutChart({ segments, centerValue, centerLabel }) {
  const [hovered, setHovered] = useState(null);
  const total = Math.max(1, segments.reduce((s, x) => s + (+x.value || 0), 0));

  const cx = 175;
  const cy = 112;
  const radius = 64;
  const strokeWidth = 17;
  const circumference = 2 * Math.PI * radius;

  let accPct = 0;
  const computed = segments.map((seg, idx) => {
    const pct = (+seg.value || 0) / total;
    const dash = Math.max(0.02, pct) * circumference;
    const gap = Math.max(0, circumference - dash);
    const startAngle = accPct * 360 - 90;
    const midAngle = (accPct + pct / 2) * 360 - 90;
    accPct += pct;
    const rad = (midAngle * Math.PI) / 180;
    const pStart = {
      x: cx + Math.cos(rad) * (radius + strokeWidth / 2 + 3),
      y: cy + Math.sin(rad) * (radius + strokeWidth / 2 + 3)
    };
    const isRight = Math.cos(rad) >= 0;
    const pElbow = {
      x: cx + Math.cos(rad) * (radius + 26),
      y: cy + Math.sin(rad) * (radius + 26)
    };
    const pEnd = {
      x: isRight ? cx + 106 : cx - 106,
      y: pElbow.y
    };
    return {
      ...seg,
      idx,
      pctInt: Math.round(pct * 100),
      dash: Math.max(8, dash - 6),
      gap,
      startAngle,
      pStart,
      pElbow,
      pEnd,
      isRight
    };
  });

  const activeSeg = hovered !== null ? computed[hovered] : null;

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox="0 0 350 225" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--bg-subtle)" strokeWidth={strokeWidth} />

        {computed.map(seg => (
          <g
            key={seg.label}
            onMouseEnter={() => setHovered(seg.idx)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === seg.idx ? strokeWidth + 3 : strokeWidth}
              strokeDasharray={`${seg.dash} ${circumference}`}
              strokeLinecap="round"
              transform={`rotate(${seg.startAngle} ${cx} ${cy})`}
              style={{
                transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                opacity: hovered !== null && hovered !== seg.idx ? 0.52 : 1
              }}
            />

            {/* External dotted/elbow callout matching Skymetrics */}
            <polyline
              points={`${seg.pStart.x},${seg.pStart.y} ${seg.pElbow.x},${seg.pElbow.y} ${seg.pEnd.x},${seg.pEnd.y}`}
              fill="none"
              stroke={seg.color}
              strokeOpacity="0.55"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
            <text
              x={seg.isRight ? seg.pEnd.x + 6 : seg.pEnd.x - 6}
              y={seg.pEnd.y - 3}
              textAnchor={seg.isRight ? 'start' : 'end'}
              fill="var(--mu)"
              fontSize="10.5"
              fontWeight="500"
            >
              {seg.label}
            </text>
            <text
              x={seg.isRight ? seg.pEnd.x + 6 : seg.pEnd.x - 6}
              y={seg.pEnd.y + 10}
              textAnchor={seg.isRight ? 'start' : 'end'}
              fill="var(--tx)"
              fontSize="11"
              fontWeight="700"
              fontFamily="var(--font-mono)"
            >
              {toCompactBRL(seg.value)} ({seg.pctInt}%)
            </text>
          </g>
        ))}

        {/* Center text */}
        <text x={cx} y={cy - 2} textAnchor="middle" fill="var(--tx)" fontSize="18" fontWeight="700" fontFamily="var(--font-display)">
          {activeSeg ? toCompactBRL(activeSeg.value) : centerValue}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="var(--mu)" fontSize="11" fontWeight="500">
          {activeSeg ? `${activeSeg.label} (${activeSeg.pctInt}%)` : centerLabel}
        </text>
      </svg>
    </div>
  );
}
