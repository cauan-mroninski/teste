import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Check, ChevronLeft, ChevronRight, Download, Edit3, LayoutGrid, List, Plus, Search } from 'lucide-react';
import {
  buildMonthlySeries,
  computeClientsDirectory,
  computeCrmAnalytics,
  computeTeamMembers,
  CRM_STAGE_META,
  CRM_STAGES,
  exportProjectsCSV,
  filterProjectsByPeriod,
  formatDate,
  getBalance,
  getCustoTotal,
  getInitials,
  getLucro,
  getMargem,
  getPercentage,
  isLate,
  STATUS_APPR,
  STATUS_DEV,
  STATUS_DONE,
  toBRL,
  todayISO
} from '../data/seed';
import { AnimatedNumber, SkymetricsDonutChart, SkymetricsSplineChart } from './Charts';

export function CrmView({
  crm,
  onOpenLead,
  onOpenNewLead,
  onMoveLeadStage,
  onConvertLead,
  onOpenClient
}) {
  const [mode, setMode] = useState('kanban');
  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [respFilter, setRespFilter] = useState('ALL');
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const analytics = computeCrmAnalytics(crm);
  const today = todayISO();
  const resps = [...new Set(crm.map(l => l.resp).filter(Boolean))];

  const filtered = crm.filter(l => {
    if (stageFilter !== 'ALL' && l.stage !== stageFilter) return false;
    if (respFilter !== 'ALL' && l.resp !== respFilter) return false;
    if (q.trim()) {
      const hay = `${l.id} ${l.cli} ${l.obra} ${l.area} ${l.cidade || ''} ${l.phone || ''}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  const kanbanStages = ['Lead', 'Levantamento', 'Proposta', 'Negociação', 'Fechado'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 4 KPIs CRM */}
      <div className="kpi-grid-4" style={{ marginBottom: 0 }}>
        <div className="sky-card animate-rise" style={{ '--stagger': 0 }}>
          <div className="sky-kpi-top">
            <span className="sky-kpi-label">Pipeline em Negociação</span>
            <span className="sky-delta-pill pos">{analytics.active.length} ativos</span>
          </div>
          <div className="sky-kpi-value">
            <AnimatedNumber value={analytics.openPipeline} formatter={toBRL} />
          </div>
          <div className="sky-kpi-sub">Previsão ponderada: {toBRL(analytics.weightedForecast)}</div>
        </div>

        <div className="sky-card animate-rise" style={{ '--stagger': 1 }}>
          <div className="sky-kpi-top">
            <span className="sky-kpi-label">Contratos Fechados</span>
            <span className="sky-delta-pill pos">{analytics.winRate}% conv.</span>
          </div>
          <div className="sky-kpi-value">
            <AnimatedNumber value={analytics.wonValue} formatter={toBRL} />
          </div>
          <div className="sky-kpi-sub">{analytics.won.length} ganho(s) · {analytics.lost.length} perdido(s)</div>
        </div>

        <div className="sky-card animate-rise" style={{ '--stagger': 2 }}>
          <div className="sky-kpi-top">
            <span className="sky-kpi-label">Valor Médio / m²</span>
            <span className="sky-delta-pill neu">Eng. Civil</span>
          </div>
          <div className="sky-kpi-value">{analytics.avgPerM2 > 0 ? toBRL(analytics.avgPerM2) : '—'}</div>
          <div className="sky-kpi-sub">Referência das propostas comerciais</div>
        </div>

        <div className="sky-card animate-rise" style={{ '--stagger': 3 }}>
          <div className="sky-kpi-top">
            <span className="sky-kpi-label">Follow-ups Pendentes</span>
            <span className="sky-delta-pill neg">
              {analytics.active.filter(l => l.nextFollowUp && l.nextFollowUp < today).length} vencido(s)
            </span>
          </div>
          <div className="sky-kpi-value">
            {analytics.active.filter(l => l.nextFollowUp).length}
          </div>
          <div className="sky-kpi-sub">Arraste cards entre colunas no Kanban</div>
        </div>
      </div>

      {/* Toolbar CRM */}
      <div className="sky-card animate-rise" style={{ '--stagger': 4 }}>
        <div className="toolbar-row" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            <div className="search-box-wrap">
              <Search size={15} />
              <input
                type="text"
                className="sky-input"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar cliente, obra, cidade ou telefone..."
              />
            </div>

            <select
              className="sky-select"
              style={{ width: 'auto', minWidth: 160 }}
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
            >
              <option value="ALL">Todas as etapas</option>
              {CRM_STAGES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>

            <select
              className="sky-select"
              style={{ width: 'auto', minWidth: 170 }}
              value={respFilter}
              onChange={e => setRespFilter(e.target.value)}
            >
              <option value="ALL">Todos responsáveis</option>
              {resps.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="filter-segment">
              <button
                type="button"
                className={`filter-seg-btn ${mode === 'kanban' ? 'active' : ''}`}
                onClick={() => setMode('kanban')}
              >
                <LayoutGrid size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Kanban
              </button>
              <button
                type="button"
                className={`filter-seg-btn ${mode === 'table' ? 'active' : ''}`}
                onClick={() => setMode('table')}
              >
                <List size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Tabela
              </button>
            </div>

            <button type="button" className="btn btn-primary" onClick={onOpenNewLead}>
              <Plus size={15} /> Novo Lead
            </button>
          </div>
        </div>

        {mode === 'kanban' ? (
          <div className="kanban-grid">
            {kanbanStages.map(st => {
              const meta = CRM_STAGE_META[st];
              const items = filtered.filter(l => l.stage === st);
              const sum = items.reduce((a, b) => a + (+b.valorEst || 0), 0);
              return (
                <div
                  key={st}
                  className={`kanban-col ${dragOverStage === st ? 'drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOverStage(st); }}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOverStage(null);
                    if (draggingId) {
                      onMoveLeadStage(draggingId, st);
                      setDraggingId(null);
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: meta.color }}>{st}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{toBRL(sum)}</div>
                    </div>
                    <span className="nav-pill-count">{items.length}</span>
                  </div>

                  {items.map(l => {
                    const priceM2 = l.areaM2 > 0 ? l.valorEst / l.areaM2 : 0;
                    const lateFollow = l.nextFollowUp && l.nextFollowUp < today && l.stage !== 'Fechado';
                    return (
                      <div
                        key={l.id}
                        draggable
                        className="kanban-card"
                        onDragStart={() => setDraggingId(l.id)}
                        onDragEnd={() => { setDraggingId(null); setDragOverStage(null); }}
                        onClick={() => onOpenLead(l.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className="client-link-btn"
                            onClick={e => { e.stopPropagation(); onOpenClient(l.cli); }}
                          >
                            <span className="avatar-circle" style={{ width: 20, height: 20, fontSize: 9 }}>{getInitials(l.cli)}</span>
                            <span style={{ fontSize: 12.5 }}>{l.cli}</span>
                          </button>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--mu)' }}>{l.id}</span>
                        </div>

                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{l.obra}</div>

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span className="badge-pill" style={{ background: 'var(--bg-subtle)', color: 'var(--tx-dim)', fontSize: 11 }}>{l.area}</span>
                          {l.areaM2 > 0 && (
                            <span className="badge-pill" style={{ background: 'var(--bg-subtle)', color: 'var(--tx-dim)', fontSize: 11 }}>{l.areaM2} m²</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px solid var(--bd-light)' }}>
                          <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, color: 'var(--ac)' }}>{toBRL(l.valorEst)}</strong>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--mu)' }}>
                            {priceM2 > 0 ? `${toBRL(priceM2)}/m²` : `${l.probabilidade}%`}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: lateFollow ? 'var(--neg-tx)' : 'var(--mu)' }}>
                          <span>{l.nextFollowUp ? `Follow: ${formatDate(l.nextFollowUp)}` : 'Sem follow-up'}</span>
                          <span>{getInitials(l.resp)}</span>
                        </div>

                        {l.stage === 'Fechado' && !l.convertedProjectId && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={e => { e.stopPropagation(); onConvertLead(l.id); }}
                          >
                            Converter em Obra
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="sky-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Escopo / Obra</th>
                  <th>Etapa</th>
                  <th className="num">Área (m²)</th>
                  <th className="num">Proposta</th>
                  <th>Follow-up</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => onOpenLead(l.id)}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{l.id}</td>
                    <td>
                      <button
                        type="button"
                        className="client-link-btn"
                        onClick={e => { e.stopPropagation(); onOpenClient(l.cli); }}
                      >
                        {l.cli}
                      </button>
                    </td>
                    <td>{l.obra}</td>
                    <td>
                      <span className="badge-pill" style={{ background: 'var(--bg-subtle)', color: CRM_STAGE_META[l.stage]?.color }}>
                        {l.stage}
                      </span>
                    </td>
                    <td className="num">{l.areaM2 || '—'}</td>
                    <td className="num" style={{ fontWeight: 700, color: 'var(--ac)' }}>{toBRL(l.valorEst)}</td>
                    <td>{formatDate(l.nextFollowUp)}</td>
                    <td>
                      <button type="button" className="btn btn-sm" onClick={e => { e.stopPropagation(); onOpenLead(l.id); }}>
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function ClientsView({ projects, crm, onOpenClient, onOpenNewLead, onOpenNewProject }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('ALL');
  const directory = computeClientsDirectory(projects, crm);

  const filtered = directory.filter(c => {
    if (filter === 'DELIVERED' && c.deliveredCount === 0) return false;
    if (filter === 'ACTIVE' && c.activeCount === 0) return false;
    if (filter === 'PENDING' && c.totalBalance <= 0) return false;
    if (q.trim()) {
      const hay = `${c.name} ${Object.keys(c.disciplines).join(' ')}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  const recurring = directory.filter(c => c.projects.length >= 2).length;
  const totalGenerated = directory.reduce((s, c) => s + c.totalValor, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="kpi-grid-4" style={{ marginBottom: 0 }}>
        <div className="sky-card animate-rise" style={{ '--stagger': 0 }}>
          <div className="sky-kpi-top"><span className="sky-kpi-label">Total de Clientes</span><span className="sky-delta-pill pos">Carteira</span></div>
          <div className="sky-kpi-value">{directory.length}</div>
          <div className="sky-kpi-sub">{recurring} recorrente(s) (2+ obras)</div>
        </div>
        <div className="sky-card animate-rise" style={{ '--stagger': 1 }}>
          <div className="sky-kpi-top"><span className="sky-kpi-label">Receita Total da Carteira</span></div>
          <div className="sky-kpi-value">{toBRL(totalGenerated)}</div>
          <div className="sky-kpi-sub">Soma histórica de contratos</div>
        </div>
        <div className="sky-card animate-rise" style={{ '--stagger': 2 }}>
          <div className="sky-kpi-top"><span className="sky-kpi-label">Projetos Entregues</span></div>
          <div className="sky-kpi-value">{directory.reduce((s, c) => s + c.deliveredCount, 0)}</div>
          <div className="sky-kpi-sub">Obras finalizadas na LR</div>
        </div>
        <div className="sky-card animate-rise" style={{ '--stagger': 3 }}>
          <div className="sky-kpi-top"><span className="sky-kpi-label">Saldo Pendente Total</span></div>
          <div className="sky-kpi-value">{toBRL(directory.reduce((s, c) => s + c.totalBalance, 0))}</div>
          <div className="sky-kpi-sub">A receber de clientes</div>
        </div>
      </div>

      <div className="sky-card animate-rise" style={{ '--stagger': 4 }}>
        <div className="toolbar-row">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            <div className="search-box-wrap">
              <Search size={15} />
              <input
                type="text"
                className="sky-input"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar cliente ou disciplina..."
              />
            </div>

            <div className="filter-segment">
              {[
                ['ALL', 'Todos'],
                ['DELIVERED', 'Com Entregas'],
                ['ACTIVE', 'Obras Ativas'],
                ['PENDING', 'Saldo a Receber']
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`filter-seg-btn ${filter === id ? 'active' : ''}`}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={onOpenNewLead}>+ Prospectar CRM</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onOpenNewProject}>+ Nova Obra</button>
          </div>
        </div>

        <div className="table-scroll">
          <table className="sky-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Entregues / Ativos</th>
                <th>Disciplinas Realizadas</th>
                <th className="num">Total Gerado</th>
                <th className="num">Lucro LR</th>
                <th className="num">A Receber</th>
                <th>CRM</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const openCrm = c.crmLeads.filter(l => l.stage !== 'Fechado' && l.stage !== 'Perdido').length;
                return (
                  <tr key={c.name} style={{ cursor: 'pointer' }} onClick={() => onOpenClient(c.name)}>
                    <td>
                      <span className="client-link-btn">
                        <span className="avatar-circle" style={{ width: 28, height: 28 }}>{getInitials(c.name)}</span>
                        <span>{c.name}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <span className="badge-pill badge-done">{c.deliveredCount} entregue(s)</span>
                        {c.activeCount > 0 && <span className="badge-pill badge-dev">{c.activeCount} ativa(s)</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 230 }}>
                        {Object.entries(c.disciplines).map(([disc, cnt]) => (
                          <span key={disc} className="badge-pill" style={{ background: 'var(--bg-subtle)', color: 'var(--tx-dim)', fontSize: 11 }}>
                            {disc}{cnt > 1 ? ` (${cnt})` : ''}
                          </span>
                        ))}
                        {!Object.keys(c.disciplines).length && <span style={{ color: 'var(--mu)', fontSize: 12 }}>Prospect CRM</span>}
                      </div>
                    </td>
                    <td className="num" style={{ fontWeight: 700 }}>{toBRL(c.totalValor)}</td>
                    <td className="num" style={{ color: 'var(--pos-tx)', fontWeight: 600 }}>{toBRL(c.totalProfit)}</td>
                    <td className="num" style={{ color: c.totalBalance > 0 ? 'var(--neg-tx)' : 'var(--mu)' }}>{toBRL(c.totalBalance)}</td>
                    <td>
                      {openCrm > 0 ? <span className="badge-pill badge-appr">{openCrm} aberta(s)</span> : <span style={{ color: 'var(--mu)' }}>—</span>}
                    </td>
                    <td>
                      <button type="button" className="btn btn-sm" onClick={e => { e.stopPropagation(); onOpenClient(c.name); }}>
                        Ver Dossiê
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ProjectsView({
  projects,
  filter,
  onFilterChange,
  onCycleStatus,
  onOpenProject,
  onOpenNewProject,
  onOpenClient,
  onOpenMember
}) {
  const [q, setQ] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    const onKey = e => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = projects.filter(p => {
    if (filter === 'late' && !isLate(p)) return false;
    else if (filter !== 'ALL' && filter !== 'late' && p.st !== filter) return false;
    if (q.trim()) {
      const hay = `${p.id} ${p.cli} ${p.obra} ${p.area} ${p.resp || ''}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="sky-card animate-rise">
      <div className="toolbar-row">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box-wrap">
            <Search size={15} />
            <input
              ref={searchRef}
              type="text"
              className="sky-input"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar por cliente, obra, código ou responsável... ('/')"
            />
          </div>

          <div className="filter-segment">
            {[
              ['ALL', `Todos (${projects.length})`],
              [STATUS_DEV, 'Em Dev'],
              [STATUS_APPR, 'Aguardando'],
              [STATUS_DONE, 'Concluídos'],
              ['late', 'Atrasados']
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`filter-seg-btn ${filter === id ? 'active' : ''}`}
                onClick={() => onFilterChange(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-sm" onClick={() => exportProjectsCSV(filtered)}>
            <Download size={14} /> CSV
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenNewProject}>
            <Plus size={14} /> Nova Obra
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="sky-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Obra / Projeto</th>
              <th>Disciplina</th>
              <th>Prazo</th>
              <th>Status</th>
              <th className="num">Contratado</th>
              <th className="num">Recebido</th>
              <th className="num">Custos</th>
              <th className="num">Lucro LR</th>
              <th>Responsável</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const late = isLate(p);
              const lucro = getLucro(p);
              const margem = getMargem(p);
              const statusCls = p.st === STATUS_DONE ? 'badge-done' : p.st === STATUS_APPR ? 'badge-appr' : 'badge-dev';
              return (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>{p.id}</td>
                  <td>
                    <button type="button" className="client-link-btn" onClick={() => onOpenClient(p.cli)}>
                      {p.cli}
                    </button>
                  </td>
                  <td style={{ fontWeight: 500 }}>{p.obra}</td>
                  <td><span className="badge-pill" style={{ background: 'var(--bg-subtle)', color: 'var(--tx-dim)', fontSize: 11 }}>{p.area}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: late ? 'var(--neg-tx)' : 'var(--tx-dim)', fontWeight: late ? 700 : 400 }}>
                    {formatDate(p.prazo)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`badge-pill ${statusCls}`}
                      style={{ cursor: 'pointer' }}
                      title="Clique para alternar status"
                      onClick={() => onCycleStatus(p.id)}
                    >
                      {p.st}
                    </button>
                  </td>
                  <td className="num">{toBRL(p.valor)}</td>
                  <td className="num">{toBRL(p.rec)} ({getPercentage(p)}%)</td>
                  <td className="num">{toBRL(getCustoTotal(p))}</td>
                  <td className="num" style={{ color: 'var(--pos-tx)', fontWeight: 700 }}>
                    {toBRL(lucro)} <span style={{ fontSize: 10.5, color: 'var(--mu)' }}>({margem}%)</span>
                  </td>
                  <td>
                    {p.resp ? (
                      <button type="button" className="client-link-btn" onClick={() => onOpenMember(p.resp)}>
                        <span className="avatar-circle" style={{ width: 22, height: 22, fontSize: 9.5 }}>{getInitials(p.resp)}</span>
                        <span style={{ fontSize: 12 }}>{p.resp}</span>
                      </button>
                    ) : <span style={{ color: 'var(--mu)' }}>—</span>}
                  </td>
                  <td>
                    <button type="button" className="btn btn-sm" onClick={() => onOpenProject(p.id)} title="Editar obra">
                      <Edit3 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FinancialView({
  projects,
  onOpenBreakdown,
  onMarkReceived,
  onOpenClient,
  onOpenMember,
  onOpenReceivablesModal
}) {
  const [period, setPeriod] = useState('ALL');
  const [customStart, setCustomStart] = useState('2026-01-01');
  const [customEnd, setCustomEnd] = useState(todayISO());

  const filtered = filterProjectsByPeriod(projects, period, customStart, customEnd);
  const series = buildMonthlySeries(filtered);

  const totalValor = projects.reduce((s, p) => s + (+p.valor || 0), 0);
  const totalRec = projects.reduce((s, p) => s + (+p.rec || 0), 0);
  const totalPend = projects.reduce((s, p) => s + getBalance(p), 0);
  const totalProfitAll = projects.reduce((s, p) => s + getLucro(p), 0);

  const pValor = filtered.reduce((s, p) => s + (+p.valor || 0), 0);
  const pCosts = filtered.reduce((s, p) => s + getCustoTotal(p), 0);
  const pProfit = filtered.reduce((s, p) => s + getLucro(p), 0);

  const donutSegments = [
    { label: 'Lucro Líquido', value: Math.max(0, pProfit), color: '#248b63' },
    { label: 'Honorários Equipe', value: filtered.reduce((s, p) => s + (+p.custoResp || 0), 0), color: '#3b82f6' },
    { label: 'Taxas & Extras', value: filtered.reduce((s, p) => s + (+p.custosExtras || 0), 0), color: '#f59e0b' }
  ];

  const teamMembers = computeTeamMembers(projects);
  const maxTeamVal = Math.max(1, ...teamMembers.map(m => m.totalValor));
  const pendingProjects = projects.filter(p => getBalance(p) > 0).sort((a, b) => getBalance(b) - getBalance(a));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="kpi-grid-4" style={{ marginBottom: 0 }}>
        <div className="sky-card animate-rise" style={{ '--stagger': 0 }}>
          <div className="sky-kpi-top"><span className="sky-kpi-label">Contratado Total</span></div>
          <div className="sky-kpi-value"><AnimatedNumber value={totalValor} formatter={toBRL} /></div>
          <div className="sky-kpi-sub">{projects.length} contratos acumulados</div>
        </div>
        <div className="sky-card animate-rise" style={{ '--stagger': 1 }}>
          <div className="sky-kpi-top"><span className="sky-kpi-label">Recebido em Caixa</span><span className="sky-delta-pill pos">{totalValor ? Math.round((totalRec / totalValor) * 100) : 0}%</span></div>
          <div className="sky-kpi-value"><AnimatedNumber value={totalRec} formatter={toBRL} /></div>
          <div className="sky-kpi-sub">Entrada liquidada</div>
        </div>
        <div className="sky-card sky-card-interactive animate-rise" style={{ '--stagger': 2 }} onClick={onOpenReceivablesModal}>
          <div className="sky-kpi-top"><span className="sky-kpi-label">Saldo a Receber</span><span className="sky-delta-pill neg">{pendingProjects.length} pend.</span></div>
          <div className="sky-kpi-value"><AnimatedNumber value={totalPend} formatter={toBRL} /></div>
          <div className="sky-kpi-sub">Clique para abrir quitação rápida</div>
        </div>
        <div className="sky-card animate-rise" style={{ '--stagger': 3 }}>
          <div className="sky-kpi-top"><span className="sky-kpi-label">Lucro Líquido LR</span><span className="sky-delta-pill pos">{totalValor ? Math.round((totalProfitAll / totalValor) * 100) : 0}%</span></div>
          <div className="sky-kpi-value"><AnimatedNumber value={totalProfitAll} formatter={toBRL} /></div>
          <div className="sky-kpi-sub">Líquido após honorários e taxas</div>
        </div>
      </div>

      {/* Gráfico + KPIs clicáveis do período (Faturamento / Custos / Lucro) */}
      <div className="sky-card animate-rise" style={{ '--stagger': 4 }}>
        <div className="sky-card-head">
          <div>
            <h2 className="sky-card-title">Desempenho Financeiro no Período</h2>
            <span style={{ fontSize: 12, color: 'var(--mu)' }}>Clique nos cartões abaixo para dissecar obra por obra com rolagem detalhada</span>
          </div>
          <div className="filter-segment">
            {[
              ['30D', '30D'],
              ['3M', '3M'],
              ['6M', '6M'],
              ['1A', '1 Ano'],
              ['ALL', 'Todo Período'],
              ['CUSTOM', 'Personalizado']
            ].map(([id, label]) => (
              <button key={id} type="button" className={`filter-seg-btn ${period === id ? 'active' : ''}`} onClick={() => setPeriod(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {period === 'CUSTOM' && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="date" className="sky-input" style={{ width: 'auto' }} value={customStart} onChange={e => setCustomStart(e.target.value)} />
            <span>até</span>
            <input type="date" className="sky-input" style={{ width: 'auto' }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 16 }}>
          <button
            type="button"
            className="sky-card sky-card-interactive"
            style={{ textAlign: 'left', padding: 14 }}
            onClick={() => onOpenBreakdown('faturamento', filtered)}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase' }}>Faturamento no Período →</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginTop: 4 }}>{toBRL(pValor)}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ac)', marginTop: 2 }}>Clique para detalhar {filtered.length} contratos</div>
          </button>

          <button
            type="button"
            className="sky-card sky-card-interactive"
            style={{ textAlign: 'left', padding: 14 }}
            onClick={() => onOpenBreakdown('custos', filtered)}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase' }}>Custos no Período →</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--neg-tx)', marginTop: 4 }}>{toBRL(pCosts)}</div>
            <div style={{ fontSize: 11.5, color: 'var(--mu)', marginTop: 2 }}>Honorários + Taxas / Extras</div>
          </button>

          <button
            type="button"
            className="sky-card sky-card-interactive"
            style={{ textAlign: 'left', padding: 14 }}
            onClick={() => onOpenBreakdown('lucro', filtered)}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase' }}>Lucro Líquido no Período →</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--pos-tx)', marginTop: 4 }}>{toBRL(pProfit)}</div>
            <div style={{ fontSize: 11.5, color: 'var(--mu)', marginTop: 2 }}>Margem média {pValor ? Math.round((pProfit / pValor) * 100) : 0}%</div>
          </button>
        </div>

        <SkymetricsSplineChart series={series} />
      </div>

      <div className="split-2-even" style={{ marginBottom: 0 }}>
        <div className="sky-card animate-rise" style={{ '--stagger': 5 }}>
          <div className="sky-card-head">
            <h2 className="sky-card-title">Destinação de Cada R$ Faturado</h2>
          </div>
          <SkymetricsDonutChart
            segments={donutSegments}
            centerValue={pValor ? `${Math.round((pProfit / pValor) * 100)}%` : '0%'}
            centerLabel="Margem LR"
          />
        </div>

        <div className="sky-card animate-rise" style={{ '--stagger': 6 }}>
          <div className="sky-card-head">
            <h2 className="sky-card-title">Faturamento vs. Honorários por Responsável</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {teamMembers.slice(0, 6).map((m, idx) => (
              <div key={m.name} style={{ cursor: 'pointer' }} onClick={() => onOpenMember(m.name)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <strong>{m.name}</strong>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                    {toBRL(m.totalValor)} <span style={{ color: 'var(--mu)' }}>(Hon: {toBRL(m.totalCustoResp)})</span>
                  </span>
                </div>
                <div style={{ height: 10, background: 'var(--bg-subtle)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
                  <div
                    className="animate-bar-x"
                    style={{
                      width: `${Math.round((m.totalValor / maxTeamVal) * 100)}%`,
                      height: '100%',
                      background: 'var(--ac)',
                      borderRadius: 999,
                      '--stagger': idx
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contas a Receber */}
      <div className="sky-card animate-rise" style={{ '--stagger': 7 }}>
        <div className="sky-card-head">
          <h2 className="sky-card-title">Contas a Receber em Aberto ({pendingProjects.length})</h2>
          <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--neg-tx)' }}>{toBRL(totalPend)}</strong>
        </div>
        <div className="table-scroll">
          <table className="sky-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente & Obra</th>
                <th>Prazo</th>
                <th className="num">Contratado</th>
                <th className="num">Já Recebido</th>
                <th className="num">Saldo Pendente</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {pendingProjects.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.id}</td>
                  <td>
                    <button type="button" className="client-link-btn" onClick={() => onOpenClient(p.cli)}>{p.cli}</button>
                    <span style={{ color: 'var(--tx-dim)' }}> · {p.obra}</span>
                  </td>
                  <td>{formatDate(p.prazo)}</td>
                  <td className="num">{toBRL(p.valor)}</td>
                  <td className="num">{toBRL(p.rec)}</td>
                  <td className="num" style={{ color: 'var(--neg-tx)', fontWeight: 700 }}>{toBRL(getBalance(p))}</td>
                  <td>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => onMarkReceived(p.id)}>
                      <Check size={13} /> Receber
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function CalendarView({ projects, selectedDay, onSelectDay, onOpenProject, onOpenClient }) {
  const [cursor, setCursor] = useState(() => {
    const dt = new Date((selectedDay || todayISO()) + 'T12:00:00');
    return { year: dt.getFullYear(), month: dt.getMonth() };
  });

  const firstDay = new Date(cursor.year, cursor.month, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const monthLabel = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const today = todayISO();

  const shiftMonth = delta => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const dayList = projects.filter(p => p.prazo === selectedDay);

  return (
    <div className="charts-split-row" style={{ marginBottom: 0 }}>
      <div className="sky-card animate-rise">
        <div className="sky-card-head">
          <h2 className="sky-card-title" style={{ textTransform: 'capitalize' }}>
            <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {monthLabel}
          </h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="icon-btn-round" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></button>
            <button type="button" className="btn btn-sm" onClick={() => {
              const t = new Date();
              setCursor({ year: t.getFullYear(), month: t.getMonth() });
              onSelectDay(today);
            }}>Hoje</button>
            <button type="button" className="icon-btn-round" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="calendar-grid" style={{ marginBottom: 6 }}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(w => (
            <div key={w} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: 'var(--mu)', padding: '4px 0' }}>{w}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {Array.from({ length: startDow }, (_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const iso = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const items = projects.filter(p => p.prazo === iso);
            return (
              <div
                key={iso}
                className={`cal-cell ${selectedDay === iso ? 'selected' : ''}`}
                style={{ background: iso === today ? 'var(--ac-subtle)' : undefined }}
                onClick={() => onSelectDay(iso)}
              >
                <span style={{ fontSize: 12, fontWeight: 700 }}>{day}</span>
                {items.slice(0, 2).map(p => (
                  <span
                    key={p.id}
                    className={`badge-pill ${p.st === STATUS_DONE ? 'badge-done' : isLate(p) ? 'badge-late' : 'badge-dev'}`}
                    style={{ fontSize: 10, padding: '2px 6px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {p.cli}
                  </span>
                ))}
                {items.length > 2 && <span style={{ fontSize: 10, color: 'var(--mu)' }}>+{items.length - 2} mais</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sky-card animate-rise" style={{ '--stagger': 1 }}>
        <div className="sky-card-head">
          <h2 className="sky-card-title">Entregas em {formatDate(selectedDay)}</h2>
          <span className="nav-pill-count">{dayList.length}</span>
        </div>

        {dayList.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dayList.map(p => (
              <div key={p.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--bd)', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <button type="button" className="client-link-btn" onClick={() => onOpenClient(p.cli)}>{p.cli}</button>
                  <span className={`badge-pill ${p.st === STATUS_DONE ? 'badge-done' : 'badge-dev'}`}>{p.st}</span>
                </div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{p.obra}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--mu)' }}>
                  <span>{p.area} · {toBRL(p.valor)}</span>
                  <button type="button" className="btn btn-sm" onClick={() => onOpenProject(p.id)}>Inspecionar</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--mu)' }}>Nenhuma entrega prevista para esta data.</p>
        )}
      </div>
    </div>
  );
}
