// Mock data for vCISO module showcase/paywall mode
import { format, subDays, addDays, startOfMonth, addMonths } from 'date-fns';

const today = new Date();
const thisMonth = startOfMonth(today);

// Dashboard metrics
export const MOCK_DASHBOARD = {
  complianceRate: 78,
  criticalRisks: 3,
  overdueCount: 2,
  planCompletionRate: 64,
  acceptedRisks: 1,
  monthHours: 42.5,
};

// KRIs
export const MOCK_KRIS = [
  { id: 'mk1', name: 'Cobertura de MFA (%)', description: 'Percentual de contas com MFA habilitado', current_value: 85, target_value: 100, unit: '%', trend: 'up' as const, severity: 'high', measured_at: today.toISOString(), framework_id: null, sparkline: [60, 65, 72, 78, 82, 85] },
  { id: 'mk2', name: 'Tempo médio de patching (dias)', description: 'Dias para aplicar patches críticos', current_value: 12, target_value: 7, unit: 'dias', trend: 'down' as const, severity: 'critical', measured_at: today.toISOString(), framework_id: null, sparkline: [21, 18, 15, 14, 13, 12] },
  { id: 'mk3', name: 'Sistemas sem backup testado', description: 'Número de sistemas críticos sem backup verificado', current_value: 1, target_value: 0, unit: 'un', trend: 'down' as const, severity: 'high', measured_at: today.toISOString(), framework_id: null, sparkline: [4, 3, 3, 2, 2, 1] },
  { id: 'mk4', name: 'Vulnerabilidades críticas abertas', description: 'CVEs críticos não remediados', current_value: 4, target_value: 0, unit: 'un', trend: 'stable' as const, severity: 'critical', measured_at: today.toISOString(), framework_id: null, sparkline: [8, 6, 5, 5, 4, 4] },
  { id: 'mk5', name: '% Funcionários com treinamento', description: 'Treinamento de conscientização em segurança', current_value: 72, target_value: 95, unit: '%', trend: 'up' as const, severity: 'medium', measured_at: today.toISOString(), framework_id: null, sparkline: [45, 52, 58, 64, 68, 72] },
  { id: 'mk6', name: 'Incidentes de segurança no mês', description: 'Total de incidentes reportados', current_value: 2, target_value: 0, unit: 'un', trend: 'down' as const, severity: 'medium', measured_at: today.toISOString(), framework_id: null, sparkline: [5, 4, 3, 4, 3, 2] },
];

