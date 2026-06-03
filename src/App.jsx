import { createContext, useState, useEffect, useRef, useMemo } from 'react';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut, sendPasswordResetEmail, sendEmailVerification
} from 'firebase/auth';
import { 
  collection, onSnapshot, doc, setDoc, getDoc, getDocs,
  query, where, limit, serverTimestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { 
  Search, UserPlus, Stethoscope, History as HistoryIcon, 
  ArrowLeft, User, Calendar, CheckCircle, FileText, HeartPulse, 
  Clock, AlertCircle, X, LogOut, PieChart, Users,
  ChevronRight, Activity, Brain, Heart, Info, 
  UserCheck, Baby, HomeIcon, Dog, 
  Gift, Smile, HeartHandshake, MapPin, Navigation as NavigationIcon, IdCard, 
  Edit3, Briefcase, Star, Gavel,
  ShieldCheck, Trash2, RefreshCw, UserCog, Mail, Phone, Menu
} from 'lucide-react';
import { app, auth, db, storage } from './firebaseConfig';
import PhotoHandler from './components/PhotoHandler';
import PatientHeader from './components/PatientHeader';
import DashboardView from './components/DashboardView';

const appFunctions = getFunctions(app, 'southamerica-east1');
const updateUserAccessCallable = httpsCallable(appFunctions, 'updateUserAccess');
const revokeUserAccessCallable = httpsCallable(appFunctions, 'revokeUserAccess');
const ActionLocationContext = createContext(null);

const BRAND = {
  navy: '#292f63',
  navyDark: '#1f244f',
  red: '#ef312a',
};

// --- LISTAS CLÍNICAS E ESTATÍSTICAS ---
const TODAS_ESPECIALIDADES = [
  'Medicina Humana', 'Odontologia', 'Psicologia', 'Nutrição', 'Fisioterapia',
  'Enfermagem / Curativos', 'Vacinação', 'Biomedicina', 'Veterinária', 
  'Farmácia', 'Podologia', 'Acolhimento Social', 'Justiça de Rua', 'Doações',
  'Beleza de Rua', 'Atendimento Infantil / Brinquedoteca', 'Exames Clínicos',
  'Emissão de Documentos', 'Apoio à Mulher'
];

const LISTA_COMORBIDADES = [
  "Não há antecedentes",
  "HAS", "DM", "DPOC", "TB", "HIPOTIREOIDISMO", "HIPERTIREOIDISMO", "HEPATITE B", 
  "HEPATITE C", "SÍFILIS", "HIV", "AVC", "IAM", "CANCER", "TROMBOSE", "IST’S", 
  "COVID", "OBESIDADE", "DESNUTRIÇÃO", "DISLIPIDEMIA", "ARTROSE/ARTRITE", 
  "FIBROMIALGIA", "ESCABIOSE/MICOSES", "ANEMIA", "GASTRITE/ULCERA/ESOFAGITE", 
  "DROGADIÇÃO", "TRANSTORNO PSIQUIÁTRICO", "EPILEPSIA"
];

const LISTA_PSIQUIATRIA = [
  "Ausência de diagnóstico",
  "Depressão", "TAG", "TOC", "Transtorno Bipolar", "Esquizofrenia", "Insônia", 
  "Abstinência", "Ideação Suicida", "Borderline", "Outros: especifique"
];

const LISTA_VICIOS = [
  "Não faz uso declarado",
  "Tabaco", "Álcool", "Maconha", "Crack", "Cocaína", "Lança perfume",
  "Cola", "Ecstasy", "LSD", "Heroína"
];

const TOPICOS_QUEIXA = [
  "Cefaleia", "Artralgia/ Mialgia/Lombalgia", "Sintomas Respiratórios", 
  "Sintomas Gastro Intestinais", "Sintomas Urinários", "Alterações pressóricas", 
  "Ferimentos", "Encaminhamentos/renovação de receitas", "Vacinação/ testagem", "Não se aplica"
];

const ENCAMINHAMENTOS_EXTERNOS = [
  "UPA", "CAPS", "Remoção de ambulância", "Curativos em UBS", "UBS clínica médica", 
  "UBS ginecologia/obstetrícia", "UBS cirurgia geral", "UBS ortopedia", 
  "UBS medicina família", "UBS pediatria", "Reabilitação", "Retirada de medicações em policlínica/UBS",
  "Consultório de Rua", "Retorno na próxima ação"
];

const SINTOMAS_GINEC = [
  "Ausência de sintoma",
  "Corrimento Vaginal", "Dor pélvica", "Sangramento disfuncional", 
  "Amenorreia / suspeita de gravidez", "Dor na relação sexual"
];

const PROGRAMAS_SOCIAIS = ["Centro POP", "CAPS", "CRAS", "Consultório na Rua", "Outros"];
const FILIAIS_EQUIPE = ['Santos', 'São Paulo', 'Osasco'];
const ACTION_LOCATIONS = [
  {
    value: 'santos_medicosdomundo',
    label: 'Médicos do Mundo Santos',
    city: 'Santos',
    neighborhood: 'Paquetá',
    unit: 'medicosdomundo.santos',
  },
  {
    value: 'itanhaem_medicosdomundo',
    label: 'Médicos do Mundo Itanhaém',
    city: 'Itanhaém',
    neighborhood: 'Belas Artes',
    unit: 'medicosdomundo.itanhaem',
  },
];
const TENANT_INITIAL_LIMIT = 50;
const USERS_INITIAL_LIMIT = 200;
const REPORT_MAX_LIMIT = 5000;
const TRIAGE_ATTENTION_OPTIONS = [
  'Situação crítica / risco imediato',
  'Pessoa desorientada ou confusa',
  'Uso de substância com alteração importante',
  'TEA / autismo - cuidado sensorial',
  'Deficiência física / mobilidade reduzida',
  'Deficiência auditiva',
  'Deficiência visual',
  'Dificuldade de fala ou comunicação',
  'Gestante',
  'Pessoa idosa frágil',
  'Criança desacompanhada ou vulnerável',
  'Suspeita de violência / abuso',
  'Precisa de acompanhante ou prioridade',
];

const CATEGORIAS_DOACAO = ['Kit higiene', 'Roupas', 'Sapatos'];
const CATEGORIAS_JUSTICA = ['Direito civil', 'Dúvida trabalhista', 'Orientação cível', 'Orientação eleitoral', 'Outro (especifique)'];
const VACINAS_APLICADAS = ['Influenza', 'COVID-19', 'Tétano', 'Outras'];
const RELIGIOES_CENSO = ['Não informado', 'Católica', 'Evangélica', 'Espírita', 'Umbanda/Candomblé', 'Matriz africana', 'Ateu/Agnóstico', 'Outra', 'Prefere não responder'];
const TEMAS_ACONSELHAMENTO = ['Hábitos alimentares', 'Hidratação', 'Segurança alimentar', 'Diabetes/Hipertensão', 'Saúde mental', 'Adesão ao cuidado'];
const LOCAIS_ENCAMINHAMENTO = ['UBS', 'CAPS', 'CRAS', 'Centro POP', 'Consultório na Rua', 'Policlínica', 'Rede parceira', 'Retorno próxima ação'];
const MARCADORES_SEVERIDADE = [
  'HIV', 'CANCER', 'CÂNCER', 'IDEAÇÃO SUICIDA', 'SUICIDA', 'TEA', 'AUTISMO',
  'RISCO IMEDIATO', 'SITUAÇÃO CRÍTICA', 'CRÍTICA', 'VIOLÊNCIA', 'ABUSO',
  'GESTANTE', 'TUBERCULOSE', 'TB', 'EPILEPSIA', 'EPILÉTICO', 'EPILEPTICO',
  'CONVULSÃO', 'CONVULSAO', 'SÍNDROME DE DOWN', 'SINDROME DE DOWN', 'DOWN',
  'DEFICIÊNCIA', 'DEFICIENCIA', 'MOBILIDADE REDUZIDA', 'DESORIENTADA',
  'DESORIENTADO', 'CONFUSA', 'CONFUSO', 'CRIANÇA DESACOMPANHADA',
  'CRIANCA DESACOMPANHADA',
];
const TIPOS_ALERGIA = ['Medicamentos', 'Alimentos', 'Outros'];
const TIPOS_PETS = ['Cao', 'Gato', 'Outros'];
const PERFIS_CADASTRAVEIS = [
  'voluntario_eficiente', 'colaborador_servico', 'academico', 'profissional_formado'
];
const PERFIS_COORDENACAO = ['admin', 'coordenador'];
const ATUACOES_TECNICAS = [
  'medicina', 'odontologia', 'psicologia', 'nutricao', 'fisioterapia',
  'enfermagem', 'biomedicina', 'veterinaria', 'direito', 'farmacia',
  'servico_social', 'podologia', 'vacinacao', 'exames_clinicos'
];
const ATUACOES_SAUDE_TRIAGEM = [
  'medicina', 'odontologia', 'psicologia', 'nutricao', 'fisioterapia',
  'enfermagem', 'biomedicina', 'veterinaria', 'farmacia', 'podologia',
  'vacinacao', 'exames_clinicos'
];
const ATUACOES_SERVICO = [
  'cadastro_triagem', 'cabeleireiro', 'brinquedoteca', 'apoio_mulher',
  'documentacao', 'acolhimento', 'doacoes'
];
const PROFISSOES_CADASTRAVEIS = [
  ...ATUACOES_TECNICAS, ...ATUACOES_SERVICO, 'apoio_operacional', 'apoio_transversal'
];
const ROLE_LABELS = {
  admin: 'Administrador',
  coordenador: 'Coordenação',
  voluntario_eficiente: 'Voluntário(a) de apoio geral',
  colaborador_servico: 'Colaborador(a) de serviço',
  academico: 'Acadêmico(a)',
  profissional_formado: 'Profissional habilitado(a)',
  voluntario: 'Voluntário(a) geral',
};
const PROFESSION_LABELS = {
  cadastro_triagem: 'Cadastro e Triagem',
  medicina: 'Atendimento médico',
  odontologia: 'Odontologia',
  psicologia: 'Apoio Psicológico',
  nutricao: 'Avaliação Nutricional',
  fisioterapia: 'Fisioterapia e Reabilitação',
  enfermagem: 'Tratamento de Feridas',
  biomedicina: 'Exames Clínicos / Biomedicina',
  veterinaria: 'Atendimento Veterinário',
  direito: 'Justiça de Rua',
  farmacia: 'Farmácia',
  vacinacao: 'Aplicação de Vacinas',
  exames_clinicos: 'Exames Clínicos',
  servico_social: 'Assistência Social',
  podologia: 'Podologia',
  beleza: 'Banho e Corte de Cabelo',
  cabeleireiro: 'Banho e Corte de Cabelo',
  brinquedoteca: 'Atendimento Infantil e Brinquedoteca',
  apoio_mulher: 'Apoio à Mulher',
  documentacao: 'Emissão de Documentos',
  acolhimento: 'Acolhimento Social',
  doacoes: 'Doações e Itens',
  apoio_operacional: 'Apoio operacional geral',
  apoio_transversal: 'Apoio transversal / acolhimento',
};
const LEGACY_ROLE_PROFESSION = {
  enfermeiro: 'enfermagem',
  medico: 'medicina',
  psicologo: 'psicologia',
  odonto: 'odontologia',
  nutricionista: 'nutricao',
  fisioterapeuta: 'fisioterapia',
  advogado: 'direito',
  biomedico: 'biomedicina',
  veterinario: 'veterinaria',
};
const AREA_ALLOWED_PROFESSIONS = {
  'Medicina Humana': ['medicina'],
  'Odontologia': ['odontologia'],
  'Psicologia': ['psicologia'],
  'Nutrição': ['nutricao'],
  'Fisioterapia': ['fisioterapia'],
  'Enfermagem / Curativos': ['enfermagem', 'medicina'],
  'Vacinação': ['enfermagem', 'biomedicina', 'medicina', 'farmacia', 'vacinacao'],
  'Biomedicina': ['biomedicina', 'medicina'],
  'Exames Clínicos': ['biomedicina', 'medicina', 'exames_clinicos'],
  'Veterinária': ['veterinaria'],
  'Justiça de Rua': ['direito'],
  'Podologia': ['podologia', 'enfermagem', 'medicina'],
  'Farmácia': ['farmacia', 'medicina', 'enfermagem'],
  'Doações': ['doacoes', 'apoio_operacional'],
  'Beleza de Rua': ['cabeleireiro', 'beleza'],
  'Acolhimento Social': ['servico_social', 'acolhimento'],
  'Apoio à Mulher': ['apoio_mulher', 'servico_social', 'psicologia'],
  'Atendimento Infantil / Brinquedoteca': ['brinquedoteca'],
  'Emissão de Documentos': ['documentacao', 'servico_social', 'direito'],
};
const AREAS_COM_VALIDACAO_PROFISSIONAL = [
  'Medicina Humana', 'Odontologia', 'Psicologia', 'Nutrição', 'Fisioterapia',
  'Enfermagem / Curativos', 'Vacinação', 'Biomedicina', 'Exames Clínicos',
  'Veterinária', 'Justiça de Rua', 'Podologia', 'Farmácia'
];

const DIAGNOSTICOS_POR_AREA = {
  'Medicina': LISTA_COMORBIDADES,
  'Odontologia': ["Cárie Dentária", "Gengivite", "Periodontite / Doença Periodontal", "Abscesso Dentário / Fístula", "Edentulismo (Perda de Dentes)", "Traumatismo Dental", "Lesão de Mucosa / Estomatite", "Odontalgia Aguda (Dor)"],
  'Psicologia': LISTA_PSIQUIATRIA,
  'Fisioterapia': ["Lombalgia / Dor Lombar", "Cervicalgia", "Artrose / Osteoartrite", "Sequelas de AVC (Hemiplegia, etc)", "Traumatismo / Fratura em Recuperação", "Tendinite / Bursite", "Dor Crônica Generalizada"],
  'Enfermagem': ["Risco de Infecção Associado a Lesão", "Ferida Crônica / Pé Diabético", "Baixa Adesão ao Tratamento Medicamentoso", "Curativo Complexo Realizado", "Risco Social/Sanitário Evidente"],
  'Veterinária': ["Desnutrição / Subnutrição", "Ectoparasitose (Sarna/Pulga/Carrapato)", "Ferida/Trauma Físico", "Infeção (Gastrointestinal/Respiratória)", "Virose Suspeita (Cinomose, Parvo)", "Tumor / Neoplasia", "Saudável (Avaliação de Rotina)"]
};

const TEXTOS_CLINICOS = {
  'Medicina': { evolucaoLabel: "S - Subjetivo (História Clínica e Anamnese)", evolucaoPlace: "Queixa do paciente, evolução do quadro...", diagLabel: "A - Avaliação Médica / Diagnóstico", planoLabel: "P - Conduta / Plano Terapêutico", planoPlace: "Conduta, orientações, prescrição e encaminhamentos quando aplicável..." },
  'Odontologia': { evolucaoLabel: "Evolução Odontológica e Achados", evolucaoPlace: "Relato de dor, condição de higiene oral, dentes afetados...", diagLabel: "Diagnóstico Clínico Odontológico", planoLabel: "Conduta, Procedimento Realizado e Prescrição", planoPlace: "Ex: Exodontia, profilaxia, prescrição de analgésico..." },
  'Psicologia': { evolucaoLabel: "Demanda e Escuta Qualificada", evolucaoPlace: "Motivo do acolhimento, estado de humor, pensamento...", diagLabel: "Sinais clínicos e comportamentais relevantes", planoLabel: "Manejo Terapêutico e Encaminhamento", planoPlace: "Intervenção na crise, encaminhamento CAPS..." },
  'Nutrição': { evolucaoLabel: "Avaliação Antropométrica e Recordatório", evolucaoPlace: "Relato de consumo, acesso a comida, aversões...", diagLabel: "Estado Nutricional Aparente", planoLabel: "Plano Alimentar e Orientação Nutricional", planoPlace: "Orientações possíveis para a realidade de rua..." },
  'Fisioterapia': { evolucaoLabel: "Avaliação Físico-Funcional e Dor", evolucaoPlace: "História da dor, inspeção postural, palpação...", diagLabel: "Diagnóstico Cinesiológico Funcional", planoLabel: "Conduta Fisioterapêutica Realizada", planoPlace: "Alongamentos, terapia manual, orientações posturais..." },
  'Enfermagem': { evolucaoLabel: "Evolução de Enfermagem e Procedimentos", evolucaoPlace: "Descrição do estado geral, aspecto das lesões/feridas...", diagLabel: "Diagnóstico de Enfermagem", planoLabel: "Cuidados Prestados e Orientações", planoPlace: "Curativo com técnica asséptica, medicação IM/IV..." },
  'Biomedicina': { evolucaoLabel: "Descrição das Amostras Coletadas", evolucaoPlace: "Tipos de exames solicitados ou recolhidos hoje...", diagLabel: "Resultados / Alterações Evidentes", planoLabel: "Laudo Laboratorial e Orientação", planoPlace: "Valores de referência encontrados, encaminhamento urgente..." }
};

// --- AUXILIARES E ANTI-CRASH ---
const normalizeStr = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
const formatName = (name) => name ? name.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()).join(' ') : '';
const safeIncludes = (strOrArray, item) => {
  if (!strOrArray) return false;
  if (Array.isArray(strOrArray)) return strOrArray.includes(item);
  return strOrArray.includes(item);
};
const requiredText = (value) => String(value || '').trim();
const profileDisplayName = (profile) => formatName(profile?.nomeSocial || profile?.nome || '');
const isInactiveRecord = (record) => normalizeStr(record?.status) === 'inativo';
const assistidoDisplayName = (assistido) => (
  requiredText(assistido?.nomeSocial)
  || requiredText(assistido?.nome)
  || requiredText(assistido?.nomeCivil)
  || 'Nome não informado'
);
const assistidoSearchText = (assistido) => normalizeStr([
  assistido?.nome,
  assistido?.nomeCivil,
  assistido?.nomeSocial,
  assistido?.cpf,
  assistido?.rg,
].filter(Boolean).join(' '));
const isTestAssistido = (record) => assistidoSearchText(record).includes('teste');
const activeRows = (rows) => rows.filter(row => !isInactiveRecord(row));
const snapshotRows = (snapshot) => snapshot.docs.map((document) => {
  const data = document.data();
  return { ...data, id: data.id || document.id };
});
const tenantCollectionQuery = (collectionName, location, maxRows = TENANT_INITIAL_LIMIT) => {
  const constraints = [where('localAcao', '==', location)];
  if (maxRows) constraints.push(limit(maxRows));
  return query(collection(db, collectionName), ...constraints);
};
const patientScopedQuery = (collectionName, location, assistidoId) => query(
  collection(db, collectionName),
  where('localAcao', '==', location),
  where('assistidoId', '==', assistidoId)
);
const mergePatientScopedRows = (currentRows, loadedRows, assistidoId) => [
  ...currentRows.filter(row => String(row.assistidoId) !== String(assistidoId)),
  ...loadedRows,
];
const upsertRowById = (rows, row) => {
  if (!row?.id) return rows;
  const rowId = String(row.id);
  let found = false;
  const nextRows = rows.map(current => {
    if (String(current.id) !== rowId) return current;
    found = true;
    return { ...current, ...row };
  });
  return found ? nextRows : [row, ...nextRows];
};
const mergeSnapshotRows = (currentRows, incomingRows) => {
  const inactiveIds = new Set(incomingRows.filter(isInactiveRecord).map(row => String(row.id)));
  const nextById = new Map(
    currentRows
      .filter(row => !inactiveIds.has(String(row.id)) && !isInactiveRecord(row))
      .map(row => [String(row.id), row])
  );

  activeRows(incomingRows).forEach(row => {
    const rowId = String(row.id);
    nextById.set(rowId, { ...(nextById.get(rowId) || {}), ...row });
  });

  return Array.from(nextById.values());
};
const recordTime = (record) => {
  const time = Number(record?.ultimoAtendimentoEm || record?.dataCriacaoEm || record?.id || 0);
  return Number.isFinite(time) ? time : 0;
};
const elapsedLabel = (timestamp, now = Date.now()) => {
  const time = Number(timestamp || 0);
  if (!time || !Number.isFinite(time)) return 'Tempo não registrado';
  const minutes = Math.max(0, Math.floor((now - time) / 60000));
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
};
const hourLabel = (timestamp) => {
  const time = Number(timestamp || 0);
  if (!time || !Number.isFinite(time)) return 'Horário não registrado';
  return new Date(time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
const formatClinicalDate = (timestamp) => {
  if (!timestamp) return 'Data não registrada';
  const numeric = Number(timestamp);
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(Number.isFinite(numeric) && numeric > 1000000000 ? numeric : timestamp);
  if (Number.isNaN(date.getTime())) return exportValue(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (left, right) => left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
  if (sameDay(date, today)) return 'HOJE';
  if (sameDay(date, yesterday)) return 'Ontem';
  return date.toLocaleDateString('pt-BR');
};
const calculateImc = (peso, alturaCm) => {
  const weight = Number(String(peso || '').replace(',', '.'));
  const heightCm = Number(String(alturaCm || '').replace(',', '.'));
  const height = heightCm > 3 ? heightCm / 100 : heightCm;
  if (!weight || !height || !Number.isFinite(weight) || !Number.isFinite(height)) return '';
  return (weight / (height * height)).toFixed(2);
};
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
const roleLabel = (role) => ROLE_LABELS[role] || ROLE_LABELS[LEGACY_ROLE_PROFESSION[role] ? 'profissional_formado' : role] || role || 'Perfil';
const professionLabel = (profession) => PROFESSION_LABELS[profession] || profession || 'Área não informada';
const profileProfession = (profile) => profile?.role === 'colaborador_servico'
  ? 'apoio_transversal'
  : profile?.profissao || LEGACY_ROLE_PROFESSION[profile?.role] || '';
const isCoordinatorProfile = (profile) => PERFIS_COORDENACAO.includes(profile?.role);
const isProfessionalProfile = (profile) => profile?.role === 'profissional_formado' || Boolean(LEGACY_ROLE_PROFESSION[profile?.role]);
const signupAreaOptions = (role) => {
  if (role === 'academico') return ATUACOES_TECNICAS;
  return [...ATUACOES_TECNICAS, ...ATUACOES_SERVICO];
};
const inferredProjectForProfile = (role, profession) => {
  if (role === 'voluntario_eficiente') return 'Apoio operacional da ação';
  if (role === 'colaborador_servico') return 'Apoio transversal da ação';
  const map = {
    cadastro_triagem: 'Cadastro e Triagem',
    medicina: 'Atendimento Médico',
    odontologia: 'Odontologia',
    psicologia: 'Apoio Psicológico',
    nutricao: 'Avaliação Nutricional',
    fisioterapia: 'Fisioterapia e Reabilitação',
    enfermagem: 'Tratamento de Feridas',
    biomedicina: 'Exames Clínicos',
    veterinaria: 'Atendimento Veterinário',
    direito: 'Justiça de Rua',
    farmacia: 'Farmácia',
    servico_social: 'Assistência Social',
    podologia: 'Podologia',
    vacinacao: 'Aplicação de Vacinas',
    exames_clinicos: 'Exames Clínicos',
    cabeleireiro: 'Banho e Corte de Cabelo',
    brinquedoteca: 'Atendimento Infantil e Brinquedoteca',
    apoio_mulher: 'Apoio à Mulher',
    documentacao: 'Emissão de Documentos',
    acolhimento: 'Acolhimento Social',
    doacoes: 'Doações',
  };
  return map[profession] || 'Equipe multiprofissional';
};
const renderProfileHeroIcon = (profile, className) => {
  const Icon = isCoordinatorProfile(profile) ? Users : ({
    odontologia: Smile,
    psicologia: Brain,
    nutricao: Heart,
    fisioterapia: Activity,
    enfermagem: HeartPulse,
    biomedicina: Activity,
    veterinaria: Dog,
    direito: Gavel,
    farmacia: FileText,
    servico_social: HeartHandshake,
    podologia: Activity,
    beleza: Smile,
    cadastro_triagem: UserCheck,
    vacinacao: HeartPulse,
    exames_clinicos: Activity,
    cabeleireiro: Smile,
    brinquedoteca: Baby,
    apoio_mulher: HeartHandshake,
    documentacao: IdCard,
    acolhimento: HeartHandshake,
    doacoes: Gift,
    apoio_operacional: Gift,
    apoio_transversal: HeartHandshake,
  }[profileProfession(profile)] || Stethoscope);
  return <Icon className={className} />;
};
const compactList = (value) => String(value || '').split(',').map(item => item.trim()).filter(Boolean);
const exclusiveList = (values, exclusive) => values.includes(exclusive) ? exclusive : values.join(', ');
const percentFromFields = (record, fields) => {
  if (!record) return 0;
  const filled = fields.filter(field => {
    const normalized = normalizeStr(requiredText(record[field]));
    return Boolean(normalized)
      && !['n/a', 'nao informado', 'sem informacao', 'sem informação'].includes(normalized);
  }).length;
  return Math.round((filled / fields.length) * 100);
};
const hasMeaningfulValue = (value) => {
  const normalized = normalizeStr(requiredText(value));
  return Boolean(normalized)
    && !['n/a', 'nao informado', 'sem informacao', 'sem informação'].includes(normalized);
};
const applyFieldDefaults = (record, defaults) => Object.entries(defaults).reduce((acc, [key, value]) => ({
  ...acc,
  [key]: requiredText(acc[key]) ? acc[key] : value,
}), { ...record });
const completionLabel = (percent) => {
  if (percent <= 0) return 'Não preenchido';
  if (percent < 80) return 'Parcial';
  return 'Completo';
};
const triageCompletion = (triagem) => {
  const fields = ['queixaPrincipal', 'pa', 'fc', 'fr', 'spo2', 'temperatura', 'peso', 'altura', 'imc', 'estadoNutricionalAparente', 'encaminhamento'];
  const percent = percentFromFields(triagem, fields);
  const vitalFields = ['pa', 'fc', 'fr', 'spo2', 'temperatura', 'peso', 'altura'];
  const vitalsPercent = percentFromFields(triagem, vitalFields);
  const status = vitalsPercent === 0 && requiredText(triagem?.encaminhamento)
    ? 'Parcial - sem sinais vitais'
    : completionLabel(percent);
  return { percent, status, vitalsPercent };
};
const triagePriority = (triagem) => {
  const signals = compactList(triagem?.sinaisAtencao)
    .filter(signal => !normalizeStr(signal).includes('sem atencao'));
  const prioritySignals = signals.filter(isSpecialCareSignal);
  const selected = normalizeStr(triagem?.prioridadeCuidado);
  const hasCriticalSignal = signals.some(signal => normalizeStr(signal).includes('situacao critica')
    || normalizeStr(signal).includes('risco imediato'));
  if (hasCriticalSignal || selected.includes('critica') || hasSevereMarker(signals, triagem?.observacaoAtencao, triagem?.observacaoCrianca)) {
    return { level: 'critical', label: 'Crítica', reasons: prioritySignals.length ? prioritySignals : signals };
  }
  if (prioritySignals.length || selected.includes('prioridade')) {
    return { level: 'priority', label: 'Atenção especial', reasons: prioritySignals.length ? prioritySignals : ['Prioridade marcada na triagem'] };
  }
  return { level: 'routine', label: triagem ? 'Rotina' : 'Aguardando triagem', reasons: [] };
};
const censoCompletion = (censo) => {
  if (!censo) return { percent: 0, status: 'Não preenchido' };
  const fields = [
    'moradia', 'motivoRua', 'programas', 'convive', 'religiao', 'empregado',
    'profissao', 'responsavelPed', 'psicomotor', 'vacinaPed', 'drogas',
    'detalhesDrogas', 'vidaSexual', 'preservativo', 'dum', 'planejamentoFamiliar',
    'sintomas_ginec', 'medsUso', 'comorbidades', 'alergiaTipos', 'alergias',
    'cirurgias', 'freqSaude', 'psiquiatria', 'acessoTerapia', 'tratamentoPsi',
    'apetite', 'refeicoes', 'frutas', 'agua', 'semComer', 'petTipos', 'pets',
    'temAlergia', 'temCirurgia', 'temPsi', 'temPets', 'temMac', 'temFreqSaude',
  ];
  const filled = fields.filter(field => hasMeaningfulValue(censo[field])).length;
  const percent = Math.round((filled / fields.length) * 100);
  return { percent, status: completionLabel(percent) };
};

const EXPORT_THEMES = {
  geral: { label: 'Geral', file: 'Geral', primary: '#1d4ed8', dark: '#1e3a8a', soft: '#eff6ff', line: '#bfdbfe', text: '#1e3a8a' },
  clinica: { label: 'Saude', file: 'Saude', primary: '#0f766e', dark: '#115e59', soft: '#ecfeff', line: '#99f6e4', text: '#134e4a' },
  social: { label: 'Social', file: 'Social', primary: '#7c3aed', dark: '#5b21b6', soft: '#f5f3ff', line: '#ddd6fe', text: '#4c1d95' },
  vet: { label: 'Veterinaria', file: 'Veterinaria', primary: '#be185d', dark: '#9d174d', soft: '#fff1f2', line: '#fecdd3', text: '#881337' },
  doacoes: { label: 'Doacoes', file: 'Doacoes', primary: '#c2410c', dark: '#9a3412', soft: '#fff7ed', line: '#fed7aa', text: '#7c2d12' },
  justica: { label: 'Justica de Rua', file: 'Justica_de_Rua', primary: '#334155', dark: '#0f172a', soft: '#f1f5f9', line: '#cbd5e1', text: '#0f172a' },
};
const getExportTheme = (tab) => EXPORT_THEMES[tab] || EXPORT_THEMES.geral;

const exportValue = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || 'Não informado';
  if (value === null || value === undefined) return 'Não informado';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Nao';
  if (typeof value === 'object') return JSON.stringify(value);
  return requiredText(value) || 'Não informado';
};

const exportHeaderCell = (value, theme = EXPORT_THEMES.geral) => ({
  value,
  fontWeight: 'bold',
  backgroundColor: theme.primary,
  textColor: '#ffffff',
  wrap: true,
  alignVertical: 'center',
  borderColor: theme.line,
  borderStyle: 'thin',
});

const exportDataCell = (value, rowIndex, theme = EXPORT_THEMES.geral) => ({
  value: exportValue(value),
  wrap: true,
  alignVertical: 'top',
  borderColor: theme.line,
  borderStyle: 'thin',
  backgroundColor: rowIndex % 2 ? theme.soft : '#ffffff',
});

const buildExportSheet = (sheet, columns, rows, options = {}) => {
  const theme = options.theme || EXPORT_THEMES.geral;
  const title = options.title || sheet;
  const description = options.description || 'Dados detalhados exportados do app para consulta, revisao e filtros locais.';
  const data = [
    [
      {
        value: title,
        columnSpan: columns.length,
        fontWeight: 'bold',
        fontSize: 14,
        backgroundColor: theme.dark,
        textColor: '#ffffff',
        wrap: true,
        borderColor: theme.dark,
        borderStyle: 'thin',
      },
      ...Array(Math.max(columns.length - 1, 0)).fill(null),
    ],
    [
      {
        value: description,
        columnSpan: columns.length,
        fontStyle: 'italic',
        textColor: theme.text,
        backgroundColor: theme.soft,
        wrap: true,
        borderColor: theme.line,
        borderStyle: 'thin',
      },
      ...Array(Math.max(columns.length - 1, 0)).fill(null),
    ],
    columns.map(column => exportHeaderCell(column.label, theme)),
    ...(rows.length
      ? rows.map((row, rowIndex) => columns.map(column => exportDataCell(
        typeof column.value === 'function' ? column.value(row) : row[column.value],
        rowIndex,
        theme
      )))
      : [[
        {
          value: 'Sem registros para esta aba.',
          columnSpan: columns.length,
          fontStyle: 'italic',
          textColor: theme.text,
          backgroundColor: theme.soft,
          borderColor: theme.line,
          borderStyle: 'thin',
        },
        ...Array(Math.max(columns.length - 1, 0)).fill(null),
      ]]),
  ];

  return {
    data,
    sheet,
    columns: columns.map(column => ({ width: column.width || 18 })),
    stickyRowsCount: 3,
    stickyColumnsCount: options.stickyColumnsCount || 0,
    orientation: 'landscape',
    showGridLines: false,
    zoomScale: 0.9,
  };
};

const exportPercent = (count, total) => `${total ? Math.round((count / total) * 100) : 0}%`;
const dateInputToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const DAILY_LOCATION_STORAGE_KEY = 'mdmActionLocationDaily';
const isInlinePhoto = (value) => requiredText(value).startsWith('data:image/');
const uploadPhotoIfNeeded = async (photoValue, folder, recordId) => {
  const photo = requiredText(photoValue);
  if (!photo || !isInlinePhoto(photo)) return photo;
  const target = storageRef(storage, `${folder}/${recordId}-${Date.now()}.jpg`);
  await uploadString(target, photo, 'data_url', { contentType: 'image/jpeg' });
  return getDownloadURL(target);
};
const readDailyActionLocation = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(DAILY_LOCATION_STORAGE_KEY) || '{}');
    return parsed.date === dateInputToday() ? parsed.value || '' : '';
  } catch {
    return '';
  }
};
const writeDailyActionLocation = (value) => {
  localStorage.setItem(DAILY_LOCATION_STORAGE_KEY, JSON.stringify({ date: dateInputToday(), value }));
  localStorage.setItem('mdmActionLocation', value);
};
const displayDateFromInput = (value) => {
  const [year, month, day] = String(value || '').split('-');
  return year && month && day ? `${day}/${month}/${year}` : new Date().toLocaleDateString('pt-BR');
};
const countExportValues = (rows, pickValue) => Object.entries(rows.reduce((counts, row) => {
  const label = exportValue(pickValue(row)) || 'Nao informado';
  counts[label] = (counts[label] || 0) + 1;
  return counts;
}, {})).sort((a, b) => b[1] - a[1]);
const splitExportList = (value) => String(value || '').split(',').map(item => item.trim()).filter(Boolean);
const countExportListValues = (rows, pickValue) => Object.entries(rows.reduce((counts, row) => {
  splitExportList(pickValue(row)).forEach((item) => { counts[item] = (counts[item] || 0) + 1; });
  return counts;
}, {})).sort((a, b) => b[1] - a[1]);

const EXPORT_FIELD_LABELS = {
  id: 'ID',
  assistidoId: 'Assistido ID',
  assistidoNome: 'Nome do assistido',
  assistidoCpf: 'CPF do assistido',
  assistidoRg: 'RG do assistido',
  nome: 'Nome',
  dataNascimento: 'Data de nascimento',
  dataCriacao: 'Data de cadastro',
  dataCriacaoEm: 'Timestamp cadastro',
  ultimoAtendimento: 'Ultimo fluxo',
  ultimoAtendimentoEm: 'Timestamp ultimo fluxo',
  role: 'Perfil operacional',
  profissao: 'Profissao / area',
  projeto: 'Projeto MDM',
  lgpdAcceptedAt: 'Aceite LGPD',
  localAcao: 'Local da acao',
  unidadeAcao: 'Unidade da acao',
  prioridadeCuidado: 'Prioridade de cuidado',
  sinaisAtencao: 'Atencoes inclusivas',
  observacaoAtencao: 'Comentario de atencao',
  responsavelPresente: 'Responsavel presente',
  vinculoResponsavel: 'Vinculo responsavel',
  necessidadesInfantis: 'Necessidades infantis',
  observacaoCrianca: 'Comentario infantil',
  preenchimentoStatus: 'Status de preenchimento',
  preenchimentoPct: 'Percentual preenchido',
  extraAtendimento: 'Atendimento extra',
  qd: 'Queixa / duracao',
  hd: 'Hipotese / diagnostico',
  plano: 'Conduta / plano',
  obsGeral: 'Observacoes gerais',
  encExterno: 'Encaminhamento externo',
  itens_entregues_cat: 'Categorias entregues',
  categoria_juridica: 'Categorias juridicas',
  demandaMulher: 'Demanda - apoio a mulher',
  riscoMulher: 'Risco - apoio a mulher',
  encaminhamentoMulher: 'Encaminhamento - apoio a mulher',
  testes_rapidos: 'Testes / vacinas',
  vetPets: 'Pets veterinarios',
  photoRegistrada: 'Foto registrada',
};
const exportFieldLabel = (field) => EXPORT_FIELD_LABELS[field] || field
  .replace(/_/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/\b\w/g, letter => letter.toUpperCase());
const exportWidthForField = (field) => {
  if (['id', 'assistidoId', 'data', 'dataAtu', 'dataCriacao', 'dum'].includes(field)) return 16;
  if (['nome', 'assistidoNome', 'subjetivo', 'plano', 'obsGeral', 'demandaJuridica', 'acaoJuridica', 'vetPets'].includes(field)) return 36;
  if (field.toLowerCase().includes('cpf') || field.toLowerCase().includes('rg')) return 18;
  return 24;
};
const cleanExportRecord = (record) => Object.fromEntries(Object.entries(record || {}).flatMap(([field, value]) => {
  if (field === 'photo') return [['photoRegistrada', value ? 'Sim' : 'Nao']];
  return [[field, exportValue(value)]];
}));
const buildRawExportSheet = (sheet, rows, options = {}) => {
  const cleanRows = rows.map(cleanExportRecord);
  const fields = Array.from(new Set(cleanRows.flatMap(row => Object.keys(row))));
  const orderedFields = [
    ...['id', 'assistidoId', 'assistidoNome', 'assistidoCpf', 'data', 'area', 'status'].filter(field => fields.includes(field)),
    ...fields.filter(field => !['id', 'assistidoId', 'assistidoNome', 'assistidoCpf', 'data', 'area', 'status'].includes(field)).sort(),
  ];
  return buildExportSheet(
    sheet,
    (orderedFields.length ? orderedFields : ['semDados']).map(field => ({
      label: field === 'semDados' ? 'Aviso' : exportFieldLabel(field),
      value: field,
      width: exportWidthForField(field),
    })),
    orderedFields.length ? cleanRows : [{ semDados: 'Sem registros nesta base.' }],
    options
  );
};

const metricRows = (metrics, theme) => metrics.reduce((rows, _metric, index) => {
  if (index % 4 !== 0) return rows;
  const group = metrics.slice(index, index + 4);
  const labelRow = [];
  const valueRow = [];
  const noteRow = [];
  group.forEach((metric) => {
    labelRow.push({
      value: metric.label,
      columnSpan: 2,
      fontWeight: 'bold',
      backgroundColor: theme.soft,
      textColor: theme.text,
      wrap: true,
      borderColor: theme.line,
      borderStyle: 'thin',
    }, null);
    valueRow.push({
      value: exportValue(metric.value),
      columnSpan: 2,
      fontWeight: 'bold',
      fontSize: 16,
      backgroundColor: '#ffffff',
      textColor: theme.dark,
      borderColor: theme.line,
      borderStyle: 'thin',
    }, null);
    noteRow.push({
      value: metric.note || '',
      columnSpan: 2,
      fontStyle: 'italic',
      backgroundColor: '#ffffff',
      textColor: '#475569',
      wrap: true,
      borderColor: theme.line,
      borderStyle: 'thin',
    }, null);
  });
  while (labelRow.length < 8) {
    labelRow.push('', '');
    valueRow.push('', '');
    noteRow.push('', '');
  }
  rows.push(labelRow, valueRow, noteRow, Array(8).fill(''));
  return rows;
}, []);

