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
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useKRIs, type KRI } from '@/hooks/useKRIs';
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
} from 'lucide-react';

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

export default function VCISOKRIs() {
  const { data: kris, isLoading, createKRI, updateKRI, deleteKRI } = useKRIs();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKRI, setEditingKRI] = useState<KRI | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

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

  const getProgressColor = (kri: KRI) => {
    const ratio = kri.target_value > 0 ? kri.current_value / kri.target_value : 0;
    if (ratio >= 0.8) return 'bg-emerald-500';
    if (ratio >= 0.5) return 'bg-amber-500';
    return 'bg-destructive';
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
            <p className="text-muted-foreground">Indicadores de risco de negócio com metas e tendências</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Novo KRI
        </Button>
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
            <Button onClick={openCreate} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Criar primeiro KRI
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((kri) => {
            const sevCfg = SEVERITY_CONFIG[kri.severity] || SEVERITY_CONFIG.low;
            const TrendIcon = TREND_ICONS[kri.trend] || Minus;
            const progressPct = kri.target_value > 0 ? Math.min(100, Math.round((kri.current_value / kri.target_value) * 100)) : 0;

            return (
              <Card key={kri.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-space truncate">{kri.name}</CardTitle>
                      {kri.description && (
                        <CardDescription className="line-clamp-2 mt-1">{kri.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Badge variant="outline" className={cn('text-xs', sevCfg.color)}>{sevCfg.label}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(kri)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteKRI.mutate(kri.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
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
