import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Plus, Calendar as CalendarIcon, CheckCircle2, Clock, XCircle, FileText, Trash2, Pencil, Eye, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useContinuityTests, ContinuityTest, TEST_TYPES, TEST_STATUSES } from '@/hooks/useContinuityTests';
import { useOutletContext } from 'react-router-dom';
import { MOCK_CONTINUITY_TESTS } from '@/lib/vciso-mock-data';
import { format, parseISO, isPast, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { icon: React.ElementType; color: string; dot: string }> = {
  agendado: { icon: Clock, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', dot: 'bg-blue-500' },
  em_andamento: { icon: CalendarIcon, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', dot: 'bg-amber-500' },
  concluido: { icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', dot: 'bg-emerald-500' },
  cancelado: { icon: XCircle, color: 'bg-red-500/10 text-red-600 border-red-500/30', dot: 'bg-red-500' },
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const emptyForm = {
  title: '',
  test_type: 'tabletop',
  scheduled_date: '',
  executed_date: null as string | null,
  status: 'agendado',
  description: null as string | null,
  lessons_learned: null as string | null,
  report_url: null as string | null,
  conducted_by: null as string | null,
};

export default function VCISOContinuidade() {
  const { data: tests, isLoading: _isLoading, createTest, updateTest, deleteTest } = useContinuityTests();
  const { canEdit: _canEdit, isCLevel } = usePermissions();
  const { isDemo } = (useOutletContext() || {}) as { isDemo?: boolean };
  const canEdit = isDemo ? false : _canEdit;
  const isLoading = isDemo ? false : _isLoading;
  const allTests = isDemo ? (MOCK_CONTINUITY_TESTS as unknown as ContinuityTest[]) : (tests || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<ContinuityTest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [calMonth, setCalMonth] = useState(new Date());

  const openCreate = () => {
    setEditingTest(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: ContinuityTest) => {
    setEditingTest(t);
    setForm({
      title: t.title,
      test_type: t.test_type,
      scheduled_date: t.scheduled_date,
      executed_date: t.executed_date,
      status: t.status,
      description: t.description,
      lessons_learned: t.lessons_learned,
      report_url: t.report_url,
      conducted_by: t.conducted_by,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.scheduled_date) return;
    if (editingTest) {
      updateTest.mutate({ id: editingTest.id, ...form });
    } else {
      createTest.mutate(form as any);
    }
    setDialogOpen(false);
  };

  const filtered = (tests || []).filter(t => filter === 'all' || t.status === filter);

  const stats = {
    total: tests?.length || 0,
    scheduled: tests?.filter(t => t.status === 'agendado').length || 0,
    completed: tests?.filter(t => t.status === 'concluido').length || 0,
    overdue: tests?.filter(t => t.status === 'agendado' && isPast(parseISO(t.scheduled_date))).length || 0,
  };

  // Calendar data
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);
    const days = eachDayOfInterval({ start, end });
    // Pad start with empty days
    const startPad = getDay(start);
    return { days, startPad };
  }, [calMonth]);

  const testsByDate = useMemo(() => {
    const map = new Map<string, ContinuityTest[]>();
    (filtered || []).forEach(t => {
      const key = t.scheduled_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return map;
  }, [filtered]);

  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-space">Testes de Continuidade</h1>
            <p className="text-muted-foreground text-sm">Calendário de testes de BIA, restore e tabletop exercises</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md overflow-hidden">
            <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setViewMode('calendar')}>
              <CalendarIcon className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setViewMode('list')}>
              <List className="w-4 h-4" />
            </Button>
          </div>
          {canEdit ? (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> Agendar Teste
            </Button>
          ) : isCLevel ? (
            <Badge variant="outline" className="border-blue-500/30 text-blue-500 gap-1"><Eye className="w-3 h-3" /> Somente Leitura</Badge>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Agendados', value: stats.scheduled, color: 'text-blue-500' },
          { label: 'Concluídos', value: stats.completed, color: 'text-emerald-500' },
          { label: 'Atrasados', value: stats.overdue, color: 'text-red-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: 'all', label: 'Todos' }, ...TEST_STATUSES].map(s => (
          <Button
            key={s.value}
            variant={filter === s.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : viewMode === 'calendar' ? (
        /* Calendar View */
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCalMonth(m => subMonths(m, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="text-base font-space capitalize">
                {format(calMonth, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCalMonth(m => addMonths(m, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden">
              {/* Empty pads */}
              {Array.from({ length: calendarDays.startPad }).map((_, i) => (
                <div key={`pad-${i}`} className="bg-card/30 min-h-[80px] p-1" />
              ))}
              {calendarDays.days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayTests = testsByDate.get(dateStr) || [];
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      'bg-card min-h-[80px] p-1 transition-colors',
                      isToday && 'ring-1 ring-primary/50 bg-primary/5',
                    )}
                  >
                    <p className={cn(
                      'text-xs font-medium mb-0.5',
                      isToday ? 'text-primary font-bold' : 'text-muted-foreground',
                    )}>
                      {format(day, 'd')}
                    </p>
                    <div className="space-y-0.5">
                      {dayTests.slice(0, 3).map(t => {
                        const cfg = statusConfig[t.status] || statusConfig.agendado;
                        const isOverdue = t.status === 'agendado' && isPast(parseISO(t.scheduled_date));
                        return (
                          <button
                            key={t.id}
                            onClick={() => openEdit(t)}
                            className={cn(
                              'w-full text-left px-1 py-0.5 rounded text-[10px] leading-tight truncate flex items-center gap-1',
                              isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-muted/50 text-foreground hover:bg-muted',
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isOverdue ? 'bg-destructive' : cfg.dot)} />
                            <span className="truncate">{t.title}</span>
                          </button>
                        );
                      })}
                      {dayTests.length > 3 && (
                        <p className="text-[10px] text-muted-foreground text-center">+{dayTests.length - 3}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                  <span className="text-xs text-muted-foreground">{TEST_STATUSES.find(s => s.value === key)?.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* List View */
        filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum teste encontrado. Agende o primeiro teste de continuidade.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(test => {
              const cfg = statusConfig[test.status] || statusConfig.agendado;
              const StatusIcon = cfg.icon;
              const typeLabel = TEST_TYPES.find(t => t.value === test.test_type)?.label || test.test_type;
              const isOverdue = test.status === 'agendado' && isPast(parseISO(test.scheduled_date));

              return (
                <Card key={test.id} className={isOverdue ? 'border-red-500/40' : ''}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{test.title}</h3>
                          <Badge variant="outline" className={cfg.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {TEST_STATUSES.find(s => s.value === test.status)?.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
                          {isOverdue && <Badge variant="destructive" className="text-xs">Atrasado</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Agendado: {format(parseISO(test.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          {test.executed_date && ` • Executado: ${format(parseISO(test.executed_date), 'dd/MM/yyyy')}`}
                        </p>
                        {test.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{test.description}</p>
                        )}
                        {test.lessons_learned && (
                          <div className="flex items-start gap-1 mt-1">
                            <FileText className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground line-clamp-2">{test.lessons_learned}</p>
                          </div>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(test)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTest.mutate(test.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTest ? 'Editar Teste' : 'Agendar Teste de Continuidade'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Tabletop de Incidente Ransomware" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.test_type} onValueChange={v => setForm(f => ({ ...f, test_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEST_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Agendada *</Label>
                <Input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
              </div>
              <div>
                <Label>Data Executada</Label>
                <Input type="date" value={form.executed_date || ''} onChange={e => setForm(f => ({ ...f, executed_date: e.target.value || null }))} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))} rows={2} placeholder="Escopo e objetivos do teste" />
            </div>
            <div>
              <Label>Lições Aprendidas</Label>
              <Textarea value={form.lessons_learned || ''} onChange={e => setForm(f => ({ ...f, lessons_learned: e.target.value || null }))} rows={3} placeholder="Registre as lições aprendidas após a execução" />
            </div>
            <div>
              <Label>URL do Relatório</Label>
              <Input value={form.report_url || ''} onChange={e => setForm(f => ({ ...f, report_url: e.target.value || null }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.title || !form.scheduled_date}>
              {editingTest ? 'Salvar' : 'Agendar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
