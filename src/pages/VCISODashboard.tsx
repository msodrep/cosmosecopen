import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAssessments } from '@/hooks/useAssessments';
import { useRisks, calculateRiskLevel } from '@/hooks/useRisks';
import { useControls } from '@/hooks/useControls';
import { useActionPlans } from '@/hooks/useActionPlans';
import { useKRIs } from '@/hooks/useKRIs';
import { useRoadmapItems } from '@/hooks/useRoadmapItems';
import { useContinuityTests } from '@/hooks/useContinuityTests';
import { useVCISOLogEntries } from '@/hooks/useVCISOLogEntries';
import { usePermissions } from '@/hooks/usePermissions';
import { SecurityPostureScore } from '@/components/dashboard/SecurityPostureScore';
import { TopThreatsWidget } from '@/components/dashboard/TopThreatsWidget';
import { ComplianceRadarChart } from '@/components/dashboard/ComplianceRadarChart';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { startOfMonth, endOfMonth, isWithinInterval, isPast, parseISO } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MOCK_DASHBOARD, MOCK_KRIS, MOCK_ROADMAP, MOCK_CONTINUITY_TESTS } from '@/lib/vciso-mock-data';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus as MinusIcon,
  Clock,
  CheckCircle2,
  Eye,
  Activity,
  Map,
  ShieldCheck,
  BookOpen,
  Stamp,
  CalendarIcon,
  ArrowRight,
} from 'lucide-react';

