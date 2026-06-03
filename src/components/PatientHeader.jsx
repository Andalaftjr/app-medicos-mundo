const normalizeStr = (str) => str ? String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
const requiredText = (value) => String(value || '').trim();
const formatName = (name) => name ? name.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()).join(' ') : '';
const compactList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
};

const MARCADORES_SEVERIDADE = [
  'HIV', 'CANCER', 'CÂNCER', 'IDEAÇÃO SUICIDA', 'SUICIDA', 'TEA', 'AUTISMO',
  'RISCO IMEDIATO', 'SITUAÇÃO CRÍTICA', 'CRÍTICA', 'VIOLÊNCIA', 'ABUSO',
  'GESTANTE', 'TUBERCULOSE', 'TB', 'EPILEPSIA', 'EPILÉTICO', 'EPILEPTICO',
  'CONVULSÃO', 'CONVULSAO', 'SÍNDROME DE DOWN', 'SINDROME DE DOWN', 'DOWN',
  'DEFICIÊNCIA', 'DEFICIENCIA', 'MOBILIDADE REDUZIDA', 'DESORIENTADA',
  'DESORIENTADO', 'CONFUSA', 'CONFUSO', 'CRIANÇA DESACOMPANHADA',
  'CRIANCA DESACOMPANHADA',
];

const hasSevereMarker = (...values) => {
  const joined = normalizeStr(values.flat().filter(Boolean).join(' '));
  return MARCADORES_SEVERIDADE.some(marker => joined.includes(normalizeStr(marker)));
};

const isSpecialCareSignal = (value) => {
  const text = normalizeStr(value);
  if (!text) return false;
  return hasSevereMarker(value)
    || [
      'uso de substancia com alteracao importante',
      'substancia com alteracao importante',
      'dificuldade de fala',
      'dificuldade de comunicacao',
      'deficiencia auditiva',
      'deficiencia visual',
      'pessoa idosa fragil',
      'idosa fragil',
      'idoso fragil',
      'precisa de acompanhante',
      'precisa de prioridade',
      'acompanhante ou prioridade',
    ].some(marker => text.includes(marker));
};

const chipValueLabel = (value) => {
  const normalized = normalizeStr(value);
  if (normalized.includes('nao ha antecedentes')) return 'sem antecedentes referidos';
  if (normalized.includes('nao sabe informar')) return 'nao sabe informar';
  if (normalized.includes('sem atencao especial')) return '';
  if (['nao informado', 'nao se aplica', 'nega', ''].includes(normalized)) return '';
  return value;
};

const calculateAge = (dob) => {
  if (!dob) return 'Não informado';
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return 'Não informado';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age ? `${age} anos` : 'Não informado';
};

const assistidoDisplayName = (assistido) => (
  requiredText(assistido?.nomeSocial)
  || requiredText(assistido?.nome)
  || requiredText(assistido?.nomeCivil)
  || 'Nome não informado'
);

const formatHeaderTriageStatus = (status) => {
  const cleanStatus = requiredText(status);
  const normalized = normalizeStr(cleanStatus);
  if (normalized.includes('sem sinais vitais')) return 'Triagem anterior parcial: sinais vitais pendentes';
  if (normalized.includes('completa')) return 'Triagem anterior completa';
  if (normalized.includes('parcial')) return 'Triagem anterior parcial';
  return cleanStatus ? `Triagem anterior: ${cleanStatus}` : 'Triagem anterior registrada';
};

const humanizeHeaderFlow = (flowText, triagem) => {
  if (triagem?.data && triagem?.preenchimentoStatus) {
    return `${formatHeaderTriageStatus(triagem.preenchimentoStatus)} (${triagem.data})`;
  }
  const text = requiredText(flowText);
  if (!text) return 'Sem registro clínico anterior';
  const triagemMatch = text.match(/^Triagem\s+(.+?)\s+em\s+(.+)$/i);
  if (triagemMatch) return `${formatHeaderTriageStatus(triagemMatch[1])} (${triagemMatch[2]})`;
  const datedMatch = text.match(/^(.+?)\s+em\s+(\d{2}\/\d{2}\/\d{4})$/i);
  if (datedMatch) return `Último registro: ${datedMatch[1]} (${datedMatch[2]})`;
  return text;
};

export default function PatientHeader({ assistido, triagem, censo }) {
  if (!assistido) return null;
  const flowStatus = humanizeHeaderFlow(
    triagem?.queixaPrincipal || triagem?.historiaClinica || triagem?.queixa || triagem?.observacaoAtencao || assistido?.ultimoAtendimento,
    triagem
  );
  const problemChips = [
    ...compactList(censo?.comorbidades).map(value => ({
      label: 'Antecedentes clínicos',
      value: chipValueLabel(value),
    })),
    ...compactList(censo?.alergias).map(value => ({
      label: 'Alergias',
      value: chipValueLabel(value),
    })),
    ...compactList(triagem?.sinaisAtencao).filter(isSpecialCareSignal).map(value => ({
      label: 'Cuidado especial',
      value: chipValueLabel(value),
    })),
  ].filter(item => item.value);
  const medication = requiredText(triagem?.medicacaoUso)
    || [requiredText(triagem?.medicacaoFarmaco), requiredText(triagem?.medicacaoDose)].filter(Boolean).join(' - ')
    || chipValueLabel(censo?.medsUso);
  const criticalChips = problemChips.filter(item => hasSevereMarker(item.value)).slice(0, 4);
  const shownProblems = (criticalChips.length ? criticalChips : problemChips).slice(0, 4);

  return (
    <div className="sticky top-0 z-50 -mx-4 mb-4 border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#292f63] text-sm font-black text-white">
          {assistido.photo ? <img src={assistido.photo} alt="" className="h-full w-full object-cover" /> : formatName(assistidoDisplayName(assistido))[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-black uppercase text-[#101932]">{assistidoDisplayName(assistido)}</p>
          <p className="mt-0.5 truncate text-[7px] font-black uppercase tracking-wider text-gray-400">
            {calculateAge(assistido.dataNascimento)} - {assistido.sexo || 'Sexo não informado'}
          </p>
          <p className="mt-1 line-clamp-1 text-[8px] font-bold text-gray-600">
            Queixa/fluxo: {flowStatus}
          </p>
          <p className="mt-1 line-clamp-1 text-[8px] font-bold text-gray-600">
            Medicação em uso: {medication || 'Não informada'}
          </p>
        </div>
      </div>
      {shownProblems.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {shownProblems.map(item => (
            <span key={`${item.label}-${item.value}`} className={`rounded-full px-2 py-1 text-[6px] font-black uppercase tracking-wider ${hasSevereMarker(item.value) ? 'bg-red-100 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