// Roadmap items
export const MOCK_ROADMAP = [
  { id: 'mr1', title: 'Implementação SIEM', description: 'Deploy de solução SIEM para monitoramento contínuo', category: 'security', start_date: format(subDays(today, 60), 'yyyy-MM-dd'), end_date: format(addDays(today, 30), 'yyyy-MM-dd'), status: 'in_progress', priority: 'alta', quarter: `Q${Math.ceil((today.getMonth() + 1) / 3)} ${today.getFullYear()}`, assigned_to: null },
  { id: 'mr2', title: 'Política de Segurança v3', description: 'Revisão completa da política corporativa', category: 'governance', start_date: format(subDays(today, 30), 'yyyy-MM-dd'), end_date: format(addDays(today, 15), 'yyyy-MM-dd'), status: 'in_progress', priority: 'alta', quarter: `Q${Math.ceil((today.getMonth() + 1) / 3)} ${today.getFullYear()}`, assigned_to: null },
  { id: 'mr3', title: 'Certificação ISO 27001', description: 'Preparação para auditoria de certificação', category: 'compliance', start_date: format(addDays(today, 10), 'yyyy-MM-dd'), end_date: format(addDays(today, 120), 'yyyy-MM-dd'), status: 'planned', priority: 'alta', quarter: `Q${Math.ceil((today.getMonth() + 4) / 3)} ${today.getFullYear()}`, assigned_to: null },
  { id: 'mr4', title: 'Treinamento Phishing', description: 'Campanha de simulação de phishing para 100% dos colaboradores', category: 'training', start_date: format(subDays(today, 90), 'yyyy-MM-dd'), end_date: format(subDays(today, 20), 'yyyy-MM-dd'), status: 'done', priority: 'media', quarter: `Q${Math.ceil((today.getMonth()) / 3 || 1)} ${today.getFullYear()}`, assigned_to: null },
  { id: 'mr5', title: 'Hardening de Servidores', description: 'Aplicação de baselines CIS em toda infraestrutura', category: 'infrastructure', start_date: format(addDays(today, 20), 'yyyy-MM-dd'), end_date: format(addDays(today, 80), 'yyyy-MM-dd'), status: 'planned', priority: 'media', quarter: `Q${Math.ceil((today.getMonth() + 3) / 3)} ${today.getFullYear()}`, assigned_to: null },
  { id: 'mr6', title: 'Plano de Continuidade BIA', description: 'Business Impact Analysis completo', category: 'continuity', start_date: format(subDays(today, 45), 'yyyy-MM-dd'), end_date: format(addDays(today, 5), 'yyyy-MM-dd'), status: 'in_progress', priority: 'alta', quarter: `Q${Math.ceil((today.getMonth() + 1) / 3)} ${today.getFullYear()}`, assigned_to: null },
  { id: 'mr7', title: 'WAF + DDoS Protection', description: 'Implementação de WAF e proteção anti-DDoS', category: 'security', start_date: format(addDays(today, 45), 'yyyy-MM-dd'), end_date: format(addDays(today, 100), 'yyyy-MM-dd'), status: 'planned', priority: 'media', quarter: `Q${Math.ceil((today.getMonth() + 4) / 3)} ${today.getFullYear()}`, assigned_to: null },
  { id: 'mr8', title: 'Gestão de Acessos PAM', description: 'Deploy de solução de gerenciamento de acesso privilegiado', category: 'security', start_date: format(subDays(today, 120), 'yyyy-MM-dd'), end_date: format(subDays(today, 30), 'yyyy-MM-dd'), status: 'done', priority: 'alta', quarter: `Q${Math.ceil((today.getMonth() - 1) / 3 || 1)} ${today.getFullYear()}`, assigned_to: null },
];

// Diário entries
export const MOCK_DIARIO = [
  { id: 'md1', title: 'Reunião comitê de segurança', description: 'Apresentação do relatório trimestral de riscos para a diretoria. Discussão sobre investimentos em cibersegurança.', category: 'reuniao', entry_date: format(subDays(today, 1), 'yyyy-MM-dd'), hours_spent: 2 },
  { id: 'md2', title: 'Parecer técnico sobre fornecedor Cloud', description: 'Análise de due diligence do novo fornecedor de cloud computing. Revisão de certificações e compliance.', category: 'parecer', entry_date: format(subDays(today, 2), 'yyyy-MM-dd'), hours_spent: 3 },
  { id: 'md3', title: 'Aprovação da nova política de senhas', description: 'Revisão final e aprovação da política de senhas corporativa v2.1.', category: 'aprovacao', entry_date: format(subDays(today, 3), 'yyyy-MM-dd'), hours_spent: 1 },
  { id: 'md4', title: 'Tratamento de incidente phishing', description: 'Análise e contenção de campanha de phishing direcionada. 3 contas comprometidas foram bloqueadas.', category: 'incidente', entry_date: format(subDays(today, 4), 'yyyy-MM-dd'), hours_spent: 4 },
  { id: 'md5', title: 'Workshop LGPD para RH', description: 'Treinamento sobre tratamento de dados pessoais de colaboradores conforme LGPD.', category: 'treinamento', entry_date: format(subDays(today, 5), 'yyyy-MM-dd'), hours_spent: 3 },
  { id: 'md6', title: 'Auditoria de acessos críticos', description: 'Revisão trimestral dos acessos privilegiados a sistemas financeiros e de infraestrutura.', category: 'auditoria', entry_date: format(subDays(today, 7), 'yyyy-MM-dd'), hours_spent: 4 },
  { id: 'md7', title: 'Reunião board executivo', description: 'Apresentação do dashboard de cyber risk para C-Level. KPIs e plano de ação Q2.', category: 'reuniao', entry_date: format(subDays(today, 8), 'yyyy-MM-dd'), hours_spent: 2 },
  { id: 'md8', title: 'Parecer sobre solução EDR', description: 'Comparativo técnico entre CrowdStrike, SentinelOne e Microsoft Defender for Endpoint.', category: 'parecer', entry_date: format(subDays(today, 10), 'yyyy-MM-dd'), hours_spent: 5 },
  { id: 'md9', title: 'Simulação de tabletop exercise', description: 'Condução de exercício tabletop de resposta a ransomware com equipes de TI e operações.', category: 'treinamento', entry_date: format(subDays(today, 12), 'yyyy-MM-dd'), hours_spent: 6 },
  { id: 'md10', title: 'Validação de backup restore', description: 'Teste de restauração do ambiente de produção principal com sucesso em 2h14min.', category: 'outro', entry_date: format(subDays(today, 14), 'yyyy-MM-dd'), hours_spent: 3 },
];

