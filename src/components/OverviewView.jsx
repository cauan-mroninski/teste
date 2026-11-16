import React from 'react';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import {
  addDaysISO,
  buildMonthlySeries,
  computeCrmAnalytics,
  diffDays,
  formatDate,
  getBalance,
  getCustoTotal,
  getInitials,
  getLucro,
  isLate,
  STATUS_APPR,
  STATUS_DEV,
  STATUS_DONE,
  toBRL,
  todayISO
} from '../data/seed';
import { AnimatedNumber, SkymetricsDonutChart, SkymetricsSplineChart } from './Charts';

export function OverviewView({
  projects,
  crm,
  onSelectTab,
  onSetProjectFilter,
  onOpenClient,
  onOpenProject,
  onCycleStatus,
  onDeliverProject,
  onOpenLead,
  onOpenNewLead,
  onOpenDayInspector
}) {
  const today = todayISO();
  const openProjects = projects
    .filter(p => p.st !== STATUS_DONE)
    .sort((a, b) => (a.prazo || '').localeCompare(b.prazo || ''));
  const lateProjects = openProjects.filter(isLate);
  const doneProjects = projects.filter(p => p.st === STATUS_DONE);
  const inDevCount = projects.filter(p => p.st === STATUS_DEV).length;
  const inApprCount = projects.filter(p => p.st === STATUS_APPR).length;

  const totalValor = projects.reduce((s, p) => s + (+p.valor || 0), 0);
  const totalRec = projects.reduce((s, p) => s + (+p.rec || 0), 0);
  const totalCosts = projects.reduce((s, p) => s + getCustoTotal(p), 0);
  const totalProfit = totalValor - totalCosts;
  const totalToReceive = projects.reduce((s, p) => s + getBalance(p), 0);

  const pctDone = projects.length ? Math.round((doneProjects.length / projects.length) * 100) : 0;
  const pctDev = projects.length ? Math.round((inDevCount / projects.length) * 100) : 0;
  const pctAppr = projects.length ? Math.round((inApprCount / projects.length) * 100) : 0;
  const pctLate = projects.length ? Math.round((lateProjects.length / projects.length) * 100) : 0;

  const monthlySeries = buildMonthlySeries(projects);
  const crmAnalytics = computeCrmAnalytics(crm);

  const donutSegments = [
    { label: 'Lucro Líquido', value: Math.max(0, totalProfit), color: '#248b63' },
    { label: 'Honorários Equipe', value: projects.reduce((s, p) => s + (+p.custoResp || 0), 0), color: '#3b82f6' },
    { label: 'Taxas & Extras', value: projects.reduce((s, p) => s + (+p.custosExtras || 0), 0), color: '#f59e0b' },
    { label: 'A Receber', value: totalToReceive, color: '#14b8a6' }
  ];

  const kpis = [
    {
      label: 'Faturamento Contratado',
      raw: totalValor,
      format: toBRL,
      delta: `${pctDone}% concl.`,
      positive: true,
      sub: `${projects.length} contratos no portfólio`,
      onClick: () => onSelectTab('fin')
    },
    {
      label: 'Lucro Líquido Estimado',
      raw: totalProfit,
      format: toBRL,
      delta: `${totalValor > 0 ? Math.round((totalProfit / totalValor) * 100) : 0}% margem`,
      positive: true,
      sub: `${toBRL(totalRec)} já recebidos`,
      onClick: () => onSelectTab('fin')
    },
    {
      label: 'Obras em Aberto',
      raw: openProjects.length,
      format: n => Math.round(n).toString(),
      delta: lateProjects.length ? `${lateProjects.length} atrasada(s)` : 'Em dia',
      positive: lateProjects.length === 0,
      sub: `${inDevCount} em dev · ${inApprCount} aprovação`,
      onClick: () => {
        onSetProjectFilter(STATUS_DEV);
        onSelectTab('proj');
      }
    },
    {
      label: 'Pipeline CRM Ponderado',
      raw: crmAnalytics.weightedForecast + crmAnalytics.wonValue,
      format: toBRL,
      delta: `${crmAnalytics.winRate}% conv.`,
      positive: true,
      sub: `${crmAnalytics.active.length} propostas ativas`,
      onClick: () => onSelectTab('crm')
    }
  ];

  const spotlight = openProjects[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 4 KPI Cards estilo Skymetrics */}
      <div className="kpi-grid-4" style={{ marginBottom: 0 }}>
        {kpis.map((k, idx) => (
          <div
            key={k.label}
            className="sky-card sky-card-interactive animate-rise"
            style={{ '--stagger': idx }}
            onClick={k.onClick}
          >
            <div className="sky-kpi-top">
              <span className="sky-kpi-label">{k.label}</span>
              <span className={`sky-delta-pill ${k.positive ? 'pos' : 'neg'}`}>{k.delta}</span>
            </div>
            <div className="sky-kpi-val-row">
              <div className="sky-kpi-value">
                <AnimatedNumber value={k.raw} formatter={k.format} />
              </div>
              <span className={`sky-trend-dot ${k.positive ? 'pos' : 'neg'}`}>
                {k.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              </span>
            </div>
            <div className="sky-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráficos principais estilo Skymetrics (Spline + Donut com callouts externos) */}
      <div className="charts-split-row" style={{ marginBottom: 0 }}>
        <div className="sky-card animate-rise" style={{ '--stagger': 4 }}>
          <div className="sky-card-head">
            <div>
              <h2 className="sky-card-title">Evolução de Faturamento & Custos</h2>
              <span style={{ fontSize: 12, color: 'var(--mu)' }}>Curva animada por competência — clique em um mês para ver Finanças</span>
            </div>
            <span className="badge-pill badge-done">{monthlySeries.length} meses</span>
          </div>
          <SkymetricsSplineChart
            series={monthlySeries}
            onPointClick={() => onSelectTab('fin')}
          />
        </div>

        <div className="sky-card animate-rise" style={{ '--stagger': 5 }}>
          <div className="sky-card-head">
            <div>
              <h2 className="sky-card-title">Distribuição Financeira</h2>
              <span style={{ fontSize: 12, color: 'var(--mu)' }}>Composição de receitas e repasses</span>
            </div>
          </div>
          <SkymetricsDonutChart
            segments={donutSegments}
            centerValue={projects.length}
            centerLabel="Obras totais"
          />
        </div>
      </div>

      {/* Saúde Operacional */}
      <div className="sky-card animate-rise" style={{ '--stagger': 6 }}>
        <div className="sky-card-head" style={{ marginBottom: 10 }}>
          <h2 className="sky-card-title">Saúde do Pipeline de Obras</h2>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ac)' }}>
            {pctDone}% Concluídas ({doneProjects.length}/{projects.length})
          </span>
        </div>
        <div className="pipeline-track">
          <div
            className="pipeline-seg"
            style={{ width: `${pctDone}%`, background: 'var(--ac)' }}
            title={`Concluídas: ${doneProjects.length}`}
            onClick={() => { onSetProjectFilter(STATUS_DONE); onSelectTab('proj'); }}
          />
          <div
            className="pipeline-seg"
            style={{ width: `${pctDev}%`, background: 'var(--blue)' }}
            title={`Em Desenvolvimento: ${inDevCount}`}
            onClick={() => { onSetProjectFilter(STATUS_DEV); onSelectTab('proj'); }}
          />
          <div
            className="pipeline-seg"
            style={{ width: `${pctAppr}%`, background: 'var(--amber)' }}
            title={`Aguardando Aprovação: ${inApprCount}`}
            onClick={() => { onSetProjectFilter(STATUS_APPR); onSelectTab('proj'); }}
          />
          <div
            className="pipeline-seg"
            style={{ width: `${pctLate}%`, background: '#ef4444' }}
            title={`Atrasadas: ${lateProjects.length}`}
            onClick={() => { onSetProjectFilter('late'); onSelectTab('proj'); }}
          />
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10, fontSize: 12, color: 'var(--tx-dim)' }}>
          <span>● {doneProjects.length} Concluídas</span>
          <span>● {inDevCount} Em desenvolvimento</span>
          <span>● {inApprCount} Aguardando aprovação</span>
          {lateProjects.length > 0 && <span style={{ color: 'var(--neg-tx)' }}>● {lateProjects.length} Atrasadas</span>}
        </div>
      </div>

      {/* Spotlight de Próximo Marco + Resumo CRM Skymetrics Clean */}
      <div className="split-2-even" style={{ marginBottom: 0 }}>
        <div className="sky-card animate-rise" style={{ '--stagger': 7 }}>
          <div className="sky-card-head">
            <h2 className="sky-card-title">Próximo Marco & Fila Ativa</h2>
            <button type="button" className="btn btn-sm" onClick={() => onSelectTab('proj')}>
              Ver todos
            </button>
          </div>

          {spotlight ? (
            <div
              style={{
                padding: 14,
                borderRadius: 14,
                background: isLate(spotlight) ? 'var(--neg-bg)' : 'var(--bg-subtle)',
                border: '1px solid var(--bd)',
                marginBottom: 14
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isLate(spotlight) ? 'var(--neg-tx)' : 'var(--ac)', textTransform: 'uppercase' }}>
                    {isLate(spotlight) ? `Atrasada há ${-diffDays(spotlight.prazo, today)}d` : `Entrega em ${diffDays(spotlight.prazo, today)}d`}
                  </span>
                  <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700 }}>
                    <button type="button" className="client-link-btn" onClick={() => onOpenClient(spotlight.cli)}>
                      <span className="avatar-circle" style={{ width: 22, height: 22, fontSize: 9.5 }}>{getInitials(spotlight.cli)}</span>
                      {spotlight.cli}
                    </button>
                    {' · '}
                    <span>{spotlight.obra}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4 }}>
                    {spotlight.area} · Resp: {spotlight.resp || '—'} · Lucro: {toBRL(getLucro(spotlight))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => onDeliverProject(spotlight.id)}>
                    <CheckCircle2 size={14} /> Entregar
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => onOpenProject(spotlight.id)}>
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--mu)' }}>Todas as obras do pipeline foram entregues.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {openProjects.slice(0, 4).map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: '1px solid var(--bd-light)'
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <button type="button" className="client-link-btn" onClick={() => onOpenClient(p.cli)}>
                    {p.cli}
                  </button>
                  <span style={{ fontSize: 12.5, color: 'var(--tx-dim)' }}> · {p.obra}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--mu)' }}>
                    {formatDate(p.prazo)}
                  </span>
                  <button
                    type="button"
                    className={`badge-pill ${p.st === STATUS_APPR ? 'badge-appr' : 'badge-dev'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onCycleStatus(p.id)}
                  >
                    {p.st}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funil Comercial CRM no estilo Skymetrics Claro */}
        <div className="sky-card animate-rise" style={{ '--stagger': 8 }}>
          <div className="sky-card-head">
            <div>
              <h2 className="sky-card-title">Funil Comercial (CRM Civil)</h2>
              <span style={{ fontSize: 12, color: 'var(--mu)' }}>
                {crmAnalytics.active.length} propostas ativas · Média {crmAnalytics.avgPerM2 > 0 ? toBRL(crmAnalytics.avgPerM2) : '—'}/m²
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn btn-sm" onClick={() => onSelectTab('crm')}>Abrir CRM</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={onOpenNewLead}>+ Lead</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
            {crmAnalytics.funnelBars.map((b, i) => {
              const topCount = Math.max(1, crmAnalytics.funnelBars[0].count);
              const wPct = Math.max(24, Math.round((b.count / topCount) * 100));
              return (
                <div key={b.key} className="funnel-row">
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx)' }}>{b.label}</span>
                  <div className="funnel-track">
                    <div
                      className="funnel-fill animate-bar-x"
                      style={{ width: `${wPct}%`, background: b.color, '--stagger': i }}
                    >
                      {b.val > 0 ? toBRL(b.val) : '—'}
                    </div>
                  </div>
                  <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13 }}>
                    {b.count}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--bd-light)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {crmAnalytics.active.slice(0, 3).map(l => (
              <button
                key={l.id}
                type="button"
                className="chip-control"
                style={{ height: 30, fontSize: 12 }}
                onClick={() => onOpenLead(l.id)}
              >
                <Sparkles size={12} color="var(--ac)" />
                <span>{l.cli} · {toBRL(l.valorEst)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Horizonte dos Próximos 7 Dias */}
      <div className="sky-card animate-rise" style={{ '--stagger': 9 }}>
        <div className="sky-card-head">
          <h2 className="sky-card-title">Horizonte de Entregas (Próximos 7 dias)</h2>
          <button type="button" className="btn btn-sm" onClick={() => onSelectTab('cal')}>
            <Clock size={14} /> Abrir Calendário
          </button>
        </div>
        <div className="horizon-grid">
          {Array.from({ length: 7 }, (_, i) => {
            const iso = addDaysISO(today, i);
            const dt = new Date(iso + 'T12:00:00');
            const weekday = dt.toLocaleDateString('pt-BR', { weekday: 'short' });
            const dayAll = projects.filter(p => p.prazo === iso);
            const active = dayAll.filter(p => p.st !== STATUS_DONE).length;
            const done = dayAll.filter(p => p.st === STATUS_DONE).length;
            return (
              <div
                key={iso}
                className={`horizon-day ${i === 0 ? 'today' : ''}`}
                onClick={() => onOpenDayInspector(iso)}
              >
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--mu)' }}>
                  {i === 0 ? 'Hoje' : weekday}
                </span>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>
                  {dt.getDate()}/{dt.getMonth() + 1}
                </strong>
                <span style={{ fontSize: 11.5, color: active ? 'var(--ac)' : 'var(--mu)', fontWeight: active ? 600 : 400 }}>
                  {active ? `${active} ativa(s)` : done ? `${done} entregue(s)` : 'Livre'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
