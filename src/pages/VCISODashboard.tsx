import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAssessments } from '@/hooks/useAssessments';
import { useRisks } from '@/hooks/useRisks';
import { useControls } from '@/hooks/useControls';
import { useActionPlans } from '@/hooks/useActionPlans';
import { useFrameworks } from '@/hooks/useFrameworks';
import { SecurityPostureScore } from '@/components/dashboard/SecurityPostureScore';
import { TopThreatsWidget } from '@/components/dashboard/TopThreatsWidget';
import { ComplianceRadarChart } from '@/components/dashboard/ComplianceRadarChart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  BarChart3,
  FileText,
  Eye,
} from 'lucide-react';

export default function VCISODashboard() {
  const { organization } = useOrganization();
  const { assessments, isLoading: assessmentsLoading } = useAssessments();
  const { risks, isLoading: risksLoading } = useRisks();
  const { controls, isLoading: controlsLoading } = useControls();
  const { actionPlans, isLoading: plansLoading } = useActionPlans();
  const { frameworks } = useFrameworks();

  const isLoading = assessmentsLoading || risksLoading || controlsLoading || plansLoading;

  // Compute summary metrics
  const overdueCount = actionPlans?.filter(
    (p) => p.status !== 'done' && p.due_date && new Date(p.due_date) < new Date()
  ).length ?? 0;

  const criticalRisks = risks?.filter(
    (r) => r.inherent_probability * r.inherent_impact >= 20
  ) ?? [];

  const completedPlans = actionPlans?.filter((p) => p.status === 'done').length ?? 0;
  const totalPlans = actionPlans?.length ?? 0;
  const planCompletionRate = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  const conformeCount = assessments?.filter((a) => a.status === 'conforme').length ?? 0;
  const complianceRate = assessments && assessments.length > 0
    ? Math.round((conformeCount / assessments.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        <div className="flex items-center gap-2">
          {organization?.logo_url && (
            <img src={organization.logo_url} alt={organization.name} className="h-8 w-auto rounded" />
          )}
          <Badge variant="outline" className="border-amber-500/30 text-amber-500">
            Torre de Controle
          </Badge>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Compliance</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold font-space text-foreground">{complianceRate}%</p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Riscos Críticos</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold font-space text-destructive">{criticalRisks.length}</p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Planos em Atraso</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold font-space text-amber-500">{overdueCount}</p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conclusão de Planos</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold font-space text-foreground">{planCompletionRate}%</p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SecurityPostureScore
          assessments={assessments || []}
          risks={risks || []}
          controls={controls?.map((c) => ({ id: c.id })) || []}
          isLoading={isLoading}
        />
        <ComplianceRadarChart
          assessments={assessments || []}
          controls={controls || []}
          isLoading={isLoading}
        />
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopThreatsWidget risks={risks || []} isLoading={isLoading} />

        {/* Overdue Action Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-space flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Planos de Ação em Atraso
            </CardTitle>
            <CardDescription>Itens que requerem atenção imediata</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : overdueCount === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                <p>Nenhum plano em atraso!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {actionPlans
                  ?.filter((p) => p.status !== 'done' && p.due_date && new Date(p.due_date) < new Date())
                  .slice(0, 5)
                  .map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/40">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{plan.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Vencido em {new Date(plan.due_date!).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="destructive" className="ml-2 flex-shrink-0">Atrasado</Badge>
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
