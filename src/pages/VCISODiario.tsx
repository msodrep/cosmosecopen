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
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useVCISOLogEntries, type VCISOLogEntry } from '@/hooks/useVCISOLogEntries';
import {
  BookOpen,
  Plus,
  CalendarIcon,
  Pencil,
  Trash2,
  Clock,
  Users,
  FileCheck,
  CheckSquare,
  MoreHorizontal,
} from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  reuniao: { label: 'Reunião', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: Users },
  parecer: { label: 'Parecer', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30', icon: FileCheck },
  aprovacao: { label: 'Aprovação', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', icon: CheckSquare },
  outro: { label: 'Outro', color: 'bg-muted text-muted-foreground border-border', icon: MoreHorizontal },
};

const emptyForm = {
  title: '',
  description: '',
  category: 'reuniao',
  entry_date: format(new Date(), 'yyyy-MM-dd'),
  hours_spent: 1,
};

export default function VCISODiario() {
  const { data: entries, isLoading, createEntry, updateEntry, deleteEntry } = useVCISOLogEntries();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VCISOLogEntry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<Date>(new Date());
  const [entryDate, setEntryDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(filterMonth);
  const monthEnd = endOfMonth(filterMonth);

  const filtered = useMemo(() => {
    if (!entries) return [];
    return entries.filter((e) => {
      const dateMatch = isWithinInterval(new Date(e.entry_date), { start: monthStart, end: monthEnd });
      const catMatch = filterCategory === 'all' || e.category === filterCategory;
      return dateMatch && catMatch;
    });
  }, [entries, filterCategory, monthStart, monthEnd]);

  const monthStats = useMemo(() => {
    const totalHours = filtered.reduce((acc, e) => acc + (e.hours_spent || 0), 0);
    const byCategory: Record<string, number> = {};
    filtered.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    });
    return { totalEntries: filtered.length, totalHours, byCategory };
  }, [filtered]);

  const openCreate = () => {
    setEditingEntry(null);
    setForm(emptyForm);
    setEntryDate(new Date());
    setDialogOpen(true);
  };

  const openEdit = (entry: VCISOLogEntry) => {
    setEditingEntry(entry);
    setForm({
      title: entry.title,
      description: entry.description || '',
      category: entry.category,
      entry_date: entry.entry_date,
      hours_spent: entry.hours_spent,
    });
    setEntryDate(new Date(entry.entry_date));
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title) return;
    const payload = { ...form, entry_date: format(entryDate, 'yyyy-MM-dd') };
    if (editingEntry) {
      updateEntry.mutate({ id: editingEntry.id, ...payload });
    } else {
      createEntry.mutate(payload);
    }
    setDialogOpen(false);
  };

  const navigateMonth = (direction: number) => {
    const d = new Date(filterMonth);
    d.setMonth(d.getMonth() + direction);
    setFilterMonth(d);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <BookOpen className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-space">Diário de Bordo</h1>
            <p className="text-muted-foreground">Registro de atividades, reuniões e pareceres</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Entrada
        </Button>
      </div>

      {/* Month Navigation + Stats */}
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="border-border/50 flex-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>←</Button>
              <span className="font-semibold font-space capitalize">
                {format(filterMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>→</Button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="text-xl font-bold font-space">{monthStats.totalEntries}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Horas</p>
                <p className="text-xl font-bold font-space text-amber-500">{monthStats.totalHours.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Categorias</p>
                <p className="text-xl font-bold font-space">{Object.keys(monthStats.byCategory).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card className="border-border/50 flex-1">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Por Categoria</p>
            <div className="space-y-2">
              {Object.entries(monthStats.byCategory).map(([cat, count]) => {
                const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.outro;
                const CatIcon = cfg.icon;
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CatIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{cfg.label}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                );
              })}
              {Object.keys(monthStats.byCategory).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Sem entradas neste mês</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="reuniao">Reunião</SelectItem>
            <SelectItem value="parecer">Parecer</SelectItem>
            <SelectItem value="aprovacao">Aprovação</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entries List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma entrada neste período</h3>
            <p className="text-muted-foreground mb-4">Registre atividades para acompanhar sua atuação</p>
            <Button onClick={openCreate} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Criar primeira entrada
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const cfg = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.outro;
            const CatIcon = cfg.icon;

            return (
              <Card key={entry.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className={cn('p-2 rounded-lg flex-shrink-0 h-fit', cfg.color.split(' ')[0])}>
                        <CatIcon className={cn('w-4 h-4', cfg.color.split(' ')[1])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-medium truncate">{entry.title}</h4>
                          <Badge variant="outline" className={cn('text-xs', cfg.color)}>{cfg.label}</Badge>
                        </div>
                        {entry.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{entry.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {format(new Date(entry.entry_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {entry.hours_spent}h
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(entry)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteEntry.mutate(entry.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
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
            <DialogTitle className="font-space">{editingEntry ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Reunião de comitê de segurança" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Detalhe as atividades realizadas..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="parecer">Parecer</SelectItem>
                    <SelectItem value="aprovacao">Aprovação</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Horas Gastas</Label>
                <Input type="number" step="0.5" min="0" value={form.hours_spent} onChange={(e) => setForm({ ...form, hours_spent: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(entryDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={entryDate} onSelect={(d) => d && setEntryDate(d)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.title}>{editingEntry ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
