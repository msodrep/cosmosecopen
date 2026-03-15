import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Shield, CheckCircle2, Stamp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useRisks, Risk, calculateRiskLevel, getRiskLevelLabel, getRiskLevelColor, TREATMENT_OPTIONS } from '@/hooks/useRisks';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { RiskMatrix } from '@/components/riscos/RiskMatrix';

export default function VCISORiscos() {
  const { data: risks, isLoading } = useRisks({ filterByFramework: false });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [acceptDialog, setAcceptDialog] = useState<Risk | null>(null);
  const [justification, setJustification] = useState('');
  const [accepting, setAccepting] = useState(false);

  const criticalRisks = (risks || []).filter(r => calculateRiskLevel(r.inherent_probability, r.inherent_impact) >= 20);
  const acceptedRisks = (risks || []).filter(r => r.treatment === 'aceitar');
  const highRisks = (risks || []).filter(r => {
    const lvl = calculateRiskLevel(r.inherent_probability, r.inherent_impact);
    return lvl >= 12 && lvl < 20;
  });

  const handleFormalAcceptance = async () => {
    if (!acceptDialog || !user) return;
    setAccepting(true);
    try {
      // Update risk treatment to 'aceitar' with treatment_plan as justification
      const { error: riskError } = await supabase
        .from('risks')
        .update({
          treatment: 'aceitar' as any,
          treatment_plan: `[ACEITE FORMAL - ${format(new Date(), 'dd/MM/yyyy HH:mm')}] Aceito por ${user.email}. Justificativa: ${justification}`,
        })
        .eq('id', acceptDialog.id);
      if (riskError) throw riskError;

      // Log the formal acceptance in access_logs via RPC
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
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-space">Registro de Riscos</h1>
          <p className="text-muted-foreground text-sm">Registro central com aceite formal de riscos pelo C-Level</p>
        </div>
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

      {/* Top Critical + High risks table */}
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
                    <TableHead>Tratamento</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...criticalRisks, ...highRisks].map(risk => {
                    const level = calculateRiskLevel(risk.inherent_probability, risk.inherent_impact);
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
                          <Badge className={`${level >= 20 ? 'bg-red-500' : 'bg-orange-500'} text-white`}>
                            {level} — {levelLabel}
                          </Badge>
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

      {/* All risks summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-space">Todos os Riscos ({risks?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !risks || risks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Cadastre riscos no módulo GRC para visualizá-los aqui.</p>
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
                  {risks.map(risk => {
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