const pairedBlockRows = (blocks, theme) => blocks.reduce((data, _block, index) => {
  if (index % 2 !== 0) return data;
  const left = blocks[index];
  const right = blocks[index + 1];
  const blockHeader = (block) => block
    ? [{ value: block.title, columnSpan: 4, fontWeight: 'bold', backgroundColor: theme.primary, textColor: '#ffffff', wrap: true, borderColor: theme.line, borderStyle: 'thin' }, null, null, null]
    : ['', '', '', ''];
  const tableHeader = (block) => block
    ? [...block.headers.slice(0, 4), ...Array(Math.max(4 - block.headers.length, 0)).fill('')].map(header => exportHeaderCell(header, theme))
    : ['', '', '', ''];
  const tableRow = (block, rowIndex) => block?.rows[rowIndex]
    ? [...block.rows[rowIndex].slice(0, 4), ...Array(Math.max(4 - block.rows[rowIndex].length, 0)).fill('')].map(value => exportDataCell(value, rowIndex, theme))
    : ['', '', '', ''];
  data.push([...blockHeader(left), ...blockHeader(right)]);
  data.push([...tableHeader(left), ...tableHeader(right)]);
  const rowCount = Math.max(left?.rows.length || 0, right?.rows.length || 0, 1);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) data.push([...tableRow(left, rowIndex), ...tableRow(right, rowIndex)]);
  data.push(Array(8).fill(''));
  return data;
}, []);

const buildDashboardSheet = ({ sheet, title, subtitle, metrics, blocks, guideRows, theme, generatedAt, userName, scopeLabel }) => ({
  sheet,
  data: [
    [{ value: title, columnSpan: 8, fontWeight: 'bold', fontSize: 18, backgroundColor: theme.dark, textColor: '#ffffff', wrap: true, borderColor: theme.dark, borderStyle: 'thin' }, null, null, null, null, null, null, null],
    [{ value: subtitle, columnSpan: 8, fontStyle: 'italic', backgroundColor: theme.soft, textColor: theme.text, wrap: true, borderColor: theme.line, borderStyle: 'thin' }, null, null, null, null, null, null, null],
    [exportHeaderCell('Gerado em', theme), generatedAt, exportHeaderCell('Responsavel', theme), userName || 'Nao informado', exportHeaderCell('Escopo', theme), `${theme.label} - ${scopeLabel || 'Geral'}`, exportHeaderCell('Uso', theme), 'Dados sensiveis - acesso restrito'],
    Array(8).fill(''),
    ...metricRows(metrics, theme),
    ...pairedBlockRows(blocks, theme),
    [{ value: 'Guia das abas exportadas', columnSpan: 8, fontWeight: 'bold', backgroundColor: theme.primary, textColor: '#ffffff', borderColor: theme.line, borderStyle: 'thin' }, null, null, null, null, null, null, null],
    [exportHeaderCell('Aba', theme), exportHeaderCell('Leitura', theme), exportHeaderCell('Aba', theme), exportHeaderCell('Leitura', theme), exportHeaderCell('Aba', theme), exportHeaderCell('Leitura', theme), exportHeaderCell('Aba', theme), exportHeaderCell('Leitura', theme)],
    ...guideRows.reduce((rows, guide, index) => {
      const target = Math.floor(index / 4);
      if (!rows[target]) rows[target] = Array(8).fill('');
      rows[target].splice((index % 4) * 2, 2, exportDataCell(guide[0], target, theme), exportDataCell(guide[1], target, theme));
      return rows;
    }, []),
  ],
  columns: [{ width: 24 }, { width: 18 }, { width: 24 }, { width: 18 }, { width: 24 }, { width: 18 }, { width: 24 }, { width: 18 }],
  stickyRowsCount: 3,
  orientation: 'landscape',
  showGridLines: false,
  zoomScale: 0.85,
});

const calculateAgeNum = (dob) => {
  if (!dob) return 0;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};
const calculateAge = (dob) => {
  const age = calculateAgeNum(dob);
  return age ? `${age} anos` : 'Não informado';
};