export default function VCISODashboard() {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const { isCLevel } = usePermissions();
  const { isDemo } = (useOutletContext() || {}) as { isDemo?: boolean };
  const assessmentsQuery = useAssessments();
  const risksQuery = useRisks({ filterByFramework: false });
  const controlsQuery = useControls();
  const actionPlansQuery = useActionPlans();
  const krisQuery = useKRIs();
  const roadmapQuery = useRoadmapItems();
  const testsQuery = useContinuityTests();
  const logQuery = useVCISOLogEntries();

  const assessments = assessmentsQuery.data || [];
  const risks = risksQuery.data || [];
  const controls = controlsQuery.data || [];
  const actionPlans = actionPlansQuery.data || [];
  const kris = isDemo ? MOCK_KRIS : (krisQuery.data || []);
  const roadmapItems = isDemo ? MOCK_ROADMAP : (roadmapQuery.data || []);
  const tests = isDemo ? MOCK_CONTINUITY_TESTS : (testsQuery.data || []);
  const logEntries = logQuery.data || [];

  const isLoading = isDemo ? false : (assessmentsQuery.isLoading || risksQuery.isLoading || controlsQuery.isLoading || actionPlansQuery.isLoading);

  // Metrics
  const overdueCount = isDemo ? MOCK_DASHBOARD.overdueCount : actionPlans.filter(
    (p) => p.status !== 'done' && p.due_date && new Date(p.due_date) < new Date()
  ).length;

  const criticalRisks = isDemo
    ? Array(MOCK_DASHBOARD.criticalRisks).fill(null)
    : risks.filter((r) => calculateRiskLevel(r.inherent_probability, r.inherent_impact) >= 20);

  const completedPlans = actionPlans.filter((p) => p.status === 'done').length;
  const totalPlans = actionPlans.length;
  const planCompletionRate = isDemo ? MOCK_DASHBOARD.planCompletionRate : (totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0);

  const conformeCount = assessments.filter((a) => a.status === 'conforme').length;
  const complianceRate = isDemo ? MOCK_DASHBOARD.complianceRate : (assessments.length > 0
    ? Math.round((conformeCount / assessments.length) * 100) : 0);

  const acceptedRisks = isDemo ? Array(MOCK_DASHBOARD.acceptedRisks).fill(null) : risks.filter(r => r.treatment === 'aceitar');

  // KRIs - top 3 critical
  const topKRIs = useMemo(() => {
    return [...kris]
      .sort((a, b) => {
        const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
      })
      .slice(0, 3);
  }, [kris]);

  // Roadmap summary
  const roadmapStats = useMemo(() => {
    const done = roadmapItems.filter(i => i.status === 'done').length;
    const inProgress = roadmapItems.filter(i => i.status === 'in_progress').length;
    const total = roadmapItems.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const nextMilestones = roadmapItems
      .filter(i => i.status !== 'done' && i.end_date)
      .sort((a, b) => a.end_date.localeCompare(b.end_date))
      .slice(0, 2);
    return { done, inProgress, total, pct, nextMilestones };
  }, [roadmapItems]);

  // Tests upcoming
  const upcomingTests = useMemo(() => {
    return tests
      .filter(t => t.status === 'agendado')
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
      .slice(0, 3);
  }, [tests]);

  const overdueTests = tests.filter(t => t.status === 'agendado' && isPast(parseISO(t.scheduled_date))).length;

  // vCISO hours this month
  const monthHours = useMemo(() => {
    if (isDemo) return MOCK_DASHBOARD.monthHours;
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return logEntries
      .filter(e => isWithinInterval(new Date(e.entry_date), { start, end }))
      .reduce((acc, e) => acc + (e.hours_spent || 0), 0);
  }, [logEntries, isDemo]);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-destructive" />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />;
    return <MinusIcon className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {organization?.logo_url && (
            <img src={organization.logo_url} alt={organization.name} className="h-10 w-auto rounded-lg border border-border/50" />
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Eye className="w-6 h-6 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold font-space">Painel Executivo vCISO</h1>
            </div>
            <p className="text-muted-foreground">
              Visão consolidada de segurança, riscos e compliance para {organization?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCLevel && (
            <Badge variant="outline" className="border-blue-500/30 text-blue-500">
              👁 Modo Leitura
            </Badge>
          )}
          <Badge variant="outline" className="border-amber-500/30 text-amber-500">
            Torre de Controle
          </Badge>
        </div>
      </div>

      {/* Quick Metrics - 6 cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {([
          { label: 'Compliance', value: `${complianceRate}%`, icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
          { label: 'Riscos Críticos', value: criticalRisks.length, icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
          { label: 'Planos Atrasados', value: overdueCount, icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
          { label: 'Conclusão Planos', value: `${planCompletionRate}%`, icon: TrendingUp, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
          { label: 'Aceites Formais', value: acceptedRisks.length, icon: Stamp, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
          { label: 'Horas vCISO (mês)', value: monthHours.toFixed(1), icon: BookOpen, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
        ] as const).map((m) => (
          <Card key={m.label} className="border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{m.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-12 mt-1" />
                  ) : (
                    <p className={`text-xl font-bold font-space ${m.color}`}>{m.value}</p>
                  )}
                </div>
                <div className={`p-1.5 rounded-lg ${m.bgColor}`}>
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SecurityPostureScore
          assessments={assessments}
          risks={risks}
          controls={controls.map((c) => ({ id: c.id }))}
          isLoading={isLoading}
        />
        <ComplianceRadarChart
          assessments={assessments}
          controls={controls}
          isLoading={isLoading}
        />
      </div>

      {/* Middle Section - KRIs + Roadmap */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top KRIs Widget */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-space flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                KRIs Prioritários
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/vciso/kris')}>
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <CardDescription>{kris.length} indicadores monitorados</CardDescription>
          </CardHeader>
          <CardContent>
            {krisQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}</div>
            ) : topKRIs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum KRI cadastrado</p>
            ) : (
              <div className="space-y-3">
                {topKRIs.map(kri => {
                  const progressPct = kri.target_value > 0 ? Math.min(100, Math.round((kri.current_value / kri.target_value) * 100)) : 0;
                  const sevColors: Record<string, string> = {
                    critical: 'border-l-destructive',
                    high: 'border-l-orange-500',
                    medium: 'border-l-amber-500',
                    low: 'border-l-blue-500',
                  };
                  return (
                    <div key={kri.id} className={`p-3 rounded-lg border border-border/50 border-l-4 ${sevColors[kri.severity] || 'border-l-muted'} bg-card/40`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate flex-1">{kri.name}</span>
                        <TrendIcon trend={kri.trend} />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold font-space">{kri.current_value}<span className="text-xs text-muted-foreground ml-0.5">{kri.unit}</span></span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progressPct >= 80 ? 'bg-emerald-500' : progressPct >= 50 ? 'bg-amber-500' : 'bg-destructive'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{kri.target_value}{kri.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roadmap Summary Widget */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-space flex items-center gap-2">
                <Map className="w-5 h-5 text-amber-500" />
                Roadmap Estratégico
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/vciso/roadmap')}>
                Ver detalhes <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {roadmapQuery.isLoading ? (
              <Skeleton className="h-24" />
            ) : roadmapStats.total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum item no roadmap</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Concluídos</p>
                    <p className="text-xl font-bold font-space text-emerald-500">{roadmapStats.done}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Em Andamento</p>
                    <p className="text-xl font-bold font-space text-amber-500">{roadmapStats.inProgress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold font-space">{roadmapStats.total}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso Geral</span>
                    <span>{roadmapStats.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${roadmapStats.pct}%` }} />
                  </div>
                </div>
                {roadmapStats.nextMilestones.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Próximos marcos</p>
                    {roadmapStats.nextMilestones.map(m => (
                      <div key={m.id} className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="truncate flex-1">{m.title}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(m.end_date), 'dd/MM', { locale: ptBR })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Threats + Tests + Overdue Plans */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TopThreatsWidget risks={risks} isLoading={isLoading} />

        {/* Upcoming Tests Widget */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-space flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Testes de Continuidade
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/vciso/continuidade')}>
                Ver <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            {overdueTests > 0 && (
              <Badge variant="destructive" className="text-xs w-fit">{overdueTests} atrasado{overdueTests > 1 ? 's' : ''}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {testsQuery.isLoading ? (
              <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-10" />)}</div>
            ) : upcomingTests.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum teste agendado</p>
            ) : (
              <div className="space-y-2">
                {upcomingTests.map(test => (
                  <div key={test.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-card/40">
                    <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{test.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(parseISO(test.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Plans */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-space flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Planos em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-10" />)}</div>
            ) : overdueCount === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-500" />
                <p className="text-xs text-muted-foreground">Nenhum plano em atraso!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {actionPlans
                  .filter((p) => p.status !== 'done' && p.due_date && new Date(p.due_date) < new Date())
                  .slice(0, 5)
                  .map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-card/40">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{plan.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Vencido em {new Date(plan.due_date!).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="destructive" className="ml-2 flex-shrink-0 text-[10px]">Atrasado</Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
