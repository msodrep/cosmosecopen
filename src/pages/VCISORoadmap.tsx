import { useState, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, differenceInDays, startOfMonth, endOfMonth, addMonths, isBefore, isAfter, max as dateMax, min as dateMin } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRoadmapItems, type RoadmapItem } from '@/hooks/useRoadmapItems';
import { MOCK_ROADMAP } from '@/lib/vciso-mock-data';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Map,
  Plus,
  CalendarIcon,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  Pause,
  Target,
  Eye,
  List,
  BarChart3,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; barColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  planned: { label: 'Planejado', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', barColor: 'bg-blue-500', icon: Target },
  in_progress: { label: 'Em Andamento', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30', barColor: 'bg-amber-500', icon: Clock },
  done: { label: 'Concluído', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', barColor: 'bg-emerald-500', icon: CheckCircle2 },
  blocked: { label: 'Bloqueado', color: 'bg-destructive/10 text-destructive border-destructive/30', barColor: 'bg-destructive', icon: Pause },
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

function getQuarterFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q} ${d.getFullYear()}`;
}

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
  const { data: items, isLoading: _isLoading, createItem, updateItem, deleteItem } = useRoadmapItems();
  const { canEdit: _canEdit, isCLevel } = usePermissions();
  const { isDemo } = (useOutletContext() || {}) as { isDemo?: boolean };
  const canEdit = isDemo ? false : _canEdit;
  const isLoading = isDemo ? false : _isLoading;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [viewMode, setViewMode] = useState<'gantt' | 'list'>('gantt');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const allItems = isDemo ? (MOCK_ROADMAP as unknown as RoadmapItem[]) : items;

  const filtered = useMemo(() => {
    if (!allItems) return [];
    return allItems.filter((i) => filterStatus === 'all' || i.status === filterStatus);
  }, [allItems, filterStatus]);

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

  // Gantt timeline computation
  const ganttData = useMemo(() => {
    if (filtered.length === 0) return { months: [], items: [], timelineStart: new Date(), timelineEnd: new Date(), totalDays: 1 };

    const allDates = filtered.flatMap(i => [new Date(i.start_date), new Date(i.end_date)]);
    const minDate = startOfMonth(new Date(Math.min(...allDates.map(d => d.getTime()))));
    const maxDate = endOfMonth(new Date(Math.max(...allDates.map(d => d.getTime()))));

    // Generate month labels
    const months: { label: string; start: Date; end: Date }[] = [];
    let current = minDate;
    while (isBefore(current, maxDate) || current.getTime() === maxDate.getTime()) {
      const mEnd = endOfMonth(current);
      months.push({
        label: format(current, 'MMM yy', { locale: ptBR }),
        start: current,
        end: mEnd,
      });
      current = addMonths(startOfMonth(current), 1);
    }

    const totalDays = Math.max(1, differenceInDays(maxDate, minDate) + 1);

    return { months, items: filtered, timelineStart: minDate, timelineEnd: maxDate, totalDays };
  }, [filtered]);

  // Group by auto-calculated quarter for list view
  const grouped = useMemo(() => {
    const groups: Record<string, RoadmapItem[]> = {};
    filtered.forEach((item) => {
      const q = item.quarter || getQuarterFromDate(item.start_date);
      if (!groups[q]) groups[q] = [];
      groups[q].push(item);
    });
    return groups;
  }, [filtered]);

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
    const autoQuarter = getQuarterFromDate(format(startDate, 'yyyy-MM-dd'));
    const payload = {
      ...form,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      quarter: form.quarter || autoQuarter,
    };
    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, ...payload });
    } else {
      createItem.mutate(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteItem.mutate(id);
    setDeleteConfirm(null);
  };

  const getTimelineWidth = (item: RoadmapItem) => {
    const start = new Date(item.start_date).getTime();
    const end = new Date(item.end_date).getTime();
    const now = new Date().getTime();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const getBarPosition = (item: RoadmapItem) => {
    const itemStart = new Date(item.start_date);
    const itemEnd = new Date(item.end_date);
    const clampedStart = dateMax([itemStart, ganttData.timelineStart]);
    const clampedEnd = dateMin([itemEnd, ganttData.timelineEnd]);
    const leftDays = differenceInDays(clampedStart, ganttData.timelineStart);
    const widthDays = Math.max(1, differenceInDays(clampedEnd, clampedStart) + 1);
    const leftPct = (leftDays / ganttData.totalDays) * 100;
    const widthPct = (widthDays / ganttData.totalDays) * 100;
    return { left: `${leftPct}%`, width: `${Math.max(widthPct, 1)}%` };
  };

  // Today marker position
  const todayPct = useMemo(() => {
    if (ganttData.totalDays <= 1) return null;
    const days = differenceInDays(new Date(), ganttData.timelineStart);
    if (days < 0 || days > ganttData.totalDays) return null;
    return (days / ganttData.totalDays) * 100;
  }, [ganttData]);

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
            <p className="text-muted-foreground">Projetos de segurança com timeline visual</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <Button variant={viewMode === 'gantt' ? 'default' : 'ghost'} size="sm" className="rounded-none gap-1" onClick={() => setViewMode('gantt')}>
              <BarChart3 className="w-3.5 h-3.5" /> Gantt
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="rounded-none gap-1" onClick={() => setViewMode('list')}>
              <List className="w-3.5 h-3.5" /> Lista
            </Button>
          </div>
          {canEdit ? (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> Novo Item
            </Button>
          ) : isCLevel ? (
            <Badge variant="outline" className="border-blue-500/30 text-blue-500 gap-1"><Eye className="w-3 h-3" /> Somente Leitura</Badge>
          ) : null}
        </div>
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

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Map className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum item no roadmap</h3>
            <p className="text-muted-foreground mb-4">Adicione projetos estratégicos para começar a planejar</p>
            {canEdit && (
              <Button onClick={openCreate} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> Criar primeiro item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'gantt' ? (
        /* ========== GANTT VIEW ========== */
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-space">Timeline</CardTitle>
            <CardDescription>{filtered.length} projetos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Month headers */}
                <div className="flex border-b border-border mb-2">
                  <div className="w-[200px] flex-shrink-0 text-xs text-muted-foreground p-2">Projeto</div>
                  <div className="flex-1 flex relative">
                    {ganttData.months.map((m, i) => {
                      const widthPct = (differenceInDays(m.end, m.start) + 1) / ganttData.totalDays * 100;
                      return (
                        <div
                          key={i}
                          className="text-[10px] text-muted-foreground text-center border-l border-border/50 py-1 capitalize"
                          style={{ width: `${widthPct}%` }}
                        >
                          {m.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rows */}
                <TooltipProvider>
                  {ganttData.items.map((item) => {
                    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                    const pos = getBarPosition(item);
                    const catLabel = CATEGORY_OPTIONS.find(c => c.value === item.category)?.label || item.category;

                    return (
                      <div key={item.id} className="flex items-center group hover:bg-muted/30 rounded transition-colors">
                        <div className="w-[200px] flex-shrink-0 p-2 flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-medium truncate cursor-default">{item.title}</span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="font-medium">{item.title}</p>
                              {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                              <p className="text-xs mt-1">{catLabel} • {format(new Date(item.start_date), 'dd/MM/yy')} → {format(new Date(item.end_date), 'dd/MM/yy')}</p>
                            </TooltipContent>
                          </Tooltip>
                          {canEdit && (
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(item)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteConfirm(item.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 relative h-8 flex items-center">
                          {/* Month grid lines */}
                          {ganttData.months.map((m, i) => {
                            const leftPct = differenceInDays(m.start, ganttData.timelineStart) / ganttData.totalDays * 100;
                            return <div key={i} className="absolute top-0 bottom-0 border-l border-border/20" style={{ left: `${leftPct}%` }} />;
                          })}
                          {/* Today line */}
                          {todayPct !== null && (
                            <div className="absolute top-0 bottom-0 w-px bg-destructive/60 z-10" style={{ left: `${todayPct}%` }} />
                          )}
                          {/* Bar */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn('absolute h-5 rounded-md cursor-default', statusCfg.barColor, 'opacity-80 hover:opacity-100 transition-opacity')}
                                style={{ left: pos.left, width: pos.width }}
                              >
                                <span className="text-[9px] text-white px-1 truncate block leading-5 font-medium">
                                  {item.title}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium text-xs">{statusCfg.label} • {PRIORITY_CONFIG[item.priority]?.label || item.priority}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </TooltipProvider>

                {/* Today legend */}
                {todayPct !== null && (
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                    <div className="w-3 h-px bg-destructive/60" />
                    <span>Hoje ({format(new Date(), 'dd/MM', { locale: ptBR })})</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ========== LIST VIEW ========== */
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
                        {canEdit && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(item.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', statusCfg.barColor)}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este item do roadmap? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                <Label>Trimestre <span className="text-muted-foreground text-xs">(auto)</span></Label>
                <Input value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value })} placeholder={startDate ? getQuarterFromDate(format(startDate, 'yyyy-MM-dd')) : 'Ex: Q1 2026'} />
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
