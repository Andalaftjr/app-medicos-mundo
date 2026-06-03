import {
  Activity,
  AlertCircle,
  Calendar,
  Download,
  FileText,
  Gift,
  Gavel,
  HeartHandshake,
  HomeIcon,
  PieChart,
  ShieldCheck,
  Stethoscope,
  Users,
  Dog,
  Clock,
  MapPin,
} from 'lucide-react';

const TABS = [
  { id: 'geral', label: 'Geral', icon: PieChart },
  { id: 'clinica', label: 'Saúde', icon: Stethoscope },
  { id: 'social', label: 'Social', icon: HeartHandshake },
  { id: 'vet', label: 'Veterinária', icon: Dog },
  { id: 'doacoes', label: 'Doações', icon: Gift },
  { id: 'justiça', label: 'Justiça de Rua', icon: Gavel },
];

const EXPORT_LABELS = {
  geral: 'Geral',
  clinica: 'Saúde',
  social: 'Social',
  vet: 'Veterinária',
  doacoes: 'Doações',
  justiça: 'Justiça de Rua',
};

const percentOf = (value, total) => (total ? Math.round((Number(value || 0) / Number(total || 0)) * 100) : 0);
const decimalOf = (value, total) => (total ? (Number(value || 0) / Number(total || 0)).toFixed(1) : '0.0');

function MetricCard({ label, value, note, icon: Icon, tone = 'navy' }) {
  const tones = {
    navy: 'border-[#d7dcf6] bg-[#f4f6ff] text-[#292f63]',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    gray: 'border-gray-200 bg-gray-50 text-gray-700',
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.navy}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.18em] opacity-75">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none">{value}</p>
        </div>
        {Icon && <Icon size={21} className="shrink-0 opacity-70" />}
      </div>
      {note && <p className="mt-3 text-[8px] font-bold leading-snug opacity-80">{note}</p>}
    </div>
  );
}

