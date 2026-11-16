import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, MessageSquare, Phone, Plus, Trash2, X } from 'lucide-react';
import {
  computeClientsDirectory,
  computeTeamMembers,
  CRM_STAGE_META,
  CRM_STAGES,
  formatDate,
  getBalance,
  getCustoTotal,
  getInitials,
  getLucro,
  getMargem,
  STATUS_APPR,
  STATUS_DEV,
  STATUS_DONE,
  toBRL,
  todayISO
} from '../data/seed';

let supportsDisplayTransitionCache;
function canTransitionDisplay() {
  if (supportsDisplayTransitionCache !== undefined) return supportsDisplayTransitionCache;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransitionCache = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransitionCache;
}

function supportsTopLayerExit() {
  return window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay();
}

async function closeTopLayer(element, onFinish) {
  if (!element || !element.open) {
    onFinish?.();
    return;
  }
  if (!supportsTopLayerExit()) {
    element.setAttribute('data-closing', '');
    const animations = element.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map(a => a.finished)),
        new Promise(r => setTimeout(r, 1500))
      ]);
    }
    if (!element.hasAttribute('data-closing')) return;
    element.removeAttribute('data-closing');
  }
  if (element.open) element.close();
  onFinish?.();
}

export function SkyDialog({ open, onClose, title, subtitle, className = '', footer, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.removeAttribute('data-closing');
      dlg.showModal();
    } else if (!open && dlg.open) {
      closeTopLayer(dlg);
    }
  }, [open]);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    const handleCancel = e => {
      e.preventDefault();
      closeTopLayer(dlg, onClose);
    };
    dlg.addEventListener('cancel', handleCancel);
    return () => dlg.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const handleRequestClose = () => {
    closeTopLayer(ref.current, onClose);
  };

  const handleBackdropClick = e => {
    if (e.target === ref.current) {
      handleRequestClose();
    }
  };

  return (
    <dialog ref={ref} className={`sky-dialog ${className}`} onClick={handleBackdropClick}>
      <div className="dialog-head">
        <div>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{title}</h3>
          {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--mu)' }}>{subtitle}</p>}
        </div>
        <button type="button" className="icon-btn-round" onClick={handleRequestClose} aria-label="Fechar janela">
          <X size={16} />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
      {footer && <div className="dialog-foot">{footer}</div>}
    </dialog>
  );
}

