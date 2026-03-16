import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useKRIs, useKRIHistory, type KRI } from '@/hooks/useKRIs';
import { usePermissions } from '@/hooks/usePermissions';
import { useOutletContext } from 'react-router-dom';
import { MOCK_KRIS } from '@/lib/vciso-mock-data';
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Shield,
  Target,
  Eye,
  Sparkles,
  Zap,
  BarChart3,
  Save,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixo', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  medium: { label: 'Médio', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  high: { label: 'Alto', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
  critical: { label: 'Crítico', color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const TREND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const KRI_TEMPLATES = [
  { name: '% Funcionários com treinamento de segurança', unit: '%', target_value: 95, severity: 'medium' },
  { name: 'Tempo médio de aplicação de patches (dias)', unit: 'dias', target_value: 7, severity: 'high' },
  { name: 'Sistemas críticos sem backup testado', unit: 'un', target_value: 0, severity: 'critical' },
  { name: 'Vulnerabilidades críticas abertas', unit: 'un', target_value: 0, severity: 'critical' },
  { name: 'Cobertura de MFA (%)', unit: '%', target_value: 100, severity: 'high' },
  { name: 'Incidentes de segurança no mês', unit: 'un', target_value: 0, severity: 'medium' },
];

const emptyForm = {
  name: '',
  description: '',
  current_value: 0,
  target_value: 0,
  unit: '%',
  trend: 'stable',
  severity: 'low',
  measured_at: new Date().toISOString(),
  framework_id: null as string | null,
};

// Mini sparkline component
function Sparkline({ data, color = 'text-primary' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className={cn('inline-block', color)}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {data.length > 0 && (() => {
        const lastX = width;
        const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
        return <circle cx={lastX} cy={lastY} r="2" fill="currentColor" />;
      })()}
    </svg>
  );
}

// KRI History Panel component
function KRIHistoryPanel({ kri, canEdit }: { kri: KRI; canEdit: boolean }) {
  const { data: history, recordValue } = useKRIHistory(kri.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          Histórico de valores
        </h4>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => recordValue.mutate({ kriId: kri.id, value: kri.current_value })}
          >
            <Save className="w-3 h-3" /> Registrar Valor Atual
          </Button>
        )}
      </div>

      {(!history || history.length === 0) ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Nenhum histórico registrado. Clique em "Registrar Valor Atual" para começar a rastrear.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Sparkline
              data={history.map(h => h.value)}
              color={kri.trend === 'up' ? 'text-destructive' : kri.trend === 'down' ? 'text-emerald-500' : 'text-muted-foreground'}
            />
            <span className="text-xs text-muted-foreground">
              {history.length} registros
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 max-h-[120px] overflow-y-auto">
            {history.slice().reverse().map(h => (
              <div key={h.id} className="text-[10px] text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5 flex justify-between">
                <span>{h.value}{kri.unit}</span>
                <span>{format(parseISO(h.recorded_at), 'dd/MM', { locale: ptBR })}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function VCISOKRIs() {
  const { data: kris, isLoading: _isLoading, createKRI, updateKRI, deleteKRI } = useKRIs();
  const { canEdit: _canEdit, isCLevel } = usePermissions();
  const { isDemo } = (useOutletContext() || {}) as { isDemo?: boolean };
  const canEdit = isDemo ? false : _canEdit;
  const isLoading = isDemo ? false : _isLoading;
  const allKRIs = isDemo ? (MOCK_KRIS as unknown as KRI[]) : (kris || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKRI, setEditingKRI] = useState<KRI | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedKRI, setExpandedKRI] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!kris) return [];
    return kris.filter((k) => filterSeverity === 'all' || k.severity === filterSeverity);
  }, [kris, filterSeverity]);

  const stats = useMemo(() => {
    if (!kris) return { total: 0, critical: 0, offTarget: 0, onTarget: 0 };
    return {
      total: kris.length,
      critical: kris.filter((k) => k.severity === 'critical').length,
      offTarget: kris.filter((k) => Math.abs(k.current_value - k.target_value) > k.target_value * 0.2).length,
      onTarget: kris.filter((k) => Math.abs(k.current_value - k.target_value) <= k.target_value * 0.2).length,
    };
  }, [kris]);

  const openCreate = () => {
    setEditingKRI(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (kri: KRI) => {
    setEditingKRI(kri);
    setForm({
      name: kri.name,
      description: kri.description || '',
      current_value: kri.current_value,
      target_value: kri.target_value,
      unit: kri.unit,
      trend: kri.trend,
      severity: kri.severity,
      measured_at: kri.measured_at,
      framework_id: kri.framework_id,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editingKRI) {
      updateKRI.mutate({ id: editingKRI.id, ...form });
    } else {
      createKRI.mutate(form);
    }
    setDialogOpen(false);
  };

  const handleUseTemplate = (template: typeof KRI_TEMPLATES[0]) => {
    createKRI.mutate({
      name: template.name,
      description: '',
      current_value: 0,
      target_value: template.target_value,
      unit: template.unit,
      trend: 'stable',
      severity: template.severity,
      measured_at: new Date().toISOString(),
      framework_id: null,
    });
    setShowTemplates(false);
  };

  const getProgressColor = (kri: KRI) => {
    const ratio = kri.target_value > 0 ? kri.current_value / kri.target_value : 0;
    if (ratio >= 0.8) return 'bg-emerald-500';
    if (ratio >= 0.5) return 'bg-amber-500';
    return 'bg-destructive';
  };

  const isAlert = (kri: KRI) => {
    if ((kri.unit === 'un' || kri.unit === 'dias') && kri.current_value > kri.target_value) return true;
    if (kri.unit === '%' && kri.target_value > 0 && kri.current_value < kri.target_value * 0.5) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Activity className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-space">Key Risk Indicators</h1>
            <p className="text-muted-foreground">Indicadores de risco com metas, tendências e histórico</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowTemplates(true)}>
                <Sparkles className="w-3.5 h-3.5" /> Templates
              </Button>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" /> Novo KRI
              </Button>
            </>
          )}
          {isCLevel && !canEdit && (
            <Badge variant="outline" className="border-blue-500/30 text-blue-500 gap-1"><Eye className="w-3 h-3" /> Somente Leitura</Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Total KRIs', value: stats.total, color: 'text-foreground', icon: Activity },
          { label: 'Críticos', value: stats.critical, color: 'text-destructive', icon: AlertTriangle },
          { label: 'Fora da Meta', value: stats.offTarget, color: 'text-amber-500', icon: Target },
          { label: 'Na Meta', value: stats.onTarget, color: 'text-emerald-500', icon: Shield },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={cn('text-2xl font-bold font-space', s.color)}>{isLoading ? '-' : s.value}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <s.icon className={cn('w-4 h-4', s.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar severidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
            <SelectItem value="high">Alto</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="low">Baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KRI Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum KRI cadastrado</h3>
            <p className="text-muted-foreground mb-4">Defina indicadores de risco para monitorar a segurança</p>
            {canEdit && (
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowTemplates(true)} variant="outline" className="gap-2">
                  <Sparkles className="w-4 h-4" /> Usar Template
                </Button>
                <Button onClick={openCreate} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" /> Criar manual
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((kri) => {
            const sevCfg = SEVERITY_CONFIG[kri.severity] || SEVERITY_CONFIG.low;
            const TrendIcon = TREND_ICONS[kri.trend] || Minus;
            const progressPct = kri.target_value > 0 ? Math.min(100, Math.round((kri.current_value / kri.target_value) * 100)) : 0;
            const alerting = isAlert(kri);
            const isExpanded = expandedKRI === kri.id;

            return (
              <Card key={kri.id} className={cn('border-border/50 transition-all', alerting && 'border-destructive/50 shadow-destructive/10 shadow-sm')}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-space truncate">{kri.name}</CardTitle>
                        {alerting && (
                          <Zap className="w-4 h-4 text-destructive animate-pulse flex-shrink-0" />
                        )}
                      </div>
                      {kri.description && (
                        <CardDescription className="line-clamp-2 mt-1">{kri.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Badge variant="outline" className={cn('text-xs', sevCfg.color)}>{sevCfg.label}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedKRI(isExpanded ? null : kri.id)}>
                        <BarChart3 className="w-3 h-3" />
                      </Button>
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(kri)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteKRI.mutate(kri.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold font-space">{kri.current_value}</span>
                      <span className="text-sm text-muted-foreground ml-1">{kri.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendIcon className={cn(
                        'w-4 h-4',
                        kri.trend === 'up' ? 'text-destructive' : kri.trend === 'down' ? 'text-emerald-500' : 'text-muted-foreground'
                      )} />
                      <span className="text-muted-foreground">Meta: {kri.target_value}{kri.unit}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progresso</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', getProgressColor(kri))} style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>

                  {/* Expanded History Panel */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-border/50">
                      <KRIHistoryPanel kri={kri} canEdit={canEdit} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-space flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Templates de KRI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {KRI_TEMPLATES.map((tpl, i) => {
              const exists = kris?.some(k => k.name === tpl.name);
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground">Meta: {tpl.target_value}{tpl.unit} • {SEVERITY_CONFIG[tpl.severity]?.label}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exists}
                    onClick={() => handleUseTemplate(tpl)}
                    className="ml-2 flex-shrink-0"
                  >
                    {exists ? 'Já existe' : 'Adicionar'}
                  </Button>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplates(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-space">{editingKRI ? 'Editar KRI' : 'Novo KRI'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Sistemas críticos sem backup testado" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Valor Atual</Label>
                <Input type="number" value={form.current_value} onChange={(e) => setForm({ ...form, current_value: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Meta</Label>
                <Input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Unidade</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="%" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tendência</Label>
                <Select value={form.trend} onValueChange={(v) => setForm({ ...form, trend: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up">Subindo ↑</SelectItem>
                    <SelectItem value="down">Descendo ↓</SelectItem>
                    <SelectItem value="stable">Estável →</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severidade</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name}>{editingKRI ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