// --- APP PRINCIPAL ---
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [assistidos, setAssistidos] = useState([]);
  const [anamneses, setAnamneses] = useState([]);
  const [triagens, setTriagens] = useState([]);
  const [atendimentos, setAtendimentos] = useState([]);

  // Estados de UI
  const [currentView, setCurrentView] = useState('home');
  const [selectedAssistido, setSelectedAssistido] = useState(null);
  const [selectedAtendimento, setSelectedAtendimento] = useState(null);
  const [defaultArea, setDefaultArea] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');
  const [authMode, setAuthMode] = useState('login'); 
  const [signupRole, setSignupRole] = useState('voluntario_eficiente');
  const [statTab, setStatTab] = useState('geral');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportDate, setExportDate] = useState(dateInputToday);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExtraAtendimentos, setShowExtraAtendimentos] = useState(false);
  const [atendimentoExtra, setAtendimentoExtra] = useState(false);
  const [managedUsers, setManagedUsers] = useState([]);
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [adminActionUid, setAdminActionUid] = useState('');
  const [editingManagedUser, setEditingManagedUser] = useState(null);
  const [queueMode, setQueueMode] = useState('aguardando');
  const [queueNow, setQueueNow] = useState(Date.now());
  const [profilePhotoDraft, setProfilePhotoDraft] = useState('');
  const [appSettings, setAppSettings] = useState({ actionLocations: [], filiaisEquipe: [] });
  const [selectedActionLocation, setSelectedActionLocation] = useState(() => readDailyActionLocation());
  const [actionLocationConfirmedToday, setActionLocationConfirmedToday] = useState(() => Boolean(readDailyActionLocation()));
  const [showActionLocationModal, setShowActionLocationModal] = useState(false);
  const [pendingActionLocation, setPendingActionLocation] = useState(() => readDailyActionLocation() || ACTION_LOCATIONS[0].value);
  const [showAppMenu, setShowAppMenu] = useState(false);
  const actionLocations = useMemo(() => (
    Array.isArray(appSettings.actionLocations) && appSettings.actionLocations.length ? appSettings.actionLocations : ACTION_LOCATIONS
  ), [appSettings.actionLocations]);
  const filiaisEquipe = useMemo(() => (
    Array.isArray(appSettings.filiaisEquipe) && appSettings.filiaisEquipe.length ? appSettings.filiaisEquipe : FILIAIS_EQUIPE
  ), [appSettings.filiaisEquipe]);
  const currentActionLocation = actionLocations.find(location => location.value === selectedActionLocation) || actionLocations[0] || ACTION_LOCATIONS[0];
  const signupInProgressRef = useRef(false);
  const mainScrollRef = useRef(null);

  // Estado para controlar as abas que abrem com o "Sim"
  const [formToggles, setFormToggles] = useState({});
  const [vetPets, setVetPets] = useState([]);

  const changeActionLocation = (locationValue, options = {}) => {
    const nextValue = locationValue || actionLocations[0]?.value || ACTION_LOCATIONS[0].value;
    if (options.confirm) {
      writeDailyActionLocation(nextValue);
      setActionLocationConfirmedToday(true);
      setShowActionLocationModal(false);
    }
    setPendingActionLocation(nextValue);
    if (nextValue === selectedActionLocation && !options.forceReload) return;
    setSelectedActionLocation(nextValue);
    setSelectedAssistido(null);
    setSelectedAtendimento(null);
    setAssistidos([]);
    setAnamneses([]);
    setTriagens([]);
    setAtendimentos([]);
    setManagedUsers([]);
    setCurrentView('home');
  };
  const actionLocationContextValue = {
    selectedActionLocation,
    currentActionLocation,
    setSelectedActionLocation: changeActionLocation,
    actionLocations,
  };

  useEffect(() => { setTimeout(() => setShowSplash(false), 2000); }, []);
  useEffect(() => {
    if (!actionLocations.length) return;
    const timer = window.setTimeout(() => {
      if (!pendingActionLocation || !actionLocations.some(location => location.value === pendingActionLocation)) {
        setPendingActionLocation(actionLocations[0].value);
      }
      if (selectedActionLocation && !actionLocations.some(location => location.value === selectedActionLocation)) {
        setSelectedActionLocation('');
        setActionLocationConfirmedToday(false);
        setShowActionLocationModal(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [actionLocations, pendingActionLocation, selectedActionLocation]);
  useEffect(() => {
    if (!user) return undefined;
    // Firebase settings hook: admins can update app_settings/operacional in the UI;
    // the app consumes these values here while keeping hardcoded defaults as fallback.
    const unsubscribeSettings = onSnapshot(doc(db, 'app_settings', 'operacional'), (snapshot) => {
      if (!snapshot.exists()) {
        setAppSettings({ actionLocations: [], filiaisEquipe: [] });
        return;
      }
      const data = snapshot.data();
      setAppSettings({
        actionLocations: Array.isArray(data.actionLocations) ? data.actionLocations : [],
        filiaisEquipe: Array.isArray(data.filiaisEquipe) ? data.filiaisEquipe : [],
      });
    }, () => {
      setAppSettings({ actionLocations: [], filiaisEquipe: [] });
    });
    return () => unsubscribeSettings();
  }, [user]);
  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
  }, [currentView]);
  useEffect(() => {
    if (currentView !== 'atender') return undefined;
    const timer = window.setInterval(() => setQueueNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [currentView]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      if (u) {
        if (!u.emailVerified) {
          if (signupInProgressRef.current) {
            setLoading(false);
            return;
          }
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          showMsg('Confirme seu e-mail para entrar. Verifique também spam ou lixo eletrônico.');
          setLoading(false);
          return;
        }
        let docSnap = await getDoc(doc(db, 'users', u.uid));
        let retries = 0;
        while (!docSnap.exists() && retries < 3) {
           await new Promise(r => setTimeout(r, 1000));
           docSnap = await getDoc(doc(db, 'users', u.uid));
           retries++;
        }
        
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          const authProfilePatch = {
            email: u.email || '',
            emailVerified: u.emailVerified,
            ultimoLoginEm: new Date().toISOString(),
          };
          if (!requiredText(profileData.filial)) authProfilePatch.filial = 'Santos';
          await setDoc(doc(db, 'users', u.uid), authProfilePatch, { merge: true });
          setUserProfile({ ...profileData, ...authProfilePatch });
          setUser(u);
        } else {
          await signOut(auth);
          setUser(null);
          showMsg('Acesso nao habilitado ou revogado. Fale com a coordenacao.');
        }
      } else { setUser(null); setUserProfile(null); }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !userProfile || !actionLocationConfirmedToday || !selectedActionLocation) return;
    const snapshotError = (err) => {
      console.error('Falha ao sincronizar dados:', err);
      setNotification('Nao foi possivel sincronizar os dados. Verifique a conexao e as permissoes.');
    };
    const unsubA = onSnapshot(tenantCollectionQuery('assistidos', selectedActionLocation), (s) => {
      const rows = snapshotRows(s);
      setAssistidos(current => mergeSnapshotRows(current, rows));
      setSelectedAssistido(current => {
        if (!current?.id) return current;
        const fresh = activeRows(rows).find(row => String(row.id) === String(current.id));
        return fresh ? { ...current, ...fresh } : current;
      });
    }, snapshotError);
    const unsubB = onSnapshot(tenantCollectionQuery('anamneses', selectedActionLocation), (s) => setAnamneses(current => mergeSnapshotRows(current, snapshotRows(s))), snapshotError);
    const unsubC = onSnapshot(tenantCollectionQuery('triagens', selectedActionLocation), (s) => setTriagens(current => mergeSnapshotRows(current, snapshotRows(s))), snapshotError);
    const unsubD = onSnapshot(tenantCollectionQuery('atendimentos', selectedActionLocation), (s) => setAtendimentos(current => mergeSnapshotRows(current, snapshotRows(s))), snapshotError);
    return () => { unsubA(); unsubB(); unsubC(); unsubD(); };
  }, [user, userProfile, selectedActionLocation, actionLocationConfirmedToday]);

  useEffect(() => {
    if (!user || !userProfile || !actionLocationConfirmedToday || !selectedAssistido?.id) return undefined;
    let cancelled = false;
    const loadCompletePatientHistory = async () => {
      try {
        const [anamnesesSnap, triagensSnap, atendimentosSnap] = await Promise.all([
          getDocs(patientScopedQuery('anamneses', selectedActionLocation, selectedAssistido.id)),
          getDocs(patientScopedQuery('triagens', selectedActionLocation, selectedAssistido.id)),
          getDocs(patientScopedQuery('atendimentos', selectedActionLocation, selectedAssistido.id)),
        ]);
        if (cancelled) return;
        setAnamneses(current => mergePatientScopedRows(current, activeRows(snapshotRows(anamnesesSnap)), selectedAssistido.id));
        setTriagens(current => mergePatientScopedRows(current, activeRows(snapshotRows(triagensSnap)), selectedAssistido.id));
        setAtendimentos(current => mergePatientScopedRows(current, activeRows(snapshotRows(atendimentosSnap)), selectedAssistido.id));
      } catch (err) {
        console.error('Falha ao carregar historico completo do assistido:', err);
        if (!cancelled) showMsg('Nao foi possivel carregar o historico completo deste assistido.');
      }
    };
    loadCompletePatientHistory();
    return () => { cancelled = true; };
  }, [user, userProfile, selectedAssistido?.id, selectedActionLocation, actionLocationConfirmedToday]);

  // --- REGRAS DE ACESSO ---
  const canAccessArea = (area) => {
    if (!area) return Boolean(userProfile);
    return Boolean(userProfile);
  };
  const canWriteArea = (area) => {
    if (!userProfile || !area) return false;
    if (isCoordinatorProfile(userProfile)) return true;
    if (!['academico', 'profissional_formado'].includes(userProfile?.role) && !LEGACY_ROLE_PROFESSION[userProfile?.role]) return false;
    const allowedProfessions = AREA_ALLOWED_PROFESSIONS[area] || [];
    return allowedProfessions.includes(profileProfession(userProfile));
  };
  const canFinalizeArea = (area) => {
    if (!canWriteArea(area)) return false;
    if (isCoordinatorProfile(userProfile)) return true;
    if (userProfile?.role === 'academico') return false;
    if (AREAS_COM_VALIDACAO_PROFISSIONAL.includes(area)) return isProfessionalProfile(userProfile);
    return true;
  };
  const canRegisterAssistido = isCoordinatorProfile(userProfile)
    || ['profissional_formado', 'academico'].includes(userProfile?.role)
    || Boolean(LEGACY_ROLE_PROFESSION[userProfile?.role])
    || ['cadastro_triagem', 'apoio_transversal'].includes(profileProfession(userProfile));
  const canPerformTriage = isCoordinatorProfile(userProfile)
    || userProfile?.role === 'academico'
    || ['cadastro_triagem', ...ATUACOES_SAUDE_TRIAGEM].includes(profileProfession(userProfile));
  const canRecordCenso = isCoordinatorProfile(userProfile)
    || ['cadastro_triagem', 'servico_social', 'apoio_transversal', ...ATUACOES_SAUDE_TRIAGEM].includes(profileProfession(userProfile));
  const accessibleAreas = TODAS_ESPECIALIDADES.filter(area => canWriteArea(area));
  const canViewDashboard = isCoordinatorProfile(userProfile);
  const canExportReports = isCoordinatorProfile(userProfile);
  const canViewUsers = isCoordinatorProfile(userProfile);
  const canPromoteUsers = userProfile?.role === 'admin';
  const canDeleteAssistido = userProfile?.role === 'admin';

  useEffect(() => {
    if (!user || !userProfile || !actionLocationConfirmedToday || currentView !== 'stats' || !canViewDashboard) return undefined;
    let cancelled = false;
    const loadDashboardDataset = async () => {
      try {
        const [assistidosSnap, anamnesesSnap, triagensSnap, atendimentosSnap] = await Promise.all([
          getDocs(tenantCollectionQuery('assistidos', selectedActionLocation, REPORT_MAX_LIMIT)),
          getDocs(tenantCollectionQuery('anamneses', selectedActionLocation, REPORT_MAX_LIMIT)),
          getDocs(tenantCollectionQuery('triagens', selectedActionLocation, REPORT_MAX_LIMIT)),
          getDocs(tenantCollectionQuery('atendimentos', selectedActionLocation, REPORT_MAX_LIMIT)),
        ]);
        if (cancelled) return;
        setAssistidos(activeRows(snapshotRows(assistidosSnap)));
        setAnamneses(activeRows(snapshotRows(anamnesesSnap)));
        setTriagens(activeRows(snapshotRows(triagensSnap)));
        setAtendimentos(activeRows(snapshotRows(atendimentosSnap)));
      } catch (err) {
        console.error('Falha ao carregar base completa do dashboard:', err);
        if (!cancelled) setNotification('Dashboard parcial: nao foi possivel carregar a base completa agora.');
      }
    };
    loadDashboardDataset();
    return () => { cancelled = true; };
  }, [user, userProfile, currentView, canViewDashboard, selectedActionLocation, actionLocationConfirmedToday]);

  const getAreaIcon = (area) => {
    switch(area) {
      case 'Veterinária': return <Dog size={14}/>;
      case 'Nutrição': return <Heart size={14}/>;
      case 'Doações': return <Gift size={14}/>;
      case 'Justiça de Rua': return <Briefcase size={14}/>;
      case 'Apoio à Mulher': return <HeartHandshake size={14}/>;
      case 'Vacinação': return <HeartPulse size={14}/>;
      case 'Testes Rápidos': return <Activity size={14}/>;
      case 'Biomedicina': return <Activity size={14}/>;
      case 'Exames Clínicos': return <Activity size={14}/>;
      case 'Farmácia': return <FileText size={14}/>;
      case 'Podologia': return <Activity size={14}/>;
      case 'Atendimento Infantil / Brinquedoteca': return <Baby size={14}/>;
      case 'Emissão de Documentos': return <IdCard size={14}/>;
      case 'Beleza de Rua': return <Smile size={14}/>;
      case 'Acolhimento Social': return <HeartHandshake size={14}/>;
      case 'Psicologia': return <Brain size={14}/>;
      case 'Odontologia': return <Smile size={14}/>;
      case 'Fisioterapia': return <Activity size={14}/>;
      case 'Enfermagem / Curativos': return <HeartPulse size={14}/>;
      default: return <Stethoscope size={14}/>;
    }
  };

  const showMsg = (m) => { setNotification(m); setTimeout(() => setNotification(''), 4000); };
  const patchLocalAssistido = (assistidoId, patch) => {
    if (!assistidoId) return;
    setAssistidos(current => current.map(item => (
      String(item.id) === String(assistidoId) ? { ...item, ...patch } : item
    )));
    setSelectedAssistido(current => (
      current && String(current.id) === String(assistidoId) ? { ...current, ...patch } : current
    ));
  };
  const syncLocalRecord = (setter, record) => {
    if (!record?.id) return;
    setter(current => upsertRowById(current, record));
  };
  const saveSafely = async (saveAction, successMessage) => {
    if (isSaving) return false;
    setIsSaving(true);
    try {
      await saveAction();
      showMsg(successMessage);
      setHasUnsavedChanges(false);
      return true;
    } catch (err) {
      console.error('Falha ao salvar:', err);
      showMsg('Erro ao salvar. Confira a conexao e tente novamente.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  const loadManagedUsers = async () => {
    if (!canViewUsers || isLoadingUsers) return;
    setIsLoadingUsers(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'users'), limit(USERS_INITIAL_LIMIT)));
      setManagedUsers(snapshot.docs.map(document => ({ uid: document.id, ...document.data() }))
        .sort((left, right) => String(right.ultimoLoginEm || right.lgpdAcceptedAt || '').localeCompare(String(left.ultimoLoginEm || left.lgpdAcceptedAt || ''))));
    } catch (err) {
      console.error('Falha ao carregar usuarios:', err);
      showMsg('Nao foi possivel carregar usuarios. Verifique as permissoes publicadas.');
    } finally {
      setIsLoadingUsers(false);
    }
  };
  const promoteManagedUser = async (managedUser, role) => {
    if (!canPromoteUsers || adminActionUid) return;
    const label = role === 'admin' ? 'Administrador' : 'Coordenacao';
    if (!window.confirm(`Confirmar ${managedUser.email || managedUser.nome || 'usuario'} como ${label}?`)) return;
    setAdminActionUid(managedUser.uid);
    try {
      await updateUserAccessCallable({
        targetUid: managedUser.uid,
        role,
        profissao: profileProfession(managedUser) || 'apoio_operacional',
        filial: managedUser.filial || 'Santos',
      });
      showMsg(`Perfil atualizado para ${label}.`);
      await loadManagedUsers();
    } catch (err) {
      console.error('Falha ao atualizar papel:', err);
      showMsg('Nao foi possivel alterar o papel deste usuario.');
    } finally {
      setAdminActionUid('');
    }
  };
  const deleteManagedUser = async (managedUser) => {
    if (!canViewUsers || adminActionUid || managedUser.uid === user?.uid) return;
    const protectedRole = ['admin', 'coordenador'].includes(managedUser.role);
    if (userProfile?.role === 'coordenador' && protectedRole) return;
    if (!window.confirm(`Revogar o acesso de ${managedUser.email || managedUser.nome || ''}? A pessoa deixara de entrar no app; a exclusao definitiva do login e feita no Console Firebase.`)) return;
    setAdminActionUid(managedUser.uid);
    try {
      await revokeUserAccessCallable({ targetUid: managedUser.uid });
      showMsg('Acesso revogado com auditoria. O login foi desabilitado quando permitido pelo Firebase.');
      await loadManagedUsers();
    } catch (err) {
      console.error('Falha ao excluir usuario:', err);
      showMsg('Nao foi possivel excluir este usuario.');
    } finally {
      setAdminActionUid('');
    }
  };
  const updateManagedUser = async (event) => {
    event.preventDefault();
    if (!canPromoteUsers || !editingManagedUser?.uid || adminActionUid) return;
    const fd = new FormData(event.currentTarget);
    const updates = {
      role: requiredText(fd.get('role')),
      profissao: requiredText(fd.get('profissao')),
      filial: requiredText(fd.get('filial')) || 'Santos',
      roleUpdatedAt: new Date().toISOString(),
      roleUpdatedBy: user.uid,
      perfilAdminAtualizadoEm: new Date().toISOString(),
    };
    setAdminActionUid(editingManagedUser.uid);
    try {
      await updateUserAccessCallable({
        targetUid: editingManagedUser.uid,
        role: updates.role,
        profissao: updates.profissao,
        filial: updates.filial,
      });
      setManagedUsers(current => current.map(item => item.uid === editingManagedUser.uid ? { ...item, ...updates } : item));
      setEditingManagedUser(null);
      showMsg('Usuario atualizado pelo administrador.');
    } catch (err) {
      console.error('Falha ao atualizar usuario pelo admin:', err);
      showMsg('Nao foi possivel atualizar este usuario.');
    } finally {
      setAdminActionUid('');
    }
  };
  const persistOperationalSettings = async (updates, successMessage) => {
    if (!canPromoteUsers) return;
    try {
      // Firebase settings write hook: admins persist localidade/filial in app_settings/operacional.
      // Dashboards continuam filtrando por localAcao; filial e apenas origem do voluntario.
      await setDoc(doc(db, 'app_settings', 'operacional'), {
        actionLocations,
        filiaisEquipe,
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      }, { merge: true });
      showMsg(successMessage);
    } catch (err) {
      console.error('Falha ao salvar configuracoes operacionais:', err);
      showMsg('Nao foi possivel salvar a configuracao operacional.');
    }
  };
  const addFilialSetting = async (event) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const filial = requiredText(fd.get('filial'));
    if (!filial) return;
    await persistOperationalSettings({
      filiaisEquipe: [...new Set([...filiaisEquipe, filial])],
    }, 'Filial adicionada.');
    event.currentTarget.reset();
  };
  const removeFilialSetting = async (filial) => {
    if (filiaisEquipe.length <= 1) {
      showMsg('Mantenha pelo menos uma filial ativa.');
      return;
    }
    await persistOperationalSettings({
      filiaisEquipe: filiaisEquipe.filter(item => item !== filial),
    }, 'Filial removida.');
  };
  const addActionLocationSetting = async (event) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const label = requiredText(fd.get('label'));
    const city = requiredText(fd.get('city'));
    const neighborhood = requiredText(fd.get('neighborhood'));
    const unit = requiredText(fd.get('unit')) || normalizeStr(`${label}.${city}`).replace(/\s+/g, '.');
    if (!label || !city || !neighborhood) {
      showMsg('Informe nome, cidade e bairro do local da acao.');
      return;
    }
    const value = requiredText(fd.get('value')) || normalizeStr(`${label}_${city}_${neighborhood}`).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (actionLocations.some(location => location.value === value)) {
      showMsg('Ja existe local com este identificador.');
      return;
    }
    await persistOperationalSettings({
      actionLocations: [...actionLocations, { value, label, city, neighborhood, unit }],
    }, 'Local de acao adicionado.');
    event.currentTarget.reset();
  };
  const removeActionLocationSetting = async (value) => {
    if (actionLocations.length <= 1) {
      showMsg('Mantenha pelo menos um local de acao ativo.');
      return;
    }
    await persistOperationalSettings({
      actionLocations: actionLocations.filter(location => location.value !== value),
    }, 'Local de acao removido.');
  };
  const handleDeleteAssistido = async (assistido) => {
    if (!canDeleteAssistido || !assistido?.id || isSaving) return;
    const typed = window.prompt(`Digite EXCLUIR para inativar o cadastro de ${assistidoDisplayName(assistido)}. O histórico será preservado para auditoria.`);
    if (typed !== 'EXCLUIR') {
      showMsg('Exclusao cancelada. Digite EXCLUIR exatamente para confirmar.');
      return;
    }
    const saved = await saveSafely(
      () => setDoc(doc(db, 'assistidos', assistido.id), {
        status: 'inativo',
        deletedAt: serverTimestamp(),
        deletedBy: user.uid,
        deletedByName: userProfile.nome,
      }, { merge: true }),
      'Assistido inativado com segurança.'
    );
    if (saved) {
      setAssistidos(current => current.filter(item => String(item.id) !== String(assistido.id)));
      setSelectedAssistido(null);
      setCurrentView('home');
    }
  };

  const handleBack = () => {
    if (!confirmFormExit()) return;
    if (['busca', 'atender', 'cadastro', 'stats', 'usuarios', 'perfil', 'ficha'].includes(currentView)) { setCurrentView('home'); setSelectedAssistido(null); } 
    else if (['triagem', 'atendimento', 'anamnese', 'historico'].includes(currentView)) { setCurrentView('ficha'); } 
    else { setCurrentView('home'); }
  };

  const confirmFormExit = () => {
    const isEditing = ['cadastro', 'triagem', 'atendimento', 'anamnese', 'perfil'].includes(currentView);
    if (!isEditing || !hasUnsavedChanges) return true;
    const shouldExit = window.confirm('Existem alteracoes nao salvas. Deseja sair sem salvar?');
    if (shouldExit) setHasUnsavedChanges(false);
    return shouldExit;
  };

  const navigateFromBottom = (view) => {
    if (!confirmFormExit()) return;
    if (!actionLocationConfirmedToday) {
      setShowActionLocationModal(true);
      showMsg('Escolha a localidade da acao de hoje para continuar.');
      return;
    }
    if (view === 'stats' && !canViewDashboard) {
      showMsg('Não foi possível abrir o dashboard.');
      return;
    }
    if (view === 'usuarios' && !canViewUsers) {
      showMsg('Gestao de usuarios disponivel apenas para administracao e coordenacao.');
      return;
    }
    setCurrentView(view);
    setSelectedAssistido(null);
    setShowExtraAtendimentos(false);
  };

  const openOwnProfile = () => {
    if (!confirmFormExit()) return;
    setProfilePhotoDraft(userProfile?.photo || '');
    setHasUnsavedChanges(false);
    setCurrentView('perfil');
    setSelectedAssistido(null);
  };

  const goToFicha = (assistido) => {
    if (!actionLocationConfirmedToday) {
      setShowActionLocationModal(true);
      showMsg('Escolha a localidade da acao de hoje para abrir prontuarios.');
      return;
    }
    setSelectedAssistido(assistido);
    setSelectedAtendimento(null);
    setDefaultArea('');
    setAtendimentoExtra(false);
    setShowExtraAtendimentos(false);
    setCurrentView('ficha');
  };

  const openAtendimento = (area, atendimento = null, options = {}) => {
    if (!canAccessArea(area)) {
      showMsg(`Atendimento direcionado à equipe de ${area}.`);
      return;
    }
    setDefaultArea(area);
    setSelectedAtendimento(atendimento);
    setAtendimentoExtra(Boolean(options.extra || atendimento?.extraAtendimento));
    setFormToggles(prev => ({
      ...prev,
      farmaciaAtendimento: atendimento?.precisaFarmacia || 'Não',
      abordagemNutri: atendimento?.abordagem_nutri || '',
      tipoCondutaPsicologia: atendimento?.tipoCondutaPsicologia || '',
    }));
    if (area === 'Veterinária' || area === 'Medicina Veterinaria') {
      setVetPets(atendimento?.vetPets || [{ id: 'novo-pet', nome: '', especie: '', situacao: '', avaliacao: '', conduta: '', diagVet: '' }]);
    }
    setCurrentView('atendimento');
  };

  const openAnamnese = (assistido) => {
    if (!canRecordCenso) {
      showMsg('Censo Social direcionado à equipe de acolhimento e assistência social.');
      return;
    }
    const ana = anamneses.find(a => String(a.assistidoId) === String(assistido.id)) || {};
    setFormToggles({
      temAlergia: ana.alergias && ana.alergias !== 'Nega' ? 'Sim' : 'Não',
      temCirurgia: ana.cirurgias && ana.cirurgias !== 'Nega' ? 'Sim' : 'Não',
      temPsi: ana.tratamentoPsi && ana.tratamentoPsi !== 'Nega' ? 'Sim' : 'Não',
      temPets: ana.pets && ana.pets !== 'Nega' ? 'Sim' : 'Não',
      temMac: ana.mac && ana.mac !== 'Não se aplica' ? 'Sim' : 'Não',
      temFreqSaude: ana.freqSaude || ana.freqSaudeResposta === 'Sim' ? 'Sim' : 'Não',
      drogas: ana.drogas || 'Não faz uso declarado',
      moradia: ana.moradia || '',
      motivoRua: ana.motivoRua || '',
      programas: ana.programas || '',
      abordagemNutri: '',
    });
    setCurrentView('anamnese');
  };

  const openTriagem = (assistido) => {
    if (!canPerformTriage) {
      showMsg('Triagem direcionada à equipe cadastrada nessa atuação.');
      return;
    }
    const hoje = new Date().toLocaleDateString('pt-BR');
    const triagemHoje = triagens.find(t => String(t.assistidoId) === String(assistido.id) && t.data === hoje) || {};
    setFormToggles(prev => ({
      ...prev,
      peso: triagemHoje.peso || '',
      altura: triagemHoje.altura || '',
      prioridadeCuidado: triagemHoje.prioridadeCuidado || 'Rotina',
      usaMedicacaoTriagem: triagemHoje.usaMedicacaoTriagem || (triagemHoje.medicacaoUso && triagemHoje.medicacaoUso !== 'Não se aplica' ? 'Sim' : 'Não'),
    }));
    setSelectedAssistido(assistido);
    setCurrentView('triagem');
  };

  const handleToggle = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
       const currentVals = formToggles[name] ? formToggles[name].split(',') : [];
       if (checked) currentVals.push(value);
       else { const idx = currentVals.indexOf(value); if (idx > -1) currentVals.splice(idx, 1); }
       setFormToggles(prev => ({ ...prev, [name]: currentVals.join(',') }));
    } else {
       setFormToggles(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- EXPORTACAO XLSX POR ABAS ---
  const exportWorkbook = async (reportScope = 'geral') => {
    if (isExporting) return;
    if (!canExportReports) {
      showMsg('Exportacao XLSX restrita a coordenacao e administracao.');
      return;
    }
    const reportDate = displayDateFromInput(exportDate);
    const reportIsDateScoped = reportScope === 'data';
    const reportScopeLabel = reportIsDateScoped ? `Data da ação: ${reportDate}` : 'Histórico geral consolidado';
    const confirmed = window.confirm(`${reportScopeLabel}. Esta planilha contem dados pessoais e de saude. Exporte somente quando necessario e compartilhe pelos canais institucionais da coordenacao.`);
    if (!confirmed) return;

    setIsExporting(true);
    try {
      const [assistidosSnap, anamnesesSnap, triagensSnap, atendimentosSnap] = await Promise.all([
        getDocs(tenantCollectionQuery('assistidos', selectedActionLocation, REPORT_MAX_LIMIT)),
        getDocs(tenantCollectionQuery('anamneses', selectedActionLocation, REPORT_MAX_LIMIT)),
        getDocs(tenantCollectionQuery('triagens', selectedActionLocation, REPORT_MAX_LIMIT)),
        getDocs(tenantCollectionQuery('atendimentos', selectedActionLocation, REPORT_MAX_LIMIT)),
      ]);
      const sourceAssistidos = activeRows(snapshotRows(assistidosSnap));
      const sourceAnamneses = activeRows(snapshotRows(anamnesesSnap));
      const sourceTriagens = activeRows(snapshotRows(triagensSnap));
      const sourceAtendimentos = activeRows(snapshotRows(atendimentosSnap));
      const reportAssistidos = sourceAssistidos.filter(row => !isTestAssistido(row));
      const reportAssistidoIds = new Set(reportAssistidos.map(row => String(row.id)));
      const assistidoById = new Map(reportAssistidos.map(assistido => [String(assistido.id), assistido]));
      const withAssistido = (record) => {
        const assistido = assistidoById.get(String(record.assistidoId)) || {};
        return {
          ...record,
          assistidoNome: assistidoDisplayName(assistido) || 'Assistido nao localizado',
          assistidoCpf: assistido.cpf || '',
          assistidoRg: assistido.rg || '',
        };
      };
      const localExportLabel = currentActionLocation.label;
      const exportTab = statTab === 'justiça' ? 'justica' : statTab;
      const theme = getExportTheme(exportTab);
      const allAtendimentoRows = sourceAtendimentos.filter(row => reportAssistidoIds.has(String(row.assistidoId))).map(withAssistido).sort((a, b) => recordTime(b) - recordTime(a));
      const allTriagemRows = sourceTriagens.filter(row => reportAssistidoIds.has(String(row.assistidoId))).map(withAssistido).sort((a, b) => recordTime(b) - recordTime(a));
      const allCensoRows = sourceAnamneses.filter(row => reportAssistidoIds.has(String(row.assistidoId))).map(withAssistido).sort((a, b) => recordTime(b) - recordTime(a));
      const dateScopeIds = new Set([
        ...reportAssistidos
          .filter(row => row.dataCriacao === reportDate || row.chegadaAcaoData === reportDate)
          .map(row => String(row.id)),
        ...allAtendimentoRows.filter(row => row.data === reportDate).map(row => String(row.assistidoId)),
        ...allTriagemRows.filter(row => row.data === reportDate).map(row => String(row.assistidoId)),
        ...allCensoRows.filter(row => row.dataAtu === reportDate).map(row => String(row.assistidoId)),
      ]);
      const scopedAtendimentoRows = reportIsDateScoped ? allAtendimentoRows.filter(row => row.data === reportDate) : allAtendimentoRows;
      const scopedTriagemRows = reportIsDateScoped ? allTriagemRows.filter(row => row.data === reportDate) : allTriagemRows;
      const scopedCensoRows = reportIsDateScoped ? allCensoRows.filter(row => dateScopeIds.has(String(row.assistidoId))) : allCensoRows;
      const scopedAssistidoRows = reportIsDateScoped ? reportAssistidos.filter(row => dateScopeIds.has(String(row.id))) : reportAssistidos;
      const areaIs = (row, expected) => normalizeStr(row.area) === normalizeStr(expected);
      const isHealthArea = (row) => [
        'Medicina Humana', 'Odontologia', 'Psicologia', 'Nutricao', 'Fisioterapia',
        'Enfermagem / Curativos', 'Curativos', 'Biomedicina', 'Vacinacao',
        'Farmacia', 'Podologia', 'Exames Clinicos',
      ].some(area => areaIs(row, area));
      const isVetArea = (row) => areaIs(row, 'Veterinaria') || areaIs(row, 'Medicina Veterinaria');
      const matchesExportTab = (row) => {
        if (exportTab === 'clinica') return isHealthArea(row);
        if (exportTab === 'social') return areaIs(row, 'Acolhimento Social');
        if (exportTab === 'vet') return isVetArea(row);
        if (exportTab === 'doacoes') return areaIs(row, 'Doacoes') || areaIs(row, 'Doacao');
        if (exportTab === 'justica') return areaIs(row, 'Justica de Rua');
        return true;
      };
      const atendimentoRows = scopedAtendimentoRows.filter(matchesExportTab);
      const triagemRows = exportTab === 'geral' || exportTab === 'clinica' ? scopedTriagemRows : [];
      const censoRows = exportTab === 'geral' || exportTab === 'clinica' || exportTab === 'social'
        ? scopedCensoRows
        : exportTab === 'vet'
          ? scopedCensoRows.filter(row => row.petTipos || row.pets)
          : [];
      const scopeIds = new Set([
        ...atendimentoRows.map(row => String(row.assistidoId || '')),
        ...triagemRows.map(row => String(row.assistidoId || '')),
        ...censoRows.map(row => String(row.assistidoId || '')),
      ].filter(Boolean));
      const assistidoRows = (exportTab === 'geral' ? scopedAssistidoRows : scopedAssistidoRows.filter(row => scopeIds.has(String(row.id))))
        .sort((a, b) => recordTime(b) - recordTime(a));
      const areaCounts = countExportValues(atendimentoRows, row => row.area);
      const petsRows = [
        ...censoRows
          .filter(row => row.petTipos || row.pets)
          .map(row => ({ ...row, origem: 'Censo social', petDetalhes: row.pets })),
        ...atendimentoRows
          .filter(isVetArea)
          .flatMap(row => (row.vetPets || []).map(pet => ({
            ...row,
            origem: 'Atendimento veterinario',
            petNome: pet.nome,
            petEspecie: pet.especie,
            petSituacao: pet.situacao,
            petAvaliacao: pet.avaliacao,
            petDiagnostico: pet.diagVet,
            petConduta: pet.conduta,
          }))),
      ];
      const generatedAt = new Date().toLocaleString('pt-BR');
      const today = new Date().toLocaleDateString('pt-BR');
      const scopedClinicalRows = atendimentoRows.filter(isHealthArea);
      const medicineRows = atendimentoRows.filter(row => areaIs(row, 'Medicina Humana'));
      const nutritionRows = atendimentoRows.filter(row => areaIs(row, 'Nutricao'));
      const testesVacinasRows = atendimentoRows.filter(row => areaIs(row, 'Biomedicina') || areaIs(row, 'Vacinacao') || areaIs(row, 'Exames Clinicos'));
      const doacaoRows = atendimentoRows.filter(row => areaIs(row, 'Doacoes') || areaIs(row, 'Doacao'));
      const justicaRows = atendimentoRows.filter(row => areaIs(row, 'Justica de Rua'));
      const socialRows = atendimentoRows.filter(row => areaIs(row, 'Acolhimento Social'));
      const pendingRows = atendimentoRows.filter(row => normalizeStr(row.status).includes('aguardando'));
      const extraRows = atendimentoRows.filter(row => row.extraAtendimento);
      const partialTriagemRows = triagemRows.filter(row => (row.preenchimentoPct ? triageCompletion(row).percent : 0) < 80);
      const partialAtendimentoRows = atendimentoRows.filter(row => Number(row.preenchimentoPct || 0) > 0 && Number(row.preenchimentoPct || 0) < 80);
      const criticalTriagemRows = triagemRows.filter(row => triagePriority(row).level === 'critical');
      const priorityTriagemRows = triagemRows.filter(row => triagePriority(row).level === 'priority');
      const pharmacyRows = scopedClinicalRows.filter(row => normalizeStr(row.precisaFarmacia) === 'sim' || row.farmacia);
      const referralRows = scopedClinicalRows.filter(row => row.encExterno || row.encaminhamentoSocial);
      const riskRows = censoRows.filter(row => normalizeStr(row.suicidio).includes('sim') || normalizeStr(row.psiquiatria).includes('suic'));
      const substanceRows = censoRows.filter(row => {
        const value = normalizeStr(row.drogas);
        return value && !['nega', 'nao faz uso', 'nao informado', 'nao se aplica'].some(marker => value.includes(marker));
      });
      const foodRiskRows = censoRows.filter(row => {
        const value = normalizeStr(row.semComer);
        return value && !['nenhuma vez', 'nao', 'nao informado', 'nao se aplica'].some(marker => value === marker);
      });
      const withoutCpfRows = assistidoRows.filter(row => !requiredText(row.cpf) || normalizeStr(row.cpf).includes('nao informado'));
      const withoutCensoRows = assistidoRows.filter(row => !censoRows.some(censo => String(censo.assistidoId) === String(row.id)));
      const missingAssistidoRows = [...atendimentoRows, ...triagemRows, ...censoRows].filter(row => row.assistidoNome === 'Assistido nao localizado');
      const diagnosisCounts = countExportListValues(scopedClinicalRows, row => row.hd || row.diagnostico || row.outros_hd);
      const moradiaCounts = countExportValues(censoRows, row => row.moradia);
      const statusCounts = countExportValues(atendimentoRows, row => row.status);
      const itemCounts = countExportListValues(doacaoRows, row => row.itens_entregues_cat);
      const justiceCounts = countExportListValues(justicaRows, row => row.categoria_juridica);
      const vetSituationCounts = countExportValues(petsRows.filter(row => row.petSituacao), row => row.petSituacao);
      const vetDiagnosisCounts = countExportValues(petsRows.filter(row => row.petDiagnostico), row => row.petDiagnostico);
      const alertFlowRows = assistidoRows.map(assistido => {
        const relatedTriagem = triagemRows.find(row => String(row.assistidoId) === String(assistido.id));
        const relatedAtendimentos = atendimentoRows.filter(row => String(row.assistidoId) === String(assistido.id));
        const priority = triagePriority(relatedTriagem);
        return {
          assistidoId: assistido.id,
          nome: assistidoDisplayName(assistido),
          nomeCivil: assistido.nomeCivil || '',
          nomeSocial: assistido.nomeSocial || '',
          chegada: assistido.chegadaAcaoData || assistido.dataCriacao,
          horaChegada: hourLabel(assistido.chegadaAcaoEm || assistido.dataCriacaoEm),
          prioridade: priority.label,
          marcadores: priority.reasons.join(', ') || 'Sem marcador de atenção informado',
          comentario: relatedTriagem?.observacaoAtencao || 'Não informado',
          statusTriagem: relatedTriagem ? (relatedTriagem.preenchimentoStatus || triageCompletion(relatedTriagem).status) : 'Não iniciada',
          areasIndicadas: relatedTriagem?.encaminhamento || 'Não informado',
          atendimentos: relatedAtendimentos.length,
          pendencias: relatedAtendimentos.filter(row => normalizeStr(row.status).includes('aguardando')).map(row => row.area).join(', ') || 'Nenhuma pendência de validação',
          ultimoFluxo: assistido.ultimoAtendimento,
          priorityRank: priority.level === 'critical' ? 0 : priority.level === 'priority' ? 1 : 2,
        };
      }).sort((left, right) => left.priorityRank - right.priorityRank || String(left.horaChegada).localeCompare(String(right.horaChegada)));
      const sheetGuide = exportTab === 'geral' ? [
        ['Assistidos', 'Identificacao, documentos e ultimo fluxo.'],
        ['Fila e Alertas', 'Chegada, prioridade definida na triagem e pendencias de cuidado.'],
        ['Censo Social', 'Moradia, rede publica, familia e trabalho.'],
        ['Saude e Habitos', 'Historico, alergias, saude mental, substancias e alimentacao.'],
        ['Sexual Reprodutiva', 'Campos sexuais e ginecologicos separados do censo geral.'],
        ['Triagens', 'Sinais vitais e roteiro de encaminhamento.'],
        ['Atendimentos', 'Linha geral de cada atendimento por area.'],
        ['Medicina', 'Queixa, avaliacao, conduta, farmacia e encaminhamento medico.'],
        ['Nutricao', 'Avaliacao, aconselhamento e conduta nutricional.'],
        ['Testes e Vacinas', 'Registros de Biomedicina e Vacinacao.'],
        ['Doacoes', 'Itens solicitados e entregues.'],
        ['Justica de Rua', 'Demanda juridica e orientacoes.'],
        ['Pets e Vet', 'Pets do censo e animais avaliados na veterinaria.'],
        ['Bases completas', 'Campos brutos exportaveis para auditoria e cruzamentos.'],
      ] : exportTab === 'clinica' ? [
        ['Assistidos', 'Identificacao de pessoas com dado clinico exportado.'],
        ['Fila e Alertas', 'Prioridades, inclusao e pendencias registradas na triagem.'],
        ['Saude e Habitos', 'Censo clinico, alergias, historico e alimentacao.'],
        ['Triagens', 'Sinais vitais e encaminhamentos.'],
        ['Atendimentos', 'Todos os atendimentos de saude do recorte.'],
        ['Medicina', 'Registro medico detalhado.'],
        ['Nutricao', 'Registro nutricional detalhado.'],
        ['Testes e Vacinas', 'Biomedicina e vacinacao.'],
        ['Bases completas', 'Campos brutos clinicos preservados.'],
      ] : exportTab === 'social' ? [
        ['Assistidos', 'Identificacao do recorte social.'],
        ['Censo Social', 'Moradia, trabalho, programas e familia.'],
        ['Saude e Habitos', 'Riscos sociais e alimentares do censo.'],
        ['Acolhimento', 'Demandas e encaminhamentos sociais.'],
        ['Bases completas', 'Campos brutos sociais preservados.'],
      ] : exportTab === 'vet' ? [
        ['Assistidos', 'Identificacao de tutores e assistidos relacionados.'],
        ['Pets e Vet', 'Pets do censo e animais avaliados.'],
        ['Atendimentos Vet', 'Atendimentos veterinarios e condutas.'],
        ['Bases completas', 'Campos brutos veterinarios preservados.'],
      ] : exportTab === 'doacoes' ? [
        ['Assistidos', 'Identificacao dos assistidos atendidos em doacoes.'],
        ['Doacoes', 'Itens solicitados e entregues.'],
        ['Bases completas', 'Campos brutos do recorte de doacoes.'],
      ] : [
        ['Assistidos', 'Identificacao dos assistidos atendidos em justica.'],
        ['Justica de Rua', 'Demandas, categorias e orientacoes.'],
        ['Bases completas', 'Campos brutos juridicos preservados.'],
      ];
      const areaRows = areaCounts.slice(0, 10).map(([area, total]) => [area, total, exportPercent(total, atendimentoRows.length), 'Atendimentos']);
      const dashboardProfileRows = countExportValues(assistidoRows, row => row.sexo).map(([sexo, total]) => [sexo, total, exportPercent(total, assistidoRows.length), 'Genero']);
      const dashboardQualityRows = [
        ['Sem CPF', withoutCpfRows.length, exportPercent(withoutCpfRows.length, assistidoRows.length), 'Cadastro'],
        ['Sem censo no recorte', withoutCensoRows.length, exportPercent(withoutCensoRows.length, assistidoRows.length), 'Cobertura'],
        ['Atendimento aguardando', pendingRows.length, exportPercent(pendingRows.length, atendimentoRows.length), 'Fluxo'],
        ['Triagem parcial', partialTriagemRows.length, exportPercent(partialTriagemRows.length, triagemRows.length), 'Preenchimento'],
        ['Atendimento parcial', partialAtendimentoRows.length, exportPercent(partialAtendimentoRows.length, atendimentoRows.length), 'Preenchimento'],
        ['Atendimento extra', extraRows.length, exportPercent(extraRows.length, atendimentoRows.length), 'Fluxo'],
        ['Atenção crítica', criticalTriagemRows.length, exportPercent(criticalTriagemRows.length, triagemRows.length), 'Prioridade'],
        ['Atenção especial', priorityTriagemRows.length, exportPercent(priorityTriagemRows.length, triagemRows.length), 'Prioridade'],
        ['Vinculo nao localizado', missingAssistidoRows.length, exportPercent(missingAssistidoRows.length, [...atendimentoRows, ...triagemRows, ...censoRows].length), 'Integridade'],
      ];
      const commonMetrics = [
        { label: 'Assistidos no relatorio', value: assistidoRows.length, note: 'Pessoas abrangidas pelo recorte exportado.' },
        { label: 'Atendimentos', value: atendimentoRows.length, note: 'Registros de atendimento exportados.' },
        { label: 'Triagens', value: triagemRows.length, note: 'Registros tecnicos de triagem.' },
        { label: 'Censos sociais', value: censoRows.length, note: 'Anamneses/censos no relatorio.' },
      ];
      const baseDashboardMetrics = exportTab === 'clinica' ? [
        ...commonMetrics,
        { label: reportIsDateScoped ? 'Atendimentos na data' : 'Atendimentos hoje', value: atendimentoRows.filter(row => row.data === (reportIsDateScoped ? reportDate : today)).length, note: reportIsDateScoped ? reportDate : today },
        { label: 'Farmacia MDM', value: pharmacyRows.length, note: 'Registros com necessidade/receituario.' },
        { label: 'Encaminhamentos', value: referralRows.length, note: 'Encaminhamentos externos ou sociais.' },
        { label: 'Pendentes', value: pendingRows.length, note: 'Aguardando profissional.' },
      ] : exportTab === 'social' ? [
        ...commonMetrics,
        { label: 'Sem comer no mes', value: foodRiskRows.length, note: 'Indicador alimentar informado.' },
        { label: 'Uso de substancias', value: substanceRows.length, note: 'Censos com relato.' },
        { label: 'Risco psi/suicida', value: riskRows.length, note: 'Sinal informado no censo.' },
        { label: 'Acolhimentos', value: socialRows.length, note: 'Atendimentos sociais.' },
      ] : exportTab === 'vet' ? [
        ...commonMetrics,
        { label: 'Pets / animais', value: petsRows.length, note: 'Linhas de pets do censo e veterinaria.' },
        { label: 'Atendimentos vet', value: atendimentoRows.length, note: 'Registros veterinarios.' },
        { label: 'Situacoes descritas', value: vetSituationCounts.length, note: 'Categorias clinicas distintas.' },
        { label: 'Diagnosticos vet', value: vetDiagnosisCounts.length, note: 'Diagnosticos distintos.' },
      ] : exportTab === 'doacoes' ? [
        ...commonMetrics,
        { label: 'Atendimentos doacao', value: doacaoRows.length, note: 'Linhas de doacao.' },
        { label: 'Categorias entregues', value: itemCounts.length, note: 'Tipos de itens entregues.' },
        { label: 'Com solicitacao', value: doacaoRows.filter(row => row.itensSolicitados).length, note: 'Pedido registrado.' },
        { label: 'Com observacao', value: doacaoRows.filter(row => row.obsGeral).length, note: 'Alertas multidisciplinares.' },
      ] : exportTab === 'justica' ? [
        ...commonMetrics,
        { label: 'Atendimentos justica', value: justicaRows.length, note: 'Registros juridicos.' },
        { label: 'Categorias legais', value: justiceCounts.length, note: 'Demandas categorizadas.' },
        { label: 'Com acao', value: justicaRows.filter(row => row.acaoJuridica).length, note: 'Orientacao/acao registrada.' },
        { label: 'Pendentes', value: pendingRows.length, note: 'Aguardando profissional.' },
      ] : [
        ...commonMetrics,
        { label: reportIsDateScoped ? 'Triagens na data' : 'Triagens hoje', value: scopedTriagemRows.filter(row => row.data === (reportIsDateScoped ? reportDate : today)).length, note: reportIsDateScoped ? reportDate : today },
        { label: reportIsDateScoped ? 'Atendimentos na data' : 'Atendimentos hoje', value: scopedAtendimentoRows.filter(row => row.data === (reportIsDateScoped ? reportDate : today)).length, note: reportIsDateScoped ? reportDate : today },
        { label: 'Areas atendidas', value: areaCounts.length, note: 'Areas com registros.' },
        { label: 'Pendentes', value: pendingRows.length, note: 'Aguardando profissional.' },
      ];
      const dashboardMetrics = [
        ...baseDashboardMetrics,
        ...(exportTab === 'geral' || exportTab === 'clinica' ? [
          { label: 'Atenção crítica', value: criticalTriagemRows.length, note: 'Prioridade imediata indicada na triagem.' },
          { label: 'Atenção especial', value: priorityTriagemRows.length, note: 'TEA, deficiência, vulnerabilidade ou acompanhamento.' },
        ] : []),
      ];
      const dashboardBlocks = exportTab === 'clinica' ? [
        { title: 'Atendimentos por area', headers: ['Area', 'Qtd.', '%', 'Fonte'], rows: areaRows },
        { title: 'Diagnosticos mais frequentes', headers: ['Diagnostico', 'Qtd.', '%', 'Fonte'], rows: diagnosisCounts.slice(0, 8).map(([diag, total]) => [diag, total, exportPercent(total, diagnosisCounts.reduce((sum, [, count]) => sum + count, 0)), 'Atendimento']) },
        { title: 'Fluxo clinico', headers: ['Indicador', 'Qtd.', '%', 'Leitura'], rows: [
          ['Farmacia MDM', pharmacyRows.length, exportPercent(pharmacyRows.length, scopedClinicalRows.length), 'Necessidade'],
          ['Encaminhamentos', referralRows.length, exportPercent(referralRows.length, scopedClinicalRows.length), 'Rede'],
          ['Aguardando profissional', pendingRows.length, exportPercent(pendingRows.length, atendimentoRows.length), 'Status'],
        ] },
        { title: 'Qualidade do recorte', headers: ['Ponto', 'Qtd.', '%', 'Grupo'], rows: dashboardQualityRows },
      ] : exportTab === 'social' ? [
        { title: 'Moradia', headers: ['Situacao', 'Qtd.', '%', 'Fonte'], rows: moradiaCounts.slice(0, 8).map(([label, total]) => [label, total, exportPercent(total, censoRows.length), 'Censo']) },
        { title: 'Sinais sociais', headers: ['Indicador', 'Qtd.', '%', 'Fonte'], rows: [
          ['Sem comer no mes', foodRiskRows.length, exportPercent(foodRiskRows.length, censoRows.length), 'Censo'],
          ['Uso de substancias', substanceRows.length, exportPercent(substanceRows.length, censoRows.length), 'Censo'],
          ['Risco psi/suicida', riskRows.length, exportPercent(riskRows.length, censoRows.length), 'Censo'],
          ['Acolhimentos', socialRows.length, exportPercent(socialRows.length, atendimentoRows.length), 'Atendimento'],
        ] },
        { title: 'Programas publicos', headers: ['Programa', 'Qtd.', '%', 'Fonte'], rows: countExportListValues(censoRows, row => row.programas).slice(0, 8).map(([label, total]) => [label, total, exportPercent(total, censoRows.length), 'Censo']) },
        { title: 'Qualidade do recorte', headers: ['Ponto', 'Qtd.', '%', 'Grupo'], rows: dashboardQualityRows },
      ] : exportTab === 'vet' ? [
        { title: 'Situacoes dos animais', headers: ['Situacao', 'Qtd.', '%', 'Fonte'], rows: vetSituationCounts.slice(0, 8).map(([label, total]) => [label, total, exportPercent(total, petsRows.length), 'Vet']) },
        { title: 'Diagnosticos veterinarios', headers: ['Diagnostico', 'Qtd.', '%', 'Fonte'], rows: vetDiagnosisCounts.slice(0, 8).map(([label, total]) => [label, total, exportPercent(total, petsRows.length), 'Vet']) },
        { title: 'Tipos no censo', headers: ['Tipo', 'Qtd.', '%', 'Fonte'], rows: countExportListValues(censoRows, row => row.petTipos).slice(0, 8).map(([label, total]) => [label, total, exportPercent(total, censoRows.length), 'Censo']) },
        { title: 'Qualidade do recorte', headers: ['Ponto', 'Qtd.', '%', 'Grupo'], rows: dashboardQualityRows },
      ] : exportTab === 'doacoes' ? [
        { title: 'Itens entregues', headers: ['Categoria', 'Qtd.', '%', 'Fonte'], rows: itemCounts.slice(0, 10).map(([label, total]) => [label, total, exportPercent(total, doacaoRows.length), 'Doacao']) },
        { title: 'Status dos atendimentos', headers: ['Status', 'Qtd.', '%', 'Fonte'], rows: statusCounts.map(([label, total]) => [label, total, exportPercent(total, atendimentoRows.length), 'Atendimento']) },
        { title: 'Qualidade do recorte', headers: ['Ponto', 'Qtd.', '%', 'Grupo'], rows: dashboardQualityRows },
      ] : exportTab === 'justica' ? [
        { title: 'Demandas juridicas', headers: ['Categoria', 'Qtd.', '%', 'Fonte'], rows: justiceCounts.slice(0, 10).map(([label, total]) => [label, total, exportPercent(total, justicaRows.length), 'Justica']) },
        { title: 'Status dos atendimentos', headers: ['Status', 'Qtd.', '%', 'Fonte'], rows: statusCounts.map(([label, total]) => [label, total, exportPercent(total, atendimentoRows.length), 'Atendimento']) },
        { title: 'Qualidade do recorte', headers: ['Ponto', 'Qtd.', '%', 'Grupo'], rows: dashboardQualityRows },
      ] : [
        { title: 'Atendimentos por area', headers: ['Area', 'Qtd.', '%', 'Fonte'], rows: areaRows },
        { title: 'Perfil por genero', headers: ['Genero', 'Qtd.', '%', 'Fonte'], rows: dashboardProfileRows },
        { title: 'Moradia', headers: ['Situacao', 'Qtd.', '%', 'Fonte'], rows: moradiaCounts.slice(0, 8).map(([label, total]) => [label, total, exportPercent(total, censoRows.length), 'Censo']) },
        { title: 'Sinais de atencao', headers: ['Indicador', 'Qtd.', '%', 'Fonte'], rows: [
          ['Farmacia MDM', pharmacyRows.length, exportPercent(pharmacyRows.length, scopedClinicalRows.length), 'Saude'],
          ['Sem comer no mes', foodRiskRows.length, exportPercent(foodRiskRows.length, censoRows.length), 'Censo'],
          ['Uso de substancias', substanceRows.length, exportPercent(substanceRows.length, censoRows.length), 'Censo'],
          ['Risco psi/suicida', riskRows.length, exportPercent(riskRows.length, censoRows.length), 'Censo'],
        ] },
        { title: 'Top diagnosticos clinicos', headers: ['Diagnostico', 'Qtd.', '%', 'Fonte'], rows: diagnosisCounts.slice(0, 8).map(([diag, total]) => [diag, total, exportPercent(total, diagnosisCounts.reduce((sum, [, count]) => sum + count, 0)), 'Atendimento']) },
        { title: 'Qualidade do banco', headers: ['Ponto', 'Qtd.', '%', 'Grupo'], rows: dashboardQualityRows },
      ];
      const dashboardSheet = buildDashboardSheet({
        sheet: `Painel ${theme.label}`,
        title: `Relatorio MDM - ${theme.label} - ${reportIsDateScoped ? 'Por Data' : 'Geral'}`,
        subtitle: `${exportTab === 'geral'
          ? 'Painel completo com indicadores, abas assistenciais e bases brutas exportaveis do app.'
          : 'Painel focalizado na aba selecionada com dados detalhados e bases brutas do recorte.'} ${reportScopeLabel}. Unidade: ${localExportLabel}.`,
        metrics: dashboardMetrics,
        blocks: dashboardBlocks,
        guideRows: sheetGuide,
        theme,
        generatedAt,
        userName: userProfile?.nome,
        scopeLabel: reportScopeLabel,
      });
      const indicatorRows = [
        ...dashboardMetrics.map(metric => ({ grupo: 'Painel', indicador: metric.label, valor: metric.value, leitura: metric.note })),
        ...areaRows.map(([area, total, share]) => ({ grupo: 'Areas', indicador: area, valor: total, leitura: `Participacao ${share}` })),
        ...dashboardQualityRows.map(([label, total, share, group]) => ({ grupo: `Qualidade - ${group}`, indicador: label, valor: total, leitura: share })),
      ];
      const qualityRows = [
        { ponto: 'Assistidos sem CPF', quantidade: withoutCpfRows.length, leitura: 'Revisar se o dado foi coletado ou se nao se aplica.' },
        { ponto: 'Assistidos sem censo no recorte', quantidade: withoutCensoRows.length, leitura: 'Cobertura do censo/anamnese frente aos assistidos exportados.' },
        { ponto: 'Atendimentos aguardando profissional', quantidade: pendingRows.length, leitura: 'Fluxo ainda nao concluido.' },
        { ponto: 'Triagens parciais', quantidade: partialTriagemRows.length, leitura: 'Triagem salva sem todos os sinais vitais/encaminhamentos.' },
        { ponto: 'Atendimentos parciais', quantidade: partialAtendimentoRows.length, leitura: 'Atendimento salvo de forma incompleta para nao travar a acao.' },
        { ponto: 'Atendimentos extras', quantidade: extraRows.length, leitura: 'Atendimentos adicionados fora do roteiro recomendado pela triagem.' },
        { ponto: 'Triagens com atenção crítica', quantidade: criticalTriagemRows.length, leitura: 'Risco imediato identificado para priorização no cuidado.' },
        { ponto: 'Triagens com atenção especial', quantidade: priorityTriagemRows.length, leitura: 'Marcadores inclusivos ou de vulnerabilidade para priorização.' },
        { ponto: 'Registros sem vinculo de assistido', quantidade: missingAssistidoRows.length, leitura: 'Integridade referencial para auditoria.' },
      ];

      const workbookSheets = [
        dashboardSheet,
        buildExportSheet('Indicadores', [
          { label: 'Grupo', value: 'grupo', width: 24 },
          { label: 'Indicador', value: 'indicador', width: 34 },
          { label: 'Valor', value: 'valor', width: 14 },
          { label: 'Leitura', value: 'leitura', width: 42 },
        ], indicatorRows, { theme, stickyColumnsCount: 2, description: 'Indicadores calculados para leitura rapida do relatorio exportado.' }),
        buildExportSheet('Assistidos', [
          { label: 'ID', value: 'id', width: 16 },
          { label: 'Nome', value: 'nome', width: 30 },
          { label: 'Nascimento', value: 'dataNascimento', width: 14 },
          { label: 'Idade', value: row => calculateAgeNum(row.dataNascimento), width: 9 },
          { label: 'Genero', value: 'sexo', width: 14 },
          { label: 'Raca / Cor', value: 'raca', width: 16 },
          { label: 'CPF', value: 'cpf', width: 18 },
          { label: 'RG', value: 'rg', width: 18 },
          { label: 'Naturalidade', value: 'naturalidade', width: 20 },
          { label: 'Procedencia', value: 'procedencia', width: 22 },
          { label: 'Escolaridade', value: 'escolaridade', width: 20 },
          { label: 'Estado civil', value: 'estadoCivil', width: 18 },
          { label: 'Ultimo fluxo', value: 'ultimoAtendimento', width: 28 },
          { label: 'Local da ação', value: 'unidadeAcao', width: 26 },
          { label: 'Cadastrado por', value: 'criadoPor', width: 24 },
          { label: 'Data cadastro', value: 'dataCriacao', width: 14 },
        ], assistidoRows, { theme, stickyColumnsCount: 2, description: 'Identificacao, documentos, perfil e ultimo fluxo conhecido dos assistidos exportados.' }),
        buildExportSheet('Fila e Alertas', [
          { label: 'Assistido ID', value: 'assistidoId', width: 16 },
          { label: 'Nome', value: 'nome', width: 30 },
          { label: 'Chegada', value: 'chegada', width: 16 },
          { label: 'Hora chegada', value: 'horaChegada', width: 14 },
          { label: 'Prioridade na triagem', value: 'prioridade', width: 22 },
          { label: 'Marcadores de atenção', value: 'marcadores', width: 44 },
          { label: 'Comentário de cuidado', value: 'comentario', width: 44 },
          { label: 'Status triagem', value: 'statusTriagem', width: 20 },
          { label: 'Áreas indicadas', value: 'areasIndicadas', width: 38 },
          { label: 'Qtd. atendimentos', value: 'atendimentos', width: 18 },
          { label: 'Pendências', value: 'pendencias', width: 34 },
          { label: 'Último fluxo', value: 'ultimoFluxo', width: 34 },
        ], alertFlowRows, { theme, stickyColumnsCount: 2, description: 'Fila assistencial e alertas definidos pela triagem para orientar prioridade, inclusão e continuidade do cuidado.' }),
        buildExportSheet('Censo Social', [
          { label: 'Assistido ID', value: 'assistidoId', width: 16 },
          { label: 'Nome', value: 'assistidoNome', width: 30 },
          { label: 'CPF', value: 'assistidoCpf', width: 18 },
          { label: 'Local da ação', value: 'unidadeAcao', width: 26 },
          { label: 'Moradia', value: 'moradia', width: 20 },
          { label: 'Motivo rua', value: row => row.motivoRua === 'Outro' ? row.motivoRuaOutro : row.motivoRua, width: 28 },
          { label: 'Programas publicos', value: 'programas', width: 30 },
          { label: 'Outro programa', value: 'outroPrograma', width: 22 },
          { label: 'Convive com', value: 'convive', width: 13 },
          { label: 'Religiao', value: 'religiao', width: 18 },
          { label: 'Empregado', value: 'empregado', width: 13 },
          { label: 'Profissao', value: 'profissao', width: 22 },
          { label: 'Responsavel pediatria', value: 'responsavelPed', width: 24 },
          { label: 'Desenv. psicomotor', value: 'psicomotor', width: 20 },
          { label: 'Vacina pediatrica', value: 'vacinaPed', width: 18 },
          { label: 'Atualizado em', value: 'dataAtu', width: 14 },
        ], censoRows, { theme, stickyColumnsCount: 2, description: 'Recorte social do censo/anamnese para moradia, rede publica, trabalho e familia.' }),
        buildExportSheet('Saude e Habitos', [
          { label: 'Assistido ID', value: 'assistidoId', width: 16 },
          { label: 'Nome', value: 'assistidoNome', width: 30 },
          { label: 'Medicacoes em uso', value: 'medsUso', width: 28 },
          { label: 'Comorbidades', value: 'comorbidades', width: 32 },
          { label: 'Tipos de alergia', value: 'alergiaTipos', width: 22 },
          { label: 'Alergias', value: 'alergias', width: 28 },
          { label: 'Cirurgias / internacoes', value: 'cirurgias', width: 30 },
          { label: 'Usou saude no mes', value: 'freqSaudeResposta', width: 18 },
          { label: 'Frequencia / servico', value: 'freqSaude', width: 28 },
          { label: 'Saude mental', value: 'psiquiatria', width: 32 },
          { label: 'Acesso terapia', value: 'acessoTerapia', width: 18 },
          { label: 'Tratamento psi', value: 'tratamentoPsi', width: 28 },
          { label: 'Substancias', value: 'drogas', width: 28 },
          { label: 'Detalhes uso', value: 'detalhesDrogas', width: 32 },
          { label: 'Apetite', value: 'apetite', width: 16 },
          { label: 'Refeicoes/dia', value: 'refeicoes', width: 16 },
          { label: 'Frutas / verduras', value: 'frutas', width: 18 },
          { label: 'Agua/dia', value: 'agua', width: 16 },
          { label: 'Sem comer no mes', value: 'semComer', width: 18 },
        ], censoRows, { theme, stickyColumnsCount: 2, description: 'Historico de saude, habitos, alergias, saude mental e alimentacao coletados no censo.' }),
        buildExportSheet('Sexual Reprodutiva', [
          { label: 'Assistido ID', value: 'assistidoId', width: 16 },
          { label: 'Nome', value: 'assistidoNome', width: 30 },
          { label: 'Vida sexual ativa', value: 'vidaSexual', width: 18 },
          { label: 'Preservativo', value: 'preservativo', width: 16 },
          { label: 'Menarca', value: 'menarca', width: 12 },
          { label: 'Coitarca', value: 'coitarca', width: 12 },
          { label: 'DUM', value: 'dum', width: 14 },
          { label: 'Partos normais', value: 'partos', width: 14 },
          { label: 'Cesareas', value: 'cesareas', width: 12 },
          { label: 'Abortos', value: 'abortos', width: 12 },
          { label: 'Metodo anticoncepcional', value: 'mac', width: 26 },
          { label: 'Planejamento familiar', value: 'planejamentoFamiliar', width: 22 },
          { label: 'Sintomas ginecologicos', value: 'sintomas_ginec', width: 32 },
          { label: 'Ultimo Papanicolau', value: 'papanicolau', width: 22 },
        ], censoRows, { theme, stickyColumnsCount: 2, description: 'Campos sexuais e reprodutivos mantidos em aba separada para leitura controlada.' }),
        buildExportSheet('Triagens', [
          { label: 'Triagem ID', value: 'id', width: 16 },
          { label: 'Data', value: 'data', width: 14 },
          { label: 'Assistido ID', value: 'assistidoId', width: 16 },
          { label: 'Nome', value: 'assistidoNome', width: 30 },
          { label: 'PA', value: 'pa', width: 12 },
          { label: 'FC', value: 'fc', width: 10 },
          { label: 'FR', value: 'fr', width: 10 },
          { label: 'SaO2', value: 'spo2', width: 10 },
          { label: 'Peso', value: 'peso', width: 10 },
          { label: 'Altura (cm)', value: 'altura', width: 12 },
          { label: 'Preenchimento', value: row => row.preenchimentoStatus || triageCompletion(row).status, width: 22 },
          { label: '% preenchido', value: row => row.preenchimentoPct ? triageCompletion(row).percent : 0, width: 14 },
          { label: 'Encaminhamentos', value: 'encaminhamento', width: 36 },
          { label: 'Prioridade cuidado', value: 'prioridadeCuidado', width: 22 },
          { label: 'Atenções inclusivas', value: 'sinaisAtencao', width: 38 },
          { label: 'Comentário de atenção', value: 'observacaoAtencao', width: 38 },
          { label: 'Responsável criança', value: 'responsavelPresente', width: 18 },
          { label: 'Necessidades infantis', value: 'necessidadesInfantis', width: 34 },
          { label: 'Local da ação', value: 'unidadeAcao', width: 24 },
          { label: 'Responsavel', value: 'responsavel', width: 24 },
        ], triagemRows, { theme, stickyColumnsCount: 4, description: 'Triagens com sinais vitais, medidas e roteiro de encaminhamento.' }),
        buildExportSheet('Atendimentos', [
          { label: 'Atendimento ID', value: 'id', width: 16 },
          { label: 'Data', value: 'data', width: 14 },
          { label: 'Assistido ID', value: 'assistidoId', width: 16 },
          { label: 'Nome', value: 'assistidoNome', width: 30 },
          { label: 'Area', value: 'area', width: 24 },
          { label: 'Local da ação', value: 'unidadeAcao', width: 26 },
          { label: 'Status', value: 'status', width: 22 },
          { label: 'Atendimento extra', value: 'extraAtendimento', width: 16 },
          { label: 'Preenchimento', value: 'preenchimentoStatus', width: 18 },
          { label: '% preenchido', value: 'preenchimentoPct', width: 14 },
          { label: 'Queixa / demanda', value: row => row.qd || row.demandaJuridica || row.demandaSocial || row.itensSolicitados, width: 34 },
          { label: 'Evolucao / relato', value: row => row.subjetivo || row.evolucaoEnfermagem || row.detalhesBeleza, width: 38 },
          { label: 'Diagnostico / resultado', value: row => row.hd || row.diagnostico || row.testes_rapidos, width: 34 },
          { label: 'Conduta / acao', value: row => row.plano || row.procedimentoEnfermagem || row.acaoJuridica || row.encaminhamentoSocial, width: 40 },
          { label: 'Encaminhamento', value: 'encExterno', width: 30 },
          { label: 'Farmacia MDM', value: 'farmacia', width: 28 },
          { label: 'Observacoes gerais', value: 'obsGeral', width: 34 },
          { label: 'Academico', value: 'nomeAcademico', width: 24 },
          { label: 'Profissional', value: row => row.nomeProfissional || row.medicoResponsavel, width: 24 },
        ], atendimentoRows, { theme, stickyColumnsCount: 4, description: 'Visao transversal dos atendimentos do recorte exportado.' }),
        buildExportSheet('Medicina', [
          { label: 'Atendimento ID', value: 'id', width: 16 },
          { label: 'Data', value: 'data', width: 14 },
          { label: 'Assistido', value: 'assistidoNome', width: 30 },
          { label: 'QD', value: 'qd', width: 32 },
          { label: 'Topicos da queixa', value: 'topicos_queixa', width: 34 },
          { label: 'HPMA', value: 'hpma', width: 38 },
          { label: 'ISDA', value: 'isda', width: 34 },
          { label: 'Objetivo', value: 'objetivo', width: 36 },
          { label: 'Diagnosticos', value: 'hd', width: 34 },
          { label: 'Outros diagnosticos', value: 'outros_hd', width: 28 },
          { label: 'Precisa farmacia', value: 'precisaFarmacia', width: 16 },
          { label: 'Receituario farmacia', value: 'farmacia', width: 32 },
          { label: 'Encaminhamento externo', value: 'encExterno', width: 28 },
          { label: 'Conduta', value: 'plano', width: 40 },
          { label: 'Medico responsavel', value: 'medicoResponsavel', width: 26 },
        ], medicineRows, { theme, stickyColumnsCount: 3, description: 'Queixa, avaliacao, diagnosticos, farmacia, encaminhamento e conduta da medicina humana.' }),
        buildExportSheet('Nutricao', [
          { label: 'Atendimento ID', value: 'id', width: 16 },
          { label: 'Data', value: 'data', width: 14 },
          { label: 'Assistido', value: 'assistidoNome', width: 30 },
          { label: 'Avaliacao', value: 'subjetivo', width: 38 },
          { label: 'Estado nutricional', value: 'estado_nutricional', width: 24 },
          { label: 'Motivo nao avaliado', value: 'motivo_nao_avaliado', width: 28 },
          { label: 'Sinais fisicos', value: 'sinais_fisicos', width: 34 },
          { label: 'Outro sinal', value: 'outro_sinal_fisico', width: 24 },
          { label: 'Abordagem', value: 'abordagem_nutri', width: 30 },
          { label: 'Temas', value: 'temas_nutri', width: 38 },
          { label: 'Outro tema', value: 'outro_tema_nutri', width: 24 },
          { label: 'Encaminhamento', value: 'encExterno', width: 34 },
          { label: 'Outro encaminhamento', value: 'encExterno_outro', width: 28 },
          { label: 'Conduta', value: 'plano', width: 40 },
        ], nutritionRows, { theme, stickyColumnsCount: 3, description: 'Avaliacao nutricional, temas abordados, encaminhamentos e conduta.' }),
        buildExportSheet('Testes e Vacinas', [
          { label: 'Atendimento ID', value: 'id', width: 16 },
          { label: 'Data', value: 'data', width: 14 },
          { label: 'Assistido', value: 'assistidoNome', width: 30 },
          { label: 'Area', value: 'area', width: 18 },
          { label: 'Testes / vacinas', value: 'testes_rapidos', width: 36 },
          { label: 'Outros', value: 'outros_testes_rapidos', width: 28 },
          { label: 'Resultado / observacao', value: 'subjetivo', width: 40 },
          { label: 'Conduta / laudo', value: 'plano', width: 34 },
          { label: 'Status', value: 'status', width: 22 },
          { label: 'Profissional', value: 'nomeProfissional', width: 24 },
        ], testesVacinasRows, { theme, stickyColumnsCount: 3, description: 'Procedimentos de biomedicina e vacinacao com resultados e observacoes.' }),
        buildExportSheet('Doacoes', [
          { label: 'Atendimento ID', value: 'id', width: 16 },
          { label: 'Data', value: 'data', width: 14 },
          { label: 'Assistido', value: 'assistidoNome', width: 30 },
          { label: 'Itens solicitados', value: 'itensSolicitados', width: 34 },
          { label: 'Categorias entregues', value: 'itens_entregues_cat', width: 34 },
          { label: 'Detalhes entregues', value: 'itensEntregues', width: 38 },
          { label: 'Observacoes', value: 'obsGeral', width: 34 },
          { label: 'Responsavel', value: row => row.nomeProfissional || row.nomeAcademico, width: 24 },
        ], doacaoRows, { theme, stickyColumnsCount: 3, description: 'Solicitacoes e entregas registradas pela area de doacoes.' }),
        buildExportSheet('Justica de Rua', [
          { label: 'Atendimento ID', value: 'id', width: 16 },
          { label: 'Data', value: 'data', width: 14 },
          { label: 'Assistido', value: 'assistidoNome', width: 30 },
          { label: 'Categorias', value: 'categoria_juridica', width: 34 },
          { label: 'Demanda', value: 'demandaJuridica', width: 40 },
          { label: 'Acoes / orientacoes', value: 'acaoJuridica', width: 40 },
          { label: 'Observacoes', value: 'obsGeral', width: 34 },
          { label: 'Status', value: 'status', width: 22 },
          { label: 'Profissional', value: 'nomeProfissional', width: 24 },
        ], justicaRows, { theme, stickyColumnsCount: 3, description: 'Demandas juridicas, categorias e orientacoes registradas.' }),
        buildExportSheet('Pets e Vet', [
          { label: 'Origem', value: 'origem', width: 24 },
          { label: 'Data', value: 'data', width: 14 },
          { label: 'Assistido', value: 'assistidoNome', width: 30 },
          { label: 'Tipos no censo', value: 'petTipos', width: 24 },
          { label: 'Detalhes no censo', value: 'petDetalhes', width: 32 },
          { label: 'Nome pet', value: 'petNome', width: 20 },
          { label: 'Especie', value: 'petEspecie', width: 18 },
          { label: 'Situacao', value: 'petSituacao', width: 22 },
          { label: 'Avaliacao', value: 'petAvaliacao', width: 38 },
          { label: 'Diagnostico', value: 'petDiagnostico', width: 32 },
          { label: 'Conduta', value: 'petConduta', width: 38 },
        ], petsRows, { theme, stickyColumnsCount: 3, description: 'Pets informados no censo e animais avaliados pela veterinaria.' }),
        buildExportSheet('Acolhimento', [
          { label: 'Atendimento ID', value: 'id', width: 16 },
          { label: 'Data', value: 'data', width: 14 },
          { label: 'Assistido', value: 'assistidoNome', width: 30 },
          { label: 'Demanda social', value: 'demandaSocial', width: 40 },
          { label: 'Encaminhamento social', value: 'encaminhamentoSocial', width: 40 },
          { label: 'Observacoes', value: 'obsGeral', width: 34 },
          { label: 'Responsavel', value: row => row.nomeProfissional || row.nomeAcademico, width: 24 },
        ], socialRows, { theme, stickyColumnsCount: 3, description: 'Demandas e encaminhamentos do acolhimento social.' }),
        buildExportSheet('Qualidade', [
          { label: 'Ponto de controle', value: 'ponto', width: 34 },
          { label: 'Quantidade', value: 'quantidade', width: 14 },
          { label: 'Leitura recomendada', value: 'leitura', width: 48 },
        ], qualityRows, { theme, stickyColumnsCount: 1, description: 'Sinais de cobertura e integridade para revisar antes de usar o arquivo em relatorios.' }),
        buildRawExportSheet('Base Assistidos', assistidoRows, { theme, stickyColumnsCount: 2, description: 'Base completa exportavel de assistidos. Fotos sao representadas apenas por indicador de existencia.' }),
        buildRawExportSheet('Base Censos', censoRows, { theme, stickyColumnsCount: 2, description: 'Base completa dos censos/anamneses do recorte exportado.' }),
        buildRawExportSheet('Base Triagens', triagemRows, { theme, stickyColumnsCount: 3, description: 'Base completa de triagens do recorte exportado.' }),
        buildRawExportSheet('Base Atendimentos', atendimentoRows, { theme, stickyColumnsCount: 3, description: 'Base completa de atendimentos com campos especificos preservados.' }),
        buildExportSheet('Dicionario', [
          { label: 'Aba / conjunto', value: 'aba', width: 28 },
          { label: 'Finalidade', value: 'finalidade', width: 48 },
          { label: 'Observacao', value: 'observacao', width: 48 },
        ], [
          ...sheetGuide.map(([aba, finalidade]) => ({ aba, finalidade, observacao: 'Leia o painel e os indicadores antes da base bruta.' })),
          { aba: 'Base Assistidos', finalidade: 'Campos completos do cadastro exportavel.', observacao: 'Foto nao e copiada para evitar arquivo pesado e exposicao indevida.' },
          { aba: 'Base Censos', finalidade: 'Campos completos do censo/anamnese.', observacao: 'Inclui campos clinicos e sociais quando presentes no recorte.' },
          { aba: 'Base Triagens', finalidade: 'Campos completos de triagem.', observacao: 'Unidades devem ser lidas pelos cabecalhos das abas detalhadas.' },
          { aba: 'Base Atendimentos', finalidade: 'Campos completos dos atendimentos.', observacao: 'Campos especificos de cada area podem ficar vazios nas demais linhas.' },
          { aba: 'Qualidade', finalidade: 'Pontos de controle do arquivo.', observacao: 'Nao altera dados; sinaliza revisao operacional.' },
        ], { theme, stickyColumnsCount: 1, description: 'Guia para navegar e interpretar a exportacao.' }),
      ];

      const focusedSheetNames = {
        clinica: new Set([dashboardSheet.sheet, 'Indicadores', 'Assistidos', 'Fila e Alertas', 'Saude e Habitos', 'Sexual Reprodutiva', 'Triagens', 'Atendimentos', 'Medicina', 'Nutricao', 'Testes e Vacinas', 'Qualidade', 'Base Assistidos', 'Base Censos', 'Base Triagens', 'Base Atendimentos', 'Dicionario']),
        social: new Set([dashboardSheet.sheet, 'Indicadores', 'Assistidos', 'Censo Social', 'Saude e Habitos', 'Acolhimento', 'Qualidade', 'Base Assistidos', 'Base Censos', 'Base Atendimentos', 'Dicionario']),
        vet: new Set([dashboardSheet.sheet, 'Indicadores', 'Assistidos', 'Pets e Vet', 'Atendimentos', 'Qualidade', 'Base Assistidos', 'Base Censos', 'Base Atendimentos', 'Dicionario']),
        doacoes: new Set([dashboardSheet.sheet, 'Indicadores', 'Assistidos', 'Doacoes', 'Qualidade', 'Base Assistidos', 'Base Atendimentos', 'Dicionario']),
        justica: new Set([dashboardSheet.sheet, 'Indicadores', 'Assistidos', 'Justica de Rua', 'Qualidade', 'Base Assistidos', 'Base Atendimentos', 'Dicionario']),
      };
      const exportedSheets = focusedSheetNames[exportTab]
        ? workbookSheets.filter(sheet => focusedSheetNames[exportTab].has(sheet.sheet))
        : workbookSheets;
      const { default: writeExcelFile } = await import('write-excel-file/browser');
      await writeExcelFile(exportedSheets, { fontFamily: 'Arial', fontSize: 10 })
        .toFile(`Relatorio_MDM_${theme.file}_${reportIsDateScoped ? `Data_${exportDate}` : 'Geral'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showMsg(`Relatorio ${theme.label} (${reportIsDateScoped ? reportDate : 'geral'}) exportado em XLSX.`);
    } catch (err) {
      console.error('Falha ao exportar planilha:', err);
      showMsg('Nao foi possivel gerar a planilha. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const dashboardAssistidos = useMemo(() => assistidos.filter(row => !isTestAssistido(row)), [assistidos]);
  const dashboardAssistidoIds = useMemo(() => new Set(dashboardAssistidos.map(row => String(row.id))), [dashboardAssistidos]);
  const dashboardTriagens = useMemo(() => triagens.filter(row => dashboardAssistidoIds.has(String(row.assistidoId))), [triagens, dashboardAssistidoIds]);
  const dashboardAnamneses = useMemo(() => anamneses.filter(row => dashboardAssistidoIds.has(String(row.assistidoId))), [anamneses, dashboardAssistidoIds]);
  const dashboardAtendimentos = useMemo(() => atendimentos.filter(row => dashboardAssistidoIds.has(String(row.assistidoId))), [atendimentos, dashboardAssistidoIds]);

  // Lógica de Estatísticas Reais
  const getEstatisticasReais = () => {
    let counts = { med: {}, odonto: {}, psico: {}, fisio: {}, nutri: {} };
    dashboardAtendimentos.forEach(a => {
      const diag = a.hd || a.diagnostico;
      if (diag && diag.trim() !== '') {
        const mainDiag = diag.split(/[,/]/)[0].trim();
        if (a.area === 'Medicina Humana') counts.med[mainDiag] = (counts.med[mainDiag] || 0) + 1;
        if (a.area === 'Odontologia') counts.odonto[mainDiag] = (counts.odonto[mainDiag] || 0) + 1;
        if (a.area === 'Psicologia') counts.psico[mainDiag] = (counts.psico[mainDiag] || 0) + 1;
        if (a.area === 'Fisioterapia') counts.fisio[mainDiag] = (counts.fisio[mainDiag] || 0) + 1;
        if (a.area === 'Nutrição') counts.nutri[mainDiag] = (counts.nutri[mainDiag] || 0) + 1;
      }
    });

    const getTop = (obj) => Object.entries(obj).sort((a,b) => b[1]-a[1]).slice(0, 4);
    const getTotal = (obj) => Object.values(obj).reduce((acc, val) => acc + val, 0) || 1;

    return { 
      med: getTop(counts.med), medTotal: getTotal(counts.med),
      odonto: getTop(counts.odonto), odontoTotal: getTotal(counts.odonto),
      psico: getTop(counts.psico), psicoTotal: getTotal(counts.psico),
      fisio: getTop(counts.fisio), fisioTotal: getTotal(counts.fisio),
      nutri: getTop(counts.nutri), nutriTotal: getTotal(counts.nutri),
    };
  };

  const statsGeral = useMemo(() => {
    let masc = 0, fem = 0, outro = 0, semInfo = 0;
    dashboardAssistidos.forEach(a => {
      if(a.sexo === 'Masculino') masc++;
      else if(a.sexo === 'Feminino') fem++;
      else if (requiredText(a.sexo) && normalizeStr(a.sexo) !== 'nao informado') outro++;
      else semInfo++;
    });
    const comDocumento = dashboardAssistidos.filter(a => requiredText(a.cpf) || requiredText(a.rg)).length;
    return {
      total: dashboardAssistidos.length,
      masc,
      fem,
      outro,
      semInfo,
      comDocumento,
      semDocumento: dashboardAssistidos.length - comDocumento,
      triagensHoje: dashboardTriagens.filter(t => t.data === new Date().toLocaleDateString('pt-BR')).length,
      triagensTotal: dashboardTriagens.length,
    };
  }, [dashboardAssistidos, dashboardTriagens]);

  const statsAtuacoes = useMemo(() => {
    const areas = {};
    dashboardAtendimentos.forEach(row => {
      if (requiredText(row.area)) areas[row.area] = (areas[row.area] || 0) + 1;
    });
    return {
      total: dashboardAtendimentos.length,
      areas: Object.entries(areas).sort((a, b) => b[1] - a[1]),
    };
  }, [dashboardAtendimentos]);

  const statsClinica = useMemo(() => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const areasSaude = [
      'Medicina Humana', 'Odontologia', 'Psicologia', 'Nutrição', 'Fisioterapia',
      'Enfermagem / Curativos', 'Vacinação', 'Biomedicina', 'Farmácia', 'Podologia',
      'Exames Clínicos',
    ];
    const registros = dashboardAtendimentos.filter(row => areasSaude.some(area => normalizeStr(row.area) === normalizeStr(area)));
    const areas = {};
    registros.forEach(row => { areas[row.area] = (areas[row.area] || 0) + 1; });
    return {
      total: registros.length,
      hoje: registros.filter(row => row.data === hoje).length,
      concluidos: registros.filter(row => normalizeStr(row.status).includes('concluido')).length,
      pendentes: registros.filter(row => normalizeStr(row.status).includes('aguardando')).length,
      areas: Object.entries(areas).sort((a, b) => b[1] - a[1]),
    };
  }, [dashboardAtendimentos]);

  const statsSocial = useMemo(() => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const moradia = {};
    const areas = {};
    const registros = dashboardAtendimentos.filter(row => ['Acolhimento Social', 'Apoio à Mulher', 'Emissão de Documentos']
      .some(area => normalizeStr(row.area) === normalizeStr(area)));
    dashboardAnamneses.forEach(row => {
      if (requiredText(row.moradia)) moradia[row.moradia] = (moradia[row.moradia] || 0) + 1;
    });
    registros.forEach(row => { areas[row.area] = (areas[row.area] || 0) + 1; });
    const hasSubstanceUse = (row) => {
      const value = normalizeStr(row.drogas);
      return value && !['nao informado', 'nao faz uso', 'nega', 'nao se aplica'].some(marker => value.includes(marker));
    };
    const hasFoodRisk = (row) => {
      const value = normalizeStr(row.semComer);
      return value && !['nenhuma vez', 'nao', 'nao informado', 'nao se aplica'].some(marker => value === marker);
    };
    return {
      total: dashboardAnamneses.length,
      hoje: registros.filter(row => row.data === hoje).length,
      atendimentos: registros.length,
      moradia: Object.entries(moradia).sort((a, b) => b[1] - a[1]),
      moradiaRua: dashboardAnamneses.filter(row => {
        const value = normalizeStr(row.moradia);
        return value.includes('rua') || value.includes('descoberta');
      }).length,
      alimentar: dashboardAnamneses.filter(hasFoodRisk).length,
      drogas: dashboardAnamneses.filter(hasSubstanceUse).length,
      saudeMental: dashboardAnamneses.filter(row => normalizeStr(row.psiquiatria).includes('ideacao suicida')).length,
      areas: Object.entries(areas).sort((a, b) => b[1] - a[1]),
    };
  }, [dashboardAnamneses, dashboardAtendimentos]);

  const statsVet = useMemo(() => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const sit = {}, diags = {};
    let totalPets = 0;
    const registros = dashboardAtendimentos.filter(a => normalizeStr(a.area) === normalizeStr('Veterinária') || normalizeStr(a.area) === normalizeStr('Medicina Veterinaria'));
    registros.forEach(a => {
      a.vetPets?.forEach(p => {
        if(p.nome) {
          totalPets++;
          if(p.situacao) sit[p.situacao] = (sit[p.situacao] || 0) + 1;
          if(p.diagVet) diags[p.diagVet] = (diags[p.diagVet] || 0) + 1;
        }
      });
    });
    return {
      atendimentos: registros.length,
      hoje: registros.filter(row => row.data === hoje).length,
      total: totalPets,
      situacoes: Object.entries(sit).sort((a,b)=>b[1]-a[1]),
      doencas: Object.entries(diags).sort((a,b)=>b[1]-a[1]).slice(0,4),
    };
  }, [dashboardAtendimentos]);

  const statsDoacoes = useMemo(() => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const itens = {};
    const registros = dashboardAtendimentos.filter(row => normalizeStr(row.area) === normalizeStr('Doações') || normalizeStr(row.area) === normalizeStr('Doação'));
    registros.forEach(row => {
      compactList(row.itens_entregues_cat).forEach(item => { itens[item] = (itens[item] || 0) + 1; });
    });
    return {
      total: registros.length,
      hoje: registros.filter(row => row.data === hoje).length,
      assistidos: new Set(registros.map(row => String(row.assistidoId))).size,
      solicitacoes: registros.filter(row => requiredText(row.itensSolicitados)).length,
      itensTotal: Object.values(itens).reduce((sum, value) => sum + value, 0),
      itens: Object.entries(itens).sort((a, b) => b[1] - a[1]).slice(0, 8),
    };
  }, [dashboardAtendimentos]);

  const statsJustica = useMemo(() => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const demandas = {};
    const registros = dashboardAtendimentos.filter(row => normalizeStr(row.area) === normalizeStr('Justiça de Rua'));
    registros.forEach(row => {
      compactList(row.categoria_juridica).forEach(item => { demandas[item] = (demandas[item] || 0) + 1; });
    });
    return {
      total: registros.length,
      hoje: registros.filter(row => row.data === hoje).length,
      assistidos: new Set(registros.map(row => String(row.assistidoId))).size,
      acoes: registros.filter(row => requiredText(row.acaoJuridica)).length,
      categorias: Object.values(demandas).reduce((sum, value) => sum + value, 0),
      demandas: Object.entries(demandas).sort((a, b) => b[1] - a[1]).slice(0, 8),
    };
  }, [dashboardAtendimentos]);

  const recentAssistidos = useMemo(() => {
    const lastFlowByAssistido = new Map();
    [...triagens, ...atendimentos].forEach((record) => {
      const assistidoId = String(record.assistidoId || '');
      if (!assistidoId) return;
      const latest = Math.max(lastFlowByAssistido.get(assistidoId) || 0, recordTime(record));
      lastFlowByAssistido.set(assistidoId, latest);
    });

    return [...assistidos]
      .sort((a, b) => {
        const lastFlowA = Math.max(Number(a.ultimoAtendimentoEm || 0), lastFlowByAssistido.get(String(a.id)) || 0);
        const lastFlowB = Math.max(Number(b.ultimoAtendimentoEm || 0), lastFlowByAssistido.get(String(b.id)) || 0);
        if (lastFlowA !== lastFlowB) return lastFlowB - lastFlowA;
        return recordTime(b) - recordTime(a);
      })
      .slice(0, 12);
  }, [assistidos, atendimentos, triagens]);

  const getAssistidoFlowSummary = (assistido) => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const id = String(assistido.id);
    const tri = triagens.find(t => String(t.assistidoId) === id && t.data === hoje);
    const triagensDoAssistido = triagens
      .filter(t => String(t.assistidoId) === id)
      .sort((a, b) => recordTime(b) - recordTime(a));
    const ultimoAtendimento = atendimentos
      .filter(a => String(a.assistidoId) === id)
      .sort((a, b) => recordTime(b) - recordTime(a))[0];
    const ultimaTriagem = triagensDoAssistido[0];
    const ultimoRegistroLabel = ultimoAtendimento
      ? `${ultimoAtendimento.area || 'Atendimento'} em ${ultimoAtendimento.data || 'data não informada'}`
      : ultimaTriagem
        ? `Triagem em ${ultimaTriagem.data || 'data não informada'}`
        : assistido.ultimoAtendimento || '';
    const criadoHoje = assistido.dataCriacao === hoje || assistido.chegadaAcaoData === hoje;
    const ana = anamneses.find(a => String(a.assistidoId) === id);
    const atendimentosHoje = atendimentos.filter(a => String(a.assistidoId) === id && a.data === hoje);
    const triStatus = triageCompletion(tri);
    const anaStatus = censoCompletion(ana);
    const areasRecomendadas = compactList(tri?.encaminhamento);
    const areasConcluidas = atendimentosHoje
      .filter(a => normalizeStr(a.status).includes('concluido'))
      .map(a => a.area);
    const areasPendentes = areasRecomendadas.filter(area => !areasConcluidas.includes(area));
    const atendimentosParciais = atendimentosHoje.filter(a => Number(a.preenchimentoPct || 0) < 80);

    if (!tri && !atendimentosHoje.length) {
      if (criadoHoje) {
        return { tone: 'blue', label: 'Iniciar fluxo do plantão', detail: 'Sem atendimento registrado hoje. Abra a ficha para começar.' };
      }
      if (ultimoRegistroLabel) {
        return { tone: 'gray', label: 'Pronto para novo atendimento', detail: `Último registro: ${ultimoRegistroLabel}. Abra a ficha se a pessoa retornou hoje.` };
      }
      return { tone: 'gray', label: 'Sem fluxo no plantão atual', detail: 'Abra a ficha para iniciar cadastro, triagem ou atendimento.' };
    }
    if (triStatus.percent < 80) {
      return { tone: 'amber', label: triStatus.status, detail: `${triStatus.percent}% preenchido. Completar sinais e encaminhamentos.` };
    }
    if (!ana) {
      return { tone: 'purple', label: 'Censo social pendente', detail: 'Abra o histórico social antes de finalizar o fluxo.' };
    }
    if (anaStatus.percent < 80) {
      return { tone: 'purple', label: `Censo parcial - ${anaStatus.percent}%`, detail: 'Revise moradia, saúde, alimentação, rede e pets.' };
    }
    if (atendimentosParciais.length) {
      return { tone: 'amber', label: `${atendimentosParciais.length} atendimento(s) parcial(is)`, detail: atendimentosParciais.map(a => a.area).slice(0, 3).join(', ') };
    }
    if (areasPendentes.length) {
      return { tone: 'blue', label: `${areasPendentes.length} atendimento(s) pendente(s)`, detail: areasPendentes.slice(0, 3).join(', ') };
    }
    if (atendimentosHoje.length) {
      return { tone: 'emerald', label: `Fluxo ativo: ${atendimentosHoje.length} registro(s) hoje`, detail: assistido.ultimoAtendimento || 'Atendimento em andamento.' };
    }
    return { tone: 'gray', label: assistido.ultimoAtendimento || 'Novo cadastro', detail: 'Sem atendimento registrado hoje.' };
  };

  const getAssistidoAttention = (assistido) => {
    const id = String(assistido.id);
    const relatedTriagens = triagens
      .filter(t => String(t.assistidoId) === id)
      .sort((a, b) => recordTime(b) - recordTime(a));
    const latestTri = relatedTriagens[0];
    const priority = triagePriority(latestTri);
    const observationText = requiredText(latestTri?.observacaoAtencao || latestTri?.observacaoCrianca);
    const observacaoNormalizada = normalizeStr(observationText);
    const observacao = ['sem observacao adicional', 'nao se aplica'].includes(observacaoNormalizada) || !hasSevereMarker(observationText) ? '' : observationText;
    const crianca = calculateAgeNum(assistido.dataNascimento) <= 12;
    if (!latestTri && !crianca) return null;
    if (priority.level === 'critical') {
      return { level: 'critical', label: 'Atenção crítica', detail: observacao || priority.reasons.slice(0, 2).join(', ') || 'Rever triagem.' };
    }
    if (priority.level === 'priority' || observacao) {
      return { level: 'attention', label: 'Atenção especial', detail: observacao || priority.reasons.slice(0, 2).join(', ') };
    }
    if (crianca) {
      return { level: 'child', label: 'Atendimento infantil', detail: 'Confirmar responsável, acolhimento e conforto da criança.' };
    }
    return null;
  };

  const todayQueueDate = new Date().toLocaleDateString('pt-BR');
  const atendimentoQueue = assistidos
    .filter(assistido => {
      const id = String(assistido.id);
      const activeToday = assistido.dataCriacao === todayQueueDate
        || triagens.some(triagem => String(triagem.assistidoId) === id && triagem.data === todayQueueDate)
        || atendimentos.some(atendimento => String(atendimento.assistidoId) === id && atendimento.data === todayQueueDate);
      const currentLocation = !assistido.localAcao || assistido.localAcao === selectedActionLocation;
      const query = normalizeStr(searchQuery);
      const matchesQuery = !query
        || assistidoSearchText(assistido).includes(query)
        || normalizeStr(assistido.cpf).includes(query)
        || normalizeStr(assistido.rg).includes(query);
      return activeToday && currentLocation && matchesQuery;
    })
    .map(assistido => {
      const id = String(assistido.id);
      const triagem = triagens.find(record => String(record.assistidoId) === id && record.data === todayQueueDate);
      const flow = getAssistidoFlowSummary(assistido);
      const attention = getAssistidoAttention(assistido);
      const arrivalAt = Number(assistido.chegadaAcaoEm || assistido.dataCriacaoEm || 0);
      const triageAt = Number(triagem?.registradoEm || triagem?.atualizadoEm || 0);
      const priority = triagePriority(triagem);
      const rank = priority.level === 'critical'
        ? 0
        : priority.level === 'priority'
          ? 1
          : !triagem
            ? 2
            : flow.tone === 'amber' || flow.tone === 'orange'
              ? 3
              : flow.tone === 'blue' || flow.tone === 'purple'
                ? 4
                : 5;
      return { assistido, triagem, flow, attention, arrivalAt, triageAt, priority, rank };
    })
    .sort((left, right) => left.rank - right.rank || left.arrivalAt - right.arrivalAt);
  const queueWaiting = atendimentoQueue.filter(item => item.flow.tone !== 'emerald');
  const queueCritical = queueWaiting.filter(item => item.rank === 0);
  const queueFinished = atendimentoQueue.filter(item => item.flow.tone === 'emerald');
  const visibleQueue = queueMode === 'todos' ? atendimentoQueue : queueWaiting;

  // --- RENDERS DE TELAS DE ENTRADA ---
  if (showSplash || loading) return (
    <div className="min-h-[100dvh] w-full bg-white flex flex-col items-center justify-center p-10 animate-fade-in">
      <img src="/logo.png" alt="MDM" className="w-32 mb-8 animate-pulse" onError={(e) => { e.target.style.display = 'none'; }} />
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user || !userProfile) return (
    <ActionLocationContext.Provider value={actionLocationContextValue}>
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 overflow-y-auto" style={{ background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyDark} 65%, #17203f 100%)` }}>
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 my-auto border-t-[8px]" style={{ borderTopColor: BRAND.red }}>
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Logo" className="w-24 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 uppercase">Portal Voluntário</h2>
          <p className="text-gray-400 text-[8px] font-bold uppercase tracking-widest mt-1">Gestão clínica ONG Médicos do Mundo</p>
        </div>
        {notification && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-amber-950 shadow-sm">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-[9px] font-bold leading-relaxed">{notification}</p>
          </div>
        )}
        <form onSubmit={async (e) => {
          e.preventDefault(); const fd = new FormData(e.target);
          let signupAccountCreated = false;
          let signupProfileSaved = false;
          let signupVerificationSent = false;
          try {
            if (authMode === 'login') {
              const cred = await signInWithEmailAndPassword(auth, fd.get('email'), fd.get('password'));
              if (!cred.user.emailVerified) {
                await sendEmailVerification(cred.user).catch(() => undefined);
                await signOut(auth);
                showMsg('Confirme seu e-mail para entrar. Enviamos um novo link; verifique spam ou lixo eletrônico.');
                return;
              }
            } 
            else if (authMode === 'signup') {
              if (!PERFIS_CADASTRAVEIS.includes(fd.get('role'))) throw new Error('Perfil nao permitido no cadastro publico.');
              const profissaoCadastro = fd.get('role') === 'voluntario_eficiente'
                ? 'apoio_operacional'
                : fd.get('role') === 'colaborador_servico'
                  ? 'apoio_transversal'
                  : fd.get('profissao');
              if (!PROFISSOES_CADASTRAVEIS.includes(profissaoCadastro)) throw new Error('Profissao nao permitida.');
              if (!fd.get('lgpd')) throw new Error('Aceite LGPD obrigatorio.');
              signupInProgressRef.current = true;
              try {
              const cred = await createUserWithEmailAndPassword(auth, fd.get('email'), fd.get('password'));
              signupAccountCreated = true;
              const profilePhotoUrl = await uploadPhotoIfNeeded(fd.get('tempPhoto'), 'users', cred.user.uid).catch(() => '');
              await setDoc(doc(db, 'users', cred.user.uid), {
                nome: requiredText(fd.get('nome')),
                email: requiredText(fd.get('email')),
                emailVerified: false,
                role: fd.get('role'),
                profissao: profissaoCadastro,
                filial: requiredText(fd.get('filial')) || 'Santos',
                projeto: inferredProjectForProfile(fd.get('role'), profissaoCadastro),
                registro: requiredText(fd.get('registro')),
                uid: cred.user.uid,
                photo: profilePhotoUrl,
                lgpdAcceptedAt: new Date().toISOString(),
                privacyNoticeVersion: 'mdm-lgpd-v1',
              });
              signupProfileSaved = true;
              await sendEmailVerification(cred.user);
              signupVerificationSent = true;
              await signOut(auth);
              setAuthMode('login');
              showMsg('Cadastro criado. Confirme seu e-mail; verifique também spam ou lixo eletrônico.');
              } finally {
                signupInProgressRef.current = false;
              }
            } else { await sendPasswordResetEmail(auth, fd.get('email')); showMsg('Link de recuperação enviado. Verifique sua caixa de entrada, spam ou lixo eletrônico.'); setAuthMode('login'); }
          } catch (err) { 
            console.error(err);
            if (authMode === 'signup' && signupAccountCreated) {
              await signOut(auth).catch(() => undefined);
              setAuthMode('login');
              if (signupVerificationSent) showMsg('Cadastro criado. Confirme seu e-mail; verifique também spam ou lixo eletrônico.');
              else if (signupProfileSaved) showMsg('Cadastro criado, mas o e-mail de confirmação não pôde ser enviado agora. Entre novamente para reenviar o link.');
              else showMsg('A conta foi criada, mas não foi possível concluir o perfil. Procure a coordenação antes de tentar novamente.');
              return;
            }
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') showMsg('E-mail ou senha incorretos. Confira os dados e tente novamente.');
            else if (err.code === 'auth/email-already-in-use') showMsg('Este e-mail já possui cadastro.');
            else if (err.code === 'auth/weak-password') showMsg('A senha precisa ter pelo menos 8 caracteres.');
            else if (err.code === 'auth/invalid-email') showMsg('Informe um e-mail válido.');
            else if (err.message && !err.code) showMsg(err.message);
            else showMsg('Não foi possível acessar. Confira seus dados e tente novamente.'); 
          }
        }} className="space-y-3">
          {authMode === 'signup' && (
            <>
              <PhotoHandler onPhotoCaptured={(data) => { document.getElementById('tempPhoto').value = data; }} />
              <input type="hidden" name="tempPhoto" id="tempPhoto" />
              <div className="mdm-auto-field" data-field-label="Nome completo">
                <input name="nome" aria-label="Nome completo" placeholder="Ex.: Maria Santos" required className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-xs" />
              </div>
              <div className="mdm-auto-field" data-field-label="Perfil de acesso">
                <select name="role" required value={signupRole} onChange={(e) => setSignupRole(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-xs text-gray-600">
                  <option value="voluntario_eficiente">Voluntário(a) de apoio geral</option>
                  <option value="colaborador_servico">Colaborador(a) de serviço / apoio transversal</option>
                  <option value="academico">Acadêmico(a) / estudante da área</option>
                  <option value="profissional_formado">Profissional habilitado(a)</option>
                </select>
              </div>
              <div className="mdm-auto-field" data-field-label="Filial da equipe">
                <select name="filial" required defaultValue="Santos" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-xs text-gray-600">
                  {filiaisEquipe.map(filial => <option key={filial} value={filial}>{filial}</option>)}
                </select>
              </div>
              {signupRole === 'voluntario_eficiente' || signupRole === 'colaborador_servico' ? (
                <>
                  <input type="hidden" name="profissao" value={signupRole === 'voluntario_eficiente' ? 'apoio_operacional' : 'apoio_transversal'} />
                  {signupRole === 'colaborador_servico' && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-left">
                      <p className="text-[8px] font-black uppercase tracking-widest text-emerald-800">Apoio transversal</p>
                      <p className="mt-1 text-[8px] font-bold leading-relaxed text-emerald-900">Cadastro, consulta, direcionamento e censo social. Triagem e atendimentos são realizados pelas equipes das áreas.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="mdm-auto-field" data-field-label="Atuação principal na ação">
                  <select key={signupRole} name="profissao" required className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-xs text-gray-600">
                    {signupAreaOptions(signupRole).map(profissao => <option key={profissao} value={profissao}>{professionLabel(profissao)}</option>)}
                  </select>
                </div>
              )}
              <div
                className="mdm-auto-field"
                data-field-label={signupRole === 'profissional_formado' || signupRole === 'academico' ? 'Conselho, matrícula ou CPF' : 'CPF ou documento de identificação'}
              >
                <input
                  name="registro"
                  aria-label={signupRole === 'profissional_formado' || signupRole === 'academico' ? 'Conselho, matrícula ou CPF' : 'CPF ou documento de identificação'}
                  placeholder={signupRole === 'profissional_formado' || signupRole === 'academico' ? 'Ex.: CRM 000000, matrícula ou CPF' : 'Ex.: CPF, RG ou identificação institucional'}
                  required
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-xs"
                />
              </div>
              <label className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-left text-[8px] font-bold leading-relaxed text-blue-900">
                <input type="checkbox" name="lgpd" required className="mt-0.5 h-3 w-3 rounded border-blue-300 text-blue-600" />
                Declaro que acessarei apenas dados necessários ao atendimento, sem compartilhar planilhas, fotos ou informações sensíveis fora dos canais institucionais.
              </label>
            </>
          )}
          {authMode === 'reset' && (
            <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-[8px] font-bold leading-relaxed text-blue-900">
              Informe o e-mail cadastrado. O link de recuperação será enviado pelo Firebase e a equipe não terá acesso à sua senha.
            </p>
          )}
          <div className="mdm-auto-field" data-field-label="E-mail"><input name="email" type="email" aria-label="E-mail" placeholder="nome@email.com" required autoComplete="email" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-xs" /></div>
          {authMode !== 'reset' && <div className="mdm-auto-field" data-field-label="Senha"><input name="password" type="password" aria-label="Senha" placeholder="Mínimo de 8 caracteres" required minLength={8} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-xs" /></div>}
          <button type="submit" className="w-full text-white font-black py-4 rounded-xl shadow-xl uppercase text-[9px] mt-2 border-b-4 active:scale-[0.99] transition-all" style={{ backgroundColor: BRAND.navy, borderBottomColor: BRAND.navyDark }}>
            {authMode === 'login' ? 'Entrar no Portal' : authMode === 'signup' ? 'Cadastrar Perfil' : 'Recuperar Senha'}
          </button>
          {authMode === 'login' && (
            <button type="button" onClick={() => setAuthMode('reset')} className="w-full font-black text-[8px] uppercase tracking-widest py-2 hover:underline" style={{ color: BRAND.navy }}>
              Esqueci minha senha
            </button>
          )}
        </form>
        <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-[8px] font-bold leading-relaxed text-amber-900">
          Acesse durante a atividade de cuidado e registre somente os dados necessários ao atendimento do assistido.
        </p>
        <div className="mt-6 text-center">
          <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="font-black text-[9px] uppercase hover:underline" style={{ color: BRAND.navy }}>
            {authMode === 'login' ? 'Criar Conta' : 'Fazer Login'}
          </button>
        </div>
      </div>
    </div>
    </ActionLocationContext.Provider>
  );

  // --- VARS PARA FORMULÁRIOS DINÂMICOS ---
  const currentArea = defaultArea || selectedAtendimento?.area;

  const areaDictKey = currentArea === 'Medicina Humana' ? 'Medicina' : currentArea === 'Enfermagem / Curativos' ? 'Enfermagem' : currentArea;
  const textosForms = TEXTOS_CLINICOS[areaDictKey] || {
    evolucaoLabel: "Evolução Clínica / Anamnese Direcionada",
    evolucaoPlace: "Relato descritivo do atendimento...",
    diagLabel: "Diagnóstico Principal (Estatística MDM)",
    planoLabel: "Conduta Final / Orientações",
    planoPlace: "Conduta, orientações e encaminhamentos quando aplicável..."
  };

  return (
    <ActionLocationContext.Provider value={actionLocationContextValue}>
    <div translate="no" className="bg-gray-100 h-[100dvh] w-full font-sans text-gray-800 flex justify-center overflow-hidden text-left">
      <div className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col border-x border-gray-100">
        
        {/* NAVBAR */}
        <header className="bg-white border-b px-3 py-2 flex justify-between items-center gap-2 shrink-0 sticky top-0 z-50 shadow-sm">
          <div className="flex min-w-0 items-center gap-2">
            {currentView !== 'home' && <button onClick={handleBack} aria-label="Voltar" className="shrink-0 p-2 bg-gray-50 text-gray-500 rounded-lg shadow-sm"><ArrowLeft size={16} /></button>}
            <div className="flex min-w-0 items-center gap-2.5">
              <img src="/logo.png" alt="MDM" className="w-14 h-auto shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
              <span className="min-w-0 truncate text-[10px] font-black uppercase tracking-tight text-gray-900">{profileDisplayName(userProfile)}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              title="Alterar local da ação"
              aria-label="Alterar local da ação"
              onClick={() => {
                setPendingActionLocation(selectedActionLocation || currentActionLocation.value);
                setShowActionLocationModal(true);
              }}
              className="flex max-w-[104px] items-center gap-1 rounded-full border border-gray-100 bg-gray-50 px-2 py-1.5 text-[6px] font-black uppercase tracking-wider text-[#292f63] shadow-sm active:scale-95"
            >
              <MapPin size={11} />
              <span className="truncate">{currentActionLocation.neighborhood || currentActionLocation.city}</span>
            </button>
            <button type="button" onClick={() => setShowAppMenu(true)} title="Abrir menu do aplicativo" aria-label="Abrir menu do aplicativo" className="rounded-xl bg-[#292f63] p-2.5 text-white shadow-sm active:scale-95">
              <Menu size={18} />
            </button>
          </div>
        </header>

        {showAppMenu && (
          <div className="absolute inset-0 z-[210] bg-[#111a39]/45 backdrop-blur-sm" onClick={() => setShowAppMenu(false)}>
            <aside className="ml-auto flex h-full w-[82%] max-w-xs flex-col bg-white p-5 shadow-2xl animate-fade-in" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                    {userProfile.photo ? <img src={userProfile.photo} className="h-full w-full object-cover" alt="" /> : <div className="flex h-full w-full items-center justify-center text-sm font-black text-[#292f63]">{profileDisplayName(userProfile)[0]}</div>}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black uppercase text-[#111a39]">{profileDisplayName(userProfile)}</p>
                    <p className="mt-1 text-[8px] font-bold leading-snug text-gray-500">{roleLabel(userProfile.role)} • {professionLabel(profileProfession(userProfile))}</p>
                  </div>
                </div>
                <button type="button" aria-label="Fechar menu" onClick={() => setShowAppMenu(false)} className="rounded-xl bg-gray-50 p-2 text-gray-500">
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <button type="button" onClick={() => { setShowAppMenu(false); navigateFromBottom('home'); }} className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 p-4 text-left text-[10px] font-black uppercase text-[#111a39]">
                  <HomeIcon size={16} className="text-[#292f63]" /> Início
                </button>
                <button type="button" onClick={() => { setPendingActionLocation(selectedActionLocation || currentActionLocation.value); setShowActionLocationModal(true); setShowAppMenu(false); }} className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 p-4 text-left text-[10px] font-black uppercase text-[#111a39]">
                  <MapPin size={16} className="text-[#292f63]" /> Alterar local da ação
                </button>
                <button type="button" onClick={() => { setShowAppMenu(false); openOwnProfile(); }} className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 p-4 text-left text-[10px] font-black uppercase text-[#111a39]">
                  <User size={16} className="text-[#292f63]" /> Meu perfil
                </button>
                {canViewDashboard && (
                  <button type="button" onClick={() => { setShowAppMenu(false); navigateFromBottom('stats'); }} className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 p-4 text-left text-[10px] font-black uppercase text-[#111a39]">
                    <PieChart size={16} className="text-[#292f63]" /> Dashboards
                  </button>
                )}
                {canViewUsers && (
                  <button type="button" onClick={() => { setShowAppMenu(false); navigateFromBottom('usuarios'); loadManagedUsers(); }} className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 p-4 text-left text-[10px] font-black uppercase text-[#111a39]">
                    <UserCog size={16} className="text-[#292f63]" /> Gestão de usuários
                  </button>
                )}
              </div>

              <button type="button" onClick={() => signOut(auth)} className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-[10px] font-black uppercase tracking-widest text-red-600">
                <LogOut size={16} /> Sair com segurança
              </button>
            </aside>
          </div>
        )}

        {notification && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] bg-gray-900/95 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in border border-white/10 min-w-[250px] justify-center text-center">
            {['erro', 'incorret', 'confirme', 'nao foi', 'não foi', 'restrit', 'complete'].some(term => normalizeStr(notification).includes(normalizeStr(term)))
              ? <AlertCircle size={14} className="text-amber-400" />
              : <CheckCircle size={14} className="text-emerald-400" />}
            <span className="text-[8px] font-black uppercase tracking-widest">{notification}</span>
          </div>
        )}

        {(showActionLocationModal || !actionLocationConfirmedToday) && (
          <div className="absolute inset-0 z-[220] flex items-center justify-center bg-[#111a39]/75 p-5 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[2rem] border border-white/20 bg-white p-6 shadow-2xl animate-scale-up">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-[#eef2fb] p-3 text-[#292f63]"><MapPin size={20} /></div>
                <div>
                  <p className="text-[7px] font-black uppercase tracking-[0.28em] text-gray-400">Check-in da ação</p>
                  <h2 className="mt-1 text-lg font-black uppercase leading-tight text-[#111a39]">Qual a localidade da ação de hoje?</h2>
                  <p className="mt-2 text-[9px] font-bold leading-relaxed text-gray-500">
                    Prontuários, fila e dashboards serão vinculados somente ao local escolhido para o plantão de hoje.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {actionLocations.map(location => (
                  <label key={location.value} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all ${pendingActionLocation === location.value ? 'border-[#292f63] bg-[#eef2fb]' : 'border-gray-100 bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="dailyActionLocation"
                      value={location.value}
                      checked={pendingActionLocation === location.value}
                      onChange={(event) => setPendingActionLocation(event.target.value)}
                      className="h-4 w-4 text-[#292f63]"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[10px] font-black uppercase text-[#111a39]">{location.label}</span>
                      <span className="block truncate text-[8px] font-bold text-gray-500">{location.city} • {location.neighborhood} • {location.unit}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-5 flex gap-3">
                {actionLocationConfirmedToday && (
                  <button type="button" onClick={() => setShowActionLocationModal(false)} className="flex-1 rounded-xl bg-gray-100 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500 active:scale-95">
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => changeActionLocation(pendingActionLocation || actionLocations[0]?.value, { confirm: true, forceReload: true })}
                  className="flex-[2] rounded-xl border-b-4 border-[#1f244f] bg-[#292f63] py-3 text-[8px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95"
                >
                  Confirmar local da ação
                </button>
              </div>
            </div>
          </div>
        )}

        <main ref={mainScrollRef} className="flex-1 overflow-y-auto relative bg-gray-50/50 pb-4">
          {currentView === 'perfil' && (
            <div className="p-4 space-y-4 pb-28 animate-fade-in">
              <div className="rounded-[1.7rem] border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#eef2fb] p-3 text-[#292f63]"><User size={18} /></div>
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.28em] text-gray-400">Minha conta</p>
                    <h2 className="mt-1 text-lg font-black uppercase tracking-tight text-[#111a39]">Editar perfil</h2>
                    <p className="mt-1 text-[8px] font-bold leading-relaxed text-gray-500">Mantenha seus dados de identificação e contato atualizados para a ação.</p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  const fd = new FormData(event.currentTarget);
                  const nome = requiredText(fd.get('nome'));
                  if (nome.length < 3) {
                    showMsg('Informe seu nome completo para atualizar o perfil.');
                    return;
                  }
                  const profilePhotoUrl = await uploadPhotoIfNeeded(profilePhotoDraft, 'users', user.uid);
                  const updates = {
                    nome,
                    nomeSocial: requiredText(fd.get('nomeSocial')),
                    telefone: requiredText(fd.get('telefone')),
                    registro: requiredText(fd.get('registro')),
                    photo: profilePhotoUrl || '',
                    perfilAtualizadoEm: new Date().toISOString(),
                  };
                  const saved = await saveSafely(
                    async () => {
                      await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
                      setUserProfile(previous => ({ ...previous, ...updates }));
                    },
                    'Perfil atualizado com sucesso.'
                  );
                  if (saved) setCurrentView('home');
                }}
                onChange={() => setHasUnsavedChanges(true)}
                className="space-y-4 rounded-[1.7rem] border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="text-center">
                  <PhotoHandler
                    currentPhoto={profilePhotoDraft}
                    onPhotoCaptured={(data) => {
                      setProfilePhotoDraft(data);
                      setHasUnsavedChanges(true);
                    }}
                  />
                  {profilePhotoDraft && (
                    <button type="button" onClick={() => { setProfilePhotoDraft(''); setHasUnsavedChanges(true); }} className="text-[8px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500">
                      Remover foto
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-400">Nome completo</label>
                  <input name="nome" defaultValue={userProfile.nome || ''} required maxLength={120} className="w-full rounded-xl bg-gray-50 p-3 text-xs font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-400">Nome social</label>
                  <input name="nomeSocial" defaultValue={userProfile.nomeSocial || ''} maxLength={120} aria-label="Opcional" placeholder="" className="w-full rounded-xl bg-gray-50 p-3 text-xs font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-400">Telefone / WhatsApp</label>
                  <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3">
                    <Phone size={13} className="shrink-0 text-gray-400" />
                    <input name="telefone" type="tel" defaultValue={userProfile.telefone || ''} maxLength={24} aria-label="Contato opcional" placeholder="" className="w-full bg-transparent py-3 text-xs font-bold outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-400">Identificação / conselho</label>
                  <div className="mdm-auto-field" data-field-label="Se aplicável ao seu perfil"><input name="registro" defaultValue={userProfile.registro || ''} maxLength={60} aria-label="Se aplicável ao seu perfil" placeholder="" className="w-full rounded-xl bg-gray-50 p-3 text-xs font-bold outline-none" /></div>
                </div>

                <div className="space-y-1">
                  <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-400">Filial da equipe</label>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs font-black uppercase text-[#292f63]">
                    {userProfile.filial || 'Santos'}
                  </div>
                  <p className="ml-2 text-[8px] font-bold leading-relaxed text-gray-400">A filial indica sua base de origem. O local da ação é escolhido no check-in diário.</p>
                </div>

                <div className="rounded-2xl border border-[#e7ebf5] bg-[#f7f9fd] p-4">
                  <p className="text-[7px] font-black uppercase tracking-[0.25em] text-gray-400">Acesso protegido</p>
                  <div className="mt-3 flex items-center gap-2 text-[9px] font-bold text-[#292f63]">
                    <Mail size={13} />
                    <span className="truncate">{user.email}</span>
                    <ShieldCheck size={13} className="ml-auto text-emerald-600" />
                  </div>
                  <p className="mt-2 text-[8px] font-bold leading-relaxed text-gray-500">{roleLabel(userProfile.role)} • {professionLabel(profileProfession(userProfile))}. Mudanças de função são tratadas pela coordenação.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleBack} className="flex-1 rounded-xl bg-gray-100 py-4 text-[8px] font-black uppercase tracking-widest text-gray-500 active:scale-95">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="flex-[2] rounded-xl border-b-4 border-[#1f244f] bg-[#292f63] py-4 text-[8px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 disabled:opacity-60">
                    {isSaving ? 'Salvando...' : 'Salvar perfil'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {currentView === 'home' && (
            <div className="p-4 space-y-4 animate-fade-in">
              <div className="p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group" style={{ background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyDark} 100%)` }}>
                <div className="relative z-10">
                  <p className="text-blue-200 font-black uppercase tracking-[0.3em] text-[7px] mb-1">Central Operacional</p>
                  <h2 className="text-xl font-black leading-tight tracking-tighter">Bem-vindo(a), {formatName((userProfile.nomeSocial || userProfile.nome).split(' ')[0])}!</h2>
                  <p className="text-blue-100 text-[8px] mt-1 font-bold uppercase tracking-widest">Gestão Clínica ONG Médicos do Mundo</p>
                </div>
                {renderProfileHeroIcon(userProfile, 'absolute -right-4 -bottom-4 text-white opacity-[0.08] w-28 h-24 rotate-12')}
              </div>

              <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[7px] font-black uppercase tracking-[0.28em] text-gray-400">Atuação nesta ação</p>
                  <button type="button" onClick={openOwnProfile} className="flex items-center gap-1 rounded-lg bg-[#eef2fb] px-2 py-1.5 text-[7px] font-black uppercase tracking-widest text-[#292f63] active:scale-95">
                    <Edit3 size={10} /> Meu perfil
                  </button>
                </div>
                <p className="mt-2 text-xs font-black uppercase text-[#292f63]">{professionLabel(profileProfession(userProfile))}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {canRegisterAssistido && <span className="rounded-lg bg-sky-50 px-2 py-1 text-[7px] font-black uppercase text-sky-700">Cadastro</span>}
                  {canPerformTriage && <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[7px] font-black uppercase text-emerald-700">Triagem</span>}
                  {canRecordCenso && <span className="rounded-lg bg-purple-50 px-2 py-1 text-[7px] font-black uppercase text-purple-700">Censo Social</span>}
                  {profileProfession(userProfile) === 'apoio_transversal' && <span className="rounded-lg bg-amber-50 px-2 py-1 text-[7px] font-black uppercase text-amber-700">Direcionamento</span>}
                  {accessibleAreas.map(area => <span key={area} className="rounded-lg bg-blue-50 px-2 py-1 text-[7px] font-black uppercase text-blue-700">{area}</span>)}
                </div>
                {profileProfession(userProfile) === 'apoio_transversal' && (
                  <p className="mt-3 rounded-xl bg-gray-50 p-3 text-[8px] font-bold leading-relaxed text-gray-600">Você pode acolher, consultar e completar informações sociais. Triagem e atendimentos ficam com as equipes específicas.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setCurrentView('busca')} className="p-4 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-all group">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Search size={22} /></div>
                  <span className="font-black text-gray-800 text-[9px] uppercase tracking-widest">Pesquisar</span>
                </button>
                <button onClick={() => { setSearchQuery(''); setQueueMode('aguardando'); setQueueNow(Date.now()); setCurrentView('atender'); }} className="p-4 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-all group">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><Briefcase size={22} /></div>
                  <span className="font-black text-gray-800 text-[9px] uppercase tracking-widest">Atender Assistido</span>
                </button>
              </div>

              <div className="bg-white p-5 rounded-[1.8rem] border border-gray-100 shadow-sm">
                <h4 className="font-black text-gray-400 mb-4 text-[7px] uppercase tracking-[0.3em] flex items-center gap-2 border-b pb-2">
                   <Clock size={12} className="text-blue-500" /> Fluxo de Assistidos Recentes
                </h4>
                <div className="space-y-3">
                  {recentAssistidos.map(a => {
                    const flow = getAssistidoFlowSummary(a);
                    const attention = getAssistidoAttention(a);
                    const tone = {
                      orange: 'border-orange-200 bg-orange-50/80 text-orange-700',
                      amber: 'border-amber-300 bg-amber-50 text-amber-800',
                      purple: 'border-purple-200 bg-purple-50/80 text-purple-700',
                      blue: 'border-blue-200 bg-blue-50/80 text-blue-700',
                      emerald: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
                      gray: 'border-gray-100 bg-gray-50/70 text-gray-500',
                    }[flow.tone] || 'border-gray-100 bg-gray-50/70 text-gray-500';
                    return (
                    <div key={a.id} onClick={() => { setSelectedAssistido(a); setCurrentView('ficha'); }} className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer group border hover:border-blue-200 transition-all ${tone}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md overflow-hidden">
                          {a.photo ? <img src={a.photo} className="w-full h-full object-cover" /> : formatName(assistidoDisplayName(a))[0]}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-900 tracking-tight leading-none uppercase">{assistidoDisplayName(a)}</p>
                          <p className="text-[7px] font-black uppercase tracking-widest mt-1.5">{flow.label}</p>
                          <p className="text-[7px] text-gray-500 font-bold mt-1 leading-snug max-w-[220px]">{flow.detail}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {attention && (
                          <button type="button" aria-label={`Ver atenção de ${assistidoDisplayName(a)}`} title={attention.detail} onClick={(event) => { event.stopPropagation(); openTriagem(a); }} className="rounded-lg p-1 active:scale-90">
                            <AlertCircle size={17} className={attention.level === 'critical' ? 'text-red-600 fill-red-100' : 'text-amber-500 fill-amber-100'} />
                          </button>
                        )}
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                    );
                  })}
                  {recentAssistidos.length === 0 && <p className="text-[9px] text-center text-gray-400 italic py-4">Nenhum assistido recente nesta praça.</p>}
                </div>
              </div>
            </div>
          )}

          {currentView === 'busca' && (
            <div className="flex flex-col h-full bg-gray-50 animate-fade-in">
              <div className="p-4 bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="relative">
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Nome, CPF ou RG..." className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-100 outline-none font-bold text-gray-700 placeholder:text-gray-300 text-[11px] shadow-inner" />
                  <Search className="absolute left-4 top-4 text-gray-300" size={20} />
                </div>
              </div>
              <div className="p-4 space-y-3">
                {assistidos.filter(a => assistidoSearchText(a).includes(normalizeStr(searchQuery))).map(a => {
                  const flow = getAssistidoFlowSummary(a);
                  const attention = getAssistidoAttention(a);
                  const docs = [
                    a.cpf ? `CPF ${a.cpf}` : '',
                    a.rg ? `RG ${a.rg}` : '',
                  ].filter(Boolean).join(' • ') || 'Documento não registrado';
                  const identity = [
                    calculateAge(a.dataNascimento),
                    a.sexo || 'Sexo não informado',
                    a.procedencia || a.naturalidade || '',
                  ].filter(Boolean).join(' • ');
                  return (
                    <div key={a.id} onClick={() => { setSelectedAssistido(a); setCurrentView('ficha'); }} className="bg-white p-4 rounded-[1.4rem] border border-gray-100 shadow-sm active:scale-[0.98] transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-4 text-left">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-base border-2 border-white shadow-inner overflow-hidden">
                           {a.photo ? <img src={a.photo} className="w-full h-full object-cover" /> : formatName(assistidoDisplayName(a))[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 text-xs tracking-tight uppercase">{assistidoDisplayName(a)}</p>
                          <p className="mt-2 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-gray-400"><IdCard size={10}/> {docs}</p>
                          <p className="mt-1 text-[8px] font-bold leading-snug text-gray-500">{identity}</p>
                          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                            <p className="text-[7px] font-black uppercase tracking-widest text-blue-700">{flow.label}</p>
                            <p className="mt-1 text-[7px] font-bold leading-snug text-blue-900">{flow.detail}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {attention && (
                          <button type="button" aria-label={`Ver atenção de ${assistidoDisplayName(a)}`} title={attention.detail} onClick={(event) => { event.stopPropagation(); openTriagem(a); }} className="rounded-lg p-1 active:scale-90">
                            <AlertCircle size={18} className={attention.level === 'critical' ? 'text-red-600 fill-red-100' : 'text-amber-500 fill-amber-100'} />
                          </button>
                        )}
                        <ChevronRight size={20} className="text-gray-200" />
                      </div>
                    </div>
                    {attention && (
                      <div className={`mt-3 rounded-xl border px-3 py-2 ${attention.level === 'critical' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                        <p className="text-[7px] font-black uppercase tracking-widest">{attention.label}</p>
                        <p className="mt-1 text-[8px] font-bold leading-snug">{attention.detail}</p>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentView === 'atender' && (
            <div className="min-h-full bg-gray-50 p-4 pb-28 animate-fade-in">
              <div className="rounded-[1.8rem] border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.28em] text-emerald-700">Plantão da ação</p>
                    <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-[#101932]">Fila de Atendimento</h3>
                    <p className="mt-1 text-[8px] font-bold text-gray-500">Prioridade clínica em destaque, com chegada e tempo de espera preservados.</p>
                  </div>
                  {canRegisterAssistido && (
                    <button type="button" onClick={() => { setSelectedAssistido(null); setCurrentView('cadastro'); }} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-[7px] font-black uppercase tracking-wider text-white shadow-md active:scale-95">
                      <UserPlus size={13} /> Nova chegada
                    </button>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-amber-50 px-2 py-3 text-center">
                    <p className="text-xl font-black leading-none text-amber-700">{queueWaiting.length}</p>
                    <p className="mt-1 text-[6px] font-black uppercase tracking-widest text-amber-700">Aguardando ação</p>
                    {queueCritical.length > 0 && <p className="mt-1 text-[6px] font-bold uppercase text-red-700">({queueCritical.length} crítico{queueCritical.length !== 1 ? 's' : ''})</p>}
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-2 py-3 text-center">
                    <p className="text-xl font-black leading-none text-emerald-700">{queueFinished.length}</p>
                    <p className="mt-1 text-[6px] font-black uppercase tracking-widest text-emerald-700">Finalizados</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-gray-100 bg-white p-3 shadow-sm">
                <div className="relative">
                  <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Localizar na fila por nome, CPF ou RG..." className="w-full rounded-xl bg-gray-50 py-3.5 pl-10 pr-3 text-[10px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-100" />
                  <Search className="absolute left-3 top-3.5 text-gray-300" size={16} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-1">
                  <button type="button" onClick={() => setQueueMode('aguardando')} className={`rounded-lg py-2 text-[7px] font-black uppercase tracking-widest transition-all ${queueMode === 'aguardando' ? 'bg-white text-[#292f63] shadow-sm' : 'text-gray-400'}`}>Aguardando ação</button>
                  <button type="button" onClick={() => setQueueMode('todos')} className={`rounded-lg py-2 text-[7px] font-black uppercase tracking-widest transition-all ${queueMode === 'todos' ? 'bg-white text-[#292f63] shadow-sm' : 'text-gray-400'}`}>Todos de hoje</button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {visibleQueue.map((item) => {
                  const { assistido, triagem, flow, attention, arrivalAt, triageAt, priority } = item;
                  const arrivalOrder = [...atendimentoQueue]
                    .sort((left, right) => left.arrivalAt - right.arrivalAt)
                    .findIndex(queueItem => queueItem.assistido.id === assistido.id) + 1;
                  const emphasis = item.rank === 0
                    ? 'border-red-300 bg-red-50'
                    : item.rank === 1
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-100 bg-white';
                  return (
                    <div key={assistido.id} className={`rounded-[1.5rem] border p-4 shadow-sm ${emphasis}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#292f63] text-sm font-black text-white">
                          {assistido.photo ? <img src={assistido.photo} className="h-full w-full object-cover" /> : formatName(assistidoDisplayName(assistido))[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="truncate text-[11px] font-black uppercase text-gray-950">{assistidoDisplayName(assistido)}</p>
                              <p className="mt-1 text-[7px] font-black uppercase tracking-widest text-gray-400">Chegada #{String(arrivalOrder).padStart(2, '0')} • {hourLabel(arrivalAt)}</p>
                            </div>
                            <span className={`shrink-0 rounded-lg px-2 py-1 text-[6px] font-black uppercase tracking-wider ${item.rank === 0 ? 'bg-red-600 text-white' : priority.level === 'priority' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {priority.label}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-white/80 p-2">
                              <p className="text-[6px] font-black uppercase tracking-widest text-gray-400">Espera total</p>
                              <p className="mt-1 text-[9px] font-black text-gray-800">{elapsedLabel(arrivalAt, queueNow)}</p>
                            </div>
                            <div className="rounded-lg bg-white/80 p-2">
                              <p className="text-[6px] font-black uppercase tracking-widest text-gray-400">{triagem ? 'Após triagem' : 'Triagem'}</p>
                              <p className="mt-1 text-[9px] font-black text-gray-800">{triagem ? elapsedLabel(triageAt, queueNow) : 'Não iniciada'}</p>
                            </div>
                          </div>
                          <div className="mt-3 rounded-lg border border-gray-100 bg-white/80 px-3 py-2">
                            <p className="text-[7px] font-black uppercase tracking-widest text-[#292f63]">{flow.label}</p>
                            <p className="mt-1 text-[7px] font-bold text-gray-600">{flow.detail}</p>
                          </div>
                          {attention && (
                            <div className={`mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-[7px] font-bold ${attention.level === 'critical' ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900'}`}>
                              <AlertCircle size={12} className="shrink-0" />
                              <span>{attention.label}: {attention.detail}</span>
                            </div>
                          )}
                          {priority.reasons.length > 0 && (
                            <p className="mt-2 text-[7px] font-bold leading-snug text-gray-600">
                              Marcadores: {priority.reasons.slice(0, 3).join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {canPerformTriage && (!triagem || triageCompletion(triagem).percent < 80) && (
                          <button type="button" onClick={() => openTriagem(assistido)} className="flex-1 rounded-xl bg-amber-500 py-2.5 text-[7px] font-black uppercase tracking-widest text-white active:scale-95">
                            {!triagem ? 'Iniciar triagem' : 'Completar triagem'}
                          </button>
                        )}
                        <button type="button" onClick={() => goToFicha(assistido)} className="flex-1 rounded-xl bg-[#292f63] py-2.5 text-[7px] font-black uppercase tracking-widest text-white active:scale-95">
                          Abrir atendimento
                        </button>
                      </div>
                    </div>
                  );
                })}
                {visibleQueue.length === 0 && (
                  <div className="rounded-[1.5rem] border border-dashed border-gray-200 bg-white p-8 text-center">
                    <CheckCircle size={22} className="mx-auto text-emerald-500" />
                    <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-gray-500">
                      {queueMode === 'aguardando' ? 'Nenhum atendimento aguardando ação' : 'Nenhuma chegada registrada hoje'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CADASTRO NOVO ASSISTIDO */}
          {currentView === 'cadastro' && (
             <div className="p-4 animate-fade-in text-left">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                   <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tighter uppercase italic border-b pb-4">Ficha de Identificação</h3>
                   <form onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.target);
                      const id = selectedAssistido?.id || Date.now().toString();
                      const nomeCivil = requiredText(fd.get('nome'));
                      const nomeSocial = requiredText(fd.get('nomeSocial'));
                      const nome = nomeSocial || nomeCivil;
                      const cpf = requiredText(fd.get('cpf'));
                      const dataNascimento = fd.get('nasc');
                      if (!nomeCivil && !nomeSocial) {
                        showMsg('Informe o nome civil ou o nome social do assistido.');
                        return;
                      }
                      if (new Date(dataNascimento) > new Date()) {
                        showMsg('A data de nascimento nao pode estar no futuro.');
                        return;
                      }
                      if (cpf && normalizeStr(cpf) !== 'nao informado' && assistidos.some(a => a.id !== id && requiredText(a.cpf) === cpf)) {
                        showMsg('Ja existe um assistido com esse CPF.');
                        return;
                      }
                      const photoUrl = await uploadPhotoIfNeeded(fd.get('photoData'), 'assistidos', id);
                      const novo = applyFieldDefaults({ 
                        id, 
                        nome,
                        nomeCivil,
                        nomeSocial,
                        cpf, 
                        rg: requiredText(fd.get('rg')), 
                        dataNascimento, 
                        sexo: fd.get('genero'),
                        genero: fd.get('genero'),
                        sexoNascimento: fd.get('sexoNascimento'),
                        raca: fd.get('raca'),
                        naturalidade: fd.get('naturalidade'),
                        procedencia: fd.get('procedencia'),
                        escolaridade: fd.get('escolaridade'),
                        estadoCivil: fd.get('estadoCivil'),
                        photo: photoUrl || '',
                        criadoPor: userProfile.nome, 
                        localAcao: currentActionLocation.value,
                        unidadeAcao: currentActionLocation.label,
                        dataCriacao: selectedAssistido?.dataCriacao || new Date().toLocaleDateString('pt-BR'),
                        dataCriacaoEm: selectedAssistido?.dataCriacaoEm || Date.now(),
                        chegadaAcaoData: selectedAssistido?.chegadaAcaoData || new Date().toLocaleDateString('pt-BR'),
                        chegadaAcaoEm: selectedAssistido?.chegadaAcaoEm || Date.now(),
                      }, {
                        cpf: 'Não informado',
                        nomeCivil: '',
                        nomeSocial: '',
                        rg: 'Não informado',
                        genero: 'Não informado',
                        sexoNascimento: 'Não informado',
                        raca: 'Não informado',
                        naturalidade: 'Não informado',
                        procedencia: 'Não informado',
                        escolaridade: 'Não informado',
                        estadoCivil: 'Não informado',
                        photo: '',
                      });
                      const saved = await saveSafely(
                        async () => {
                          await setDoc(doc(db, 'assistidos', id), novo, { merge: true });
                          syncLocalRecord(setAssistidos, novo);
                          setSelectedAssistido(novo);
                        },
                        'Identificacao salva.'
                      );
                      if (saved) goToFicha(novo);
                   }} onChange={() => setHasUnsavedChanges(true)} className="space-y-4">
                      
                      <PhotoHandler currentPhoto={selectedAssistido?.photo} onPhotoCaptured={(data) => { document.getElementById('photoData').value = data; setHasUnsavedChanges(true); }} />
                      <input type="hidden" name="photoData" id="photoData" defaultValue={selectedAssistido?.photo || ''} />

                      <div className="space-y-1.5">
                         <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Nome civil completo</label>
                         <div className="mdm-auto-field" data-field-label="Obrigatório se não houver nome social"><input name="nome" defaultValue={selectedAssistido?.nomeCivil || (selectedAssistido?.nome !== selectedAssistido?.nomeSocial ? selectedAssistido?.nome : '') || ''} aria-label="Obrigatório se não houver nome social" placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm shadow-inner uppercase" /></div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Nome Social</label>
                         <div className="mdm-auto-field" data-field-label="Obrigatório se não houver nome civil"><input name="nomeSocial" defaultValue={selectedAssistido?.nomeSocial || ''} aria-label="Obrigatório se não houver nome civil" placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm shadow-inner uppercase" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                            <label className="text-[7px] font-black uppercase text-gray-400 ml-4">RG</label>
                            <input name="rg" defaultValue={selectedAssistido?.rg || ''} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm shadow-inner" />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[7px] font-black uppercase text-gray-400 ml-4">CPF</label>
                            <input name="cpf" inputMode="numeric" autoComplete="off" maxLength="14" defaultValue={selectedAssistido?.cpf || ''} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm shadow-inner" />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                            <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Nascimento</label>
                            <input name="nasc" type="date" required defaultValue={selectedAssistido?.dataNascimento || ''} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm shadow-inner" />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Gênero informado</label>
                            <select name="genero" required defaultValue={selectedAssistido?.genero || selectedAssistido?.sexo || 'Não informado'} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm bg-white shadow-inner text-center">
                               <option value="Não informado">Não informado</option>
                               <option value="Homem">Homem</option>
                               <option value="Mulher">Mulher</option>
                               <option value="Homem trans">Homem trans</option>
                               <option value="Mulher trans">Mulher trans</option>
                               <option value="Travesti">Travesti</option>
                               <option value="Não binário">Não binário</option>
                               <option value="Outro">Outro</option>
                               <option value="Prefere não responder">Prefere não responder</option>
                            </select>
                         </div>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Sexo ao nascer</label>
                          <select name="sexoNascimento" required defaultValue={['Masculino', 'Feminino'].includes(selectedAssistido?.sexoNascimento) ? selectedAssistido.sexoNascimento : ''} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm bg-white shadow-inner text-center">
                            <option value="" disabled>Selecione...</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                          </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                         <div className="space-y-1.5">
                            <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Raça / Cor</label>
                            <select name="raca" defaultValue={selectedAssistido?.raca || ''} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-xs bg-white shadow-inner">
                               <option value="">Selecione...</option>
                               <option value="Pardo">Pardo</option>
                               <option value="Negro">Negro</option>
                               <option value="Branco">Branco</option>
                               <option value="Indígena">Indígena</option>
                               <option value="Asiático">Asiático</option>
                               <option value="Não sabe referir">Não sabe referir</option>
                            </select>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Naturalidade</label>
                            <div className="mdm-auto-field" data-field-label="Onde nasceu"><input name="naturalidade" defaultValue={selectedAssistido?.naturalidade || ''} aria-label="Onde nasceu?" placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-xs shadow-inner" /></div>
                         </div>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Procedência</label>
                         <div className="mdm-auto-field" data-field-label="De onde veio / Veio de qual cidade"><input name="procedencia" defaultValue={selectedAssistido?.procedencia || ''} aria-label="De onde veio / Veio de qual cidade?" placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-xs shadow-inner" /></div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                            <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Escolaridade</label>
                            <select name="escolaridade" defaultValue={selectedAssistido?.escolaridade || ''} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] bg-white shadow-inner">
                               <option value="">Selecione...</option>
                               <option value="Ensino Fundamental">Ens. Fundamental</option>
                               <option value="Ensino Médio">Ens. Médio</option>
                               <option value="Ensino Superior">Ens. Superior</option>
                               <option value="Não se aplica">Não se aplica</option>
                            </select>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Estado Civil</label>
                            <select name="estadoCivil" defaultValue={selectedAssistido?.estadoCivil || ''} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] bg-white shadow-inner">
                               <option value="">Selecione...</option>
                               <option value="Solteiro(a)">Solteiro(a)</option>
                               <option value="Casado(a)">Casado(a)</option>
                               <option value="União estável">União estável</option>
                               <option value="Divorciado(a)">Divorciado(a)</option>
                               <option value="Viúvo(a)">Viúvo(a)</option>
                               <option value="Não se aplica">Não se aplica</option>
                            </select>
                         </div>
                      </div>

                      <div className="flex gap-4 pt-6 text-center">
                         <button type="button" onClick={handleBack} className="flex-1 bg-gray-100 text-gray-500 font-black py-5 rounded-2xl uppercase tracking-widest text-[8px] active:scale-95 transition-all">Voltar</button>
                         <button type="submit" disabled={isSaving} className="flex-[2.5] bg-emerald-600 disabled:opacity-60 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-[8px] border-b-4 border-emerald-800 active:scale-95 transition-all">{isSaving ? 'Salvando...' : 'Confirmar Registro'}</button>
                      </div>
                   </form>
                </div>
             </div>
          )}

          {currentView === 'ficha' && selectedAssistido && (() => {
            const hoje = new Date().toLocaleDateString('pt-BR');
            const tri = triagens.find(t => String(t.assistidoId) === String(selectedAssistido.id) && t.data === hoje);
            const ana = anamneses.find(a => String(a.assistidoId) === String(selectedAssistido.id));
            const triStatus = triageCompletion(tri);
            const anaStatus = censoCompletion(ana);
            const triIncomplete = !tri || triStatus.percent < 80;
            const anaIncomplete = !ana || anaStatus.percent < 80;
            const atendimentosHojeFicha = atendimentos.filter(a => String(a.assistidoId) === String(selectedAssistido.id) && a.data === hoje);
            const areasRecomendadasFicha = compactList(tri?.encaminhamento);
            const areasConcluidasFicha = atendimentosHojeFicha
              .filter(a => normalizeStr(a.status).includes('concluido'))
              .map(a => a.area);
            const areasPendentesFicha = areasRecomendadasFicha.filter(area => !areasConcluidasFicha.includes(area));
            const atendimentosParciaisFicha = atendimentosHojeFicha.filter(a => Number(a.preenchimentoPct || 0) < 80);
            const patientAttention = getAssistidoAttention(selectedAssistido);
            const attentionItems = [
              !tri && 'Fluxo do plantão atual ainda não foi iniciado.',
              tri && triStatus.percent < 80 && `Triagem parcial: ${triStatus.status.toLowerCase()} (${triStatus.percent}%).`,
              !ana && 'Censo social e histórico ainda não foram preenchidos.',
              ana && anaStatus.percent < 80 && `Censo social parcial (${anaStatus.percent}%). Revise dados sociais e clínicos.`,
              atendimentosParciaisFicha.length > 0 && `Registro parcial em atendimento: ${atendimentosParciaisFicha.map(a => a.area).slice(0, 4).join(', ')}.`,
              areasPendentesFicha.length > 0 && `Atendimentos recomendados pendentes: ${areasPendentesFicha.slice(0, 4).join(', ')}.`,
              patientAttention && `${patientAttention.label}: ${patientAttention.detail}`,
            ].filter(Boolean);
            const attentionCritical = patientAttention?.level === 'critical' || attentionItems.some(item => hasSevereMarker(item));
            
            return (
              <div className="p-4 space-y-4 animate-fade-in h-full overflow-y-auto">
                <PatientHeader assistido={selectedAssistido} triagem={tri} censo={ana} />
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
                  <button onClick={() => setCurrentView('cadastro')} className="absolute top-4 right-4 p-2.5 bg-gray-50 text-blue-600 rounded-full border border-blue-50 shadow-sm active:scale-90 transition-all"><Edit3 size={16}/></button>
                  {canDeleteAssistido && (
                    <button onClick={() => handleDeleteAssistido(selectedAssistido)} title="Inativar cadastro" className="absolute top-4 left-4 p-2.5 bg-red-50 text-red-600 rounded-full border border-red-100 shadow-sm active:scale-90 transition-all">
                      <Trash2 size={16}/>
                    </button>
                  )}
                  <div className="w-24 h-24 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-lg mb-4 border-4 border-white rotate-3 overflow-hidden">
                    {selectedAssistido.photo ? <img src={selectedAssistido.photo} className="w-full h-full object-cover" /> : formatName(assistidoDisplayName(selectedAssistido))[0]}
                  </div>
                  <h2 className="text-base font-black text-gray-900 tracking-tighter leading-tight uppercase px-4">{assistidoDisplayName(selectedAssistido)}</h2>
                  <div className="flex justify-center gap-2 mt-3 text-[7px] font-black text-gray-400 uppercase tracking-widest">
                    <span className="bg-gray-100 px-3 py-1 rounded-full shadow-inner">{calculateAge(selectedAssistido.dataNascimento)} • {selectedAssistido.sexo || 'Não informado'}</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full shadow-inner">CPF: {selectedAssistido.cpf || 'Não informado'}</span>
                  </div>
                  
                  <button onClick={() => setCurrentView('historico')} className="mt-5 flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-100 px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-sm active:scale-95 transition-all hover:bg-blue-600 hover:text-white group mx-auto">
                    <HistoryIcon size={14} className="group-hover:animate-spin-slow" /> Ver Histórico do Paciente
                  </button>
                </div>

                {attentionItems.length > 0 && (
                  <div className={`rounded-[1.8rem] border-2 p-4 shadow-lg ring-4 ${attentionCritical ? 'border-red-300 bg-red-50 ring-red-100' : 'border-amber-300 bg-amber-50 ring-amber-100'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`rounded-2xl p-2.5 text-white shadow-md ${attentionCritical ? 'bg-red-600' : 'bg-amber-500'}`}>
                        <AlertCircle size={18} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${attentionCritical ? 'text-red-900' : 'text-amber-900'}`}>Atenção no atendimento</p>
                        <div className="mt-2 space-y-1.5">
                          {attentionItems.map(item => (
                            <p key={item} className={`text-[8px] font-bold leading-snug ${attentionCritical ? 'text-red-950' : 'text-amber-950'}`}>• {item}</p>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          {triIncomplete && (
                            <button type="button" onClick={() => openTriagem(selectedAssistido)} className="flex-1 rounded-xl bg-amber-600 px-3 py-2 text-[7px] font-black uppercase tracking-widest text-white shadow-md active:scale-95">
                              Corrigir triagem
                            </button>
                          )}
                          {anaIncomplete && (
                            <button type="button" onClick={() => openAnamnese(selectedAssistido)} className="flex-1 rounded-xl bg-purple-700 px-3 py-2 text-[7px] font-black uppercase tracking-widest text-white shadow-md active:scale-95">
                              Revisar censo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-[7px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2 flex items-center gap-2"><NavigationIcon size={10} className="text-blue-500" /> Roteiro Clínico</h4>
                  
                  {/* TRIAGEM ALERT PISCANDO SE EXTINTO HOJE */}
                  <div className={`p-4 rounded-[1.5rem] border flex justify-between items-center shadow-sm ${!tri ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-100 animate-pulse' : triIncomplete ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${!tri ? 'bg-orange-100 text-orange-600' : triIncomplete ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'}`}><HeartPulse size={16}/></div>
                      <div className="leading-none">
                        <p className={`text-[10px] font-black tracking-tighter ${!tri ? 'text-orange-900' : triIncomplete ? 'text-amber-900' : 'text-emerald-900'}`}>1. Triagem / Check-up</p>
                        <p className={`text-[6px] uppercase font-black mt-1.5 ${triIncomplete ? 'text-amber-700' : 'text-emerald-600'}`}>{tri ? `${triStatus.status} • ${triStatus.percent}% preenchido` : 'Iniciar fluxo do plantão'}</p>
                      </div>
                    </div>
                    <button onClick={() => openTriagem(selectedAssistido)} className={`text-[7px] font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-sm active:scale-95 transition-all ${!canPerformTriage ? 'bg-gray-100 text-gray-400' : !tri ? 'bg-orange-500 text-white shadow-lg' : triIncomplete ? 'bg-amber-600 text-white shadow-lg' : 'bg-emerald-200 text-emerald-800'}`}>
                      {!canPerformTriage ? 'Equipe Triagem' : tri ? 'Ver/Editar' : 'Iniciar'}
                    </button>
                  </div>

                  {/* ANAMNESE SOCIAL */}
                  <div className={`p-4 rounded-[1.5rem] border flex justify-between items-center shadow-sm ${!ana ? 'bg-red-50 border-red-300 ring-2 ring-red-100 animate-pulse' : anaIncomplete ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-100' : 'bg-purple-50 border-purple-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${!ana ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}><FileText size={16}/></div>
                      <div className="leading-none">
                        <p className={`text-[10px] font-black tracking-tighter ${ana ? 'text-purple-900' : 'text-red-900'}`}>2. Censo Social & Histórico</p>
                        <p className={`text-[6px] uppercase font-black mt-1.5 ${anaIncomplete ? 'text-purple-700' : 'text-emerald-600'}`}>{ana ? `${anaStatus.status} • ${anaStatus.percent}% preenchido` : 'Requer preenchimento'}</p>
                      </div>
                    </div>
                    <button onClick={() => openAnamnese(selectedAssistido)} className={`text-[7px] font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-sm active:scale-95 transition-all ${!ana ? 'bg-red-600 text-white shadow-lg' : anaIncomplete ? 'bg-purple-700 text-white shadow-lg' : 'bg-white text-purple-600 border border-purple-200'}`}>
                      {ana ? 'Editar' : 'Iniciar'}
                    </button>
                  </div>

                  {/* FILA DE TODAS AS ESPECIALIDADES */}
                  {(() => {
                    const areasRecomendadas = compactList(tri?.encaminhamento);
                    const atendimentosHoje = atendimentos.filter(a => String(a.assistidoId) === String(selectedAssistido.id) && a.data === hoje);
                    const areasComAtendimentoHoje = atendimentosHoje.map(a => a.area).filter(Boolean);
                    const areasPrincipais = [...new Set([...areasRecomendadas, ...areasComAtendimentoHoje])]
                      .filter(area => TODAS_ESPECIALIDADES.includes(area));
                    const areasExtras = TODAS_ESPECIALIDADES.filter(area => !areasPrincipais.includes(area) && canAccessArea(area));

                    const renderAreaCard = (area, extra = false) => {
                      const atd = atendimentosHoje.find(a => a.area === area);
                      const canOpenArea = canAccessArea(area);
                      const canWriteCurrentArea = canWriteArea(area);
                      const isAllowed = canFinalizeArea(area);
                      const isRecomendado = areasRecomendadas.includes(area);
                      const isExtra = extra || Boolean(atd?.extraAtendimento);
                      
                      let bgIcon = "bg-blue-100 text-blue-600";
                      if(['Veterinária', 'Medicina Veterinaria'].includes(area)) bgIcon = "bg-rose-100 text-rose-600";
                      else if(['Nutrição', 'Fisioterapia', 'Podologia'].includes(area)) bgIcon = "bg-lime-100 text-lime-600";
                      else if(['Doações', 'Acolhimento Social', 'Atendimento Infantil / Brinquedoteca', 'Emissão de Documentos'].includes(area)) bgIcon = "bg-orange-100 text-orange-600";
                      else if(['Apoio à Mulher'].includes(area)) bgIcon = "bg-rose-100 text-rose-700";
                      else if(['Justiça de Rua'].includes(area)) bgIcon = "bg-gray-200 text-gray-700";
                      else if(['Beleza de Rua'].includes(area)) bgIcon = "bg-pink-100 text-pink-600";
                      else if(['Vacinação', 'Testes Rápidos', 'Exames Clínicos', 'Biomedicina', 'Farmácia'].includes(area)) bgIcon = "bg-cyan-100 text-cyan-600";

                      return (
                        <div key={area} className={`p-4 rounded-2xl flex justify-between items-center border shadow-sm transition-all bg-white ${atd?.status === 'Concluído' ? 'opacity-70' : 'active:scale-98 shadow-md border-white'}`}>
                          <div className="flex items-center gap-3">
                             <div className={`p-2.5 rounded-2xl shadow-inner ${bgIcon}`}>{getAreaIcon(area)}</div>
                             <div className="leading-none">
                               <p className="text-[10px] font-black text-gray-800 flex items-center gap-1">
                                   {area} {isRecomendado && !atd && <Star size={10} className="text-yellow-500 fill-yellow-500" title="Recomendado na Triagem" />}
                                   <AlertCircle size={11} className={atd?.obsGeral || patientAttention ? 'text-amber-500 fill-amber-100' : 'text-gray-200'} title={atd?.obsGeral ? 'Atendimento com observação registrada' : patientAttention ? 'Assistido com atenção especial registrada' : 'Sem alerta registrado'} />
                               </p>
                               <p className={`text-[6px] uppercase font-bold mt-2 ${atd?.status === 'Aguardando Profissional' ? 'text-orange-500' : atd?.status === 'Concluído' ? 'text-emerald-500' : isExtra ? 'text-blue-500' : 'text-gray-400'}`}>
                                 {atd ? `${atd.status}${atd.extraAtendimento ? ' • Extra' : ''}` : (isRecomendado ? 'Recomendado na Triagem' : 'Atendimento extra opcional')}
                               </p>
                             </div>
                          </div>
                          <button disabled={!canOpenArea} onClick={() => openAtendimento(area, atd || null, { extra: isExtra || !isRecomendado })} className={`text-[7px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 disabled:cursor-not-allowed ${!canOpenArea ? 'bg-gray-100 text-gray-400 shadow-none' : !canWriteCurrentArea ? 'bg-amber-50 text-amber-700 border border-amber-100' : atd?.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : atd?.status === 'Aguardando Profissional' ? (isAllowed ? 'bg-blue-600 text-white animate-pulse' : 'bg-orange-100 text-orange-600') : isExtra || !isRecomendado ? 'bg-gray-900 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                            {!canOpenArea ? 'Outra Equipe' : !canWriteCurrentArea ? 'Ver/Comentar' : atd?.status === 'Concluído' ? 'Ver' : atd?.status === 'Aguardando Profissional' ? (isAllowed ? 'Validar' : 'Na Fila') : isExtra || !isRecomendado ? 'Atendimento Extra' : 'Atender'}
                          </button>
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-2 mt-4 bg-gray-100 p-4 rounded-[1.8rem] border border-gray-200">
                         <p className="text-[7px] font-black uppercase text-gray-500 tracking-widest mb-3 flex items-center gap-2 px-2"><MapPin size={10} className="text-blue-500"/> Fila de Especialidades da Ação</p>
                          {areasPrincipais.length > 0
                            ? areasPrincipais.map(area => renderAreaCard(area))
                            : (
                              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                                <p className="text-[9px] font-black uppercase tracking-wider text-amber-900">Sem roteiro de áreas ainda</p>
                                <p className="mt-1 text-[8px] font-bold leading-snug text-amber-800">Se a pessoa precisar de cuidado imediato, registre um atendimento extra sem aguardar a triagem.</p>
                                {areasExtras.length > 0 && (
                                  <button type="button" onClick={() => setShowExtraAtendimentos(true)} className="mt-3 rounded-xl bg-gray-900 px-4 py-2.5 text-[8px] font-black uppercase tracking-widest text-white shadow-sm active:scale-95">
                                    Iniciar atendimento extra
                                  </button>
                                )}
                              </div>
                            )}
                         {areasExtras.length > 0 && <button type="button" onClick={() => setShowExtraAtendimentos(prev => !prev)} className="mt-3 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-700 shadow-sm active:scale-95">
                           {showExtraAtendimentos ? 'Ocultar atendimentos extras' : 'Atendimento Extra'}
                         </button>}
                         {showExtraAtendimentos && (
                           <div className="space-y-2 rounded-[1.5rem] border border-gray-200 bg-gray-50 p-2">
                             {areasExtras.map(area => renderAreaCard(area, true))}
                           </div>
                         )}
                      </div>
                    );
                  })()}
              </div>
            </div>
            );
          })()}

          {/* NOVA ABA: HISTÓRICO COMPLETO POR ÁREA */}
          {currentView === 'historico' && selectedAssistido && (() => {
             const histFilter = formToggles.historyAreaFilter || 'Todas';
             const hist = atendimentos
               .filter(a => String(a.assistidoId) === String(selectedAssistido.id))
               .filter(a => histFilter === 'Todas' || a.area === histFilter)
               .sort((a,b) => recordTime(b) - recordTime(a));
             const histAreas = ['Todas', ...new Set(atendimentos
               .filter(a => String(a.assistidoId) === String(selectedAssistido.id))
               .map(a => a.area)
               .filter(Boolean))];
             
             // Agrupar atendimentos por área
             const groupedHist = hist.reduce((acc, curr) => {
                if (!acc[curr.area]) acc[curr.area] = [];
                acc[curr.area].push(curr);
                return acc;
             }, {});

             return (
               <div className="p-4 animate-fade-in pb-32 text-left">
                  <PatientHeader assistido={selectedAssistido} triagem={triagens.find(t => String(t.assistidoId) === String(selectedAssistido.id))} censo={anamneses.find(a => String(a.assistidoId) === String(selectedAssistido.id))} />
                  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                     <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div className="flex items-center gap-3">
                           <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl"><HistoryIcon size={20}/></div>
                           <h3 className="text-sm font-black text-blue-900 tracking-tighter uppercase italic leading-none">Histórico Clínico</h3>
                        </div>
                        <button onClick={handleBack} className="text-gray-400 p-1"><X size={22}/></button>
                     </div>

                     <div className="mb-6">
                        <h4 className="text-[11px] font-black text-gray-800 uppercase px-1">{assistidoDisplayName(selectedAssistido)}</h4>
                         <p className="text-[8px] font-bold text-gray-400 uppercase px-1 mt-1">Nascimento: {selectedAssistido.dataNascimento ? new Date(selectedAssistido.dataNascimento).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                     </div>
                     <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                       {histAreas.map(area => (
                         <button key={area} type="button" onClick={() => setFormToggles(prev => ({ ...prev, historyAreaFilter: area }))} className={`shrink-0 rounded-full px-3 py-2 text-[7px] font-black uppercase tracking-wider ${histFilter === area ? 'bg-[#292f63] text-white' : 'bg-gray-50 text-gray-500'}`}>
                           {area}
                         </button>
                       ))}
                     </div>

                     {Object.keys(groupedHist).length === 0 ? (
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center shadow-inner">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Nenhum atendimento anterior registado no sistema.</p>
                        </div>
                     ) : (
                        <div className="space-y-6">
                           {Object.keys(groupedHist).map(area => (
                              <div key={area} className="space-y-3">
                                 <h4 className="text-[9px] font-black uppercase text-gray-500 tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                                    {getAreaIcon(area)} {area}
                                 </h4>
                                 <div className="space-y-3 pl-2 border-l-2 border-gray-100">
                                    {groupedHist[area].map(atd => (
                                       <div key={atd.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                                          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-400 opacity-80 group-hover:bg-blue-600 transition-colors"></div>
                                          
                                          <div className="flex justify-between items-center mb-3">
                                             <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight flex items-center gap-1.5">
                                                <Calendar size={12} className="text-blue-500"/> {formatClinicalDate(atd.dataCriacaoEm || atd.criadoEm || atd.registradoEm || atd.id || atd.data)}
                                             </span>
                                             <span className={`text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${atd.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {atd.status}
                                             </span>
                                          </div>
                                          
                                          <div className="space-y-2 text-[9px] text-gray-600 leading-relaxed">
                                             {atd.nomeProfissional && <p><span className="font-black text-gray-500 uppercase">Profissional:</span> {atd.nomeProfissional}</p>}
                                             <div className="grid gap-2">
                                               <div className="rounded-xl bg-white p-3"><span className="font-black text-gray-500 uppercase">S - Subjetivo:</span> {atd.qd || atd.subjetivo || atd.demandaJuridica || atd.itensSolicitados || 'Não informado'}</div>
                                               <div className="rounded-xl bg-white p-3"><span className="font-black text-cyan-600 uppercase">O - Objetivo:</span> {atd.objetivo || atd.evolucaoEnfermagem || atd.testes_rapidos || atd.vacinasAplicadas || 'Não informado'}</div>
                                               <div className="rounded-xl bg-white p-3"><span className="font-black text-blue-600 uppercase">A - Avaliação:</span> {atd.hd || atd.diagnostico || atd.estado_nutricional || atd.categoria_juridica || 'Não informado'}</div>
                                               <div className="rounded-xl bg-white p-3"><span className="font-black text-emerald-600 uppercase">P - Conduta:</span> {atd.plano || atd.acaoJuridica || atd.encaminhamentoSocial || atd.itensEntregues || 'Não informado'}</div>
                                             </div>
                                             {atd.demandaJuridica && <p className="line-clamp-2"><span className="font-black text-gray-500 uppercase">Demanda:</span> {atd.demandaJuridica}</p>}
                                             {atd.itens_entregues_cat && <p className="line-clamp-2"><span className="font-black text-orange-500 uppercase">Doado:</span> {atd.itens_entregues_cat}</p>}
                                             {(area === 'Veterinária' || area === 'Medicina Veterinaria') && atd.vetPets && <p><span className="font-black text-rose-500 uppercase">Pets Atendidos:</span> {atd.vetPets.map(p => p.nome).join(', ')}</p>}
                                          </div>
                                          
                                          {canAccessArea(atd.area) ? (
                                            <button onClick={() => openAtendimento(atd.area, atd)} className="mt-4 text-[8px] font-black text-blue-600 uppercase tracking-widest bg-white border border-blue-100 px-3 py-2 rounded-xl active:scale-95 transition-all w-full flex justify-center items-center gap-1.5 shadow-sm hover:bg-blue-50">
                                              Abrir Ficha Clínica Detalhada <ChevronRight size={12}/>
                                            </button>
                                          ) : (
                                            <p className="mt-4 rounded-xl bg-white px-3 py-2 text-center text-[7px] font-black uppercase tracking-widest text-gray-400">
                                              Registro de outra equipe
                                            </p>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
             );
          })()}

          {/* FORMULÁRIO DE ANAMNESE SOCIAL MASSIVA */}
          {currentView === 'anamnese' && selectedAssistido && (
             <div className="p-4 animate-fade-in pb-32">
                <PatientHeader assistido={selectedAssistido} triagem={triagens.find(t => String(t.assistidoId) === String(selectedAssistido.id))} censo={anamneses.find(a => String(a.assistidoId) === String(selectedAssistido.id))} />
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                   <div className="flex justify-between items-center mb-6 border-b pb-4 text-left">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><FileText size={20}/></div>
                         <h3 className="text-sm font-black text-purple-900 tracking-tighter uppercase italic leading-none">Censo Social</h3>
                      </div>
                      <button onClick={handleBack} className="text-gray-400"><X size={22}/></button>
                   </div>
                   <form onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.target);
                      const censoAtual = anamneses.find(a => String(a.assistidoId) === String(selectedAssistido.id));
                      const id = censoAtual?.id || Date.now().toString();
                      const d = Object.fromEntries(fd);
                      
                      d.programas = fd.getAll('programas').join(', ');
                      d.comorbidades = exclusiveList(fd.getAll('comorbidades'), 'Não há antecedentes');
                      d.psiquiatria = exclusiveList(fd.getAll('psiquiatria'), 'Ausência de diagnóstico');
                      d.drogas = exclusiveList(fd.getAll('drogas'), 'Não faz uso declarado');
                      if (normalizeStr(d.drogas).includes('nao faz uso')) {
                        d.detalhesDrogas = '';
                        d.tabacoQuantidade = '';
                        d.alcoolQuantidade = '';
                        d.outrasSubstanciasDetalhes = '';
                      }
                      d.sintomas_ginec = exclusiveList(fd.getAll('sintomas_ginec'), 'Ausência de sintoma');
                      d.detalhesDrogas = [
                        requiredText(d.tabacoQuantidade) && `Tabaco: ${requiredText(d.tabacoQuantidade)}`,
                        requiredText(d.alcoolQuantidade) && `Álcool: ${requiredText(d.alcoolQuantidade)}`,
                        requiredText(d.outrasSubstanciasDetalhes) && `Outras substâncias: ${requiredText(d.outrasSubstanciasDetalhes)}`,
                      ].filter(Boolean).join(' | ');
                      d.alergiaTipos = fd.getAll('alergiaTipos').join(', ');
                      d.petTipos = fd.getAll('petTipos').join(', ');
                      if (d.temAlergia === 'Não') { d.alergias = ''; d.alergiaTipos = ''; }
                      if (d.temCirurgia === 'Não') d.cirurgias = '';
                      if (d.temPsi === 'Não') d.tratamentoPsi = '';
                      if (d.temPets === 'Não') { d.pets = ''; d.petTipos = ''; }
                      if (d.temMac === 'Não') d.mac = '';
                      if (d.temFreqSaude === 'Não') d.freqSaude = '';
                      const censoDefaultFields = [
                        'moradia', 'motivoRua', 'motivoRuaOutro', 'programas', 'outroPrograma',
                        'convive', 'religiao', 'empregado', 'profissao', 'responsavelPed',
                        'psicomotor', 'vacinaPed', 'drogas', 'detalhesDrogas',
                        'tabacoQuantidade', 'alcoolQuantidade', 'outrasSubstanciasDetalhes', 'vidaSexual',
                        'preservativo', 'menarca', 'coitarca', 'dum', 'papanicolau', 'partos',
                        'cesareas', 'abortos', 'temMac', 'mac', 'planejamentoFamiliar',
                        'sintomas_ginec', 'medsUso', 'comorbidades', 'temAlergia', 'alergiaTipos',
                        'alergias', 'temCirurgia', 'cirurgias', 'temFreqSaude', 'freqSaude',
                        'psiquiatria', 'acessoTerapia', 'temPsi', 'tratamentoPsi', 'apetite',
                        'refeicoes', 'frutas', 'agua', 'semComer', 'temPets', 'petTipos', 'pets',
                      ];
                      const censoData = applyFieldDefaults(d, Object.fromEntries(censoDefaultFields.map(field => [field, 'Não informado'])));
                      const completion = censoCompletion(censoData);
                      const hoje = new Date().toLocaleDateString('pt-BR');
                      const now = Date.now();
                      const censoRecord = {
                        ...censoData,
                        id,
                        assistidoId: selectedAssistido.id,
                        responsavel: userProfile.nome,
                        dataAtu: hoje,
                        localAcao: currentActionLocation.value,
                        unidadeAcao: currentActionLocation.label,
                        preenchimentoStatus: completion.status,
                        preenchimentoPct: completion.percent,
                        registradoEm: censoAtual?.registradoEm || now,
                        atualizadoEm: now,
                      };
                      const assistidoPatch = {
                        ultimoAtendimento: `Censo ${completion.status} em ${hoje}`,
                        ultimoAtendimentoEm: now,
                        chegadaAcaoData: hoje,
                        chegadaAcaoEm: selectedAssistido.chegadaAcaoData === hoje ? selectedAssistido.chegadaAcaoEm : now,
                      };
                      
                      const saved = await saveSafely(
                        async () => {
                          await setDoc(doc(db, 'anamneses', id), censoRecord, { merge: true });
                          await setDoc(doc(db, 'assistidos', selectedAssistido.id), assistidoPatch, { merge: true });
                          syncLocalRecord(setAnamneses, censoRecord);
                          patchLocalAssistido(selectedAssistido.id, assistidoPatch);
                        },
                        completion.percent < 80 ? 'Censo salvo como parcial. Complete as informações pendentes.' : 'Censo gravado.'
                      );
                      if (saved) setCurrentView('ficha');
                   }} onChange={() => setHasUnsavedChanges(true)} className="space-y-6 text-left">
                      
                      {/* 1. Dados Sociais */}
                      <div className="space-y-3">
                        <label className="text-[8px] font-black uppercase text-purple-600 tracking-widest border-l-2 border-purple-600 pl-2">1. Habitação e Realidade Social</label>

                        <div className="mdm-auto-field" data-field-label="Situação de moradia">
                          <select name="moradia" value={formToggles.moradia || ''} onChange={handleToggle} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] bg-white shadow-sm">
                             <option value="">Selecione a situação atual...</option>
                             <option value="Morador de área descoberta">Morador de área descoberta</option>
                             <option value="Endereço fixo">Endereço fixo</option>
                             <option value="Moradias comunitárias">Moradias comunitárias</option>
                             <option value="Abrigos">Abrigos</option>
                          </select>
                        </div>
                        
                        {normalizeStr(formToggles.moradia).includes('area descoberta') && (
                          <>
                            <div className="mdm-auto-field" data-field-label="Motivo de estar em área descoberta">
                              <select name="motivoRua" onChange={handleToggle} value={formToggles.motivoRua || ''} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] bg-white shadow-sm">
                                 <option value="">Selecione o motivo informado...</option>
                                 <option value="Conflito familiar">Conflito familiar</option>
                                 <option value="Desemprego">Desemprego</option>
                                 <option value="Uso de substancias">Uso de substâncias</option>
                                 <option value="Não se aplica">Não se aplica</option>
                                 <option value="Outro">Outro</option>
                              </select>
                            </div>
                            {formToggles.motivoRua === 'Outro' && (
                               <div className="mdm-auto-field" data-field-label="Especifique o outro motivo"><input aria-label="Especifique o outro motivo..." name="motivoRuaOutro" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.motivoRuaOutro} placeholder="" className="w-full p-3 bg-blue-50 text-blue-900 rounded-xl border-none font-bold text-[10px] shadow-inner" /></div>
                            )}
                          </>
                        )}

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                           <p className="text-[7px] font-black uppercase text-gray-500 mb-2">Utilizou algum programa público para não estar mais em área descoberta?</p>
                           <div className="grid grid-cols-2 gap-2">
                             {PROGRAMAS_SOCIAIS.map(p => (
                               <label key={p} className="flex items-center gap-2 text-[8px] font-black text-gray-700">
                                 <input type="checkbox" name="programas" value={p} checked={safeIncludes(formToggles.programas, p)} onChange={handleToggle} className="w-3 h-3 text-purple-600 rounded" /> {p}
                               </label>
                             ))}
                           </div>
                           {safeIncludes(formToggles.programas, 'Outros') && (
                             <div className="mdm-auto-field" data-field-label="Qual outro programa"><input aria-label="Qual outro programa?" name="outroPrograma" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.outroPrograma} placeholder="" className="w-full p-2 mt-2 bg-white rounded-lg text-[9px] shadow-sm border-none" /></div>
                           )}
                        </div>

                        <div className="rounded-2xl border border-purple-100 bg-purple-50/30 p-4">
                          <p className="mb-3 text-[7px] font-black uppercase tracking-widest text-purple-700">Rede, convivência e identificação social</p>
                          <div className="grid grid-cols-2 gap-3">
                             <div className="mdm-auto-field" data-field-label="Com quantas pessoas convive">
                               <input aria-label="Com quantas pessoas convive" name="convive" type="number" inputMode="numeric" min="0" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.convive} placeholder="Ex.: 3" className="w-full p-3 bg-white rounded-xl border border-purple-100 font-bold text-[10px] shadow-sm" />
                             </div>
                             <div className="mdm-auto-field" data-field-label="Religião ou crença">
                               <select name="religiao" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.religiao || 'Não informado'} className="w-full p-3 bg-white rounded-xl border border-purple-100 font-bold text-[10px] shadow-sm">
                                  {RELIGIOES_CENSO.map(item => <option key={item} value={item}>{item}</option>)}
                               </select>
                             </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                          <p className="mb-3 text-[7px] font-black uppercase tracking-widest text-gray-500">Trabalho e ocupação</p>
                          <div className="grid grid-cols-2 gap-3">
                             <div className="mdm-auto-field" data-field-label="Situação de trabalho">
                               <select name="empregado" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.empregado || 'Não'} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-inner">
                                  <option value="Não">Não trabalha no momento</option>
                                  <option value="Sim">Trabalha atualmente</option>
                                  <option value="Informal">Trabalho informal / bicos</option>
                                  <option value="Não sabe informar">Não sabe informar</option>
                               </select>
                             </div>
                             <div className="mdm-auto-field" data-field-label="Função, profissão ou fonte de renda">
                               <input aria-label="Função, profissão ou fonte de renda" name="profissao" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.profissao} placeholder="Ex.: entregador, diarista, aposentado" className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-inner" />
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Pediatria Automática */}
                      {calculateAgeNum(selectedAssistido.dataNascimento) <= 12 && (
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                          <label className="text-[8px] font-black uppercase text-blue-600 tracking-widest border-l-2 border-blue-600 pl-2 flex items-center gap-2"><Baby size={12}/> Pediatria (0 a 12 Anos)</label>
                          <div className="mdm-auto-field" data-field-label="Nome do Responsável"><input aria-label="Nome do Responsável" name="responsavelPed" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.responsavelPed} placeholder="" className="w-full p-3 bg-blue-50/50 rounded-xl border-none font-bold text-xs shadow-sm" /></div>
                          <select name="psicomotor" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.psicomotor} className="w-full p-3 bg-blue-50/50 rounded-xl border-none font-bold text-[10px] bg-white shadow-sm">
                              <option value="">Desenvolvimento Psicomotor...</option>
                              <option value="Adequado para idade">Adequado para idade</option>
                              <option value="Inadequado para Idade">Inadequado para Idade</option>
                           </select>
                           <select name="vacinaPed" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.vacinaPed} className="w-full p-3 bg-blue-50/50 rounded-xl border-none font-bold text-[10px] bg-white shadow-sm">
                              <option value="">Carteira Vacinal em dia?</option>
                              <option value="Sim">Sim</option>
                              <option value="Não">Não</option>
                              <option value="Não sabe responder">Não sabe responder</option>
                           </select>
                        </div>
                      )}

                      {/* 2. Uso de substâncias */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="text-[8px] font-black uppercase text-orange-600 tracking-widest border-l-2 border-orange-600 pl-2">2. Uso de substâncias</label>
                        <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-100">
                           <p className="text-[7px] font-black uppercase text-orange-700 mb-1">Substâncias referidas</p>
                           <p className="mb-3 text-[8px] font-bold leading-snug text-orange-900/70">Marque apenas o que a pessoa informou. Se houver uso, registre frequência, quantidade e contexto.</p>
                           <div className="grid grid-cols-2 gap-2">
                             {LISTA_VICIOS.map(v => (
                               <label key={v} className="flex items-center gap-2 text-[8px] font-black text-gray-700">
                                 <input type="checkbox" name="drogas" value={v} defaultChecked={safeIncludes(anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.drogas, v)} onChange={handleToggle} className="w-3 h-3 text-orange-500 rounded border-gray-300" /> {v}
                               </label>
                             ))}
                           </div>
                        </div>
                        {!normalizeStr(formToggles.drogas || anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.drogas || 'Não faz uso declarado').includes('nao faz uso') && (
                          <div className="space-y-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="mdm-auto-field" data-field-label="Tabaco: quantidade e frequência">
                                <input name="tabacoQuantidade" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.tabacoQuantidade} placeholder="Ex.: 10 cigarros/dia" className="w-full rounded-xl border border-orange-100 bg-orange-50/40 p-3 text-[10px] font-bold shadow-sm" />
                              </div>
                              <div className="mdm-auto-field" data-field-label="Álcool: quantidade e frequência">
                                <input name="alcoolQuantidade" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.alcoolQuantidade} placeholder="Ex.: fins de semana, 4 latas" className="w-full rounded-xl border border-orange-100 bg-orange-50/40 p-3 text-[10px] font-bold shadow-sm" />
                              </div>
                            </div>
                            <div className="mdm-auto-field" data-field-label="Outras substâncias: frequência, quantidade e via de uso">
                              <textarea name="outrasSubstanciasDetalhes" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.outrasSubstanciasDetalhes || anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.detalhesDrogas} placeholder="Ex.: crack diariamente; maconha 2x/semana; não soube informar quantidade" className="w-full p-3 bg-gray-50 rounded-xl border border-orange-100 text-[10px] shadow-inner" rows="3"></textarea>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Saúde Sexual/Ginecológica */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="text-[8px] font-black uppercase text-pink-600 tracking-widest border-l-2 border-pink-600 pl-2">3. Saúde Sexual e Reprodutiva</label>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="mdm-auto-field" data-field-label="Vida sexual ativa">
                             <select name="vidaSexual" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.vidaSexual || 'Não'} className="w-full p-3 bg-white rounded-xl border border-pink-100 font-bold text-[10px] shadow-sm">
                                <option value="Não">Não</option>
                                <option value="Sim">Sim</option>
                                <option value="Não sabe informar">Não sabe informar</option>
                             </select>
                           </div>
                           <div className="mdm-auto-field" data-field-label="Uso de preservativo">
                             <select name="preservativo" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.preservativo || 'Não'} className="w-full p-3 bg-white rounded-xl border border-pink-100 font-bold text-[10px] shadow-sm">
                                <option value="Não">Não</option>
                                <option value="Sim">Sim</option>
                                <option value="Às vezes">Às vezes</option>
                                <option value="Não sabe informar">Não sabe informar</option>
                             </select>
                           </div>
                        </div>
                        {(selectedAssistido.sexo === 'Feminino' || selectedAssistido.sexo === 'Outro') && (
                          <div className="p-4 bg-pink-50/30 rounded-xl border border-pink-100 space-y-3 mt-2">
                            <p className="text-[7px] font-black uppercase text-pink-600">Dados Reprodutivos</p>
                            <div className="grid grid-cols-2 gap-3">
                               <div className="mdm-auto-field" data-field-label="Menarca (idade)">
                                 <input aria-label="Menarca (idade)" name="menarca" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.menarca} placeholder="Ex.: 12" className="w-full p-3 bg-white rounded-lg text-[9px] shadow-sm" />
                               </div>
                               <div className="mdm-auto-field" data-field-label="Coitarca (idade)">
                                 <input aria-label="Coitarca (idade)" name="coitarca" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.coitarca} placeholder="Ex.: 17" className="w-full p-3 bg-white rounded-lg text-[9px] shadow-sm" />
                               </div>
                               <div className="mdm-auto-field" data-field-label="Data da última menstruação">
                                 <input name="dum" type="date" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.dum} title="Data da última menstruação" className="w-full p-3 bg-white rounded-lg text-[9px] shadow-sm" />
                               </div>
                               <div className="mdm-auto-field" data-field-label="Último Papanicolau">
                                 <input aria-label="Último Papanicolau" name="papanicolau" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.papanicolau} placeholder="Ex.: 2024, nunca, não sabe" className="w-full p-3 bg-white rounded-lg text-[9px] shadow-sm" />
                               </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                               <div className="mdm-auto-field" data-field-label="Partos normais"><input aria-label="Partos normais" name="partos" type="number" min="0" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.partos} placeholder="0" className="w-full p-2 bg-white rounded-lg text-[9px] shadow-sm" /></div>
                               <div className="mdm-auto-field" data-field-label="Cesáreas"><input aria-label="Cesáreas" name="cesareas" type="number" min="0" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.cesareas} placeholder="0" className="w-full p-2 bg-white rounded-lg text-[9px] shadow-sm" /></div>
                               <div className="mdm-auto-field" data-field-label="Abortos"><input aria-label="Abortos" name="abortos" type="number" min="0" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.abortos} placeholder="0" className="w-full p-2 bg-white rounded-lg text-[9px] shadow-sm" /></div>
                            </div>
                            <div className="space-y-2">
                               <select name="temMac" value={formToggles.temMac || 'Não'} onChange={handleToggle} className="w-full p-3 bg-white rounded-lg text-[9px] shadow-sm">
                                  <option value="Não">Usa Método Anticoncepcional (MAC)? Não</option>
                                  <option value="Sim">Usa Método Anticoncepcional (MAC)? Sim</option>
                               </select>
                               {formToggles.temMac === 'Sim' && (
                                  <div className="mdm-auto-field" data-field-label="Método anticoncepcional em uso"><input aria-label="Método anticoncepcional em uso" name="mac" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.mac} placeholder="Ex.: DIU, pílula, injetável" className="w-full p-3 bg-white rounded-lg text-[9px] shadow-sm border border-pink-200" /></div>
                               )}
                               <div className="mdm-auto-field" data-field-label="Interesse em planejamento familiar">
                                 <select name="planejamentoFamiliar" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.planejamentoFamiliar} className="w-full p-3 bg-white rounded-lg text-[9px] shadow-sm">
                                    <option value="">Não informado</option>
                                    <option value="Sim">Sim, gostaria</option>
                                    <option value="Não">Não</option>
                                    <option value="Não sabe informar">Não sabe informar</option>
                                 </select>
                               </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                              <p className="text-[7px] font-black uppercase text-pink-600 mb-1">Algum sintoma ginecológico?</p>
                              <div className="grid grid-cols-1 gap-1">
                                {SINTOMAS_GINEC.map(s => (
                                  <label key={s} className="flex items-center gap-2 text-[8px] font-black text-gray-700">
                                    <input type="checkbox" name="sintomas_ginec" value={s} defaultChecked={safeIncludes(anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.sintomas_ginec, s)} className="w-3 h-3 text-pink-600 rounded" /> {s}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 4. Antecedentes e Comorbidades */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="text-[8px] font-black uppercase text-blue-600 tracking-widest border-l-2 border-blue-600 pl-2">4. Antecedentes Clínicos</label>
                        <div className="mdm-auto-field" data-field-label="Faz uso de medicações? (Nomes e doses)"><input aria-label="Faz uso de medicações? (Nomes e doses)" name="medsUso" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.medsUso} placeholder="" className="w-full p-3 bg-blue-50 text-blue-800 rounded-xl border-none font-bold text-xs shadow-inner" /></div>
                        
                        <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100">
                           <p className="text-[7px] font-black uppercase text-blue-600 mb-2">Antecedentes Pessoais (Comorbidades)</p>
                           <div className="grid grid-cols-2 gap-2 h-40 overflow-y-auto pr-2">
                             {LISTA_COMORBIDADES.map(c => (
                               <label key={c} className="flex items-center gap-2 text-[8px] font-black text-gray-700">
                                 <input type="checkbox" name="comorbidades" value={c} defaultChecked={safeIncludes(anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.comorbidades, c)} className="w-3 h-3 text-blue-600 rounded" /> {c}
                               </label>
                             ))}
                           </div>
                        </div>

                        <select name="temAlergia" value={formToggles.temAlergia || 'Não'} onChange={handleToggle} className="w-full p-3 bg-red-50 text-red-800 rounded-xl border-none font-bold text-[10px] shadow-sm">
                           <option value="Não">Possui Alergias? Não</option>
                           <option value="Sim">Possui Alergias? Sim</option>
                        </select>
                        {formToggles.temAlergia === 'Sim' && (
                          <div className="space-y-2 rounded-xl border border-red-100 bg-red-50/40 p-3">
                            <div className="grid grid-cols-2 gap-2">
                              {TIPOS_ALERGIA.map(tipo => (
                                <label key={tipo} className="flex items-center gap-2 text-[8px] font-black text-red-900">
                                  <input type="checkbox" name="alergiaTipos" value={tipo} defaultChecked={safeIncludes(anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.alergiaTipos, tipo)} className="h-3 w-3 rounded text-red-600" /> {tipo}
                                </label>
                              ))}
                            </div>
                            <div className="mdm-auto-field" data-field-label="Especifique a alergia"><input aria-label="Especifique a alergia..." name="alergias" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.alergias} placeholder="" className="w-full p-3 bg-white rounded-xl text-[10px] shadow-sm border border-red-200" /></div>
                          </div>
                        )}

                        <select name="temCirurgia" value={formToggles.temCirurgia || 'Não'} onChange={handleToggle} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-sm">
                           <option value="Não">Cirurgias ou internações prévias? Não</option>
                           <option value="Sim">Cirurgias ou internações prévias? Sim</option>
                        </select>
                        {formToggles.temCirurgia === 'Sim' && (
                           <div className="mdm-auto-field" data-field-label="Especifique as cirurgias/internações"><textarea aria-label="Especifique as cirurgias/internações..." name="cirurgias" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.cirurgias} placeholder="" className="w-full p-3 bg-white rounded-xl text-[10px] shadow-sm border border-gray-200" rows="2"></textarea></div>
                        )}
                        
                        <select name="temFreqSaude" value={formToggles.temFreqSaude || 'Não'} onChange={handleToggle} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-sm">
                           <option value="Não">Frequentou serviço de saúde no último mês? Não</option>
                           <option value="Sim">Frequentou serviço de saúde no último mês? Sim</option>
                        </select>
                        {formToggles.temFreqSaude === 'Sim' && (
                          <div className="mdm-auto-field" data-field-label="Quantas vezes e em qual serviço"><input aria-label="Quantas vezes e em qual serviço?" name="freqSaude" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.freqSaude} placeholder="" className="w-full p-3 bg-white rounded-xl border border-gray-200 font-bold text-[10px] shadow-sm" /></div>
                        )}
                      </div>

                      {/* 5. Transtornos Psiquiátricos */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="text-[8px] font-black uppercase text-purple-600 tracking-widest border-l-2 border-purple-600 pl-2">5. Saúde Mental</label>
                        <div className="bg-purple-50/30 p-4 rounded-2xl border border-purple-100 grid grid-cols-2 gap-2">
                           {LISTA_PSIQUIATRIA.map(c => (
                             <label key={c} className="flex items-center gap-2 text-[8px] font-black text-gray-700">
                               <input type="checkbox" name="psiquiatria" value={c} defaultChecked={safeIncludes(anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.psiquiatria, c)} className="w-3 h-3 text-purple-600 rounded" /> {c}
                             </label>
                           ))}
                        </div>
                        <select name="acessoTerapia" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.acessoTerapia} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] bg-white shadow-sm">
                           <option value="Não">Acesso a Psicólogo/Terapia? Não</option>
                           <option value="Sim">Acesso a Psicólogo: Sim</option>
                        </select>
                        
                        <select name="temPsi" value={formToggles.temPsi || 'Não'} onChange={handleToggle} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-sm">
                           <option value="Não">Faz ou já fez tratamento psiquiátrico? Não</option>
                           <option value="Sim">Faz ou já fez tratamento psiquiátrico? Sim</option>
                        </select>
                        {formToggles.temPsi === 'Sim' && (
                           <div className="mdm-auto-field" data-field-label="Especifique os tratamentos ou medicações"><input aria-label="Especifique os tratamentos ou medicações..." name="tratamentoPsi" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.tratamentoPsi} placeholder="" className="w-full p-3 bg-white rounded-xl text-[10px] shadow-sm border border-purple-200" /></div>
                        )}
                      </div>

                      {/* 6. Nutricional */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="text-[8px] font-black uppercase text-lime-600 tracking-widest border-l-2 border-lime-600 pl-2">6. Segurança Alimentar</label>
                         <div className="mdm-question-field">
                           <label>Apetite atual</label>
                           <select name="apetite" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.apetite} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[9px] bg-white shadow-sm">
                              <option value="">Apetite...</option>
                              <option value="Normal">Normal</option>
                              <option value="Aumentado">Aumentado</option>
                              <option value="Diminuído">Diminuído</option>
                           </select>
                         </div>
                         <div className="mdm-question-field">
                           <label>No último mês, na maioria dos dias, quantas refeições conseguiu fazer por dia?</label>
                           <select name="refeicoes" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.refeicoes} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[9px] bg-white shadow-sm">
                              <option value="">Refeições por dia...</option>
                              <option value="Não comi a maioria dos dias">Não comi a maioria dos dias</option>
                              <option value="Uma vez por dia">1x por dia</option>
                              <option value="Duas vezes">2x por dia</option>
                              <option value="Três">3x por dia</option>
                              <option value="Quatro">4x por dia</option>
                              <option value="Cinco ou mais">5+ por dia</option>
                           </select>
                         </div>
                         <div className="mdm-question-field">
                           <label>No último mês, na maioria dos dias, quantas porções de frutas comeu por dia?</label>
                           <select name="frutas" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.frutas} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[9px] bg-white shadow-sm">
                              <option value="">Frutas por dia...</option>
                              <option value="Não comi a maioria dos dias">Não comi a maioria dos dias</option>
                              <option value="Uma vez por dia">1x por dia</option>
                              <option value="Duas vezes">2x por dia</option>
                              <option value="Três">3x por dia</option>
                              <option value="Quatro">4x por dia</option>
                              <option value="Cinco ou mais">5+ por dia</option>
                           </select>
                         </div>
                         <div className="mdm-question-field">
                           <label>No último mês, quantas garrafas de 500 mL de água costumava beber por dia?</label>
                           <select name="agua" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.agua} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[9px] bg-white shadow-sm">
                              <option value="">Garrafas de água por dia...</option>
                              <option value="Nenhuma">Nenhuma</option>
                              <option value="No máximo uma">No máximo uma</option>
                              <option value="Duas">Duas</option>
                              <option value="Três">Três</option>
                              <option value="Quatro ou mais">Quatro ou mais</option>
                           </select>
                         </div>
                         <div className="mdm-question-field is-risk rounded-2xl border border-red-100 bg-red-50/40 p-3">
                           <label>No último mês, quantas vezes ficou um dia inteiro sem comer por falta de comida ou dinheiro?</label>
                           <select name="semComer" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.semComer} className="w-full p-3 bg-red-50 text-red-800 rounded-xl border-none font-bold text-[10px] shadow-sm">
                             <option value="">Selecione a frequência...</option>
                             <option value="Nenhuma vez">Nenhuma vez</option>
                             <option value="Um dia no mês">Um dia no mês</option>
                             <option value="Dois a tres dias no mes">2 a 3 dias no mês</option>
                             <option value="Um dia por semana">Um dia por semana</option>
                             <option value="Dois ou três dias por semana">2 ou 3 dias por semana</option>
                             <option value="Quase todos os dias">Quase todos os dias</option>
                          </select>
                         </div>
                      </div>

                      {/* 7. Pets */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="text-[8px] font-black uppercase text-rose-600 tracking-widest border-l-2 border-rose-600 pl-2">7. Família Multiespécie</label>
                        <select name="temPets" value={formToggles.temPets || 'Não'} onChange={handleToggle} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-sm">
                           <option value="Não">Tem Animais? Não</option>
                           <option value="Sim">Tem Animais? Sim</option>
                        </select>
                        {formToggles.temPets === 'Sim' && (
                          <div className="space-y-2 rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                            <div className="grid grid-cols-2 gap-2">
                              {TIPOS_PETS.map(tipo => (
                                <label key={tipo} className="flex items-center gap-2 text-[8px] font-black text-rose-900">
                                  <input type="checkbox" name="petTipos" value={tipo} defaultChecked={safeIncludes(anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.petTipos, tipo)} className="h-3 w-3 rounded text-rose-600" /> {tipo}
                                </label>
                              ))}
                            </div>
                            <div className="mdm-auto-field" data-field-label="Quantidade, nome ou outro animal"><input aria-label="Quantidade, nome ou outro animal..." name="pets" defaultValue={anamneses.find(a=>a.assistidoId===selectedAssistido.id)?.pets} placeholder="" className="w-full p-3 bg-white rounded-xl text-[10px] shadow-sm border border-rose-200" /></div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 pt-6 text-center">
                         <button type="button" onClick={handleBack} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-xl uppercase tracking-widest text-[8px] active:scale-95 transition-all">Cancelar</button>
                         <button type="submit" disabled={isSaving} className="flex-[2.5] bg-purple-600 disabled:opacity-60 text-white font-black py-4 rounded-xl shadow-xl uppercase tracking-widest text-[8px] border-b-4 border-purple-800 active:scale-95 transition-all">{isSaving ? 'Salvando...' : 'Salvar Censo Social'}</button>
                      </div>
                   </form>
                </div>
             </div>
          )}

          {/* TRIAGEM E CHECKUP TÉCNICA */}
          {currentView === 'triagem' && selectedAssistido && (() => {
             const hoje = new Date().toLocaleDateString('pt-BR');
             const triagemHoje = triagens.find(t => String(t.assistidoId) === String(selectedAssistido.id) && t.data === hoje);
             const prioridadeAtual = formToggles.prioridadeCuidado || triagemHoje?.prioridadeCuidado || 'Rotina';
             const imcAtual = calculateImc(formToggles.peso || triagemHoje?.peso, formToggles.altura || triagemHoje?.altura);
             const attentionOptions = TRIAGE_ATTENTION_OPTIONS.filter(item => prioridadeAtual === 'Crítica' || !normalizeStr(item).includes('situacao critica'));

             return (
             <div className="p-4 animate-fade-in pb-32 text-left">
                <PatientHeader assistido={selectedAssistido} triagem={triagemHoje} censo={anamneses.find(a => String(a.assistidoId) === String(selectedAssistido.id))} />
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                   <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><HeartPulse size={20}/></div>
                         <h3 className="text-sm font-black text-emerald-900 tracking-tighter uppercase italic leading-none">Triagem</h3>
                      </div>
                      <button onClick={handleBack} className="text-gray-400 p-1"><X size={22}/></button>
                   </div>
                   <form onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.target);
                      const id = triagemHoje?.id || Date.now().toString();
                      const d = Object.fromEntries(fd);
                      d.encaminhamento = fd.getAll('enc').join(', ');
                      d.sinaisAtencao = fd.getAll('sinaisAtencao').join(', ');
                      d.sinaisFisicosAssociados = exclusiveList(fd.getAll('sinaisFisicosAssociados'), 'Ausência de sinal físico relevante');
                      if (d.usaMedicacaoTriagem === 'Sim') {
                        d.medicacaoUso = [requiredText(d.medicacaoFarmaco), requiredText(d.medicacaoDose)].filter(Boolean).join(' - ');
                      } else {
                        d.medicacaoFarmaco = '';
                        d.medicacaoDose = '';
                        d.medicacaoUso = '';
                      }
                      const triagemData = applyFieldDefaults(d, {
                        pa: 'Não informado',
                        fc: 'Não informado',
                        fr: 'Não informado',
                        spo2: 'Não informado',
                        queixaPrincipal: 'Não informado',
                        temperatura: 'Não informado',
                        peso: 'Não informado',
                        altura: 'Não informado',
                        imc: 'Não informado',
                        usaMedicacaoTriagem: 'Não',
                        medicacaoFarmaco: 'Não se aplica',
                        medicacaoDose: 'Não se aplica',
                        medicacaoUso: 'Não se aplica',
                        estadoNutricionalAparente: 'Não informado',
                        sinaisFisicosAssociados: 'Ausência de sinal físico relevante',
                        outroSinalFisicoTriagem: 'Não se aplica',
                        encaminhamento: 'Não informado',
                        prioridadeCuidado: 'Rotina',
                        sinaisAtencao: 'Sem atenção especial informada',
                        observacaoAtencao: 'Sem observação adicional',
                        responsavelPresente: 'Não se aplica',
                        vinculoResponsavel: 'Não se aplica',
                        necessidadesInfantis: 'Não se aplica',
                        observacaoCrianca: 'Não se aplica',
                      });
                      const completion = triageCompletion(triagemData);
                      const now = Date.now();
                      const triagemRecord = {
                        ...triagemData,
                        id,
                        assistidoId: selectedAssistido.id,
                        data: hoje,
                        registradoEm: triagemHoje?.registradoEm || now,
                        atualizadoEm: now,
                        responsavel: userProfile.nome,
                        localAcao: currentActionLocation.value,
                        unidadeAcao: currentActionLocation.label,
                        preenchimentoStatus: completion.status,
                        preenchimentoPct: completion.percent,
                      };
                      const assistidoPatch = {
                        ultimoAtendimento: `Triagem ${completion.status} em ${hoje}`,
                        ultimoAtendimentoEm: now,
                        chegadaAcaoData: hoje,
                        chegadaAcaoEm: selectedAssistido.chegadaAcaoData === hoje ? selectedAssistido.chegadaAcaoEm : now,
                      };
                      
                      const saved = await saveSafely(async () => {
                        await setDoc(doc(db, 'triagens', id), triagemRecord, { merge: true });
                        await setDoc(doc(db, 'assistidos', selectedAssistido.id), assistidoPatch, { merge: true });
                        syncLocalRecord(setTriagens, triagemRecord);
                        patchLocalAssistido(selectedAssistido.id, assistidoPatch);
                      }, 'Triagem salva.');
                      if (saved) setCurrentView('ficha');
                   }} onChange={() => setHasUnsavedChanges(true)} className="space-y-6">

                      <div className="space-y-2 pt-2">
                        <label className="text-[7px] font-black uppercase text-emerald-600 tracking-widest border-l-2 border-emerald-600 pl-2">Queixa principal e medicação</label>
                        <div className="space-y-1">
                          <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-400">Queixa principal</label>
                          <input name="queixaPrincipal" defaultValue={triagemHoje?.queixaPrincipal} maxLength={120} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-inner" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-400">Faz uso de medicação?</label>
                            <select name="usaMedicacaoTriagem" value={formToggles.usaMedicacaoTriagem || 'Não'} onChange={handleToggle} className="w-full p-3 bg-white rounded-xl border border-emerald-100 font-bold text-[10px] shadow-sm">
                              <option value="Não">Não</option>
                              <option value="Sim">Sim</option>
                              <option value="Não sabe informar">Não sabe informar</option>
                            </select>
                          </div>
                          {formToggles.usaMedicacaoTriagem === 'Sim' && (
                            <>
                              <div className="space-y-1">
                                <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-400">Fármaco</label>
                                <input name="medicacaoFarmaco" defaultValue={triagemHoje?.medicacaoFarmaco} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-inner" />
                              </div>
                              <div className="space-y-1 col-span-2">
                                <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-400">Dose, horário ou forma de uso</label>
                                <input name="medicacaoDose" defaultValue={triagemHoje?.medicacaoDose} className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-inner" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-[7px] font-black uppercase text-emerald-600 tracking-widest border-l-2 border-emerald-600 pl-2">Sinais vitais e medidas</label>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="mdm-auto-field" data-field-label="Pressão arterial">
                             <input name="pa" defaultValue={triagemHoje?.pa} aria-label="Pressão arterial" placeholder="Ex.: 120x80" className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-inner" />
                           </div>
                           <div className="mdm-auto-field" data-field-label="Frequência cardíaca">
                             <input name="fc" defaultValue={triagemHoje?.fc} aria-label="Frequência cardíaca" placeholder="BPM" className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-inner" />
                           </div>
                           <div className="mdm-auto-field" data-field-label="Frequência respiratória">
                             <input name="fr" defaultValue={triagemHoje?.fr} aria-label="Frequência respiratória" placeholder="IRPM" className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-inner" />
                           </div>
                           <div className="mdm-auto-field" data-field-label="Saturação de oxigênio">
                             <input name="spo2" defaultValue={triagemHoje?.spo2} aria-label="Saturação de oxigênio" placeholder="%" className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-inner" />
                           </div>
                           <div className="mdm-auto-field" data-field-label="Temperatura">
                             <input name="temperatura" defaultValue={triagemHoje?.temperatura} aria-label="Temperatura" placeholder="°C" className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-inner" />
                           </div>
                           <div className="mdm-auto-field" data-field-label="Peso">
                             <input aria-label="Peso" name="peso" inputMode="decimal" pattern="[0-9,.]*" onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/[^0-9,.]/g, ''); }} onChange={handleToggle} defaultValue={triagemHoje?.peso} placeholder="kg" className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-inner" />
                           </div>
                           <div className="mdm-auto-field" data-field-label="Altura">
                             <input name="altura" onChange={handleToggle} type="number" inputMode="numeric" min="30" max="250" aria-label="Altura" defaultValue={triagemHoje?.altura} placeholder="cm" className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-[10px] shadow-inner" />
                           </div>
                           <div className="mdm-auto-field" data-field-label="IMC calculado">
                             <input name="imc" value={imcAtual || ''} readOnly aria-label="IMC calculado" placeholder="Automático" className="w-full p-3 bg-emerald-50 rounded-xl border border-emerald-100 font-black text-[10px] text-emerald-800 shadow-inner" />
                           </div>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-[1.7rem] border border-blue-100 bg-blue-50/40 p-4 shadow-inner">
                        <label className="text-[7px] font-black uppercase text-blue-700 tracking-widest border-l-2 border-blue-700 pl-2">Estado nutricional e sinais físicos</label>
                        <div className="space-y-1">
                          <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-500">Estado nutricional aparente</label>
                          <select name="estadoNutricionalAparente" defaultValue={triagemHoje?.estadoNutricionalAparente || ''} className="w-full p-3 bg-white rounded-xl border border-blue-100 font-bold text-[10px] shadow-sm">
                            <option value="">Selecione...</option>
                            <option value="Eutrofia">Eutrofia</option>
                            <option value="Baixo peso">Baixo peso</option>
                            <option value="Sobrepeso">Sobrepeso</option>
                            <option value="Obesidade">Obesidade</option>
                            <option value="Não foi possível avaliar">Não foi possível avaliar</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 gap-2 rounded-xl bg-white p-3 shadow-sm">
                          {['Ausência de sinal físico relevante', 'Gordura abdominal aparente', 'Edema aparente (inchaço pernas/pés)', 'Feridas/lesões cutâneas aparentes', 'Perda muscular aparente', 'Sinais aparentes de desidratação', 'Palidez aparente', 'Icterícia'].map(item => (
                            <label key={item} className="flex items-center gap-2 text-[8px] font-black text-gray-700">
                              <input type="checkbox" name="sinaisFisicosAssociados" value={item} defaultChecked={safeIncludes(triagemHoje?.sinaisFisicosAssociados, item)} className="h-3.5 w-3.5 rounded text-blue-600" />
                              {item}
                            </label>
                          ))}
                        </div>
                        <div className="space-y-1">
                          <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-500">Outro sinal físico</label>
                          <input name="outroSinalFisicoTriagem" defaultValue={triagemHoje?.outroSinalFisicoTriagem === 'Não se aplica' ? '' : triagemHoje?.outroSinalFisicoTriagem} className="w-full p-3 bg-white rounded-xl border border-blue-100 font-bold text-[10px] shadow-sm" />
                        </div>
                      </div>

                      <div className="space-y-3 rounded-[1.7rem] border border-amber-200 bg-amber-50/60 p-4 shadow-inner">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                          <div>
                            <label className="text-[8px] font-black uppercase tracking-widest text-amber-800">Atenção inclusiva e segurança</label>
                            <p className="mt-1 text-[8px] font-bold leading-snug text-amber-800">
                              Marque risco, acompanhamento especial, TEA/autismo, deficiência ou vulnerabilidade para priorizar a fila e orientar cuidado seguro.
                            </p>
                          </div>
                        </div>
                        <label className="block text-[7px] font-black uppercase tracking-widest text-amber-800">Classificação de prioridade</label>
                        <select name="prioridadeCuidado" value={prioridadeAtual} onChange={handleToggle} className="w-full rounded-xl border border-amber-200 bg-white p-3 text-[9px] font-bold text-amber-950 shadow-sm">
                          <option value="Rotina">Sem prioridade adicional identificada</option>
                          <option value="Prioridade">Necessita atenção especial / prioridade</option>
                          <option value="Crítica">Situação crítica / atenção imediata</option>
                        </select>
                        <div className="grid grid-cols-1 gap-2 rounded-xl bg-white p-3 shadow-sm">
                          {attentionOptions.map(item => (
                            <label key={item} className="flex items-center gap-2 text-[8px] font-black text-gray-700">
                              <input type="checkbox" name="sinaisAtencao" value={item} defaultChecked={safeIncludes(triagemHoje?.sinaisAtencao, item)} className="h-3.5 w-3.5 rounded text-amber-600" />
                              {item}
                            </label>
                          ))}
                        </div>
                        <div className="mdm-auto-field" data-field-label="Comentário de cuidado: como abordar, comunicação, acompanhante, risco ou suporte necessário"><textarea name="observacaoAtencao" defaultValue={triagemHoje?.observacaoAtencao === 'Sem observação adicional' ? '' : triagemHoje?.observacaoAtencao} rows="3" aria-label="Comentário de cuidado: como abordar, comunicação, acompanhante, risco ou suporte necessário..." placeholder="" className="w-full rounded-xl border border-amber-200 bg-white p-3 text-[9px] font-bold text-gray-700 shadow-sm"></textarea></div>
                      </div>

                      {calculateAgeNum(selectedAssistido.dataNascimento) <= 12 && (
                        <div className="space-y-3 rounded-[1.7rem] border border-sky-200 bg-sky-50/70 p-4 shadow-inner">
                          <label className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-sky-800"><Baby size={14}/> Proteção e acolhimento infantil</label>
                          <p className="text-[8px] font-bold leading-snug text-sky-700">Para crianças, registre responsável e necessidades de conforto ou proteção antes dos atendimentos.</p>
                          <div className="grid grid-cols-2 gap-2">
                            <select name="responsavelPresente" defaultValue={triagemHoje?.responsavelPresente || ''} className="rounded-xl border border-sky-200 bg-white p-3 text-[9px] font-bold">
                              <option value="">Responsável presente?</option>
                              <option value="Sim">Sim</option>
                              <option value="Não">Não</option>
                              <option value="Não informado">Não informado</option>
                            </select>
                            <div className="mdm-auto-field" data-field-label="Vínculo / nome"><input name="vinculoResponsavel" defaultValue={triagemHoje?.vinculoResponsavel === 'Não se aplica' ? '' : triagemHoje?.vinculoResponsavel} aria-label="Vínculo / nome" placeholder="" className="rounded-xl border border-sky-200 bg-white p-3 text-[9px] font-bold" /></div>
                          </div>
                          <div className="mdm-auto-field" data-field-label="Brinquedoteca, ambiente calmo, comunicação, suporte"><input name="necessidadesInfantis" defaultValue={triagemHoje?.necessidadesInfantis === 'Não se aplica' ? '' : triagemHoje?.necessidadesInfantis} aria-label="Brinquedoteca, ambiente calmo, comunicação, suporte..." placeholder="" className="w-full rounded-xl border border-sky-200 bg-white p-3 text-[9px] font-bold" /></div>
                          <div className="mdm-auto-field" data-field-label="Observação de proteção ou acolhimento infantil"><textarea name="observacaoCrianca" defaultValue={triagemHoje?.observacaoCrianca === 'Não se aplica' ? '' : triagemHoje?.observacaoCrianca} rows="2" aria-label="Observação de proteção ou acolhimento infantil..." placeholder="" className="w-full rounded-xl border border-sky-200 bg-white p-3 text-[9px] font-bold"></textarea></div>
                        </div>
                      )}

                      <div className="space-y-2 pt-4 border-t border-gray-100">
                        <label className="text-[7px] font-black uppercase text-blue-600 ml-2">Atendimentos recomendados pela triagem</label>
                        <div className="grid grid-cols-2 gap-2 bg-blue-50/30 p-5 rounded-[2rem] border border-blue-100 shadow-inner">
                          {TODAS_ESPECIALIDADES.map(a => (
                            <label key={a} className="flex items-center gap-3 text-[9px] font-black uppercase text-gray-700 cursor-pointer active:scale-95 transition-all">
                              <input type="checkbox" name="enc" value={a} defaultChecked={safeIncludes(triagemHoje?.encaminhamento, a)} className="w-4 h-4 text-blue-600 rounded border-gray-300 shadow-sm" /> {a}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6">
                         <button type="button" onClick={handleBack} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-xl uppercase tracking-widest text-[8px] active:scale-95 transition-all">Cancelar</button>
                         <button type="submit" disabled={isSaving} className="flex-[2.5] bg-emerald-600 disabled:opacity-60 text-white font-black py-4 rounded-xl shadow-xl uppercase tracking-widest text-[8px] border-b-4 border-emerald-800 active:scale-95 transition-all">{isSaving ? 'Salvando...' : 'Salvar Triagem'}</button>
                      </div>
                   </form>
                </div>
             </div>
             );
          })()}

          {/* ATENDIMENTOS ESPECIALIZADOS */}
          {currentView === 'atendimento' && selectedAssistido && (
             <div className="p-4 animate-fade-in pb-32 text-left">
                <PatientHeader assistido={selectedAssistido} triagem={triagens.find(t => String(t.assistidoId) === String(selectedAssistido.id))} censo={anamneses.find(a => String(a.assistidoId) === String(selectedAssistido.id))} />
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                   <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <div className="flex items-center gap-2">
                         <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                            {getAreaIcon(currentArea)}
                         </div>
                         <h3 className="text-sm font-black text-blue-900 tracking-tighter uppercase italic">{currentArea}</h3>
                      </div>
                      <button onClick={handleBack} className="text-gray-400 p-1"><X size={22}/></button>
                   </div>
                   <form onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.target);
                      const id = selectedAtendimento?.id || Date.now().toString();
                      const canWriteClinical = canWriteArea(currentArea);
                      const allowed = canFinalizeArea(currentArea);
                      const status = allowed ? 'Concluído' : canWriteClinical ? 'Aguardando Profissional' : (selectedAtendimento?.status || 'Observação registrada');
                      
                      let d = Object.fromEntries(fd);
                      if (currentArea === 'Medicina Humana') {
                        d.topicos_queixa = fd.getAll('topicos_queixa').join(', ');
                        d.hd = fd.getAll('hd').join(', ');
                      }
                      if (currentArea === 'Vacinação') {
                        const marcados = fd.getAll('vacinas_aplicadas');
                        const outros = requiredText(fd.get('outras_vacinas'));
                        d.vacinasAplicadas = [...marcados, outros && `Outras: ${outros}`].filter(Boolean).join(', ');
                        d.testes_rapidos = d.vacinasAplicadas;
                      }
                      if (currentArea === 'Biomedicina') {
                        const marcados = fd.getAll('testes_rapidos');
                        const outros = requiredText(fd.get('outros_testes_rapidos'));
                        d.testes_rapidos = [...marcados, outros && `Outros: ${outros}`].filter(Boolean).join(', ');
                        d.laudos = {
                          hiv: fd.get('laudoHiv') || 'Não informado',
                          glicemia: fd.get('glicemia') || 'Não informado',
                          abo: fd.get('abo') || 'Não informado',
                          urina: {
                            leucocitos: fd.get('urinaLeucocitos') || 'Não informado',
                            ph: fd.get('urinaPh') || 'Não informado',
                            densidade: fd.get('urinaDensidade') || 'Não informado',
                            observacoes: fd.get('urinaObs') || 'Não informado',
                          },
                        };
                      }
                      if (currentArea === 'Beleza de Rua') d.servicosBeleza = fd.getAll('servicosBeleza').join(', ');
                      if (currentArea === 'Odontologia') d.quadrantesOdonto = fd.getAll('quadrantesOdonto').join(', ');
                      if (currentArea === 'Justiça de Rua') d.categoria_juridica = fd.getAll('categoria_juridica').join(', ');
                      if (currentArea === 'Doações' || currentArea === 'Doação') d.itens_entregues_cat = fd.getAll('itens_entregues_cat').join(', ');
                      if (currentArea === 'Veterinária' || currentArea === 'Medicina Veterinaria') d.racaoPetEntregue = fd.get('racaoPetEntregue') || 'Não';
                      if (d.precisaFarmacia === 'Não') d.farmacia = '';
                      
                      // Campos específicos de nutrição multi-select
                      if (currentArea === 'Nutrição') {
                        d.sinais_fisicos = fd.getAll('sinais_fisicos').join(', ');
                        d.abordagem_nutri = fd.getAll('abordagem_nutri').join(', ');
                        d.temas_nutri = fd.getAll('temas_nutri').join(', ');
                        d.encExterno = fd.getAll('encExterno').join(', ');
                      }

                      if (!canWriteClinical) {
                        d = {
                          obsGeral: requiredText(fd.get('obsGeral')),
                          comentarioLivre: requiredText(fd.get('obsGeral')),
                        };
                      }

                      const formFieldNames = [...new Set(Array.from(e.currentTarget.elements)
                        .map(el => el.name)
                        .filter(Boolean))]
                        .filter(name => !['photoData', 'tempPhoto'].includes(name));
                      const effectiveFieldNames = canWriteClinical ? formFieldNames : ['obsGeral'];
                      const filledFields = effectiveFieldNames.filter(name => fd.getAll(name).some(value => requiredText(value))).length;
                      const preenchimentoPct = effectiveFieldNames.length ? Math.round((filledFields / effectiveFieldNames.length) * 100) : 0;
                      const now = Date.now();

                      const baseData = {
                         id, assistidoId: selectedAssistido.id, data: new Date().toLocaleDateString('pt-BR'),
                         area: currentArea,
                         localAcao: currentActionLocation.value,
                         unidadeAcao: currentActionLocation.label,
                         ...d, 
                         vetPets: canWriteClinical && (currentArea === 'Veterinária' || currentArea === 'Medicina Veterinaria') ? vetPets : null,
                         extraAtendimento: atendimentoExtra,
                         preenchimentoPct,
                         preenchimentoStatus: completionLabel(preenchimentoPct),
                         status,
                         nomeAcademico: selectedAtendimento?.nomeAcademico || userProfile.nome,
                         nomeProfissional: allowed ? userProfile.nome : (selectedAtendimento?.nomeProfissional || ''),
                         operadorUid: userProfile.uid || user.uid,
                         permissaoRegistro: canWriteClinical ? 'area_autorizada' : 'comentario_livre',
                         registradoEm: selectedAtendimento?.registradoEm || now,
                         atualizadoEm: now,
                      };
                      const data = applyFieldDefaults(baseData, Object.fromEntries(effectiveFieldNames.map(name => [name, 'Não informado'])));
                      const assistidoPatch = {
                        ultimoAtendimento: `${currentArea} em ${data.data}`,
                        ultimoAtendimentoEm: now,
                        chegadaAcaoData: data.data,
                        chegadaAcaoEm: selectedAssistido.chegadaAcaoData === data.data ? selectedAssistido.chegadaAcaoEm : now,
                      };
                      const saved = await saveSafely(
                        async () => {
                          await setDoc(doc(db, 'atendimentos', id), data, { merge: true });
                          await setDoc(doc(db, 'assistidos', selectedAssistido.id), assistidoPatch, { merge: true });
                          syncLocalRecord(setAtendimentos, data);
                          patchLocalAssistido(selectedAssistido.id, assistidoPatch);
                        },
                        allowed ? 'Atendimento finalizado.' : canWriteClinical ? 'Atendimento enviado para validacao.' : 'Observacao registrada no prontuario.'
                      );
                      if (saved) setCurrentView('ficha');
                   }} onChange={() => setHasUnsavedChanges(true)} className="space-y-6 text-left">
                      {!canWriteArea(currentArea) && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                          <p className="text-[8px] font-black uppercase tracking-widest">Leitura liberada + comentário livre</p>
                          <p className="mt-1 text-[8px] font-bold leading-relaxed">
                            Você pode consultar o histórico e registrar observações gerais úteis. Evolução técnica, diagnóstico e conduta ficam com a equipe da área.
                          </p>
                        </div>
                      )}
                      
                      {/* --- MEDICINA HUMANA --- */}
                      {currentArea === 'Medicina Humana' && (
                         <div className="space-y-4">
                             <div className="space-y-3">
                                <label className="text-[7px] font-black uppercase text-gray-400 ml-2">História Clínica Básica</label>
                                <div className="mdm-auto-field" data-field-label="Queixa e duração"><textarea name="qd" defaultValue={selectedAtendimento?.qd} aria-label="Queixa e duração" placeholder="Ex.: dor há 3 dias, início súbito, piora ao caminhar" className="w-full p-4 bg-gray-50 rounded-2xl border-none text-[10px] font-black shadow-inner" rows="3"></textarea></div>
                                
                                <div className="bg-gray-50 p-4 rounded-2xl shadow-inner border border-gray-100">
                                  <p className="text-[7px] font-black text-gray-500 uppercase mb-2">Tópicos da Queixa Principal</p>
                                  <div className="grid grid-cols-2 gap-2">
                                     {TOPICOS_QUEIXA.map(t => (
                                       <label key={t} className="flex items-center gap-2 text-[8px] font-black text-gray-700">
                                         <input type="checkbox" name="topicos_queixa" value={t} defaultChecked={safeIncludes(selectedAtendimento?.topicos_queixa, t)} className="w-3 h-3 text-emerald-600 rounded border-gray-300" /> {t}
                                       </label>
                                     ))}
                                  </div>
                                </div>
                             </div>

                             <div className="space-y-1.5 pt-4 border-t border-gray-100">
                                 <label className="text-[7px] font-black uppercase text-gray-400 ml-4">História Pregressa da Moléstia Atual (HPMA)</label>
                                 <div className="mdm-auto-field" data-field-label="Detalhe a queixa atual"><textarea name="hpma" defaultValue={selectedAtendimento?.hpma} rows="4" aria-label="Detalhe a queixa atual..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner focus:ring-2 focus:ring-blue-100"></textarea></div>
                             </div>
                             <div className="space-y-1.5">
                                 <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Interrogatório Sintomatológico (ISDA)</label>
                                 <div className="mdm-auto-field" data-field-label="Sintomas em outros aparelhos"><textarea name="isda" defaultValue={selectedAtendimento?.isda} rows="3" aria-label="Sintomas em outros aparelhos..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner focus:ring-2 focus:ring-blue-100"></textarea></div>
                             </div>
                             <div className="space-y-1.5">
                                 <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Exame Físico Dirigido (Objetivo)</label>
                                 <div className="mdm-auto-field" data-field-label="Ausculta, Inspeção"><textarea name="objetivo" defaultValue={selectedAtendimento?.objetivo} rows="4" aria-label="Ausculta, Inspeção..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner focus:ring-2 focus:ring-blue-100"></textarea></div>
                             </div>
                         </div>
                      )}

                      {/* --- ENFERMAGEM E CURATIVOS --- */}
                      {(currentArea === 'Curativos' || currentArea === 'Enfermagem / Curativos') && (
                         <div className="space-y-4">
                             <div className="space-y-1.5">
                                 <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Evolução de Enfermagem</label>
                                 <div className="mdm-auto-field" data-field-label="Sinais vitais atuais, estado de consciência, integridade da pele, queixa do paciente"><textarea name="evolucaoEnfermagem" defaultValue={selectedAtendimento?.evolucaoEnfermagem} rows="4" aria-label="Sinais vitais atuais, estado de consciência, integridade da pele, queixa do paciente..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner focus:ring-2 focus:ring-blue-100"></textarea></div>
                             </div>
                             <div className="space-y-1.5">
                                 <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Procedimento / Curativo Realizado</label>
                                 <div className="mdm-auto-field" data-field-label="Descrição do curativo, limpeza, medicação administrada"><textarea name="procedimentoEnfermagem" defaultValue={selectedAtendimento?.procedimentoEnfermagem} rows="3" aria-label="Descrição do curativo, limpeza, medicação administrada..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner focus:ring-2 focus:ring-blue-100"></textarea></div>
                             </div>
                             <div className="space-y-1.5">
                                 <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Materiais Utilizados</label>
                                 <div className="mdm-auto-field" data-field-label="Gaze, soro fisiológico, atadura, pomadas"><textarea name="materiaisEnfermagem" defaultValue={selectedAtendimento?.materiaisEnfermagem} rows="2" aria-label="Gaze, soro fisiológico, atadura, pomadas..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner focus:ring-2 focus:ring-blue-100"></textarea></div>
                             </div>
                         </div>
                      )}

                      {/* ODONTOLOGIA */}
                      {currentArea === 'Odontologia' && (
                         <div className="space-y-4">
                             <div className="space-y-1.5">
                                 <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Dentes Afetados / Odontograma</label>
                                 <div className="mdm-auto-field" data-field-label="Ex: 11, 21, 36"><input name="dentes" defaultValue={selectedAtendimento?.dentes} aria-label="Ex: 11, 21, 36..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner focus:ring-2 focus:ring-blue-100" /></div>
                             </div>
                             <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                               <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                                 <label className="text-[7px] font-black uppercase text-emerald-700">Escala EVA de dor</label>
                                 <input name="evaDor" type="range" min="0" max="10" defaultValue={selectedAtendimento?.evaDor || 0} aria-label="Escala EVA de dor de 0 a 10" className="w-full accent-emerald-600" />
                                 <div className="flex justify-between text-[7px] font-black uppercase tracking-wider text-emerald-900/70">
                                   <span>0 sem dor</span>
                                   <span>10 pior dor</span>
                                 </div>
                               </div>
                               <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
                                 <p className="mb-2 text-[7px] font-black uppercase tracking-widest text-blue-800">Quadrantes odontológicos</p>
                                 <div className="grid grid-cols-2 gap-2">
                                   {[
                                     ['Q1', 'Superior direito'],
                                     ['Q2', 'Superior esquerdo'],
                                     ['Q3', 'Inferior esquerdo'],
                                     ['Q4', 'Inferior direito'],
                                   ].map(([q, label]) => (
                                     <label key={q} className="flex items-start gap-1.5 rounded-lg bg-white px-2 py-2 text-[8px] font-black text-blue-800 shadow-sm">
                                       <input type="checkbox" name="quadrantesOdonto" value={q} defaultChecked={safeIncludes(selectedAtendimento?.quadrantesOdonto, q)} className="mt-0.5 h-3 w-3 rounded text-blue-600" />
                                       <span className="leading-tight"><strong>{q}</strong><br /><span className="text-[6px] font-bold text-blue-500">{label}</span></span>
                                     </label>
                                   ))}
                                 </div>
                               </div>
                             </div>
                             <div className="space-y-1.5">
                                 <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Evolução Odontológica</label>
                                 <div className="mdm-auto-field" data-field-label="Descrição dos achados e procedimentos"><textarea name="subjetivo" defaultValue={selectedAtendimento?.subjetivo} rows="5" aria-label="Descrição dos achados e procedimentos..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner focus:ring-2 focus:ring-blue-100"></textarea></div>
                             </div>
                         </div>
                      )}

                      {/* SAÚDE GERAL (Fisio, Psicologia, etc. Menos Nutrição que é custom) */}
                      {['Psicologia', 'Fisioterapia'].includes(currentArea) && (
                        <div className="space-y-1.5">
                             <label className="text-[7px] font-black uppercase text-gray-400 ml-4">{textosForms.evolucaoLabel || "Evolução Clínica"}</label>
                            <textarea name="subjetivo" aria-label={textosForms.evolucaoPlace || "Relato detalhado"} defaultValue={selectedAtendimento?.subjetivo} rows="6" placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner focus:ring-2 focus:ring-blue-100 leading-relaxed"></textarea>
                        </div>
                      )}
                      {currentArea === 'Fisioterapia' && (
                        <div className="rounded-2xl border border-lime-100 bg-lime-50 p-4">
                          <label className="text-[7px] font-black uppercase text-lime-700">Escala EVA de dor</label>
                          <input name="evaDor" type="range" min="0" max="10" defaultValue={selectedAtendimento?.evaDor || 0} aria-label="Escala EVA de dor de 0 a 10" className="mt-3 w-full accent-lime-600" />
                          <div className="mt-2 flex justify-between text-[7px] font-black uppercase tracking-wider text-lime-900/70">
                            <span>0 sem dor</span>
                            <span>10 pior dor</span>
                          </div>
                        </div>
                      )}
                      {currentArea === 'Psicologia' && (
                        <div className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                          <label className="text-[7px] font-black uppercase text-rose-700">Tipo de conduta</label>
                          <select name="tipoCondutaPsicologia" value={formToggles.tipoCondutaPsicologia || ''} onChange={handleToggle} className="w-full rounded-xl border border-rose-100 bg-white p-3 text-[9px] font-bold text-gray-700">
                            <option value="">Selecione...</option>
                            <option value="Escuta ativa/acolhimento">Escuta ativa/acolhimento</option>
                            <option value="Encaminhamento">Encaminhamento</option>
                            <option value="Aconselhamento psicológico">Aconselhamento psicológico</option>
                          </select>
                          {safeIncludes(formToggles.tipoCondutaPsicologia || selectedAtendimento?.tipoCondutaPsicologia, 'Encaminhamento') && (
                            <select name="encaminhamentoPsicologia" defaultValue={selectedAtendimento?.encaminhamentoPsicologia || ''} className="w-full rounded-xl border border-rose-100 bg-white p-3 text-[9px] font-bold">
                              <option value="">Local de encaminhamento...</option>
                              {LOCAIS_ENCAMINHAMENTO.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                          )}
                          {safeIncludes(formToggles.tipoCondutaPsicologia || selectedAtendimento?.tipoCondutaPsicologia, 'Aconselhamento') && (
                            <select name="temaPsicologia" defaultValue={selectedAtendimento?.temaPsicologia || ''} className="w-full rounded-xl border border-rose-100 bg-white p-3 text-[9px] font-bold">
                              <option value="">Tema trabalhado...</option>
                              {TEMAS_ACONSELHAMENTO.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                          )}
                        </div>
                      )}
                      
                      {/* NUTRIÇÃO FULL CUSTOM */}
                      {currentArea === 'Nutrição' && (
                        <div className="space-y-4">
                             <div className="space-y-1.5">
                                 <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Avaliação Antropométrica e Clínica</label>
                                 <div className="mdm-auto-field" data-field-label="Relato, queixas GI, etc"><textarea name="subjetivo" defaultValue={selectedAtendimento?.subjetivo} rows="4" aria-label="Relato, queixas GI, etc..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner focus:ring-2 focus:ring-blue-100"></textarea></div>
                             </div>
                             
                             <div className="space-y-1.5">
                               <label className="text-[7px] font-black uppercase text-blue-600 ml-2">Estado Nutricional Aparente</label>
                               <select name="estado_nutricional" defaultValue={selectedAtendimento?.estado_nutricional} className="w-full p-4 bg-white rounded-2xl border border-blue-200 font-bold text-[10px] shadow-sm outline-none">
                                 <option value="">Selecione...</option>
                                 <option value="Eutrofia">Eutrofia</option>
                                 <option value="Baixo peso">Baixo peso</option>
                                 <option value="Sobrepeso">Sobrepeso</option>
                                 <option value="Obesidade">Obesidade</option>
                                 <option value="Não foi possível avaliar">Não foi possível avaliar</option>
                               </select>
                               <div className="mdm-auto-field" data-field-label="Se não foi possível avaliar, especifique o porquê"><input name="motivo_nao_avaliado" defaultValue={selectedAtendimento?.motivo_nao_avaliado} aria-label="Se não foi possível avaliar, especifique o porquê..." placeholder="" className="w-full p-3 mt-1 bg-white rounded-xl border border-blue-100 text-[9px] shadow-sm" /></div>
                             </div>
                             
                             <div className="space-y-1.5">
                               <label className="text-[7px] font-black uppercase text-blue-600 ml-2">Sinais físicos associados</label>
                               <div className="grid grid-cols-1 gap-2 bg-white p-4 rounded-2xl border border-blue-200 shadow-sm">
                                 {['Ausência de sinal físico relevante', 'Gordura abdominal aparente', 'Edema aparente (inchaço pernas/pés)', 'Feridas/lesões cutâneas aparentes', 'Perda muscular aparente', 'Sinais aparentes de desidratação (boca/pele ressecada)', 'Palidez aparente', 'Icterícia (pele/olhos amarelados)'].map(t => (
                                   <label key={t} className="flex items-center gap-2 text-[9px] font-black text-gray-700 cursor-pointer">
                                     <input type="checkbox" name="sinais_fisicos" value={t} defaultChecked={safeIncludes(selectedAtendimento?.sinais_fisicos, t)} className="w-4 h-4 text-blue-600 rounded border-gray-300" /> {t}
                                   </label>
                                 ))}
                               </div>
                               <div className="mdm-auto-field" data-field-label="Outro sinal físico (especifique)"><input name="outro_sinal_fisico" defaultValue={selectedAtendimento?.outro_sinal_fisico} aria-label="Outro sinal físico (especifique)..." placeholder="" className="w-full p-3 mt-1 bg-white rounded-xl border border-blue-100 text-[9px] shadow-sm" /></div>
                             </div>
                             
                             <div className="space-y-1.5">
                               <label className="text-[7px] font-black uppercase text-emerald-600 ml-2">Tipo principal de abordagem</label>
                               <div className="grid grid-cols-1 gap-2 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                                 {['Escuta ativa/acolhimento', 'Encaminhamento', 'Aconselhamento'].map(t => (
                                   <label key={t} className="flex items-center gap-2 text-[9px] font-black text-gray-700 cursor-pointer">
                                     <input type="checkbox" name="abordagem_nutri" value={t} checked={safeIncludes(formToggles.abordagemNutri || selectedAtendimento?.abordagem_nutri, t)} onChange={(e) => {
                                        const current = formToggles.abordagemNutri ? formToggles.abordagemNutri.split(',') : (selectedAtendimento?.abordagem_nutri ? selectedAtendimento.abordagem_nutri.split(',') : []);
                                        if (e.target.checked) current.push(t);
                                        else { const idx = current.indexOf(t); if(idx > -1) current.splice(idx, 1); }
                                        setFormToggles(prev => ({...prev, abordagemNutri: current.join(',')}));
                                     }} className="w-4 h-4 text-emerald-600 rounded border-gray-300" /> {t}
                                   </label>
                                 ))}
                               </div>
                             </div>

                             {safeIncludes(formToggles.abordagemNutri || selectedAtendimento?.abordagem_nutri, 'Aconselhamento') && (
                               <div className="space-y-1.5 bg-emerald-100/50 p-4 rounded-2xl border border-emerald-200">
                                 <label className="text-[7px] font-black uppercase text-emerald-800 ml-2">Temas Abordados no Aconselhamento</label>
                                 <div className="grid grid-cols-1 gap-2">
                                   {TEMAS_ACONSELHAMENTO.map(t => (
                                     <label key={t} className="flex items-center gap-2 text-[8px] font-black text-emerald-900 cursor-pointer">
                                       <input type="checkbox" name="temas_nutri" value={t} defaultChecked={safeIncludes(selectedAtendimento?.temas_nutri, t)} className="w-3 h-3 text-emerald-600 rounded border-emerald-300" /> {t}
                                     </label>
                                   ))}
                                 </div>
                                 <div className="mdm-auto-field" data-field-label="Outro tema abordado"><input name="outro_tema_nutri" defaultValue={selectedAtendimento?.outro_tema_nutri} aria-label="Outro tema abordado..." placeholder="" className="w-full p-3 mt-2 bg-white rounded-xl border border-emerald-100 text-[9px] shadow-sm" /></div>
                               </div>
                             )}

                             {safeIncludes(formToggles.abordagemNutri || selectedAtendimento?.abordagem_nutri, 'Encaminhamento') && (
                             <div className="space-y-1.5">
                                  <label className="text-[7px] font-black uppercase text-blue-600 ml-2">Encaminhamento da Nutrição:</label>
                                  <div className="grid grid-cols-1 gap-2 bg-white p-3 rounded-2xl border border-blue-200 shadow-sm">
                                    {LOCAIS_ENCAMINHAMENTO.map(t => (
                                     <label key={t} className="flex items-center gap-2 text-[9px] font-black text-gray-700 cursor-pointer">
                                       <input type="checkbox" name="encExterno" value={t} defaultChecked={safeIncludes(selectedAtendimento?.encExterno, t)} className="w-4 h-4 text-blue-600 rounded border-gray-300" /> {t}
                                     </label>
                                   ))}
                                 </div>
                                  <div className="mdm-auto-field" data-field-label="Outro encaminhamento"><input name="encExterno_outro" defaultValue={selectedAtendimento?.encExterno_outro} aria-label="Outro encaminhamento..." placeholder="" className="w-full p-3 mt-1 bg-white rounded-xl border border-blue-100 text-[9px] shadow-sm" /></div>
                              </div>
                              )}

                             <div className="space-y-1.5">
                                 <label className="text-[7px] font-black uppercase text-blue-600 ml-2">Conduta Nutricional / Observações Adicionais</label>
                                 <div className="mdm-auto-field" data-field-label="Conduta, orientações e observações do atendimento nutricional"><textarea name="plano" defaultValue={selectedAtendimento?.plano} rows="3" aria-label="Conduta, orientações e observações do atendimento nutricional..." placeholder="" className="w-full p-4 bg-white rounded-2xl border border-blue-200 font-bold text-[10px] shadow-sm outline-none"></textarea></div>
                             </div>
                        </div>
                      )}

                      {/* BIOMEDICINA E VACINAÇÃO */}
                      {['Vacinação'].includes(currentArea) && (
                        <div className="space-y-4">
                           <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Procedimentos Realizados / Vacinas</label>
                           <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-inner">
                             {VACINAS_APLICADAS.map(item => (
                               <label key={item} className="flex items-center gap-2 text-[9px] font-black text-gray-700 cursor-pointer">
                                  <input type="checkbox" name="vacinas_aplicadas" value={item} defaultChecked={safeIncludes(selectedAtendimento?.vacinasAplicadas || selectedAtendimento?.testes_rapidos, item)} className="w-4 h-4 text-blue-600 rounded border-gray-300 shadow-sm" /> {item}
                               </label>
                             ))}
                           </div>
                           <div className="mdm-auto-field" data-field-label="Se marcou Outras, descreva quais vacinas"><input name="outras_vacinas" defaultValue={selectedAtendimento?.outras_vacinas || selectedAtendimento?.outros_testes_rapidos} aria-label="Se marcou Outras, descreva quais vacinas..." placeholder="" className="w-full p-4 bg-white rounded-2xl border border-blue-100 font-bold text-[10px] shadow-sm" /></div>
                           <div className="mdm-auto-field" data-field-label="Intercorrências ou observações da vacinação"><textarea name="subjetivo" defaultValue={selectedAtendimento?.subjetivo} rows="3" aria-label="Intercorrências ou observações da vacinação..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner"></textarea></div>
                        </div>
                      )}

                      {['Biomedicina'].includes(currentArea) && (
                        <div className="space-y-4">
                           <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Exames Laboratoriais</label>
                           <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-inner">
                             {['Urina 1/EAS', 'Hemograma', 'Tipagem sanguínea'].map(item => (
                               <label key={item} className="flex items-center gap-2 text-[9px] font-black text-gray-700 cursor-pointer">
                                 <input type="checkbox" name="testes_rapidos" value={item} defaultChecked={safeIncludes(selectedAtendimento?.testes_rapidos, item)} className="w-4 h-4 text-blue-600 rounded border-gray-300 shadow-sm" /> {item}
                               </label>
                             ))}
                           </div>
                           <div className="grid grid-cols-2 gap-2 bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-inner">
                             {['Glicemia', 'HIV', 'Sífilis', 'Teste TB'].map(item => (
                               <label key={item} className="flex items-center gap-2 text-[9px] font-black text-gray-700 cursor-pointer">
                                 <input type="checkbox" name="testes_rapidos" value={item} defaultChecked={safeIncludes(selectedAtendimento?.testes_rapidos, item)} className="w-4 h-4 text-blue-600 rounded border-blue-300 shadow-sm" /> {item}
                               </label>
                             ))}
                           </div>
                           <div className="mdm-auto-field" data-field-label="Outros exames ou testes"><input name="outros_testes_rapidos" defaultValue={selectedAtendimento?.outros_testes_rapidos} aria-label="Outros exames ou testes..." placeholder="" className="w-full p-4 bg-white rounded-2xl border border-blue-100 font-bold text-[10px] shadow-sm" /></div>
                           <div className="grid grid-cols-2 gap-2 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 shadow-inner">
                             <select name="laudoHiv" defaultValue={selectedAtendimento?.laudos?.hiv || selectedAtendimento?.laudoHiv || ''} className="rounded-xl bg-white p-3 text-[9px] font-bold">
                               <option value="">HIV...</option>
                               <option value="Positivo">Positivo</option>
                               <option value="Negativo">Negativo</option>
                               <option value="Inconclusivo">Inconclusivo</option>
                             </select>
                             <div className="mdm-auto-field" data-field-label="Glicemia"><input name="glicemia" type="number" inputMode="decimal" defaultValue={selectedAtendimento?.laudos?.glicemia || selectedAtendimento?.glicemia || ''} aria-label="Glicemia" placeholder="" className="rounded-xl bg-white p-3 text-[9px] font-bold" /></div>
                             <select name="abo" defaultValue={selectedAtendimento?.laudos?.abo || selectedAtendimento?.abo || ''} className="rounded-xl bg-white p-3 text-[9px] font-bold">
                               <option value="">ABO/Rh...</option>
                               <option value="A">A</option>
                               <option value="B">B</option>
                               <option value="AB">AB</option>
                               <option value="O">O</option>
                             </select>
                             <div className="mdm-auto-field" data-field-label="Urina pH"><input name="urinaPh" type="number" step="0.1" inputMode="decimal" defaultValue={selectedAtendimento?.laudos?.urina?.ph || selectedAtendimento?.urinaPh || ''} aria-label="Urina pH" placeholder="" className="rounded-xl bg-white p-3 text-[9px] font-bold" /></div>
                             <div className="mdm-auto-field" data-field-label="Leucócitos"><input name="urinaLeucocitos" defaultValue={selectedAtendimento?.laudos?.urina?.leucocitos || selectedAtendimento?.urinaLeucocitos || ''} aria-label="Leucócitos" placeholder="" className="rounded-xl bg-white p-3 text-[9px] font-bold" /></div>
                             <div className="mdm-auto-field" data-field-label="Densidade"><input name="urinaDensidade" defaultValue={selectedAtendimento?.laudos?.urina?.densidade || selectedAtendimento?.urinaDensidade || ''} aria-label="Densidade" placeholder="" className="rounded-xl bg-white p-3 text-[9px] font-bold" /></div>
                           </div>
                           <div className="mdm-auto-field" data-field-label="Observações da urina/EAS"><textarea name="urinaObs" defaultValue={selectedAtendimento?.laudos?.urina?.observacoes || selectedAtendimento?.urinaObs || ''} rows="2" aria-label="Observações da urina/EAS..." placeholder="" className="w-full p-4 bg-white rounded-2xl border border-cyan-100 font-bold text-[10px] shadow-sm"></textarea></div>
                           <div className="mdm-auto-field" data-field-label="Resultados dos exames e observações (Laudo)"><textarea name="subjetivo" defaultValue={selectedAtendimento?.subjetivo} rows="3" aria-label="Resultados dos exames e observações (Laudo)..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner"></textarea></div>
                        </div>
                      )}

                      {/* TRAVA PARA ÁREAS DE SAÚDE (CONDUTAS/DIAGNÓSTICOS FINAIS) - EXCETO NUTRIÇÃO QUE TEM SEU PROPRIO BLOCO */}
                      {['Medicina Humana', 'Odontologia', 'Fisioterapia', 'Psicologia', 'Enfermagem / Curativos', 'Curativos', 'Biomedicina'].includes(currentArea) && (
                          canFinalizeArea(currentArea) ? (
                            <div className="space-y-5 p-5 bg-blue-50/50 rounded-[2rem] border border-blue-100 animate-scale-up text-left shadow-inner mt-4">
                              
                              {/* Omissão do Diagnóstico para Vacinação e Biomedicina, focado em Medicina e afins */}
                              {currentArea !== 'Biomedicina' && (
                                <div className="space-y-1.5">
                                   <label className="text-[7px] font-black uppercase text-blue-600 ml-2 flex items-center gap-1"><Info size={8}/> {textosForms.diagLabel || "Hipótese Diagnóstica (H.D.)"}</label>
                                   {currentArea === 'Medicina Humana' ? (
                                     <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
                                       {DIAGNOSTICOS_POR_AREA.Medicina.map(p => (
                                         <label key={p} className="flex items-center gap-2 text-[8px] font-black uppercase text-gray-700">
                                           <input type="checkbox" name="hd" value={p} defaultChecked={safeIncludes(selectedAtendimento?.hd || selectedAtendimento?.diagnostico, p)} className="h-4 w-4 rounded text-blue-600" /> {p}
                                         </label>
                                       ))}
                                     </div>
                                   ) : (
                                     <>
                                       <div className="mdm-auto-field" data-field-label="Busque a condicao (opcional)"><input name="hd" list="diag-lista" defaultValue={selectedAtendimento?.hd || selectedAtendimento?.diagnostico} className="w-full p-4 bg-white rounded-2xl border border-blue-200 font-black text-[10px] uppercase outline-none shadow-sm" aria-label="Busque a condicao (opcional)..." placeholder="" /></div>
                                       <datalist id="diag-lista">
                                          {(DIAGNOSTICOS_POR_AREA[currentArea === 'Enfermagem / Curativos' || currentArea === 'Curativos' ? 'Enfermagem' : currentArea] || LISTA_COMORBIDADES).map(p => <option key={p} value={p} />)}
                                       </datalist>
                                     </>
                                   )}
                                   <div className="mdm-auto-field" data-field-label="Outros diagnósticos"><input name="outros_hd" defaultValue={selectedAtendimento?.outros_hd} aria-label="Outros diagnósticos..." placeholder="" className="w-full p-3 mt-1 bg-white rounded-xl border border-blue-100 text-[9px] shadow-sm" /></div>
                                </div>
                              )}

                              {['Medicina Humana', 'Odontologia', 'Fisioterapia', 'Psicologia', 'Enfermagem / Curativos'].includes(currentArea) && (
                                <div className="space-y-1.5">
                                   <label className="text-[7px] font-black uppercase text-blue-600 ml-2">Necessidade de Medicações da Farmácia MDM?</label>
                                   <select name="precisaFarmacia" value={formToggles.farmaciaAtendimento || 'Não'} onChange={(e) => setFormToggles(prev => ({ ...prev, farmaciaAtendimento: e.target.value }))} className="w-full p-3 bg-white rounded-2xl border border-blue-200 font-bold text-[10px] shadow-sm outline-none">
                                     <option value="Não">Não</option>
                                     <option value="Sim">Sim</option>
                                   </select>
                                   {formToggles.farmaciaAtendimento === 'Sim' && (
                                     <div className="mdm-auto-field" data-field-label="Receituário ou posologia para retirada"><input name="farmacia" defaultValue={selectedAtendimento?.farmacia} aria-label="Receituário ou posologia para retirada..." placeholder="" className="w-full p-4 bg-white rounded-2xl border border-blue-200 font-bold text-[10px] shadow-sm outline-none mt-1" /></div>
                                   )}
                                </div>
                              )}

                              {['Medicina Humana', 'Odontologia', 'Fisioterapia', 'Psicologia', 'Enfermagem / Curativos'].includes(currentArea) && (
                                <div className="space-y-1.5">
                                   <label className="text-[7px] font-black uppercase text-blue-600 ml-2">Se Encaminhamento Externo, para onde:</label>
                                   <select name="encExterno" defaultValue={selectedAtendimento?.encExterno} className="w-full p-4 bg-white rounded-2xl border border-blue-200 font-bold text-[10px] shadow-sm outline-none">
                                     <option value="">Não se aplica</option>
                                     {ENCAMINHAMENTOS_EXTERNOS.map(e => <option key={e} value={e}>{e}</option>)}
                                   </select>
                                </div>
                              )}

                              <div className="space-y-1.5">
                                 <label className="text-[7px] font-black uppercase text-blue-600 ml-2">{textosForms.planoLabel || "Conduta Final / Orientações"}</label>
                                  <textarea name="plano" aria-label={textosForms.planoPlace || "Orientações gerais e condutas"} defaultValue={selectedAtendimento?.plano} rows="3" placeholder="" className="w-full p-4 bg-white rounded-2xl border border-blue-200 font-bold text-[10px] shadow-sm outline-none"></textarea>
                              </div>

                              {currentArea === 'Medicina Humana' && (
                                <div className="space-y-1.5 pt-2 border-t border-blue-100">
                                   <label className="text-[7px] font-black uppercase text-blue-600 ml-2 flex items-center gap-1"><UserCheck size={8}/> Médico Formado Responsável</label>
                                   <div className="mdm-auto-field" data-field-label="Nome do Médico"><input name="medicoResponsavel" defaultValue={selectedAtendimento?.medicoResponsavel || userProfile.nome} className="w-full p-4 bg-white rounded-2xl border border-blue-200 font-black text-[10px] uppercase shadow-sm" aria-label="Nome do Médico..." placeholder="" /></div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-orange-50 p-5 rounded-[2rem] border border-orange-100 text-center shadow-sm">
                               <p className="text-[9px] font-black text-orange-700 uppercase tracking-widest flex items-center justify-center gap-2 leading-none"><Clock size={12}/> Aguardando Profissional da Área para Conduta</p>
                            </div>
                          )
                      )}

                      {/* VETERINÁRIA */}
                      {(currentArea === 'Veterinária' || currentArea === 'Medicina Veterinaria') && (
                        <div className="space-y-4">
                           <div className="flex justify-between items-center bg-rose-50 p-3 rounded-2xl border border-rose-100 shadow-sm">
                              <label className="text-[8px] font-black uppercase text-rose-600 flex items-center gap-2 ml-2"><Dog size={12}/> Ficha Clínica Animais</label>
                              <button type="button" onClick={() => setVetPets([...vetPets, { id: Date.now(), nome: '', especie: '', situacao: '', avaliacao: '', conduta: '', diagVet: '' }])} className="text-[8px] font-black uppercase tracking-widest bg-rose-600 text-white px-3 py-2 rounded-xl shadow-md active:scale-95"> + Adicionar Pet</button>
                           </div>
                           <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                             <label className="flex items-center gap-2 text-[8px] font-black uppercase text-amber-800">
                               <input type="checkbox" name="racaoPetEntregue" value="Sim" defaultChecked={selectedAtendimento?.racaoPetEntregue === 'Sim'} className="h-4 w-4 rounded text-amber-600" />
                               Ração pet entregue neste atendimento
                             </label>
                             <div className="mdm-auto-field" data-field-label="Quantidade, tipo ou orientação sobre a ração"><input name="detalheRacaoPet" defaultValue={selectedAtendimento?.detalheRacaoPet || ''} aria-label="Quantidade, tipo ou orientação sobre a ração..." placeholder="" className="mt-3 w-full rounded-xl border border-amber-100 bg-white p-3 text-[9px] font-bold" /></div>
                           </div>
                           {vetPets.map((pet, index) => (
                              <div key={pet.id} className="p-4 border border-rose-100 bg-rose-50/40 rounded-2xl space-y-3 shadow-inner">
                                 <div className="flex gap-2">
                                    <div className="mdm-auto-field" data-field-label="Nome do Pet"><input aria-label="Nome do Pet" placeholder="" value={pet.nome} onChange={e => { const newP = [...vetPets]; newP[index].nome = e.target.value; setVetPets(newP); }} className="w-full p-3 bg-white rounded-xl text-[10px] font-bold border border-rose-100 shadow-sm" /></div>
                                    <div className="mdm-auto-field" data-field-label="Espécie/Raça"><input aria-label="Espécie/Raça" placeholder="" value={pet.especie} onChange={e => { const newP = [...vetPets]; newP[index].especie = e.target.value; setVetPets(newP); }} className="w-full p-3 bg-white rounded-xl text-[10px] font-bold border border-rose-100 shadow-sm" /></div>
                                 </div>
                                 <select value={pet.situacao} onChange={e => { const newP = [...vetPets]; newP[index].situacao = e.target.value; setVetPets(newP); }} className="w-full p-3 bg-white rounded-xl text-[10px] font-bold border border-rose-100 shadow-sm text-gray-700">
                                    <option value="">Status Clínico (Estatística)...</option>
                                    <option value="Saudável">Saudável (Rotina/Vermifugação)</option>
                                    <option value="Doença Leve/Moderada">Doença Leve/Moderada</option>
                                    <option value="Grave / Risco de Óbito">Grave / Risco de Óbito</option>
                                 </select>
                                 <div className="mdm-auto-field" data-field-label="Avaliação Clínica Inicial"><textarea aria-label="Avaliação Clínica Inicial..." placeholder="" value={pet.avaliacao} onChange={e => { const newP = [...vetPets]; newP[index].avaliacao = e.target.value; setVetPets(newP); }} rows="3" className="w-full p-3 bg-white rounded-xl text-[10px] border border-rose-100 shadow-inner"></textarea></div>
                                 {canFinalizeArea(currentArea) && (
                                    <>
                                      <div className="mdm-auto-field" data-field-label="Diagnóstico Veterinário Principal"><input aria-label="Diagnóstico Veterinário Principal..." placeholder="" value={pet.diagVet} onChange={e => { const newP = [...vetPets]; newP[index].diagVet = e.target.value; setVetPets(newP); }} className="w-full p-3 bg-white rounded-xl text-[10px] font-bold border border-rose-200 shadow-sm" /></div>
                                      <div className="mdm-auto-field" data-field-label="Prescrição / Conduta Veterinária (Profissional)"><textarea aria-label="Prescrição / Conduta Veterinária (Profissional)..." placeholder="" value={pet.conduta} onChange={e => { const newP = [...vetPets]; newP[index].conduta = e.target.value; setVetPets(newP); }} rows="3" className="w-full p-3 bg-white rounded-xl text-[10px] border-2 border-rose-300 shadow-sm"></textarea></div>
                                    </>
                                 )}
                              </div>
                           ))}
                           {!canFinalizeArea(currentArea) && (
                             <div className="bg-orange-50 p-4 rounded-[1.5rem] border border-orange-100 text-center shadow-sm">
                               <p className="text-[8px] font-black text-orange-700 uppercase tracking-widest flex items-center justify-center gap-2"><Clock size={10}/> Prescrição restrita ao Médico Veterinário</p>
                             </div>
                           )}
                        </div>
                      )}

                      {/* --- FORMULÁRIO: JUSTIÇA DE RUA --- */}
                      {currentArea === 'Justiça de Rua' && (
                        <div className="space-y-4">
                           <div className="space-y-2">
                             <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Categoria da Demanda (Estatística)</label>
                             <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-2xl shadow-inner border border-gray-100">
                                {CATEGORIAS_JUSTICA.map(t => (
                                  <label key={t} className="flex items-center gap-2 text-[8px] font-black uppercase text-gray-700 cursor-pointer">
                                    <input type="checkbox" name="categoria_juridica" value={t} defaultChecked={safeIncludes(selectedAtendimento?.categoria_juridica, t)} className="w-4 h-4 text-blue-600 rounded border-gray-300 shadow-sm" /> {t}
                                  </label>
                                ))}
                              </div>
                           </div>
                           <div className="mdm-auto-field" data-field-label="Qual a necessidade legal do assistido? (2ª via de doc, benefícios, criminal)"><textarea name="demandaJuridica" defaultValue={selectedAtendimento?.demandaJuridica} rows="4" aria-label="Qual a necessidade legal do assistido? (2ª via de doc, benefícios, criminal...)" placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner"></textarea></div>
                           <div className="mdm-auto-field" data-field-label="Ações Tomadas / Orientações"><textarea name="acaoJuridica" defaultValue={selectedAtendimento?.acaoJuridica} rows="4" aria-label="Ações Tomadas / Orientações..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner"></textarea></div>
                        </div>
                      )}

                      {/* --- FORMULÁRIO: DOAÇÕES --- */}
                      {(currentArea === 'Doações' || currentArea === 'Doação') && (
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                             <label className="text-[7px] font-black uppercase text-orange-600 ml-4">Itens Solicitados na Triagem</label>
                             <div className="mdm-auto-field" data-field-label="O que o assistido pediu? (Roupas, cobertor, kit higiene)"><textarea name="itensSolicitados" defaultValue={selectedAtendimento?.itensSolicitados} rows="2" aria-label="O que o assistido pediu? (Roupas, cobertor, kit higiene...)" placeholder="" className="w-full p-4 bg-orange-50/50 rounded-2xl border border-orange-100 font-bold text-[10px] shadow-inner"></textarea></div>
                           </div>
                           <div className="space-y-2">
                             <label className="text-[7px] font-black uppercase text-emerald-600 ml-4">Itens Entregues (Estatística)</label>
                             <div className="grid grid-cols-2 gap-2 bg-emerald-50 p-4 rounded-2xl shadow-inner border border-emerald-100">
                                {CATEGORIAS_DOACAO.map(t => (
                                  <label key={t} className="flex items-center gap-2 text-[8px] font-black uppercase text-emerald-800 cursor-pointer">
                                    <input type="checkbox" name="itens_entregues_cat" value={t} defaultChecked={safeIncludes(selectedAtendimento?.itens_entregues_cat, t)} className="w-4 h-4 text-emerald-600 rounded border-emerald-300 shadow-sm" /> {t}
                                  </label>
                                ))}
                              </div>
                           </div>
                           <div className="mdm-auto-field" data-field-label="Detalhes (ex: Calça M, Sapato 40)"><textarea name="itensEntregues" defaultValue={selectedAtendimento?.itensEntregues} rows="3" aria-label="Detalhes (ex: Calça M, Sapato 40...)" placeholder="" className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 font-bold text-[10px] shadow-inner"></textarea></div>
                        </div>
                      )}

                      {/* --- FORMULÁRIO: BELEZA DE RUA --- */}
                      {currentArea === 'Beleza de Rua' && (
                        <div className="space-y-4">
                           <label className="text-[7px] font-black uppercase text-pink-600 ml-4">Serviços Estéticos Realizados</label>
                           <div className="grid grid-cols-2 gap-2 bg-pink-50/30 p-4 rounded-2xl border border-pink-100 shadow-inner">
                             {['Corte de Cabelo', 'Barba', 'Sobrancelha', 'Manicure', 'Maquiagem', 'Kit Higiene Pessoal'].map(item => (
                               <label key={item} className="flex items-center gap-2 text-[9px] font-black text-gray-700 cursor-pointer">
                                 <input type="checkbox" name="servicosBeleza" value={item} defaultChecked={safeIncludes(selectedAtendimento?.servicosBeleza, item)} className="w-4 h-4 text-pink-600 rounded border-gray-300 shadow-sm" /> {item}
                               </label>
                             ))}
                           </div>
                           <div className="mdm-auto-field" data-field-label="Mais algum detalhe ou procedimento realizado"><textarea name="detalhesBeleza" defaultValue={selectedAtendimento?.detalhesBeleza} rows="3" aria-label="Mais algum detalhe ou procedimento realizado?" placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner"></textarea></div>
                        </div>
                      )}

                      {/* --- FORMULÁRIO: ACOLHIMENTO SOCIAL --- */}
                      {currentArea === 'Acolhimento Social' && (
                        <div className="space-y-4">
                           <div className="mdm-auto-field" data-field-label="Qual a vulnerabilidade mapeada? (Passagem, abrigo)"><textarea name="demandaSocial" defaultValue={selectedAtendimento?.demandaSocial} rows="4" aria-label="Qual a vulnerabilidade mapeada? (Passagem, abrigo...)" placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner"></textarea></div>
                           <div className="mdm-auto-field" data-field-label="Para qual órgão o assistido foi direcionado"><textarea name="encaminhamentoSocial" defaultValue={selectedAtendimento?.encaminhamentoSocial} rows="3" aria-label="Para qual órgão o assistido foi direcionado?" placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner"></textarea></div>
                        </div>
                      )}

                      {currentArea === 'Apoio à Mulher' && (
                        <div className="space-y-4">
                           <label className="text-[7px] font-black uppercase text-rose-700 ml-4">Acolhimento protegido</label>
                           <div className="mdm-auto-field" data-field-label="Demanda apresentada e cuidado necessário, sem expor detalhes desnecessários"><textarea name="demandaMulher" defaultValue={selectedAtendimento?.demandaMulher} rows="3" aria-label="Demanda apresentada e cuidado necessário, sem expor detalhes desnecessários..." placeholder="" className="w-full p-4 bg-rose-50/60 rounded-2xl border border-rose-100 font-bold text-[10px] shadow-inner"></textarea></div>
                           <select name="riscoMulher" defaultValue={selectedAtendimento?.riscoMulher || 'Não informado'} className="w-full p-4 bg-white rounded-2xl border border-rose-100 font-bold text-[10px] shadow-sm text-gray-700">
                             <option value="Não informado">Risco imediato não informado</option>
                             <option value="Não identificado">Sem risco imediato identificado</option>
                             <option value="Prioridade">Necessita apoio prioritário</option>
                             <option value="Crítico">Risco crítico / acionar rede de proteção</option>
                           </select>
                           <div className="mdm-auto-field" data-field-label="Encaminhamento seguro, rede de apoio ou orientação oferecida"><textarea name="encaminhamentoMulher" defaultValue={selectedAtendimento?.encaminhamentoMulher} rows="3" aria-label="Encaminhamento seguro, rede de apoio ou orientação oferecida..." placeholder="" className="w-full p-4 bg-white rounded-2xl border border-rose-100 font-bold text-[10px] shadow-sm"></textarea></div>
                        </div>
                      )}

                      {['Farmácia', 'Podologia', 'Atendimento Infantil / Brinquedoteca', 'Exames Clínicos', 'Emissão de Documentos'].includes(currentArea) && (
                        <div className="space-y-4">
                           <label className="text-[7px] font-black uppercase text-blue-600 ml-4">Registro direcionado da área</label>
                           <div className="mdm-auto-field" data-field-label="Procedimento, serviço ou orientação realizada"><input name="procedimentoArea" defaultValue={selectedAtendimento?.procedimentoArea} aria-label="Procedimento, serviço ou orientação realizada..." placeholder="" className="w-full p-4 bg-blue-50/60 rounded-2xl border border-blue-100 font-bold text-[10px] shadow-inner" /></div>
                           <div className="mdm-auto-field" data-field-label="Contexto do atendimento, necessidade principal e achados relevantes"><textarea name="subjetivo" defaultValue={selectedAtendimento?.subjetivo} rows="3" aria-label="Contexto do atendimento, necessidade principal e achados relevantes..." placeholder="" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-[10px] shadow-inner"></textarea></div>
                           <div className="mdm-auto-field" data-field-label="Conduta, entrega, orientação ou encaminhamento"><textarea name="plano" defaultValue={selectedAtendimento?.plano} rows="3" aria-label="Conduta, entrega, orientação ou encaminhamento..." placeholder="" className="w-full p-4 bg-white rounded-2xl border border-blue-100 font-bold text-[10px] shadow-sm"></textarea></div>
                        </div>
                      )}

                      {/* OBSERVAÇÃO GERAL (TODAS AS ÁREAS) */}
                      <div className="pt-4 border-t border-gray-100 space-y-1.5">
                         <label className="text-[7px] font-black uppercase text-gray-400 ml-4">Observações Gerais Multidisciplinares</label>
                         <div className="mdm-auto-field" data-field-label="Algo importante para outras áreas saberem (Alerta, risco)"><textarea name="obsGeral" defaultValue={selectedAtendimento?.obsGeral} rows="2" aria-label="Algo importante para outras áreas saberem (Alerta, risco...)?" placeholder="" className="w-full p-4 bg-yellow-50/50 rounded-xl border border-yellow-100 font-bold text-[9px] text-gray-700 shadow-inner"></textarea></div>
                      </div>

                      <div className="flex gap-4 pt-4 text-center">
                         <button type="button" onClick={handleBack} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl uppercase tracking-widest text-[8px] active:scale-95 transition-all">Cancelar</button>
                         <button type="submit" disabled={isSaving} className="flex-[2.5] bg-blue-600 disabled:opacity-60 text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest text-[8px] border-b-4 border-blue-900 active:scale-95 transition-all">
                           {isSaving ? 'Salvando...' : canFinalizeArea(currentArea) ? 'Assinar e Concluir' : canWriteArea(currentArea) ? 'Submeter para Validação' : 'Salvar Observação'}
                         </button>
                      </div>
                   </form>
                </div>
             </div>
          )}

          {/* DASHBOARD INTELIGENTE COM ABAS E EXPORTACAO XLSX */}
          {currentView === 'usuarios' && canViewUsers && (() => {
            const query = normalizeStr(adminUserSearch);
            const listedUsers = managedUsers.filter(managedUser => !query || [
              managedUser.nome, managedUser.email, roleLabel(managedUser.role),
              professionLabel(managedUser.profissao), managedUser.filial,
            ].some(value => normalizeStr(value).includes(query)));

            return (
              <div className="p-4 min-h-screen space-y-4 pb-28 animate-fade-in">
                <div className="flex items-start justify-between gap-3 pt-3">
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.28em] text-gray-400">Controle de acesso</p>
                    <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#111a39]">Usuarios cadastrados</h2>
                    <p className="mt-2 text-[9px] font-bold leading-relaxed text-gray-500">
                      {canPromoteUsers
                        ? 'Administracao: visualize, promova e revogue acessos com registro de auditoria.'
                        : 'Coordenacao: visualize a equipe e revogue apenas acessos subordinados.'}
                    </p>
                  </div>
                  <button type="button" aria-label="Atualizar usuarios" onClick={loadManagedUsers} disabled={isLoadingUsers} className="rounded-xl border border-gray-200 bg-white p-3 text-gray-500 shadow-sm active:scale-95 disabled:opacity-50">
                    <RefreshCw size={16} className={isLoadingUsers ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="relative">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={adminUserSearch} onChange={event => setAdminUserSearch(event.target.value)} placeholder="Pesquisar nome, e-mail ou area" className="w-full rounded-2xl border border-gray-100 bg-white py-4 pl-11 pr-4 text-[10px] font-bold text-gray-700 shadow-sm outline-none focus:border-[#292f63]" />
                </div>

                {canPromoteUsers && (
                  <div className="space-y-4 rounded-[1.7rem] border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[#eef2fb] p-2.5 text-[#292f63]"><MapPin size={16} /></div>
                      <div>
                        <p className="text-[7px] font-black uppercase tracking-[0.28em] text-gray-400">Configuração dinâmica</p>
                        <p className="text-[11px] font-black uppercase text-[#111a39]">Locais de ação e filiais</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[7px] font-black uppercase tracking-widest text-gray-400">Filiais da equipe</p>
                      <div className="flex flex-wrap gap-2">
                        {filiaisEquipe.map(filial => (
                          <button key={filial} type="button" onClick={() => removeFilialSetting(filial)} className="rounded-lg bg-sky-50 px-2 py-1.5 text-[7px] font-black uppercase text-sky-700 active:scale-95">
                            {filial} ×
                          </button>
                        ))}
                      </div>
                      <form onSubmit={addFilialSetting} className="flex gap-2">
                        <div className="mdm-auto-field" data-field-label="Nova filial"><input name="filial" aria-label="Nova filial" placeholder="" className="min-w-0 flex-1 rounded-xl bg-gray-50 p-3 text-[9px] font-bold outline-none" /></div>
                        <button className="rounded-xl bg-[#292f63] px-3 text-[7px] font-black uppercase tracking-widest text-white">Adicionar</button>
                      </form>
                    </div>
                    <div className="space-y-2 border-t border-gray-100 pt-4">
                      <p className="text-[7px] font-black uppercase tracking-widest text-gray-400">Locais de ação</p>
                      <div className="space-y-2">
                        {actionLocations.map(location => (
                          <div key={location.value} className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 p-3">
                            <div className="min-w-0">
                              <p className="truncate text-[9px] font-black uppercase text-[#111a39]">{location.label}</p>
                              <p className="truncate text-[7px] font-bold text-gray-500">{location.city} • {location.neighborhood} • {location.unit}</p>
                            </div>
                            <button type="button" onClick={() => removeActionLocationSetting(location.value)} className="rounded-lg bg-red-50 p-2 text-red-500 active:scale-95" aria-label={`Remover ${location.label}`}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={addActionLocationSetting} className="grid grid-cols-2 gap-2">
                        <div className="mdm-auto-field" data-field-label="Nome do local"><input name="label" aria-label="Nome do local" placeholder="" className="rounded-xl bg-gray-50 p-3 text-[9px] font-bold outline-none" /></div>
                        <div className="mdm-auto-field" data-field-label="Cidade"><input name="city" aria-label="Cidade" placeholder="" className="rounded-xl bg-gray-50 p-3 text-[9px] font-bold outline-none" /></div>
                        <div className="mdm-auto-field" data-field-label="Bairro / praça"><input name="neighborhood" aria-label="Bairro / praça" placeholder="" className="rounded-xl bg-gray-50 p-3 text-[9px] font-bold outline-none" /></div>
                        <div className="mdm-auto-field" data-field-label="Unidade/código"><input name="unit" aria-label="Unidade/código" placeholder="" className="rounded-xl bg-gray-50 p-3 text-[9px] font-bold outline-none" /></div>
                        <button className="col-span-2 rounded-xl bg-[#292f63] py-3 text-[7px] font-black uppercase tracking-widest text-white">Adicionar local de ação</button>
                      </form>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between px-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">{listedUsers.length} usuarios exibidos</p>
                  {userProfile.role === 'coordenador' && <span className="text-[7px] font-black uppercase tracking-wider text-amber-700">Admins protegidos</span>}
                </div>

                {isLoadingUsers && managedUsers.length === 0 ? (
                  <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">Carregando acessos...</div>
                ) : listedUsers.length === 0 ? (
                  <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">Nenhum usuario encontrado.</div>
                ) : listedUsers.map(managedUser => {
                  const isSelf = managedUser.uid === user.uid;
                  const privileged = ['admin', 'coordenador'].includes(managedUser.role);
                  const mayDelete = !isSelf && (canPromoteUsers || !privileged);
                  const isBusy = adminActionUid === managedUser.uid;
                  return (
                    <div key={managedUser.uid} onClick={() => canPromoteUsers && setEditingManagedUser(managedUser)} className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${canPromoteUsers ? 'cursor-pointer active:scale-[0.99]' : ''}`}>
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef2fb] text-[#292f63]">
                          {managedUser.role === 'admin' ? <ShieldCheck size={19} /> : <User size={19} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[11px] font-black uppercase text-gray-900">{managedUser.nome || 'Perfil sem nome'}</p>
                            {isSelf && <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[6px] font-black uppercase text-blue-700">Voce</span>}
                          </div>
                          <p className="truncate text-[9px] font-bold text-gray-500">{managedUser.email || 'E-mail nao informado'}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="rounded-md bg-[#eef2fb] px-2 py-1 text-[7px] font-black uppercase text-[#292f63]">{roleLabel(managedUser.role)}</span>
                            {managedUser.profissao && <span className="rounded-md bg-gray-50 px-2 py-1 text-[7px] font-black uppercase text-gray-500">{professionLabel(managedUser.profissao)}</span>}
                            <span className="rounded-md bg-sky-50 px-2 py-1 text-[7px] font-black uppercase text-sky-700">Filial: {managedUser.filial || 'Santos'}</span>
                            <span className={`rounded-md px-2 py-1 text-[7px] font-black uppercase ${managedUser.emailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {managedUser.emailVerified ? 'E-mail confirmado' : 'Confirmacao pendente'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-50 pt-3">
                        {canPromoteUsers && managedUser.role !== 'coordenador' && (
                          <button type="button" disabled={isBusy || isSelf} onClick={(event) => { event.stopPropagation(); promoteManagedUser(managedUser, 'coordenador'); }} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[7px] font-black uppercase tracking-wider text-gray-600 disabled:opacity-40">
                            Tornar coordenacao
                          </button>
                        )}
                        {canPromoteUsers && managedUser.role !== 'admin' && (
                          <button type="button" disabled={isBusy} onClick={(event) => { event.stopPropagation(); promoteManagedUser(managedUser, 'admin'); }} className="rounded-lg bg-[#292f63] px-3 py-2 text-[7px] font-black uppercase tracking-wider text-white disabled:opacity-40">
                            Tornar admin
                          </button>
                        )}
                        {mayDelete && (
                          <button type="button" disabled={isBusy} title="Revogar acesso" onClick={(event) => { event.stopPropagation(); deleteManagedUser(managedUser); }} aria-label={`Revogar acesso de ${managedUser.email || managedUser.nome}`} className="rounded-lg border border-red-100 bg-red-50 p-2 text-red-600 disabled:opacity-40">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {editingManagedUser && canPromoteUsers && (
                  <div className="fixed inset-0 z-[260] flex items-center justify-center bg-[#111a39]/70 p-5 backdrop-blur-sm">
                    <form onSubmit={updateManagedUser} className="w-full max-w-sm rounded-[2rem] bg-white p-5 shadow-2xl">
                      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                          <p className="text-[7px] font-black uppercase tracking-[0.28em] text-gray-400">Edição administrativa</p>
                          <h3 className="mt-1 text-lg font-black uppercase text-[#111a39]">{editingManagedUser.nome || 'Usuário'}</h3>
                          <p className="mt-1 text-[8px] font-bold text-gray-500">{editingManagedUser.email || 'E-mail não informado'}</p>
                        </div>
                        <button type="button" onClick={() => setEditingManagedUser(null)} className="rounded-xl bg-gray-50 p-2 text-gray-400 active:scale-95"><X size={18} /></button>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="space-y-1">
                          <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-400">Role</label>
                          <select name="role" defaultValue={editingManagedUser.role || 'voluntario_eficiente'} className="w-full rounded-xl bg-gray-50 p-3 text-[10px] font-bold outline-none">
                            <option value="admin">Admin</option>
                            <option value="coordenador">Coordenador</option>
                            <option value="voluntario_eficiente">Voluntário</option>
                            <option value="colaborador_servico">Colaborador de serviço</option>
                            <option value="academico">Acadêmico</option>
                            <option value="profissional_formado">Profissional Formado</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-400">Profissão / atuação</label>
                          <select name="profissao" defaultValue={profileProfession(editingManagedUser) || 'apoio_operacional'} className="w-full rounded-xl bg-gray-50 p-3 text-[10px] font-bold outline-none">
                            {PROFISSOES_CADASTRAVEIS.map(profissao => (
                              <option key={profissao} value={profissao}>{professionLabel(profissao)}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="ml-2 text-[7px] font-black uppercase tracking-widest text-gray-400">Filial da equipe</label>
                          <select name="filial" defaultValue={editingManagedUser.filial || 'Santos'} className="w-full rounded-xl bg-gray-50 p-3 text-[10px] font-bold outline-none">
                            {filiaisEquipe.map(filial => <option key={filial} value={filial}>{filial}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="mt-5 flex gap-3">
                        <button type="button" onClick={() => setEditingManagedUser(null)} className="flex-1 rounded-xl bg-gray-100 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500 active:scale-95">Cancelar</button>
                        <button disabled={adminActionUid === editingManagedUser.uid} className="flex-[2] rounded-xl bg-[#292f63] py-3 text-[8px] font-black uppercase tracking-widest text-white shadow-md disabled:opacity-50">
                          {adminActionUid === editingManagedUser.uid ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          })()}

          {currentView === 'stats' && (() => {
            const diagnosticStats = getEstatisticasReais();
            return (
              <DashboardView
                statTab={statTab}
                setStatTab={setStatTab}
                currentActionLocation={currentActionLocation}
                statsGeral={statsGeral}
                statsAtuacoes={statsAtuacoes}
                statsClinica={statsClinica}
                statsSocial={statsSocial}
                statsVet={statsVet}
                statsDoacoes={statsDoacoes}
                statsJustica={statsJustica}
                diagnosticStats={diagnosticStats}
                queueWaiting={queueWaiting.length}
                queueCritical={queueCritical.length}
                queueFinished={queueFinished.length}
                canExportReports={canExportReports}
                isExporting={isExporting}
                exportDate={exportDate}
                setExportDate={setExportDate}
                exportWorkbook={exportWorkbook}
              />
            );
          })()}

        </main>

        <nav aria-label="Navegação principal" className="bg-white border-t px-3 pt-2 flex justify-around items-center shrink-0 shadow-[0_-12px_24px_rgba(0,0,0,0.08)] rounded-t-[2rem] sticky bottom-0 w-full z-50 min-h-[76px]" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <button aria-label="Início" onClick={() => navigateFromBottom('home')} className={`p-4 rounded-2xl transition-all duration-300 ${currentView === 'home' ? 'bg-[#292f63] text-white shadow-xl -translate-y-1' : 'text-gray-300'}`}>
            <HomeIcon size={20} />
          </button>
          <button aria-label="Pesquisar assistido" onClick={() => navigateFromBottom('busca')} className={`p-4 rounded-2xl transition-all duration-300 ${currentView === 'busca' ? 'bg-[#292f63] text-white shadow-xl -translate-y-1' : 'text-gray-300'}`}>
            <Search size={20} />
          </button>
          {canViewDashboard && (
            <button aria-label="Dashboard por áreas" onClick={() => navigateFromBottom('stats')} className={`p-4 rounded-2xl transition-all duration-300 ${currentView === 'stats' ? 'bg-[#292f63] text-white shadow-xl -translate-y-1' : 'text-gray-300'}`}>
              <PieChart size={20} />
            </button>
          )}
        </nav>
      </div>
    </div>
    </ActionLocationContext.Provider>
  );
}