function ProgressList({ title, icon: Icon, rows = [], total = 0, empty = 'Sem registros no recorte.', barClass = 'bg-[#292f63]' }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-[#292f63]" />}
        <h4 className="text-[8px] font-black uppercase tracking-[0.18em] text-[#292f63]">{title}</h4>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-3 text-[9px] font-bold italic text-gray-400">{empty}</p>
      ) : (
        <div className="space-y-3">
          {rows.map(([label, count]) => (
            <div key={label}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[9px] font-bold text-gray-600">
                <span className="min-w-0 truncate">{label}</span>
                <span className="shrink-0 font-black text-[#292f63]">{count} ({percentOf(count, total)}%)</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${barClass}`} style={{ width: `${percentOf(count, total)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SimpleRows({ title, icon: Icon, rows = [], empty = 'Sem dados para exibir.', accent = 'text-[#292f63]' }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon size={14} className={accent} />}
        <h4 className={`text-[8px] font-black uppercase tracking-[0.18em] ${accent}`}>{title}</h4>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-3 text-[9px] font-bold italic text-gray-400">{empty}</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {rows.map(([label, value, note]) => (
            <div key={`${label}-${value}-${note || ''}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-[9px] font-black text-gray-700">{label}</p>
                {note && <p className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-gray-400">{note}</p>}
              </div>
              <span className="shrink-0 text-sm font-black text-[#292f63]">{value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AreaPanel({ title, subtitle, metrics = [], sections = [], accent = 'navy' }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-[1.7rem] border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-400">{subtitle}</p>
        <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-[#101932]">{title}</h3>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} tone={metric.tone || accent} />
          ))}
        </div>
      </div>
      {sections.map((section) => (
        <div key={section.key || section.title}>{section.render}</div>
      ))}
    </div>
  );
}

export default function DashboardView({
  statTab,
  setStatTab,
  currentActionLocation,
  statsGeral,
  statsAtuacoes,
  statsClinica,
  statsSocial,
  statsVet,
  statsDoacoes,
  statsJustica,
  diagnosticStats,
  queueWaiting,
  queueCritical,
  queueFinished,
  canExportReports,
  isExporting,
  exportDate,
  setExportDate,
  exportWorkbook,
}) {
  const selectedTab = TABS.some((tab) => tab.id === statTab) ? statTab : 'geral';
  const flowTotal = queueWaiting + queueFinished;
  const genderRows = [
    ['Masculino', statsGeral.masc || 0],
    ['Feminino', statsGeral.fem || 0],
    ['Outro / identidade registrada', statsGeral.outro || 0],
    ['Não informado', statsGeral.semInfo || 0],
  ].filter(([, value]) => value > 0);
  const coverageRows = [
    ['Cobertura de censo social', `${percentOf(statsSocial.total || 0, statsGeral.total || 0)}%`, `${statsSocial.total || 0} de ${statsGeral.total || 0} assistidos`],
    ['Assistidos com CPF ou RG', `${percentOf(statsGeral.comDocumento || 0, statsGeral.total || 0)}%`, `${statsGeral.comDocumento || 0} com documento registrado`],
    ['Atendimentos por assistido', decimalOf(statsAtuacoes.total || 0, statsGeral.total || 0), 'Média geral no recorte'],
    ['Áreas com registros', statsAtuacoes.areas?.length || 0, 'Especialidades com movimento'],
  ];
  const dailyRows = flowTotal > 0 ? [
    ['Aguardando ação', queueWaiting, queueCritical > 0 ? `${queueCritical} caso(s) crítico(s)` : 'Fila do plantão atual'],
    ['Finalizados hoje', queueFinished, `${percentOf(queueFinished, flowTotal)}% do fluxo do plantão`],
  ] : [];
  const diagnosticRows = [
    ['Medicina Humana', diagnosticStats.med?.[0]?.[0] || 'Sem diagnóstico consolidado', diagnosticStats.med?.[0]?.[1] || 0],
    ['Odontologia', diagnosticStats.odonto?.[0]?.[0] || 'Sem diagnóstico consolidado', diagnosticStats.odonto?.[0]?.[1] || 0],
    ['Psicologia', diagnosticStats.psico?.[0]?.[0] || 'Sem sinais consolidados', diagnosticStats.psico?.[0]?.[1] || 0],
  ];

  const clinicalSections = [
    { key: 'areas', render: <ProgressList title="Atendimentos por especialidade" icon={Activity} rows={statsClinica.areas || []} total={statsClinica.total || 0} empty="Sem registros de saúde." /> },
    { key: 'diagnostics', render: <SimpleRows title="Principais registros clínicos" icon={FileText} rows={diagnosticRows.map(([area, label, count]) => [label, count, area])} empty="Sem diagnósticos ou sinais consolidados." /> },
  ];

  const socialSections = [
    { key: 'moradia', render: <ProgressList title="Situação de moradia" icon={HomeIcon} rows={statsSocial.moradia || []} total={statsSocial.total || 0} empty="Sem registros sociais." /> },
    { key: 'support', render: <SimpleRows title="Atendimentos de suporte" icon={HeartHandshake} rows={(statsSocial.areas || []).map(([label, count]) => [label, count])} empty="Sem atendimentos sociais registrados." /> },
  ];

  const panels = {
    geral: (
      <div className="space-y-4 animate-fade-in">
        <div className="rounded-[1.7rem] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-400">Panorama do local da ação</p>
          <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-[#101932]">Resumo geral da ação</h3>
          <p className="mt-2 text-[9px] font-bold leading-relaxed text-gray-500">
            Dados consolidados do local selecionado. Use para entender volume, cobertura dos registros e distribuição dos atendimentos.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MetricCard label="Assistidos cadastrados" value={statsGeral.total || 0} note="Pessoas únicas no local" icon={Users} tone="navy" />
            <MetricCard label="Atendimentos registrados" value={statsAtuacoes.total || 0} note="Todos os módulos somados" icon={Activity} tone="emerald" />
            <MetricCard label="Triagens registradas" value={statsGeral.triagensTotal || 0} note="Check-up e encaminhamentos" icon={Stethoscope} tone="gray" />
            <MetricCard label="Censos sociais" value={statsSocial.total || 0} note="Histórico social/anamnese" icon={HeartHandshake} tone="amber" />
          </div>
        </div>

        <SimpleRows title="Indicadores de qualidade do registro" icon={ShieldCheck} rows={coverageRows} />
        {dailyRows.length > 0 && <SimpleRows title="Plantão de hoje" icon={Clock} rows={dailyRows} accent={queueCritical > 0 ? 'text-red-700' : 'text-amber-700'} />}
        <ProgressList title="Movimento por área" icon={Activity} rows={(statsAtuacoes.areas || []).slice(0, 8)} total={statsAtuacoes.total || 0} empty="Sem atendimentos registrados ainda." />
        <ProgressList title="Perfil por sexo/gênero registrado" icon={Users} rows={genderRows} total={statsGeral.total || 0} empty="Sem informação de sexo/gênero nos cadastros." />
      </div>
    ),
    clinica: (
      <AreaPanel
        title="Saúde"
        subtitle="Produção clínica registrada"
        accent="navy"
        metrics={[
          { label: 'Atendimentos', value: statsClinica.total || 0, note: 'Registros de saúde', icon: Stethoscope },
          { label: 'Concluídos', value: statsClinica.concluidos || 0, note: 'Assinados/finalizados', icon: ShieldCheck, tone: 'emerald' },
          { label: 'Aguardando validação', value: statsClinica.pendentes || 0, note: 'Submetidos por acadêmicos', icon: Clock, tone: 'amber' },
          { label: 'Áreas ativas', value: statsClinica.areas.length || 0, note: 'Especialidades com registros', icon: Activity, tone: 'gray' },
        ]}
        sections={clinicalSections}
      />
    ),
    social: (
      <AreaPanel
        title="Censo e rede social"
        subtitle="Vulnerabilidade, moradia e suporte"
        accent="navy"
        metrics={[
          { label: 'Censos sociais', value: statsSocial.total || 0, note: 'Históricos preenchidos', icon: HeartHandshake },
          { label: 'Acolhimentos', value: statsSocial.atendimentos || 0, note: 'Atendimentos sociais', icon: Users, tone: 'gray' },
          { label: 'Área descoberta', value: statsSocial.moradiaRua || 0, note: 'Moradia em rua/descoberta', icon: HomeIcon, tone: 'amber' },
          { label: 'Risco alimentar', value: statsSocial.alimentar || 0, note: 'Falta de comida relatada', icon: AlertCircle, tone: 'red' },
        ]}
        sections={socialSections}
      />
    ),
    vet: (
      <AreaPanel
        title="Veterinária"
        subtitle="Família multiespécie e pets"
        accent="rose"
        metrics={[
          { label: 'Pets cadastrados', value: statsVet.total || 0, note: 'Animais com ficha', icon: Dog, tone: 'rose' },
          { label: 'Atendimentos', value: statsVet.atendimentos || 0, note: 'Registros veterinários', icon: Stethoscope, tone: 'navy' },
          { label: 'Situações clínicas', value: statsVet.situacoes?.length || 0, note: 'Categorias informadas', icon: Activity, tone: 'gray' },
          { label: 'Diagnósticos', value: statsVet.doencas?.length || 0, note: 'Diagnósticos registrados', icon: FileText, tone: 'gray' },
        ]}
        sections={[
          { key: 'situacoes', render: <ProgressList title="Situação clínica dos animais" icon={Activity} rows={statsVet.situacoes || []} total={statsVet.total || 0} empty="Sem registros veterinários." barClass="bg-rose-600" /> },
          { key: 'diags', render: <SimpleRows title="Diagnósticos registrados" icon={Stethoscope} rows={(statsVet.doencas || []).map(([label, count]) => [label, count])} empty="Sem diagnósticos informados." accent="text-rose-700" /> },
        ]}
      />
    ),
    doacoes: (
      <AreaPanel
        title="Doações"
        subtitle="Itens entregues e solicitações"
        accent="amber"
        metrics={[
          { label: 'Atendimentos', value: statsDoacoes.total || 0, note: 'Registros de doação', icon: Gift, tone: 'amber' },
          { label: 'Assistidos', value: statsDoacoes.assistidos || 0, note: 'Pessoas atendidas', icon: Users, tone: 'navy' },
          { label: 'Itens entregues', value: statsDoacoes.itensTotal || 0, note: 'Categorias somadas', icon: ShieldCheck, tone: 'emerald' },
          { label: 'Solicitações', value: statsDoacoes.solicitacoes || 0, note: 'Com pedido descrito', icon: FileText, tone: 'gray' },
        ]}
        sections={[
          { key: 'itens', render: <ProgressList title="Itens entregues" icon={Gift} rows={statsDoacoes.itens || []} total={statsDoacoes.itensTotal || 0} empty="Nenhum item registrado." barClass="bg-orange-600" /> },
        ]}
      />
    ),
    justiça: (
      <AreaPanel
        title="Justiça de Rua"
        subtitle="Demandas jurídicas e encaminhamentos"
        accent="navy"
        metrics={[
          { label: 'Atendimentos', value: statsJustica.total || 0, note: 'Registros jurídicos', icon: Gavel },
          { label: 'Assistidos', value: statsJustica.assistidos || 0, note: 'Pessoas atendidas', icon: Users, tone: 'navy' },
          { label: 'Categorias', value: statsJustica.categorias || 0, note: 'Demandas classificadas', icon: FileText, tone: 'gray' },
          { label: 'Com ação', value: statsJustica.acoes || 0, note: 'Orientação/encaminhamento', icon: ShieldCheck, tone: 'emerald' },
        ]}
        sections={[
          { key: 'demandas', render: <ProgressList title="Tipos de demanda" icon={Gavel} rows={statsJustica.demandas || []} total={statsJustica.categorias || 0} empty="Sem demandas jurídicas registradas." /> },
        ]}
      />
    ),
  };

  return (
    <div className="min-h-screen space-y-5 p-4 pb-40 animate-fade-in">
      <header className="rounded-[1.8rem] border border-gray-100 bg-white p-5 text-left shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[7px] font-black uppercase tracking-[0.24em] text-gray-400">Dashboard operacional</p>
            <h2 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight text-[#101932]">Médicos do Mundo</h2>
            <p className="mt-2 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-gray-500">
              <MapPin size={11} className="shrink-0 text-[#292f63]" />
              <span className="truncate">{currentActionLocation?.label || 'Local da ação'} · {currentActionLocation?.neighborhood || currentActionLocation?.city || 'Praça selecionada'}</span>
            </p>
          </div>
          <div className="rounded-2xl bg-[#292f63] p-3 text-white shadow-md">
            <PieChart size={22} />
          </div>
        </div>
      </header>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex min-w-max gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatTab(id)}
              className={`flex min-h-[42px] items-center gap-2 rounded-full border px-4 text-[8px] font-black uppercase tracking-wider transition-all ${selectedTab === id ? 'border-[#292f63] bg-[#292f63] text-white shadow-md' : 'border-gray-200 bg-white text-gray-500 shadow-sm'}`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {panels[selectedTab]}

      {canExportReports ? (
        <section className="rounded-[1.6rem] border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3 text-left">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-700">Exportação XLSX</p>
              <p className="mt-1 text-[8px] font-bold leading-snug text-gray-400">Gere uma visão geral ou um recorte por data da aba selecionada.</p>
            </div>
            <Download size={18} className="shrink-0 text-[#292f63]" />
          </div>
          <button onClick={() => exportWorkbook('geral')} disabled={isExporting} className="w-full rounded-xl bg-[#292f63] px-4 py-3.5 text-[9px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 disabled:opacity-60">
            {isExporting ? 'Gerando XLSX...' : `Exportar ${EXPORT_LABELS[selectedTab]} - geral`}
          </button>
          <div className="my-3 border-t border-gray-100"></div>
          <label className="mb-2 block text-[7px] font-black uppercase tracking-widest text-gray-500">Data da ação para o recorte</label>
          <div className="flex gap-2">
            <input type="date" value={exportDate} onChange={(event) => setExportDate(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-[10px] font-bold text-gray-700 outline-none focus:border-[#292f63]" />
            <button onClick={() => exportWorkbook('data')} disabled={isExporting || !exportDate} className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-3 text-[8px] font-black uppercase tracking-wider text-white shadow-md active:scale-95 disabled:opacity-60">
              <Calendar size={14} /> Por data
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-[1.5rem] border border-gray-200 bg-white p-4 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">Visualização liberada</p>
          <p className="mt-1 text-[8px] font-bold leading-relaxed text-gray-400">Exportação de dados restrita à coordenação e administração.</p>
        </section>
      )}
    </div>
  );
}