export function ClientDrawer({
  clientName,
  projects,
  crm,
  onClose,
  onDeliverProject,
  onOpenProject,
  onOpenLead,
  onNewProjectForClient,
  onNewLeadForClient
}) {
  const client = clientName
    ? computeClientsDirectory(projects, crm).find(c => c.name.toLowerCase() === clientName.toLowerCase()) || {
        name: clientName,
        projects: [],
        crmLeads: [],
        deliveredCount: 0,
        activeCount: 0,
        totalValor: 0,
        totalRec: 0,
        totalBalance: 0,
        totalProfit: 0,
        disciplines: {}
      }
    : null;

  const subtitle = client
    ? `${client.deliveredCount} entregue(s) · ${client.activeCount} em andamento · ${client.crmLeads.length} oportunidade(s) no CRM`
    : '';

  return (
    <SkyDialog
      open={Boolean(clientName)}
      onClose={onClose}
      className="drawer-right"
      title={client ? `Dossiê · ${client.name}` : 'Dossiê do Cliente'}
      subtitle={subtitle}
      footer={
        client && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-sm" onClick={() => onNewLeadForClient(client.name)}>+ Lead CRM</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onNewProjectForClient(client.name)}>+ Nova Obra</button>
            </div>
            <button type="button" className="btn btn-sm" onClick={onClose}>Fechar Dossiê</button>
          </>
        )
      }
    >
      {client && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <div className="sky-card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 600 }}>Projetos Entregues</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--pos-tx)' }}>
                {client.deliveredCount}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--mu)' }}>{client.activeCount} ativa(s) no momento</div>
            </div>
            <div className="sky-card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 600 }}>Receita Total Gerada</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{toBRL(client.totalValor)}</div>
              <div style={{ fontSize: 11.5, color: 'var(--pos-tx)' }}>Lucro LR: {toBRL(client.totalProfit)}</div>
            </div>
            <div className="sky-card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 600 }}>Já Recebido</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{toBRL(client.totalRec)}</div>
            </div>
            <div className="sky-card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 600 }}>Saldo a Receber</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: client.totalBalance > 0 ? 'var(--neg-tx)' : 'var(--mu)' }}>
                {toBRL(client.totalBalance)}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 8 }}>DISCIPLINAS & SERVIÇOS REALIZADOS</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(client.disciplines).length ? (
                Object.entries(client.disciplines).map(([disc, cnt]) => (
                  <span key={disc} className="badge-pill" style={{ background: 'var(--bg-subtle)', color: 'var(--tx)' }}>
                    {disc} ({cnt})
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 12.5, color: 'var(--mu)' }}>Ainda sem projetos convertidos.</span>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 8 }}>
              OBRAS E PROJETOS ({client.projects.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {client.projects.map(p => (
                <div key={p.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--bd)', background: 'var(--bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 13.5 }}>{p.obra}</strong>
                    <span className={`badge-pill ${p.st === STATUS_DONE ? 'badge-done' : 'badge-dev'}`}>{p.st}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4 }}>
                    {p.id} · {p.area} · Prazo {formatDate(p.prazo)} · {toBRL(p.valor)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {p.st !== STATUS_DONE && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => onDeliverProject(p.id)}>
                        <CheckCircle2 size={13} /> Entregar
                      </button>
                    )}
                    <button type="button" className="btn btn-sm" onClick={() => onOpenProject(p.id)}>
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {client.crmLeads.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 8 }}>OPORTUNIDADES NO CRM</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {client.crmLeads.map(l => (
                  <button
                    key={l.id}
                    type="button"
                    className="sky-card sky-card-interactive"
                    style={{ textAlign: 'left', padding: 12 }}
                    onClick={() => onOpenLead(l.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 13 }}>
                      <span>{l.obra}</span>
                      <span style={{ color: 'var(--ac)' }}>{toBRL(l.valorEst)}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--mu)', marginTop: 3 }}>
                      Etapa: {l.stage} ({l.probabilidade}%) · Follow-up: {formatDate(l.nextFollowUp)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </SkyDialog>
  );
}

export function CrmDetailDrawer({
  lead,
  onClose,
  onMoveStage,
  onAddLog,
  onConvertToProject,
  onEditLead,
  onDeleteLead,
  onOpenClient,
  onOpenProject
}) {
  const [logType, setLogType] = useState('Visita Técnica');
  const [logText, setLogText] = useState('');

  const handleLogSubmit = e => {
    e.preventDefault();
    if (!lead || !logText.trim()) return;
    onAddLog(lead.id, logType, logText.trim());
    setLogText('');
  };

  const priceM2 = lead && lead.areaM2 > 0 ? lead.valorEst / lead.areaM2 : 0;

  return (
    <SkyDialog
      open={Boolean(lead)}
      onClose={onClose}
      className="drawer-right"
      title={lead ? `${lead.id} · ${lead.cli}` : 'Oportunidade CRM'}
      subtitle={lead ? `${lead.obra} · ${lead.area}` : ''}
      footer={
        lead && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeleteLead(lead.id)}>
                <Trash2 size={13} /> Excluir
              </button>
              <button type="button" className="btn btn-sm" onClick={() => onEditLead(lead.id)}>Editar</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!lead.convertedProjectId && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onConvertToProject(lead.id)}>
                  Converter em Obra
                </button>
              )}
              <button type="button" className="btn btn-sm" onClick={onClose}>Fechar</button>
            </div>
          </>
        )
      }
    >
      {lead && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {lead.convertedProjectId && (
            <div style={{ padding: 12, borderRadius: 12, background: 'var(--pos-bg)', color: 'var(--pos-tx)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600 }}>
              <span>✓ Convertida na obra {lead.convertedProjectId}</span>
              <button type="button" className="btn btn-sm" onClick={() => onOpenProject(lead.convertedProjectId)}>Abrir Obra</button>
            </div>
          )}

          {/* Stepper 6 etapas */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--mu)', marginBottom: 8 }}>MOVER ETAPA NO FUNIL</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
              {CRM_STAGES.map(st => (
                <button
                  key={st}
                  type="button"
                  className={`filter-seg-btn ${lead.stage === st ? 'active' : ''}`}
                  style={{
                    border: '1px solid var(--bd)',
                    padding: '7px 8px',
                    background: lead.stage === st ? CRM_STAGE_META[st].color : 'var(--bg)',
                    color: lead.stage === st ? '#fff' : 'var(--tx-dim)'
                  }}
                  onClick={() => onMoveStage(lead.id, st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            <div className="sky-card" style={{ padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--mu)' }}>Valor Proposta</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ac)' }}>{toBRL(lead.valorEst)}</div>
            </div>
            <div className="sky-card" style={{ padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--mu)' }}>Área / R$ m²</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {lead.areaM2 ? `${lead.areaM2} m²` : '—'} {priceM2 > 0 ? `(${toBRL(priceM2)})` : ''}
              </div>
            </div>
            <div className="sky-card" style={{ padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--mu)' }}>Probabilidade</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{lead.probabilidade}%</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-sm" onClick={() => onOpenClient(lead.cli)}>Ver Dossiê de {lead.cli}</button>
            {lead.phone && (
              <a
                className="btn btn-sm"
                href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <Phone size={13} /> {lead.phone}
              </a>
            )}
            {lead.email && (
              <a className="btn btn-sm" href={`mailto:${lead.email}`} style={{ textDecoration: 'none' }}>
                <Mail size={13} /> {lead.email}
              </a>
            )}
          </div>

          {lead.obs && (
            <div style={{ padding: 12, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--bd)', fontSize: 13 }}>
              {lead.obs}
            </div>
          )}

          <form onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)' }}>REGISTRAR INTERAÇÃO</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="sky-select" style={{ width: 165 }} value={logType} onChange={e => setLogType(e.target.value)}>
                <option>Visita Técnica</option>
                <option>WhatsApp</option>
                <option>Ligação</option>
                <option>Proposta</option>
                <option>Anotação</option>
              </select>
              <input
                type="text"
                className="sky-input"
                value={logText}
                onChange={e => setLogText(e.target.value)}
                placeholder="Descreva o contato ou vistoria..."
              />
              <button type="submit" className="btn btn-primary btn-sm">Registrar</button>
            </div>
          </form>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 8 }}>
              HISTÓRICO ({lead.logs.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lead.logs.map((lg, idx) => (
                <div key={idx} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--bd)', background: 'var(--bg)', fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <strong style={{ color: 'var(--ac)' }}><MessageSquare size={11} style={{ marginRight: 4 }} />{lg.type}</strong>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mu)' }}>{formatDate(lg.date)}</span>
                  </div>
                  <div>{lg.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </SkyDialog>
  );
}

export function MemberDrawer({ memberName, projects, onClose, onCycleStatus, onOpenProject, onOpenClient }) {
  const member = memberName
    ? computeTeamMembers(projects).find(m => m.name === memberName)
    : null;

  return (
    <SkyDialog
      open={Boolean(memberName)}
      onClose={onClose}
      className="drawer-right"
      title={member ? `Raio-X · ${member.name}` : 'Raio-X do Responsável'}
      subtitle={member ? `${member.projects.length} obra(s) · Especialidades: ${[...member.disciplines].join(', ') || 'Geral'}` : ''}
      footer={<button type="button" className="btn btn-sm" onClick={onClose}>Fechar</button>}
    >
      {member && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <div className="sky-card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--mu)' }}>Faturamento Gerido</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{toBRL(member.totalValor)}</div>
            </div>
            <div className="sky-card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--mu)' }}>Honorários Totais</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--purple)' }}>{toBRL(member.totalCustoResp)}</div>
              <div style={{ fontSize: 11, color: 'var(--pos-tx)' }}>{toBRL(member.concludedCustoResp)} liberado(s)</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {member.projects.map(p => (
              <div key={p.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--bd)', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <button type="button" className="client-link-btn" onClick={() => onOpenClient(p.cli)}>{p.cli}</button>
                    <span> · {p.obra}</span>
                  </div>
                  <button
                    type="button"
                    className={`badge-pill ${p.st === STATUS_DONE ? 'badge-done' : 'badge-dev'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onCycleStatus(p.id)}
                  >
                    {p.st}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--mu)' }}>
                  <span>Honorário: {toBRL(p.custoResp)} · Lucro LR: {toBRL(getLucro(p))}</span>
                  <button type="button" className="btn btn-sm" onClick={() => onOpenProject(p.id)}>Editar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SkyDialog>
  );
}

export function ProjectFormModal({ open, editingProject, initialClient, clientsList, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    cli: '',
    obra: '',
    area: 'Hidrossanitário',
    tipo: 'Projeto novo',
    ini: todayISO(),
    prazo: todayISO(),
    st: STATUS_DEV,
    valor: 0,
    rec: 0,
    resp: 'Lucas',
    custoResp: 0,
    custosExtras: 0,
    custosNotas: '',
    obs: ''
  });

  useEffect(() => {
    if (editingProject) {
      setForm({ ...editingProject });
    } else if (open) {
      setForm({
        cli: initialClient || '',
        obra: '',
        area: 'Hidrossanitário',
        tipo: 'Projeto novo',
        ini: todayISO(),
        prazo: todayISO(),
        st: STATUS_DEV,
        valor: 0,
        rec: 0,
        resp: 'Lucas',
        custoResp: 0,
        custosExtras: 0,
        custosNotas: '',
        obs: ''
      });
    }
  }, [editingProject, initialClient, open]);

  const lucro = (+form.valor || 0) - (+form.custoResp || 0) - (+form.custosExtras || 0);
  const margem = +form.valor > 0 ? Math.round((lucro / +form.valor) * 100) : 0;

  const submit = e => {
    e.preventDefault();
    onSave({
      ...form,
      valor: Number(form.valor) || 0,
      rec: Number(form.rec) || 0,
      custoResp: Number(form.custoResp) || 0,
      custosExtras: Number(form.custosExtras) || 0
    });
  };

  return (
    <SkyDialog
      open={open}
      onClose={onClose}
      title={editingProject ? `Editar Obra ${editingProject.id}` : 'Cadastrar Nova Obra'}
      subtitle={`Lucro líquido calculado: ${toBRL(lucro)} (${margem}% margem)`}
      footer={
        <>
          <div>
            {editingProject && (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(editingProject.id)}>
                <Trash2 size={13} /> Excluir
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" form="project-editor-form" className="btn btn-primary btn-sm">Salvar Obra</button>
          </div>
        </>
      }
    >
      <form id="project-editor-form" onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Cliente</label>
          <input list="lr-clients-datalist" required className="sky-input" value={form.cli} onChange={e => setForm({ ...form, cli: e.target.value })} />
          <datalist id="lr-clients-datalist">
            {clientsList.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Obra / Empreendimento</label>
          <input required className="sky-input" value={form.obra} onChange={e => setForm({ ...form, obra: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Disciplina</label>
          <input className="sky-input" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Status</label>
          <select className="sky-select" value={form.st} onChange={e => setForm({ ...form, st: e.target.value })}>
            <option value={STATUS_DEV}>{STATUS_DEV}</option>
            <option value={STATUS_APPR}>{STATUS_APPR}</option>
            <option value={STATUS_DONE}>{STATUS_DONE}</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Data Início</label>
          <input type="date" className="sky-input" value={form.ini} onChange={e => setForm({ ...form, ini: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Prazo Entrega</label>
          <input type="date" className="sky-input" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Valor Contratado (R$)</label>
          <input type="number" step="0.01" className="sky-input" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Valor Recebido (R$)</label>
          <input type="number" step="0.01" className="sky-input" value={form.rec} onChange={e => setForm({ ...form, rec: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Responsável Técnico</label>
          <input className="sky-input" value={form.resp} onChange={e => setForm({ ...form, resp: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Honorários Resp. (R$)</label>
          <input type="number" step="0.01" className="sky-input" value={form.custoResp} onChange={e => setForm({ ...form, custoResp: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Taxas / Extras (R$)</label>
          <input type="number" step="0.01" className="sky-input" value={form.custosExtras} onChange={e => setForm({ ...form, custosExtras: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Notas de Custos</label>
          <input className="sky-input" value={form.custosNotas} onChange={e => setForm({ ...form, custosNotas: e.target.value })} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Observações</label>
          <textarea rows={2} className="sky-textarea" value={form.obs} onChange={e => setForm({ ...form, obs: e.target.value })} />
        </div>
      </form>
    </SkyDialog>
  );
}

export function CrmFormModal({ open, editingLead, initialClient, onClose, onSave }) {
  const [form, setForm] = useState({
    cli: '',
    obra: '',
    area: 'Hidrossanitário',
    areaM2: 200,
    valorEst: 4500,
    stage: 'Lead',
    probabilidade: 20,
    origin: 'Indicação',
    resp: 'Lucas',
    phone: '',
    email: '',
    cidade: '',
    nextFollowUp: todayISO(),
    prazoDesejado: todayISO(),
    obs: ''
  });

  useEffect(() => {
    if (editingLead) setForm({ ...editingLead });
    else if (open) {
      setForm({
        cli: initialClient || '',
        obra: '',
        area: 'Hidrossanitário',
        areaM2: 200,
        valorEst: 4500,
        stage: 'Lead',
        probabilidade: 20,
        origin: 'Indicação',
        resp: 'Lucas',
        phone: '',
        email: '',
        cidade: '',
        nextFollowUp: todayISO(),
        prazoDesejado: todayISO(),
        obs: ''
      });
    }
  }, [editingLead, initialClient, open]);

  const submit = e => {
    e.preventDefault();
    onSave({
      ...form,
      areaM2: Number(form.areaM2) || 0,
      valorEst: Number(form.valorEst) || 0,
      probabilidade: Number(form.probabilidade) || 0
    });
  };

  return (
    <SkyDialog
      open={open}
      onClose={onClose}
      title={editingLead ? `Editar Oportunidade ${editingLead.id}` : 'Nova Oportunidade no CRM'}
      subtitle={form.areaM2 > 0 ? `Referência: ${toBRL((+form.valorEst || 0) / +form.areaM2)} / m²` : ''}
      footer={
        <>
          <span />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" form="crm-editor-form" className="btn btn-primary btn-sm">
              <Plus size={14} /> Salvar Oportunidade
            </button>
          </div>
        </>
      }
    >
      <form id="crm-editor-form" onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Cliente / Lead</label>
          <input required className="sky-input" value={form.cli} onChange={e => setForm({ ...form, cli: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Obra / Escopo</label>
          <input required className="sky-input" value={form.obra} onChange={e => setForm({ ...form, obra: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Disciplina</label>
          <input className="sky-input" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Etapa do Funil</label>
          <select
            className="sky-select"
            value={form.stage}
            onChange={e => setForm({ ...form, stage: e.target.value, probabilidade: CRM_STAGE_META[e.target.value]?.prob ?? form.probabilidade })}
          >
            {CRM_STAGES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Metragem (m²)</label>
          <input type="number" className="sky-input" value={form.areaM2} onChange={e => setForm({ ...form, areaM2: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Valor Estimado (R$)</label>
          <input type="number" step="0.01" className="sky-input" value={form.valorEst} onChange={e => setForm({ ...form, valorEst: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Responsável</label>
          <input className="sky-input" value={form.resp} onChange={e => setForm({ ...form, resp: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Próximo Follow-up</label>
          <input type="date" className="sky-input" value={form.nextFollowUp} onChange={e => setForm({ ...form, nextFollowUp: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>WhatsApp / Telefone</label>
          <input className="sky-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600 }}>E-mail</label>
          <input className="sky-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Observações Técnicas</label>
          <textarea rows={2} className="sky-textarea" value={form.obs} onChange={e => setForm({ ...form, obs: e.target.value })} />
        </div>
      </form>
    </SkyDialog>
  );
}

export function PeriodBreakdownModal({ state, onClose, onOpenClient }) {
  const scrollRef = useRef(null);
  const type = state?.type || 'faturamento';
  const list = state?.projects || [];

  const titleMap = {
    faturamento: 'Detalhamento de Faturamento no Período',
    custos: 'Detalhamento de Custos por Projeto no Período',
    lucro: 'Detalhamento de Lucro Líquido por Projeto'
  };

  const scrollHorizontal = delta => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <SkyDialog
      open={Boolean(state)}
      onClose={onClose}
      className="wide"
      title={titleMap[type]}
      subtitle={`${list.length} obra(s) no período selecionado · Role horizontalmente para ver todas as colunas`}
      footer={
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm btn-scroll-left" onClick={() => scrollHorizontal(-260)}>
              <ArrowLeft size={14} /> Rolar Esquerda
            </button>
            <button type="button" className="btn btn-sm btn-scroll-right" onClick={() => scrollHorizontal(260)}>
              Rolar Direita <ArrowRight size={14} />
            </button>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>Fechar</button>
        </>
      }
    >
      <div className="table-scroll" ref={scrollRef}>
        <table className="sky-table" style={{ minWidth: 920 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Código ID</th>
              <th>Cliente & Obra</th>
              <th>Disciplina</th>
              <th>Status</th>
              <th className="num">Faturamento</th>
              <th className="num">Recebido</th>
              <th className="num">Honorários</th>
              <th className="num">Extras</th>
              <th className="num">Lucro LR</th>
              <th className="num">Margem</th>
            </tr>
          </thead>
          <tbody>
            {list
              .slice()
              .sort((a, b) => (type === 'custos' ? getCustoTotal(b) - getCustoTotal(a) : type === 'lucro' ? getLucro(b) - getLucro(a) : (+b.valor || 0) - (+a.valor || 0)))
              .map((p, idx) => (
                <tr key={p.id}>
                  <td>#{idx + 1}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>{p.id}</td>
                  <td>
                    <button type="button" className="client-link-btn" onClick={() => onOpenClient(p.cli)}>{p.cli}</button>
                    <span> · {p.obra}</span>
                  </td>
                  <td>{p.area}</td>
                  <td>{p.st}</td>
                  <td className="num">{toBRL(p.valor)}</td>
                  <td className="num">{toBRL(p.rec)}</td>
                  <td className="num">{toBRL(p.custoResp)}</td>
                  <td className="num">{toBRL(p.custosExtras)}</td>
                  <td className="num" style={{ color: 'var(--pos-tx)', fontWeight: 700 }}>{toBRL(getLucro(p))}</td>
                  <td className="num">{getMargem(p)}%</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </SkyDialog>
  );
}

export function ReceivablesModal({ open, projects, onClose, onMarkReceived, onOpenClient }) {
  const pending = projects.filter(p => getBalance(p) > 0).sort((a, b) => getBalance(b) - getBalance(a));
  return (
    <SkyDialog
      open={open}
      onClose={onClose}
      title={`Contas a Receber (${pending.length})`}
      subtitle={`Saldo acumulado pendente: ${toBRL(pending.reduce((s, p) => s + getBalance(p), 0))}`}
      footer={<button type="button" className="btn btn-sm" onClick={onClose}>Fechar</button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pending.map(p => (
          <div key={p.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div>
              <button type="button" className="client-link-btn" onClick={() => onOpenClient(p.cli)}>{p.cli}</button>
              <span> · {p.obra}</span>
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>
                Contratado: {toBRL(p.valor)} · Recebido: {toBRL(p.rec)} · Prazo: {formatDate(p.prazo)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--neg-tx)' }}>{toBRL(getBalance(p))}</strong>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onMarkReceived(p.id)}>Receber</button>
            </div>
          </div>
        ))}
        {!pending.length && <p style={{ fontSize: 13, color: 'var(--mu)' }}>Todos os contratos estão quitados.</p>}
      </div>
    </SkyDialog>
  );
}