// Continuity tests
export const MOCK_CONTINUITY_TESTS = [
  { id: 'mt1', title: 'Tabletop Ransomware', test_type: 'tabletop', scheduled_date: format(addDays(today, 12), 'yyyy-MM-dd'), executed_date: null, status: 'agendado', description: 'Simulação de cenário de ataque ransomware com envolvimento de TI, operações e diretoria.', lessons_learned: null, report_url: null, conducted_by: null },
  { id: 'mt2', title: 'Restore de Backup Produção', test_type: 'restore', scheduled_date: format(addDays(today, 25), 'yyyy-MM-dd'), executed_date: null, status: 'agendado', description: 'Teste completo de restore do banco de dados de produção principal.', lessons_learned: null, report_url: null, conducted_by: null },
  { id: 'mt3', title: 'BIA - Área Financeira', test_type: 'bia', scheduled_date: format(subDays(today, 10), 'yyyy-MM-dd'), executed_date: format(subDays(today, 10), 'yyyy-MM-dd'), status: 'concluido', description: 'Business Impact Analysis da área financeira e tesouraria.', lessons_learned: 'RTO de 4h é viável com a infraestrutura atual. RPO precisa reduzir de 24h para 4h.', report_url: null, conducted_by: null },
  { id: 'mt4', title: 'Failover de Datacenter', test_type: 'failover', scheduled_date: format(addDays(today, 45), 'yyyy-MM-dd'), executed_date: null, status: 'agendado', description: 'Teste de failover completo para o datacenter secundário.', lessons_learned: null, report_url: null, conducted_by: null },
];

// Risks for risk register
export const MOCK_RISKS = [
  { id: 'mrk1', code: 'RSK-001', title: 'Ataque Ransomware em infraestrutura crítica', category: 'Cibernético', inherent_probability: 4, inherent_impact: 5, treatment: 'mitigar', treatment_plan: 'Implementação de EDR, backups imutáveis e segmentação de rede' },
  { id: 'mrk2', code: 'RSK-002', title: 'Vazamento de dados pessoais (LGPD)', category: 'Regulatório', inherent_probability: 3, inherent_impact: 5, treatment: 'mitigar', treatment_plan: 'DLP, criptografia e classificação de dados' },
  { id: 'mrk3', code: 'RSK-003', title: 'Indisponibilidade do ERP por mais de 4h', category: 'Operacional', inherent_probability: 3, inherent_impact: 4, treatment: 'mitigar', treatment_plan: 'HA, monitoramento e runbook de incidentes' },
  { id: 'mrk4', code: 'RSK-004', title: 'Acesso não autorizado por credenciais comprometidas', category: 'Cibernético', inherent_probability: 4, inherent_impact: 4, treatment: 'mitigar', treatment_plan: 'MFA obrigatório, PAM e monitoramento de comportamento' },
  { id: 'mrk5', code: 'RSK-005', title: 'Não conformidade com normas setoriais', category: 'Compliance', inherent_probability: 2, inherent_impact: 4, treatment: 'aceitar', treatment_plan: '[ACEITE FORMAL] Risco aceito pela diretoria — orçamento será alocado em Q3' },
  { id: 'mrk6', code: 'RSK-006', title: 'Falha no fornecedor crítico de cloud', category: 'Terceiros', inherent_probability: 2, inherent_impact: 5, treatment: 'transferir', treatment_plan: 'Contrato com SLA de 99.95%, penalidades e plano de saída' },
];
