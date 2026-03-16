import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Shield, CheckCircle2, Stamp, Clock, History, Filter } from 'lucide-react';
import { useRisks, Risk, calculateRiskLevel, getRiskLevelLabel, TREATMENT_OPTIONS } from '@/hooks/useRisks';
import { useOutletContext } from 'react-router-dom';
import { MOCK_RISKS } from '@/lib/vciso-mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RiskMatrix } from '@/components/riscos/RiskMatrix';
import { cn } from '@/lib/utils';

export default function VCISORiscos() {
  const { data: risks, isLoading: _isLoading } = useRisks({ filterByFramework: false });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isDemo } = (useOutletContext() || {}) as { isDemo?: boolean };
  const isLoading = isDemo ? false : _isLoading;
  const allRisks = isDemo ? (MOCK_RISKS as unknown as Risk[]) : (risks || []);
  const [acceptDialog, setAcceptDialog] = useState<Risk | null>(null);
  const [justification, setJustification] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [treatmentFilter, setTreatmentFilter] = useState<string>('all');
  const [showTimeline, setShowTimeline] = useState(false);

  // Fetch acceptance audit logs directly
  const { data: acceptanceLogs = [] } = useQuery({
    queryKey: ['risk-acceptance-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .eq('action', 'risk_formal_acceptance')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const criticalRisks = (risks || []).filter(r => calculateRiskLevel(r.inherent_probability, r.inherent_impact) >= 20);
  const acceptedRisks = (risks || []).filter(r => r.treatment === 'aceitar');
  const highRisks = (risks || []).filter(r => {
    const lvl = calculateRiskLevel(r.inherent_probability, r.inherent_impact);
    return lvl >= 12 && lvl < 20;
  });

  const filteredRisks = useMemo(() => {
    if (!risks) return [];
    if (treatmentFilter === 'all') return risks;
    return risks.filter(r => r.treatment === treatmentFilter);
  }, [risks, treatmentFilter]);

  const handleFormalAcceptance = async () => {
    if (!acceptDialog || !user) return;
    setAccepting(true);
    try {
      const { error: riskError } = await supabase
        .from('risks')
        .update({
          treatment: 'aceitar' as any,
          treatment_plan: `[ACEITE FORMAL - ${format(new Date(), 'dd/MM/yyyy HH:mm')}] Aceito por ${user.email}. Justificativa: ${justification}`,
        })
        .eq('id', acceptDialog.id);
      if (riskError) throw riskError;

      await supabase.rpc('log_access_event', {
        _action: 'risk_formal_acceptance',
        _entity_type: 'risks',
        _entity_id: acceptDialog.id,
        _details: {
          risk_code: acceptDialog.code,
          risk_title: acceptDialog.title,
          risk_level: calculateRiskLevel(acceptDialog.inherent_probability, acceptDialog.inherent_impact),
          justification,
          accepted_by: user.email,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['risks'] });
      queryClient.invalidateQueries({ queryKey: ['access-logs'] });
      toast({ title: 'Aceite formal registrado', description: `Risco ${acceptDialog.code} aceito formalmente com log de auditoria.` });
      setAcceptDialog(null);
      setJustification('');
    } catch (err) {
      toast({ title: 'Erro ao registrar aceite', variant: 'destructive' });
    } finally {
      setAccepting(false);
    }
  };

  const treatmentLabel = (t: string) => TREATMENT_OPTIONS.find(o => o.value === t)?.label || t;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-space">Registro de Riscos</h1>
            <p className="text-muted-foreground text-sm">Registro central com aceite formal de riscos pelo C-Level</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowTimeline(true)}>
          <History className="w-4 h-4" /> Timeline de Aceites
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Riscos', value: risks?.length || 0, color: 'text-foreground' },
          { label: 'Críticos', value: criticalRisks.length, color: 'text-red-500' },
          { label: 'Altos', value: highRisks.length, color: 'text-orange-500' },
          { label: 'Aceitos Formalmente', value: acceptedRisks.length, color: 'text-amber-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Matrix */}
      {!isLoading && risks && risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-space">Matriz de Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskMatrix risks={risks} />
          </CardContent>
        </Card>
      )}

      {/* Executive attention table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-space flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Riscos que Requerem Atenção Executiva
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : [...criticalRisks, ...highRisks].length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum risco crítico ou alto encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Residual</TableHead>
                    <TableHead>Tratamento</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...criticalRisks, ...highRisks].map(risk => {
                    const level = calculateRiskLevel(risk.inherent_probability, risk.inherent_impact);
                    const residualLevel = calculateRiskLevel(
                      (risk as any).residual_probability || risk.inherent_probability,
                      (risk as any).residual_impact || risk.inherent_impact
                    );
                    const levelLabel = getRiskLevelLabel(level);
                    const isAccepted = risk.treatment === 'aceitar';
                    return (
                      <TableRow key={risk.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">{risk.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{risk.title}</p>
                          {risk.category && <p className="text-xs text-muted-foreground">{risk.category}</p>}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-white', level >= 20 ? 'bg-red-500' : 'bg-orange-500')}>
                            {level} — {levelLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {residualLevel !== level ? (
                            <Badge variant="secondary" className="text-xs">
                              {residualLevel} — {getRiskLevelLabel(residualLevel)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {isAccepted && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {treatmentLabel(risk.treatment)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {!isAccepted ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                              onClick={() => { setAcceptDialog(risk); setJustification(''); }}
                            >
                              <Stamp className="w-4 h-4" /> Aceite Formal
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-600 flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Aceito
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All risks with treatment filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-space">Todos os Riscos ({risks?.length || 0})</CardTitle>
            <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
              <SelectTrigger className="w-[180px] h-8">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Filtrar tratamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {TREATMENT_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : filteredRisks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {risks?.length === 0 ? 'Cadastre riscos no módulo GRC para visualizá-los aqui.' : 'Nenhum risco com este tratamento.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Nível Inerente</TableHead>
                    <TableHead>Tratamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRisks.map(risk => {
                    const level = calculateRiskLevel(risk.inherent_probability, risk.inherent_impact);
                    return (
                      <TableRow key={risk.id}>
                        <TableCell><Badge variant="outline" className="font-mono text-xs">{risk.code}</Badge></TableCell>
                        <TableCell className="text-sm">{risk.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{risk.category || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{level} — {getRiskLevelLabel(level)}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{treatmentLabel(risk.treatment)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acceptance Timeline Dialog */}
      <Dialog open={showTimeline} onOpenChange={setShowTimeline}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-space">
              <History className="w-5 h-5 text-amber-500" />
              Timeline de Aceites Formais
            </DialogTitle>
            <DialogDescription>Histórico de todos os aceites formais de risco registrados.</DialogDescription>
          </DialogHeader>
          {acceptanceLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum aceite formal registrado ainda.</p>
          ) : (
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
              {acceptanceLogs.map((log: any) => {
                const details = log.details || {};
                return (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-background" />
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{details.risk_code || '—'}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(parseISO(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{details.risk_title || 'Risco'}</p>
                      <p className="text-xs text-muted-foreground">
                        Nível: <strong>{details.risk_level}</strong> • Por: <strong>{details.accepted_by}</strong>
                      </p>
                      {details.justification && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-amber-500/30 pl-2 mt-1">
                          "{details.justification}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Formal Acceptance Dialog */}
      <Dialog open={!!acceptDialog} onOpenChange={() => setAcceptDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stamp className="w-5 h-5 text-amber-500" />
              Aceite Formal de Risco
            </DialogTitle>
            <DialogDescription>
              Este registro será salvo com timestamp e identificação do aprovador no log de auditoria.
            </DialogDescription>
          </DialogHeader>
          {acceptDialog && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                <p className="font-mono text-sm font-bold">{acceptDialog.code}</p>
                <p className="text-sm font-medium">{acceptDialog.title}</p>
                <p className="text-xs text-muted-foreground">
                  Nível: {calculateRiskLevel(acceptDialog.inherent_probability, acceptDialog.inherent_impact)} — {getRiskLevelLabel(calculateRiskLevel(acceptDialog.inherent_probability, acceptDialog.inherent_impact))}
                </p>
              </div>
              <div>
                <Label>Justificativa do Aceite *</Label>
                <Textarea
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  rows={4}
                  placeholder="Descreva por que este risco está sendo aceito formalmente (ex: limitação orçamentária, risco residual aceitável, prazo para mitigação futura...)"
                />
              </div>
              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                <p>📋 Aprovador: <strong>{user?.email}</strong></p>
                <p>📅 Data: <strong>{format(new Date(), 'dd/MM/yyyy HH:mm')}</strong></p>
                <p>🔒 Este aceite será registrado no log de auditoria e não poderá ser removido.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialog(null)}>Cancelar</Button>
            <Button
              onClick={handleFormalAcceptance}
              disabled={!justification.trim() || accepting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {accepting ? 'Registrando...' : 'Confirmar Aceite Formal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
