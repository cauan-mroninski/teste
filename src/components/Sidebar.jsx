import React from 'react';
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  DollarSign,
  FolderKanban,
  Lock,
  Moon,
  Plus,
  RotateCcw,
  Sun,
  UserPlus,
  Users
} from 'lucide-react';
import { getInitials, STATUS_DONE } from '../data/seed';

export function Sidebar({
  logo,
  activeTab,
  onSelectTab,
  projects,
  crm,
  clientsCount,
  teamMembers,
  onOpenNewProject,
  onOpenNewLead,
  onOpenMember,
  isDark,
  onToggleTheme,
  onResetSandbox
}) {
  const openCount = projects.filter(p => p.st !== STATUS_DONE).length;
  const activeCrmCount = crm.filter(l => l.stage !== 'Fechado' && l.stage !== 'Perdido').length;

  const navAnalytics = [
    { id: 'painel', label: 'Visão Geral', icon: BarChart3 },
    { id: 'crm', label: 'CRM & Funil', icon: Briefcase, badge: activeCrmCount },
    { id: 'proj', label: 'Projetos & Obras', icon: FolderKanban, badge: openCount }
  ];

  const navManagement = [
    { id: 'clientes', label: 'Clientes', icon: Users, badge: clientsCount },
    { id: 'fin', label: 'Financeiro', icon: DollarSign },
    { id: 'cal', label: 'Calendário', icon: CalendarDays }
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="LR Engenharia" className="brand-logo" />
        <div>
          <div className="brand-title">LR Engenharia</div>
          <div className="brand-sub">Cockpit & CRM</div>
        </div>
      </div>

      <div className="nav-section-label">Operação</div>
      <nav className="nav-list" aria-label="Navegação principal">
        {navAnalytics.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span className="nav-btn-left">
                <Icon size={16} />
                <span>{item.label}</span>
              </span>
              {item.badge != null && <span className="nav-pill-count">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="nav-section-label">Gestão</div>
      <nav className="nav-list" aria-label="Gestão de clientes e finanças">
        {navManagement.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span className="nav-btn-left">
                <Icon size={16} />
                <span>{item.label}</span>
              </span>
              {item.badge != null && <span className="nav-pill-count">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="nav-section-label">Equipe Técnica</div>
      <div className="sidebar-team-box">
        {teamMembers.slice(0, 5).map(m => {
          const activeCount = m.devCount + m.apprCount;
          return (
            <button
              key={m.name}
              type="button"
              className="sidebar-team-item"
              onClick={() => onOpenMember(m.name)}
              title={`Abrir Raio-X de ${m.name}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span className="avatar-circle" style={{ width: 22, height: 22, fontSize: 9.5 }}>
                  {getInitials(m.name)}
                </span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.name}
                </span>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: activeCount ? 'var(--ac)' : 'var(--mu)' }}>
                {activeCount ? `${activeCount} atv` : `${m.doneCount} ok`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-cta-stack">
        <button type="button" className="btn-sidebar-soft" onClick={onOpenNewProject}>
          <Plus size={15} />
          <span>Nova Obra</span>
        </button>
        <button type="button" className="btn-sidebar-outline" onClick={onOpenNewLead}>
          <UserPlus size={14} />
          <span>Novo Lead CRM</span>
        </button>
        <div className="sidebar-footer-meta">
          <span title="Salvo apenas no seu navegador">● Sandbox Local</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="icon-btn-round"
              style={{ width: 28, height: 28, borderRadius: 8 }}
              onClick={onToggleTheme}
              title={isDark ? 'Mudar para Modo Diário' : 'Mudar para Modo Noturno'}
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button
              type="button"
              className="icon-btn-round"
              style={{ width: 28, height: 28, borderRadius: 8 }}
              onClick={onResetSandbox}
              title="Restaurar dados iniciais de demonstração"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Topbar({
  title,
  subtitle,
  activeTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  onLock,
  userName
}) {
  const tabs = [
    { id: 'painel', label: 'Visão Geral' },
    { id: 'crm', label: 'CRM & Funil' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'proj', label: 'Projetos' },
    { id: 'fin', label: 'Financeiro' },
    { id: 'cal', label: 'Calendário' }
  ];

  const dateStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <>
      <header className="topbar">
        <div className="topbar-title-block">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <div className="topbar-actions">
          <span className="chip-control" style={{ cursor: 'default' }}>
            <CalendarDays size={14} />
            <span style={{ textTransform: 'capitalize' }}>{dateStr}</span>
          </span>

          <button
            type="button"
            className="chip-control"
            onClick={onToggleTheme}
            title={isDark ? 'Propagar Modo Diário' : 'Propagar Modo Noturno'}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            <span>{isDark ? 'Modo Diário' : 'Modo Noturno'}</span>
          </button>

          <button
            type="button"
            className="icon-btn-round"
            onClick={onLock}
            title="Bloquear Cockpit (Sair)"
          >
            <Lock size={15} />
          </button>

          <div className="user-pill">
            <span className="avatar-circle">{getInitials(userName)}</span>
            <span>{userName}</span>
          </div>
        </div>
      </header>

      <nav className="mobile-nav-strip" aria-label="Navegação mobile">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            className={`nav-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => onSelectTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );
}
