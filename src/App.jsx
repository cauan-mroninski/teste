import React, { useCallback, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { LR_LOGO } from './data/logo';
import {
  AUTH_STORAGE_KEY,
  buildSeedProjects,
  computeClientsDirectory,
  computeTeamMembers,
  CRM_STAGE_META,
  ensureCostFields,
  ensureCrmFields,
  loadInitialState,
  SEED_CRM,
  STATUS_APPR,
  STATUS_DEV,
  STATUS_DONE,
  STORAGE_KEY,
  toBRL,
  todayISO
} from './data/seed';
import { LoginBackground3D, Preloader3D } from './components/Scene3D';
import { Sidebar, Topbar } from './components/Sidebar';
import { OverviewView } from './components/OverviewView';
import { CalendarView, ClientsView, CrmView, FinancialView, ProjectsView } from './components/WorkspaceViews';
import {
  ClientDrawer,
  CrmDetailDrawer,
  CrmFormModal,
  MemberDrawer,
  PeriodBreakdownModal,
  ProjectFormModal,
  ReceivablesModal
} from './components/Modals';

function getSystemDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function App() {
  const [appData, setAppData] = useState(loadInitialState);
  const [activeTab, setActiveTab] = useState('painel');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState(todayISO);

  // Dark Mode Toggle per modern-web-guidance (meta color-scheme + localStorage + OS sync)
  const [storedScheme, setStoredScheme] = useState(() => {
    try {
      const s = localStorage.getItem('color-scheme');
      return s === 'light' || s === 'dark' ? s : null;
    } catch {
      return null;
    }
  });
  const [sysDark, setSysDark] = useState(getSystemDark);
  const isDark = (storedScheme || (sysDark ? 'dark' : 'light')) === 'dark';

  // Auth Gate + Post-login 3D Preloader
  const [authenticated, setAuthenticated] = useState(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'valid' || sessionStorage.getItem(AUTH_STORAGE_KEY) === 'valid';
    } catch {
      return false;
    }
  });
  const [showPreloader, setShowPreloader] = useState(false);
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [rememberAuth, setRememberAuth] = useState(true);
  const [authError, setAuthError] = useState('');

  // Drawers & Modals state
  const [clientDrawerName, setClientDrawerName] = useState(null);
  const [crmDetailId, setCrmDetailId] = useState(null);
  const [memberDrawerName, setMemberDrawerName] = useState(null);
  const [projectModalState, setProjectModalState] = useState({ open: false, id: null, client: '' });
  const [crmModalState, setCrmModalState] = useState({ open: false, id: null, client: '' });
  const [breakdownState, setBreakdownState] = useState(null);
  const [receivablesOpen, setReceivablesOpen] = useState(false);

  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((text, icon = '✓') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, text, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const triggerConfetti = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      confetti({ particleCount: 55, spread: 68, origin: { y: 0.72 } });
    } catch {
      // ignore if canvas unavailable
    }
  }, []);

  // Persist locally in browser only
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
      console.warn('Erro ao salvar localStorage:', e);
    }
  }, [appData]);

  // Sync <meta name="color-scheme"> and watch OS & cross-tab storage
  useEffect(() => {
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.content = storedScheme ?? 'light dark';
  }, [storedScheme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onMq = e => setSysDark(e.matches);
    mq.addEventListener('change', onMq);
    const onStorage = e => {
      if (e.key === 'color-scheme') {
        setStoredScheme(e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      mq.removeEventListener('change', onMq);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Circular Propagating Theme Ripple via View Transitions API
  const handleToggleTheme = e => {
    const target = isDark ? 'light' : 'dark';
    const currentSys = getSystemDark() ? 'dark' : 'light';
    const nextStored = target === currentSys ? null : target;

    const commitTheme = () => {
      try {
        if (nextStored === null) localStorage.removeItem('color-scheme');
        else localStorage.setItem('color-scheme', nextStored);
      } catch {}
      setStoredScheme(nextStored);
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.content = nextStored ?? 'light dark';
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduced) {
      commitTheme();
      return;
    }

    const rect = e?.currentTarget?.getBoundingClientRect?.();
    const x = e?.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth - 60);
    const y = e?.clientY || (rect ? rect.top + rect.height / 2 : 30);
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = document.startViewTransition(() => {
      commitTheme();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
        },
        {
          duration: 560,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    }).catch(() => {});
  };

  // Auth Handlers
  const handleLogin = e => {
    e.preventDefault();
    if (pwd.trim().toLowerCase() === 'lr2026') {
      setAuthError('');
      try {
        if (rememberAuth) localStorage.setItem(AUTH_STORAGE_KEY, 'valid');
        else sessionStorage.setItem(AUTH_STORAGE_KEY, 'valid');
      } catch {}
      setAuthenticated(true);
      setShowPreloader(true);
      setPwd('');
    } else {
      setAuthError('Senha incorreta. Para teste local digite lr2026.');
    }
  };

  const handleLock = () => {
    if (!window.confirm('Deseja bloquear o Cockpit e sair?')) return;
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    setAuthenticated(false);
    setShowPreloader(false);
  };

  const handleResetSandbox = () => {
    if (!window.confirm('Restaurar os dados iniciais de demonstração neste navegador?')) return;
    setAppData({
      name: 'Lucas',
      p: buildSeedProjects(),
      crm: SEED_CRM.map(c => ensureCrmFields(JSON.parse(JSON.stringify(c))))
    });
    showToast('Dados locais restaurados!', '↺');
  };

  // Derived collections
  const clientsDirectory = useMemo(() => computeClientsDirectory(appData.p, appData.crm), [appData.p, appData.crm]);
  const teamMembers = useMemo(() => computeTeamMembers(appData.p), [appData.p]);
  const clientsNames = useMemo(() => clientsDirectory.map(c => c.name), [clientsDirectory]);

  // Project Mutations
  const handleCycleStatus = id => {
    const order = [STATUS_DEV, STATUS_APPR, STATUS_DONE];
    let becameDone = false;
    let nextLabel = '';
    setAppData(prev => ({
      ...prev,
      p: prev.p.map(item => {
        if (item.id !== id) return item;
        const nextSt = order[(order.indexOf(item.st) + 1) % order.length];
        if (nextSt === STATUS_DONE) becameDone = true;
        nextLabel = nextSt;
        return { ...item, st: nextSt };
      })
    }));
    if (becameDone) {
      triggerConfetti();
      showToast(`Obra ${id} concluída!`, '🎉');
    } else {
      showToast(`Obra ${id}: ${nextLabel}`);
    }
  };

  const handleDeliverProject = id => {
    setAppData(prev => ({
      ...prev,
      p: prev.p.map(item => (item.id === id ? { ...item, st: STATUS_DONE } : item))
    }));
    triggerConfetti();
    showToast(`Obra ${id} entregue ao cliente!`, '🎉');
  };

  const handleMarkReceived = id => {
    let valMsg = '';
    setAppData(prev => ({
      ...prev,
      p: prev.p.map(item => {
        if (item.id !== id) return item;
        valMsg = toBRL(Math.max(0, (+item.valor || 0) - (+item.rec || 0)));
        return { ...item, rec: +item.valor || 0 };
      })
    }));
    triggerConfetti();
    showToast(`Obra ${id}: ${valMsg} recebido com sucesso!`, '💰');
  };

  const handleSaveProject = payload => {
    if (projectModalState.id) {
      setAppData(prev => ({
        ...prev,
        p: prev.p.map(item => (item.id === projectModalState.id ? ensureCostFields({ ...item, ...payload }) : item))
      }));
      showToast(`Obra ${projectModalState.id} atualizada!`);
    } else {
      const maxNum = appData.p.reduce((mx, x) => Math.max(mx, parseInt(String(x.id).replace(/\D/g, ''), 10) || 0), 27);
      const newId = 'PRJ-' + String(maxNum + 1).padStart(4, '0');
      setAppData(prev => ({
        ...prev,
        p: [ensureCostFields({ ...payload, id: newId }), ...prev.p]
      }));
      showToast(`Nova obra ${newId} criada!`, '📐');
    }
    setProjectModalState({ open: false, id: null, client: '' });
  };

  const handleDeleteProject = id => {
    if (!window.confirm(`Excluir obra ${id}?`)) return;
    setAppData(prev => ({ ...prev, p: prev.p.filter(item => item.id !== id) }));
    setProjectModalState({ open: false, id: null, client: '' });
    showToast(`Obra ${id} excluída.`);
  };

  // CRM Mutations
  const handleMoveLeadStage = (leadId, newStage) => {
    setAppData(prev => ({
      ...prev,
      crm: prev.crm.map(l => {
        if (l.id !== leadId || l.stage === newStage) return l;
        const nextProb = CRM_STAGE_META[newStage]?.prob ?? l.probabilidade;
        const log = { date: todayISO(), type: 'Etapa', text: `Movido de "${l.stage}" para "${newStage}".` };
        return { ...l, stage: newStage, probabilidade: nextProb, logs: [log, ...(l.logs || [])] };
      })
    }));
    if (newStage === 'Fechado') triggerConfetti();
    showToast(`Lead ${leadId} → ${newStage}`);
  };

  const handleAddCrmLog = (leadId, type, text) => {
    setAppData(prev => ({
      ...prev,
      crm: prev.crm.map(l =>
        l.id === leadId ? { ...l, logs: [{ date: todayISO(), type, text }, ...(l.logs || [])] } : l
      )
    }));
    showToast('Interação registrada no CRM!');
  };

  const handleConvertLeadToProject = leadId => {
    const lead = appData.crm.find(l => l.id === leadId);
    if (!lead || lead.convertedProjectId) return;
    const maxNum = appData.p.reduce((mx, x) => Math.max(mx, parseInt(String(x.id).replace(/\D/g, ''), 10) || 0), 27);
    const newId = 'PRJ-' + String(maxNum + 1).padStart(4, '0');
    const newProj = ensureCostFields({
      id: newId,
      cli: lead.cli,
      obra: lead.obra,
      area: lead.area || 'Projeto Civil',
      tipo: 'Projeto novo',
      ini: todayISO(),
      prazo: lead.prazoDesejado || todayISO(),
      st: STATUS_DEV,
      valor: +lead.valorEst || 0,
      rec: 0,
      resp: lead.resp || 'Lucas',
      custoResp: Math.round((+lead.valorEst || 0) * 0.35),
      custosExtras: Math.round((+lead.valorEst || 0) * 0.08),
      custosNotas: `Convertido do ${lead.id}`,
      obs: lead.obs || ''
    });

    setAppData(prev => ({
      ...prev,
      p: [newProj, ...prev.p],
      crm: prev.crm.map(l =>
        l.id === leadId
          ? {
              ...l,
              stage: 'Fechado',
              probabilidade: 100,
              convertedProjectId: newId,
              logs: [{ date: todayISO(), type: 'Contrato', text: `Convertido na obra ${newId}.` }, ...(l.logs || [])]
            }
          : l
      )
    }));
    triggerConfetti();
    showToast(`Lead ${leadId} convertido em ${newId}!`, '🚀');
  };

  const handleSaveLead = payload => {
    if (crmModalState.id) {
      setAppData(prev => ({
        ...prev,
        crm: prev.crm.map(l => (l.id === crmModalState.id ? ensureCrmFields({ ...l, ...payload }) : l))
      }));
      showToast(`Lead ${crmModalState.id} atualizado!`);
    } else {
      const maxNum = appData.crm.reduce((mx, x) => Math.max(mx, parseInt(String(x.id).replace(/\D/g, ''), 10) || 0), 0);
      const newId = 'CRM-' + String(maxNum + 1).padStart(4, '0');
      setAppData(prev => ({
        ...prev,
        crm: [
          ensureCrmFields({
            ...payload,
            id: newId,
            convertedProjectId: '',
            createdAt: todayISO(),
            logs: [{ date: todayISO(), type: 'Cadastro', text: `Oportunidade criada na etapa "${payload.stage}".` }]
          }),
          ...prev.crm
        ]
      }));
      showToast(`Novo lead ${newId} criado!`, '🎯');
    }
    setCrmModalState({ open: false, id: null, client: '' });
  };

  const handleDeleteLead = id => {
    if (!window.confirm(`Excluir oportunidade ${id}?`)) return;
    setAppData(prev => ({ ...prev, crm: prev.crm.filter(l => l.id !== id) }));
    setCrmDetailId(null);
    showToast(`Lead ${id} excluído.`);
  };

  const tabMeta = {
    painel: { title: 'Visão Geral', subtitle: `Boa sessão, ${appData.name} · Telemetria operacional e comercial em tempo real local` },
    crm: { title: 'CRM & Funil Civil', subtitle: 'Propostas, m², follow-ups e conversão em obras com 1 clique' },
    clientes: { title: 'Carteira de Clientes', subtitle: 'Clique em qualquer cliente para abrir o dossiê completo de entregas e valores' },
    proj: { title: 'Projetos & Obras', subtitle: 'Controle completo de prazos, recebimentos, custos e lucratividade' },
    fin: { title: 'Financeiro', subtitle: 'Fluxo de caixa, evolução mensal, margem líquida e repasses' },
    cal: { title: 'Calendário de Entregas', subtitle: 'Prazos previstos e entregas realizadas por data' }
  }[activeTab];

  const activeLead = appData.crm.find(l => l.id === crmDetailId) || null;
  const editingProj = appData.p.find(p => p.id === projectModalState.id) || null;
  const editingLead = appData.crm.find(l => l.id === crmModalState.id) || null;

  return (
    <>
      {!authenticated && (
        <div className="auth-overlay-3d">
          <LoginBackground3D isDark={isDark} />
          <div className="auth-glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, marginBottom: 18, borderBottom: '1px solid var(--bd)' }}>
              <img src={LR_LOGO} alt="LR Engenharia" className="brand-logo" />
              <div>
                <div className="brand-title">LR Engenharia</div>
                <div className="brand-sub">Cockpit & CRM · Sandbox Local</div>
              </div>
            </div>

            <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 20 }}>Acesso ao Sistema</h2>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--mu)' }}>
              Digite a senha da equipe (lr2026) para iniciar. Os dados ficam salvos temporariamente só no navegador.
            </p>

            <form onSubmit={handleLogin}>
              <label htmlFor="auth-password" style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--tx-dim)', marginBottom: 6 }}>
                SENHA DE ACESSO
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-password"
                  type={showPwd ? 'text' : 'password'}
                  className="sky-input"
                  style={{ paddingRight: 40, height: 44 }}
                  placeholder="Digite a senha..."
                  value={pwd}
                  onChange={e => setPwd(e.target.value)}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--mu)'
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {authError && (
                <div style={{ color: 'var(--neg-tx)', fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>{authError}</div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 18px', fontSize: 12.5, color: 'var(--tx-dim)', cursor: 'pointer' }}>
                <input type="checkbox" checked={rememberAuth} onChange={e => setRememberAuth(e.target.checked)} />
                Manter conectado neste navegador
              </label>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 44, fontSize: 14 }}>
                <Lock size={15} /> Entrar no Cockpit
              </button>
            </form>
          </div>
        </div>
      )}

      {authenticated && showPreloader && (
        <Preloader3D isDark={isDark} logo={LR_LOGO} onDone={() => setShowPreloader(false)} />
      )}

      {authenticated && !showPreloader && (
        <div className="app-shell">
          <Sidebar
            logo={LR_LOGO}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            projects={appData.p}
            crm={appData.crm}
            clientsCount={clientsDirectory.length}
            teamMembers={teamMembers}
            onOpenNewProject={() => setProjectModalState({ open: true, id: null, client: '' })}
            onOpenNewLead={() => setCrmModalState({ open: true, id: null, client: '' })}
            onOpenMember={name => setMemberDrawerName(name)}
            isDark={isDark}
            onToggleTheme={handleToggleTheme}
            onResetSandbox={handleResetSandbox}
          />

          <div className="app-main-wrap">
            <Topbar
              title={tabMeta.title}
              subtitle={tabMeta.subtitle}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              isDark={isDark}
              onToggleTheme={handleToggleTheme}
              onLock={handleLock}
              userName={appData.name}
            />

            <main className="page-content">
              {activeTab === 'painel' && (
                <OverviewView
                  projects={appData.p}
                  crm={appData.crm}
                  onSelectTab={setActiveTab}
                  onSetProjectFilter={setProjectFilter}
                  onOpenClient={name => setClientDrawerName(name)}
                  onOpenProject={id => setProjectModalState({ open: true, id, client: '' })}
                  onCycleStatus={handleCycleStatus}
                  onDeliverProject={handleDeliverProject}
                  onOpenLead={id => setCrmDetailId(id)}
                  onOpenNewLead={() => setCrmModalState({ open: true, id: null, client: '' })}
                  onOpenDayInspector={iso => {
                    setSelectedDay(iso);
                    setActiveTab('cal');
                  }}
                />
              )}

              {activeTab === 'crm' && (
                <CrmView
                  crm={appData.crm}
                  onOpenLead={id => setCrmDetailId(id)}
                  onOpenNewLead={() => setCrmModalState({ open: true, id: null, client: '' })}
                  onMoveLeadStage={handleMoveLeadStage}
                  onConvertLead={handleConvertLeadToProject}
                  onOpenClient={name => setClientDrawerName(name)}
                />
              )}

              {activeTab === 'clientes' && (
                <ClientsView
                  projects={appData.p}
                  crm={appData.crm}
                  onOpenClient={name => setClientDrawerName(name)}
                  onOpenNewLead={() => setCrmModalState({ open: true, id: null, client: '' })}
                  onOpenNewProject={() => setProjectModalState({ open: true, id: null, client: '' })}
                />
              )}

              {activeTab === 'proj' && (
                <ProjectsView
                  projects={appData.p}
                  filter={projectFilter}
                  onFilterChange={setProjectFilter}
                  onCycleStatus={handleCycleStatus}
                  onOpenProject={id => setProjectModalState({ open: true, id, client: '' })}
                  onOpenNewProject={() => setProjectModalState({ open: true, id: null, client: '' })}
                  onOpenClient={name => setClientDrawerName(name)}
                  onOpenMember={name => setMemberDrawerName(name)}
                />
              )}

              {activeTab === 'fin' && (
                <FinancialView
                  projects={appData.p}
                  onOpenBreakdown={(type, list) => setBreakdownState({ type, projects: list })}
                  onMarkReceived={handleMarkReceived}
                  onOpenClient={name => setClientDrawerName(name)}
                  onOpenMember={name => setMemberDrawerName(name)}
                  onOpenReceivablesModal={() => setReceivablesOpen(true)}
                />
              )}

              {activeTab === 'cal' && (
                <CalendarView
                  projects={appData.p}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  onOpenProject={id => setProjectModalState({ open: true, id, client: '' })}
                  onOpenClient={name => setClientDrawerName(name)}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Drawers & Modals nativos no Top Layer */}
      <ClientDrawer
        clientName={clientDrawerName}
        projects={appData.p}
        crm={appData.crm}
        onClose={() => setClientDrawerName(null)}
        onDeliverProject={handleDeliverProject}
        onOpenProject={id => setProjectModalState({ open: true, id, client: '' })}
        onOpenLead={id => setCrmDetailId(id)}
        onNewProjectForClient={cli => setProjectModalState({ open: true, id: null, client: cli })}
        onNewLeadForClient={cli => setCrmModalState({ open: true, id: null, client: cli })}
      />

      <CrmDetailDrawer
        lead={activeLead}
        onClose={() => setCrmDetailId(null)}
        onMoveStage={handleMoveLeadStage}
        onAddLog={handleAddCrmLog}
        onConvertToProject={handleConvertLeadToProject}
        onEditLead={id => setCrmModalState({ open: true, id, client: '' })}
        onDeleteLead={handleDeleteLead}
        onOpenClient={name => setClientDrawerName(name)}
        onOpenProject={id => setProjectModalState({ open: true, id, client: '' })}
      />

      <MemberDrawer
        memberName={memberDrawerName}
        projects={appData.p}
        onClose={() => setMemberDrawerName(null)}
        onCycleStatus={handleCycleStatus}
        onOpenProject={id => setProjectModalState({ open: true, id, client: '' })}
        onOpenClient={name => setClientDrawerName(name)}
      />

      <ProjectFormModal
        open={projectModalState.open}
        editingProject={editingProj}
        initialClient={projectModalState.client}
        clientsList={clientsNames}
        onClose={() => setProjectModalState({ open: false, id: null, client: '' })}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
      />

      <CrmFormModal
        open={crmModalState.open}
        editingLead={editingLead}
        initialClient={crmModalState.client}
        onClose={() => setCrmModalState({ open: false, id: null, client: '' })}
        onSave={handleSaveLead}
      />

      <PeriodBreakdownModal
        state={breakdownState}
        onClose={() => setBreakdownState(null)}
        onOpenClient={name => setClientDrawerName(name)}
      />

      <ReceivablesModal
        open={receivablesOpen}
        projects={appData.p}
        onClose={() => setReceivablesOpen(false)}
        onMarkReceived={handleMarkReceived}
        onOpenClient={name => setClientDrawerName(name)}
      />

      <div className="toast-stack" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="toast-pill animate-rise">
            <span>{t.icon}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}
