export const STORAGE_KEY = 'lr-skymetrics-sandbox-v1';
export const AUTH_STORAGE_KEY = 'lr-skymetrics-auth';

export const STATUS_DONE = 'Concluído';
export const STATUS_DEV = 'Em desenvolvimento';
export const STATUS_APPR = 'Aguardando aprovação';

export const CRM_STAGES = ['Lead', 'Levantamento', 'Proposta', 'Negociação', 'Fechado', 'Perdido'];
export const CRM_STAGE_META = {
  Lead:         { label: 'Lead Recebido',         prob: 20,  color: '#64748b', tint: 'slate' },
  Levantamento: { label: 'Levantamento / Visita', prob: 40,  color: '#3b82f6', tint: 'blue' },
  Proposta:     { label: 'Proposta Enviada',      prob: 65,  color: '#f59e0b', tint: 'amber' },
  'Negociação': { label: 'Em Negociação',         prob: 82,  color: '#8b5cf6', tint: 'purple' },
  Fechado:      { label: 'Fechado (Ganho)',       prob: 100, color: '#16a34a', tint: 'green' },
  Perdido:      { label: 'Perdido',               prob: 0,   color: '#ef4444', tint: 'rose' }
};

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDaysISO(baseIso, delta) {
  const [y, m, d] = baseIso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function diffDays(aIso, bIso) {
  if (!aIso || !bIso) return 0;
  const [ay, am, ad] = aIso.split('-').map(Number);
  const [by, bm, bd] = bIso.split('-').map(Number);
  return Math.round((new Date(ay, am - 1, ad) - new Date(by, bm - 1, bd)) / 86400000);
}

export function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export function toBRL(v) {
  return (+v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function toCompactBRL(v) {
  const n = +v || 0;
  if (Math.abs(n) >= 1000) return `R$ ${(n / 1000).toFixed(1).replace('.', ',')}k`;
  return `R$ ${Math.round(n)}`;
}

export const getStatusClass = st => (st === STATUS_DONE ? 'done' : st === STATUS_APPR ? 'appr' : 'dev');
export const isLate = p => p.st !== STATUS_DONE && p.prazo < todayISO();
export const getBalance = p => Math.max(0, (+p.valor || 0) - (+p.rec || 0));
export const getPercentage = p => (+p.valor > 0 ? Math.min(100, Math.round(((+p.rec || 0) / +p.valor) * 100)) : 0);
export const getCustoTotal = p => (+p.custoResp || 0) + (+p.custosExtras || 0);
export const getLucro = p => (+p.valor || 0) - getCustoTotal(p);
export const getMargem = p => (+p.valor > 0 ? Math.round((getLucro(p) / +p.valor) * 100) : 0);

export function getInitials(name) {
  if (!name || name === '—') return 'LR';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ensureCostFields(p) {
  const copy = { ...p };
  if (copy.custoResp == null || Number.isNaN(Number(copy.custoResp))) {
    copy.custoResp = copy.resp && copy.resp.trim() && copy.resp.trim() !== '—'
      ? Math.round((+copy.valor || 0) * 0.35)
      : 0;
  }
  if (copy.custosExtras == null || Number.isNaN(Number(copy.custosExtras))) {
    copy.custosExtras = +copy.valor > 0 ? Math.round((+copy.valor || 0) * 0.08) : 0;
  }
  if (copy.custosNotas == null) copy.custosNotas = '';
  return copy;
}

export function ensureCrmFields(l) {
  const copy = { ...l };
  if (!copy.id) copy.id = 'CRM-' + String(Math.floor(1000 + Math.random() * 9000));
  if (!copy.cli) copy.cli = 'Cliente';
  if (!copy.obra) copy.obra = 'Oportunidade';
  if (!copy.area) copy.area = 'Projeto Civil';
  if (!CRM_STAGES.includes(copy.stage)) copy.stage = 'Lead';
  copy.areaM2 = Math.max(0, Number(copy.areaM2) || 0);
  copy.valorEst = Math.max(0, Number(copy.valorEst) || 0);
  if (copy.probabilidade == null || Number.isNaN(Number(copy.probabilidade))) {
    copy.probabilidade = (CRM_STAGE_META[copy.stage] || CRM_STAGE_META.Lead).prob;
  } else {
    copy.probabilidade = Math.min(100, Math.max(0, Number(copy.probabilidade)));
  }
  if (!copy.origin) copy.origin = 'Indicação';
  if (!Array.isArray(copy.logs)) copy.logs = [];
  if (!copy.createdAt) copy.createdAt = todayISO();
  return copy;
}

const A1 = 'ARQ-SAN - Regularização';
const HS = 'Hidrossanitário';
const EL = 'Elétrico';
const RJ = 'Ricardo João de Jesus';
const FA = 'Fernando Aliança';
const DS = 'Dayane de Souza';
const RF = 'Reinaldo Favero';
const PE = 'Projeto entregue';

const RAW_SEED_PROJECTS = [
  ['Dona Maria', 'Casa de madeira', A1, '17/11/2025', '17/11/2025', STATUS_DONE, 1000, 1000, RJ, PE, 350, 80, 'ART R$ 80'],
  ['Gregor', 'Casa de madeira', A1, '28/11/2025', '28/11/2025', STATUS_DONE, 1500, 1500, RJ, PE, 500, 100, 'ART + Taxas'],
  ['Ricardo', 'Casas geminadas', A1, '25/11/2025', '25/11/2025', STATUS_DONE, 0, 0, FA, PE, 0, 0, 'Parceria direta'],
  ['Tio Renato', 'Obra Sarah', A1, '08/12/2025', '08/12/2025', STATUS_DONE, 800, 800, FA, PE, 280, 60, 'Plotagem'],
  ['Germano', 'Chalé', A1, '10/02/2026', '10/02/2026', STATUS_DONE, 600, 600, RJ, PE, 200, 50, 'ART'],
  ['Luis carlos', 'Casa', A1, '26/01/2026', '26/01/2026', STATUS_DONE, 700, 700, RJ, PE, 250, 50, 'Taxas municipais'],
  ['Adair', 'Galpão', A1, '17/03/2026', '17/03/2026', STATUS_DONE, 700, 700, DS, PE, 250, 50, 'ART'],
  ['Adair', 'Galpão', 'PPCI', '17/03/2026', '17/03/2026', STATUS_DONE, 500, 500, RJ, PE, 180, 50, 'Taxa bombeiros'],
  ['João', 'Casa de alvenaria', A1, '06/04/2026', '06/04/2026', STATUS_DONE, 1300, 1300, RJ, PE, 450, 90, 'ART CREA'],
  ['Pedro', 'Casa de madeira', A1, '14/04/2026', '14/04/2026', STATUS_DONE, 1000, 1000, RJ, PE, 350, 80, 'ART + cópias'],
  ['Valtanir', 'Casa de alvenaria', A1, '12/05/2026', '12/05/2026', STATUS_DONE, 1300, 1300, RJ, PE, 450, 90, 'ART'],
  ['Erivelton', 'Kitnet', A1, '08/06/2026', '08/06/2026', STATUS_DEV, 4000, 1000, DS, 'Projeto aguardando', 1400, 250, 'Levantamento topográfico'],
  ['Silvana', '3 casas', A1, '02/07/2026', '02/07/2026', STATUS_DONE, 3500, 3500, DS, PE, 1200, 200, 'ART + Plotagens'],
  ['João Carlos', 'Casa de madeira', 'ARQ-HIS-ELE', '05/10/2026', '05/10/2026', STATUS_APPR, 3000, 0, RJ, 'Projeto aguardando aprovação', 1050, 180, 'Taxa prefeitura'],
  ['Externo', 'Fachada de obra', 'Arquitetônico', '07/04/2026', '07/04/2026', STATUS_DONE, 350, 350, '', PE, 0, 30, 'Plotagem fachada'],
  ['Vinicius', 'Documentação', HS, '10/05/2026', '10/05/2026', STATUS_DONE, 300, 300, '', PE, 0, 30, 'Emissão de certidões'],
  ['Bruna', 'Residencia', A1, '10/06/2026', '10/06/2026', STATUS_DONE, 450, 450, '', PE, 0, 40, 'Plotagem'],
  ['Reinaldo', 'Residencia sons do mar', HS, '21/09/2026', '21/09/2026', STATUS_DONE, 1000, 1000, RF, PE, 350, 80, 'ART projeto hidro'],
  ['Casiano', 'Casa de comando', EL, '11/09/2026', '11/09/2026', STATUS_DONE, 400, 400, '', PE, 0, 40, 'Material e taxas'],
  ['Reinaldo', 'ELE rodrigo', EL, '21/09/2026', '21/09/2026', STATUS_DONE, 1000, 1000, RF, PE, 350, 80, 'ART projeto elétrico'],
  ['Reinaldo', 'ETE Paulo Lopes', HS, '01/10/2026', '01/10/2026', STATUS_DONE, 500, 0, RF, PE, 180, 40, 'ART'],
  ['Vinicius', 'ELE campeche', EL, '20/10/2026', '20/10/2026', STATUS_DONE, 500, 0, '', '', 0, 40, 'Taxas concessionária'],
  ['Triches', 'Edificio Edux', HS, '29/10/2026', '29/12/2026', STATUS_DEV, 3000, 0, 'Triches engenharia', '', 1100, 200, 'ART + compatibilização BIM']
];

const convertBRDate = s => s.split('/').reverse().join('-');

export function buildSeedProjects() {
  return RAW_SEED_PROJECTS.map((r, idx) => ({
    id: 'PRJ-' + String(idx + 5).padStart(4, '0'),
    cli: r[0],
    obra: r[1],
    area: r[2],
    tipo: 'Projeto novo',
    ini: convertBRDate(r[3]),
    prazo: convertBRDate(r[4]),
    st: r[5],
    valor: +r[6] || 0,
    rec: +r[7] || 0,
    resp: r[8] || '',
    obs: r[9] || '',
    custoResp: r[10] != null ? +r[10] : 0,
    custosExtras: r[11] != null ? +r[11] : 0,
    custosNotas: r[12] || ''
  }));
}

export const SEED_CRM = [
  {
    id: 'CRM-0001',
    cli: 'Triches',
    obra: 'Condomínio Edifício Solaris (Hidro + Preventivo)',
    area: 'Hidrossanitário',
    areaM2: 1450,
    valorEst: 11500,
    stage: 'Negociação',
    probabilidade: 85,
    origin: 'Cliente Recorrente',
    resp: 'Lucas',
    phone: '(48) 99912-4080',
    email: 'engenharia@triches.com.br',
    cidade: 'Criciúma - SC',
    nextFollowUp: '2026-11-16',
    prazoDesejado: '2026-12-20',
    obs: 'Cliente recorrente (Edifício Edux). Escopo com compatibilização BIM + memorial preventivo.',
    convertedProjectId: '',
    createdAt: '2026-10-28',
    logs: [
      { date: '2026-11-08', type: 'Proposta', text: 'Enviada revisão da proposta de R$ 11.500 (R$ 7,93/m²) com prazo em 2 etapas.' },
      { date: '2026-11-02', type: 'Visita Técnica', text: 'Reunião de alinhamento com diretoria da Triches sobre prumadas.' }
    ]
  },
  {
    id: 'CRM-0002',
    cli: 'Construtora Horizonte',
    obra: 'Residencial Vista Verde — Projeto Estrutural Completo',
    area: 'Estrutural',
    areaM2: 680,
    valorEst: 9800,
    stage: 'Proposta',
    probabilidade: 65,
    origin: 'Indicação',
    resp: 'Ricardo João de Jesus',
    phone: '(48) 99844-1120',
    email: 'projetos@horizonteconstrutora.com.br',
    cidade: 'Florianópolis - SC',
    nextFollowUp: '2026-11-14',
    prazoDesejado: '2026-12-15',
    obs: 'Estrutura mista concreto armado + fundação em estaca hélice contínua.',
    convertedProjectId: '',
    createdAt: '2026-11-01',
    logs: [
      { date: '2026-11-06', type: 'Proposta', text: 'Proposta técnica enviada por WhatsApp e e-mail com ART inclusa.' },
      { date: '2026-11-01', type: 'Ligação', text: 'Levantamento inicial das plantas arquitetônicas em DWG.' }
    ]
  },
  {
    id: 'CRM-0003',
    cli: 'Silvana',
    obra: 'Ampliação Comercial + Regularização Terreno 2',
    area: 'ARQ-SAN - Regularização',
    areaM2: 240,
    valorEst: 4200,
    stage: 'Levantamento',
    probabilidade: 50,
    origin: 'Cliente Recorrente',
    resp: 'Dayane de Souza',
    phone: '(48) 99601-3344',
    email: 'silvana.empreendimentos@gmail.com',
    cidade: 'São José - SC',
    nextFollowUp: '2026-11-13',
    prazoDesejado: '2026-12-10',
    obs: 'Levantamento cadastral in loco e conferência de matrícula na prefeitura.',
    convertedProjectId: '',
    createdAt: '2026-11-04',
    logs: [
      { date: '2026-11-05', type: 'Visita Técnica', text: 'Medição a laser realizada no imóvel; aguardando certidão atualizada.' }
    ]
  },
  {
    id: 'CRM-0004',
    cli: 'Grupo Atlântico Logística',
    obra: 'Galpão Industrial 1.800m² — Elétrico + SPDA + Hidro',
    area: 'Elétrico',
    areaM2: 1800,
    valorEst: 14600,
    stage: 'Proposta',
    probabilidade: 60,
    origin: 'Construtora / Parceiro',
    resp: 'Reinaldo Favero',
    phone: '(48) 99770-8821',
    email: 'obras@atlanticologistica.com.br',
    cidade: 'Biguaçu - SC',
    nextFollowUp: '2026-11-18',
    prazoDesejado: '2027-01-15',
    obs: 'Subestação aérea 150kVA + projeto de captação pluvial e hidrantes.',
    convertedProjectId: '',
    createdAt: '2026-10-30',
    logs: [
      { date: '2026-11-07', type: 'WhatsApp', text: 'Confirmado recebimento da planilha orçamentária pela diretoria.' }
    ]
  },
  {
    id: 'CRM-0005',
    cli: 'Residencial Maravista',
    obra: 'Unifamiliar Alto Padrão (Hidrossanitário + Elétrico)',
    area: 'Hidrossanitário',
    areaM2: 310,
    valorEst: 5400,
    stage: 'Lead',
    probabilidade: 25,
    origin: 'Instagram / Google',
    resp: 'Lucas',
    phone: '(48) 99123-7790',
    email: 'contato@maravista.arq.br',
    cidade: 'Palhoça - SC',
    nextFollowUp: '2026-11-15',
    prazoDesejado: '2026-12-28',
    obs: 'Contato vindo via portfólio; pediu estimativa por m² para combo Hidro + Elétrico.',
    convertedProjectId: '',
    createdAt: '2026-11-09',
    logs: [
      { date: '2026-11-09', type: 'WhatsApp', text: 'Solicitado envio da implantação arquitetônica em PDF.' }
    ]
  },
  {
    id: 'CRM-0006',
    cli: 'Reinaldo',
    obra: 'Residência Praia da Armação — Combo Instalações',
    area: 'Elétrico',
    areaM2: 195,
    valorEst: 2600,
    stage: 'Fechado',
    probabilidade: 100,
    origin: 'Cliente Recorrente',
    resp: 'Reinaldo Favero',
    phone: '(48) 99988-2211',
    email: 'reinaldo.favero@engenharia.br',
    cidade: 'Florianópolis - SC',
    nextFollowUp: '2026-11-20',
    prazoDesejado: '2026-11-30',
    obs: 'Aprovado e integrado ao cronograma de instalações.',
    convertedProjectId: '',
    createdAt: '2026-10-18',
    logs: [
      { date: '2026-10-25', type: 'Proposta', text: 'Proposta aprovada sem ressalvas; contrato assinado.' }
    ]
  }
];

export function loadInitialState() {
  const base = {
    name: 'Lucas',
    p: buildSeedProjects(),
    crm: SEED_CRM.map(c => ensureCrmFields(JSON.parse(JSON.stringify(c))))
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.name) base.name = parsed.name;
        if (Array.isArray(parsed.p) && parsed.p.length) base.p = parsed.p.map(ensureCostFields);
        if (Array.isArray(parsed.crm) && parsed.crm.length) base.crm = parsed.crm.map(ensureCrmFields);
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar localStorage:', e);
  }
  return base;
}

export function computeTeamMembers(projects) {
  const map = {};
  projects.forEach(p => {
    const raw = (p.resp || '').trim() || 'Não atribuído';
    if (!map[raw]) {
      map[raw] = {
        name: raw,
        projects: [],
        totalValor: 0,
        totalRec: 0,
        totalCustoResp: 0,
        concludedCustoResp: 0,
        pendingCustoResp: 0,
        totalCustosExtras: 0,
        doneCount: 0,
        devCount: 0,
        apprCount: 0,
        lateCount: 0,
        disciplines: new Set()
      };
    }
    const m = map[raw];
    m.projects.push(p);
    m.totalValor += +p.valor || 0;
    m.totalRec += +p.rec || 0;
    m.totalCustoResp += +p.custoResp || 0;
    m.totalCustosExtras += +p.custosExtras || 0;
    if (p.area) m.disciplines.add(p.area);
    if (p.st === STATUS_DONE) {
      m.doneCount++;
      m.concludedCustoResp += +p.custoResp || 0;
    } else {
      if (p.st === STATUS_APPR) m.apprCount++;
      else m.devCount++;
      if (isLate(p)) m.lateCount++;
      m.pendingCustoResp += +p.custoResp || 0;
    }
  });
  return Object.values(map).sort((a, b) => (b.devCount + b.apprCount) - (a.devCount + a.apprCount) || b.totalValor - a.totalValor);
}

export function computeClientsDirectory(projects, crm) {
  const map = {};
  const ensure = name => {
    const clean = (name || 'Sem cliente').trim();
    const key = clean.toLowerCase();
    if (!map[key]) {
      map[key] = {
        name: clean,
        projects: [],
        crmLeads: [],
        deliveredCount: 0,
        activeCount: 0,
        lateCount: 0,
        totalValor: 0,
        totalRec: 0,
        totalBalance: 0,
        totalCost: 0,
        totalProfit: 0,
        disciplines: {},
        lastDate: ''
      };
    }
    return map[key];
  };

  projects.forEach(p => {
    const c = ensure(p.cli);
    c.projects.push(p);
    const val = +p.valor || 0;
    const rec = +p.rec || 0;
    const cost = getCustoTotal(p);
    c.totalValor += val;
    c.totalRec += rec;
    c.totalBalance += getBalance(p);
    c.totalCost += cost;
    c.totalProfit += val - cost;
    if (p.st === STATUS_DONE) c.deliveredCount++;
    else {
      c.activeCount++;
      if (isLate(p)) c.lateCount++;
    }
    const disc = (p.area || 'Geral').trim();
    c.disciplines[disc] = (c.disciplines[disc] || 0) + 1;
    const dt = p.prazo || p.ini || '';
    if (dt > c.lastDate) c.lastDate = dt;
  });

  crm.forEach(l => {
    const c = ensure(l.cli);
    c.crmLeads.push(l);
  });

  return Object.values(map).sort((a, b) => b.totalValor - a.totalValor || b.deliveredCount - a.deliveredCount || a.name.localeCompare(b.name));
}

export function computeCrmAnalytics(crm) {
  const leads = crm.map(ensureCrmFields);
  const won = leads.filter(l => l.stage === 'Fechado');
  const lost = leads.filter(l => l.stage === 'Perdido');
  const active = leads.filter(l => l.stage !== 'Fechado' && l.stage !== 'Perdido');

  const wonValue = won.reduce((acc, l) => acc + (+l.valorEst || 0), 0);
  const openPipeline = active.reduce((acc, l) => acc + (+l.valorEst || 0), 0);
  const weightedForecast = active.reduce((acc, l) => acc + (+l.valorEst || 0) * ((+l.probabilidade || 0) / 100), 0);

  const resolvedCount = won.length + lost.length;
  const winRate = resolvedCount > 0 ? Math.round((won.length / resolvedCount) * 100) : 0;

  const leadsWithM2 = leads.filter(l => l.areaM2 > 0 && l.valorEst > 0);
  const totalAreaM2 = leadsWithM2.reduce((a, l) => a + l.areaM2, 0);
  const totalAreaVal = leadsWithM2.reduce((a, l) => a + l.valorEst, 0);
  const avgPerM2 = totalAreaM2 > 0 ? totalAreaVal / totalAreaM2 : 0;

  const cumMap = [
    { key: 'Lead', label: 'Leads Recebidos', color: '#3b82f6', items: leads.filter(l => l.stage !== 'Perdido') },
    { key: 'Levantamento', label: 'Levantamento / Visita', color: '#06b6d4', items: leads.filter(l => ['Levantamento', 'Proposta', 'Negociação', 'Fechado'].includes(l.stage)) },
    { key: 'Proposta', label: 'Propostas Enviadas', color: '#f59e0b', items: leads.filter(l => ['Proposta', 'Negociação', 'Fechado'].includes(l.stage)) },
    { key: 'Negociação', label: 'Em Negociação', color: '#8b5cf6', items: leads.filter(l => ['Negociação', 'Fechado'].includes(l.stage)) },
    { key: 'Fechado', label: 'Obras Fechadas', color: '#16a34a', items: won }
  ];

  const baseCount = Math.max(1, cumMap[0].items.length);
  const funnelBars = cumMap.map(row => ({
    key: row.key,
    label: row.label,
    color: row.color,
    count: row.items.length,
    val: row.items.reduce((s, x) => s + (+x.valorEst || 0), 0),
    pct: Math.round((row.items.length / baseCount) * 100)
  }));

  return { leads, won, active, lost, wonValue, weightedForecast, openPipeline, winRate, avgPerM2, funnelBars };
}

export function filterProjectsByPeriod(projects, period, customStart, customEnd) {
  const ref = todayISO();
  let start = '0000-00-00';
  let end = '9999-12-31';

  if (period === '30D') start = addDaysISO(ref, -30);
  else if (period === '3M') start = addDaysISO(ref, -90);
  else if (period === '6M') start = addDaysISO(ref, -180);
  else if (period === '1A') start = addDaysISO(ref, -365);
  else if (period === 'CUSTOM') {
    start = customStart || '0000-00-00';
    end = customEnd || '9999-12-31';
  }

  return projects.filter(p => {
    const dt = p.ini || p.prazo || '';
    return !dt || (dt >= start && dt <= end);
  });
}

export function buildMonthlySeries(projects) {
  const map = {};
  projects.forEach(p => {
    const dt = p.ini || p.prazo || todayISO();
    const ym = dt.slice(0, 7);
    if (!map[ym]) {
      const [y, m] = ym.split('-');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      map[ym] = {
        ym,
        label: `${months[Math.max(0, Number(m) - 1)]}/${y.slice(2)}`,
        revenue: 0,
        costs: 0,
        profit: 0,
        received: 0,
        count: 0
      };
    }
    const row = map[ym];
    row.revenue += +p.valor || 0;
    row.costs += getCustoTotal(p);
    row.profit += getLucro(p);
    row.received += +p.rec || 0;
    row.count += 1;
  });
  return Object.values(map).sort((a, b) => a.ym.localeCompare(b.ym));
}

export function exportProjectsCSV(projects) {
  const headers = ['ID', 'Cliente', 'Obra', 'Disciplina', 'Tipo', 'Inicio', 'Prazo', 'Status', 'Contratado', 'Recebido', 'Saldo', 'Honorarios', 'Extras', 'Lucro LR', 'Responsavel'];
  const rows = projects.map(p => [
    p.id,
    p.cli,
    p.obra,
    p.area,
    p.tipo,
    formatDate(p.ini),
    formatDate(p.prazo),
    p.st,
    (+p.valor || 0).toFixed(2),
    (+p.rec || 0).toFixed(2),
    getBalance(p).toFixed(2),
    (+p.custoResp || 0).toFixed(2),
    (+p.custosExtras || 0).toFixed(2),
    getLucro(p).toFixed(2),
    p.resp || ''
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LR-Engenharia-Projetos-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
