import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from '@/hooks/use-toast';

export interface ContinuityTest {
  id: string;
  organization_id: string;
  test_type: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  executed_date: string | null;
  status: string;
  lessons_learned: string | null;
  report_url: string | null;
  conducted_by: string | null;
  created_at: string;
  updated_at: string;
}

export const TEST_TYPES = [
  { value: 'tabletop', label: 'Tabletop Exercise' },
  { value: 'restore', label: 'Teste de Restore' },
  { value: 'failover', label: 'Teste de Failover' },
  { value: 'drill', label: 'Simulado (Drill)' },
];

export const TEST_STATUSES = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

export function useContinuityTests() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['continuity-tests', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('continuity_tests')
        .select('*')
        .eq('organization_id', organization.id)
        .order('scheduled_date', { ascending: true });
      if (error) throw error;
      return (data || []) as ContinuityTest[];
    },
    enabled: !!organization?.id,
  });

  const createTest = useMutation({
    mutationFn: async (test: Omit<ContinuityTest, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('continuity_tests')
        .insert({ ...test, organization_id: organization!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['continuity-tests'] });
      toast({ title: 'Teste agendado com sucesso' });
    },
    onError: () => toast({ title: 'Erro ao agendar teste', variant: 'destructive' }),
  });

  const updateTest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContinuityTest> & { id: string }) => {
      const { error } = await supabase
        .from('continuity_tests')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['continuity-tests'] });
      toast({ title: 'Teste atualizado' });
    },
    onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('continuity_tests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['continuity-tests'] });
      toast({ title: 'Teste removido' });
    },
    onError: () => toast({ title: 'Erro ao remover', variant: 'destructive' }),
  });

  return { ...query, createTest, updateTest, deleteTest };
}
