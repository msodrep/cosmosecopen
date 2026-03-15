import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Plus, Calendar, CheckCircle2, Clock, XCircle, FileText, Trash2, Pencil, Eye } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useContinuityTests, ContinuityTest, TEST_TYPES, TEST_STATUSES } from '@/hooks/useContinuityTests';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  agendado: { icon: Clock, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  em_andamento: { icon: Calendar, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  concluido: { icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  cancelado: { icon: XCircle, color: 'bg-red-500/10 text-red-600 border-red-500/30' },
};

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
  const { data: tests, isLoading, createTest, updateTest, deleteTest } = useContinuityTests();
  const { canEdit, isCLevel } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<ContinuityTest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<string>('all');

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
        {canEdit ? (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Agendar Teste
          </Button>
        ) : isCLevel ? (
          <Badge variant="outline" className="border-blue-500/30 text-blue-500 gap-1"><Eye className="w-3 h-3" /> Somente Leitura</Badge>
        ) : null}
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

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
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
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(test)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTest.mutate(test.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
