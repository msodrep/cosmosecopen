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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRoadmapItems, type RoadmapItem } from '@/hooks/useRoadmapItems';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Map,
  Plus,
  CalendarIcon,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Pause,
  Target,
  Eye,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  planned: { label: 'Planejado', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: Target },
  in_progress: { label: 'Em Andamento', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30', icon: Clock },
  done: { label: 'Concluído', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', icon: CheckCircle2 },
  blocked: { label: 'Bloqueado', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: Pause },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  alta: { label: 'Alta', color: 'bg-destructive/10 text-destructive border-destructive/30' },
  media: { label: 'Média', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  baixa: { label: 'Baixa', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
};

const CATEGORY_OPTIONS = [
  { value: 'security', label: 'Segurança' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'continuity', label: 'Continuidade' },
  { value: 'governance', label: 'Governança' },
  { value: 'infrastructure', label: 'Infraestrutura' },
  { value: 'training', label: 'Treinamento' },
];

const emptyForm = {
  title: '',
  description: '',
  category: 'security',
  start_date: '',
  end_date: '',
  status: 'planned',
  priority: 'media',
  quarter: '',
  assigned_to: null as string | null,
};

export default function VCISORoadmap() {
  const { data: items, isLoading, createItem, updateItem, deleteItem } = useRoadmapItems();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((i) => filterStatus === 'all' || i.status === filterStatus);
  }, [items, filterStatus]);

  // Group by quarter
  const grouped = useMemo(() => {
    const groups: Record<string, RoadmapItem[]> = {};
    filtered.forEach((item) => {
      const q = item.quarter || 'Sem trimestre';
      if (!groups[q]) groups[q] = [];
      groups[q].push(item);
    });
    return groups;
  }, [filtered]);

  const stats = useMemo(() => {
    if (!items) return { total: 0, planned: 0, in_progress: 0, done: 0, blocked: 0 };
    return {
      total: items.length,
      planned: items.filter((i) => i.status === 'planned').length,
      in_progress: items.filter((i) => i.status === 'in_progress').length,
      done: items.filter((i) => i.status === 'done').length,
      blocked: items.filter((i) => i.status === 'blocked').length,
    };
  }, [items]);

  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setStartDate(undefined);
    setEndDate(undefined);
    setDialogOpen(true);
  };

  const openEdit = (item: RoadmapItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description || '',
      category: item.category,
      start_date: item.start_date,
      end_date: item.end_date,
      status: item.status,
      priority: item.priority,
      quarter: item.quarter || '',
      assigned_to: item.assigned_to,
    });
    setStartDate(new Date(item.start_date));
    setEndDate(new Date(item.end_date));
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !startDate || !endDate) return;
    const payload = {
      ...form,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
    };
    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, ...payload });
    } else {
      createItem.mutate(payload);
    }
    setDialogOpen(false);
  };

  const getTimelineWidth = (item: RoadmapItem) => {
    const start = new Date(item.start_date).getTime();
    const end = new Date(item.end_date).getTime();
    const now = new Date().getTime();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Map className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-space">Roadmap Estratégico</h1>
            <p className="text-muted-foreground">Projetos de segurança organizados por trimestre</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Planejado', value: stats.planned, color: 'text-blue-500' },
          { label: 'Em Andamento', value: stats.in_progress, color: 'text-amber-500' },
          { label: 'Concluído', value: stats.done, color: 'text-emerald-500' },
          { label: 'Bloqueado', value: stats.blocked, color: 'text-destructive' },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn('text-2xl font-bold font-space', s.color)}>{isLoading ? '-' : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="planned">Planejado</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="done">Concluído</SelectItem>
            <SelectItem value="blocked">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline by Quarter */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Map className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum item no roadmap</h3>
            <p className="text-muted-foreground mb-4">Adicione projetos estratégicos para começar a planejar</p>
            <Button onClick={openCreate} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Criar primeiro item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([quarter, qItems]) => (
            <Card key={quarter}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-space flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-amber-500" />
                  {quarter}
                </CardTitle>
                <CardDescription>{qItems.length} {qItems.length === 1 ? 'projeto' : 'projetos'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {qItems.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                  const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.media;
                  const StatusIcon = statusCfg.icon;
                  const progress = getTimelineWidth(item);

                  return (
                    <div key={item.id} className="p-4 rounded-lg border border-border/50 bg-card/40 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-medium truncate">{item.title}</h4>
                            <Badge variant="outline" className={cn('text-xs', statusCfg.color)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusCfg.label}
                            </Badge>
                            <Badge variant="outline" className={cn('text-xs', priorityCfg.color)}>
                              {priorityCfg.label}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{format(new Date(item.start_date), 'dd/MM/yy', { locale: ptBR })} → {format(new Date(item.end_date), 'dd/MM/yy', { locale: ptBR })}</span>
                            <Badge variant="secondary" className="text-xs">
                              {CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label || item.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteItem.mutate(item.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      {/* Timeline bar */}
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            item.status === 'done' ? 'bg-emerald-500' :
                            item.status === 'blocked' ? 'bg-destructive' : 'bg-amber-500'
                          )}
                          style={{ width: `${item.status === 'done' ? 100 : progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-space">
              {editingItem ? 'Editar Item' : 'Novo Item do Roadmap'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Implementar MFA em todos os sistemas" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !startDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd/MM/yyyy') : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Data Fim *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !endDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd/MM/yyyy') : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planejado</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trimestre</Label>
                <Input value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value })} placeholder="Ex: Q1 2026" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.title || !startDate || !endDate}>
              {editingItem ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
