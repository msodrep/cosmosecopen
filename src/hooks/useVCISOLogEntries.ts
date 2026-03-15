import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface VCISOLogEntry {
  id: string;
  organization_id: string;
  user_id: string;
  entry_date: string;
  category: string;
  title: string;
  description: string | null;
  hours_spent: number;
  created_at: string;
}

export function useVCISOLogEntries() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['vciso-log-entries', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('vciso_log_entries' as any)
        .select('*')
        .eq('organization_id', organization.id)
        .order('entry_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as VCISOLogEntry[];
    },
    enabled: !!organization?.id,
  });

  const createEntry = useMutation({
    mutationFn: async (entry: Omit<VCISOLogEntry, 'id' | 'organization_id' | 'created_at' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('vciso_log_entries' as any)
        .insert({ ...entry, organization_id: organization!.id, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vciso-log-entries'] });
      toast({ title: 'Entrada registrada no diário' });
    },
    onError: () => toast({ title: 'Erro ao registrar entrada', variant: 'destructive' }),
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VCISOLogEntry> & { id: string }) => {
      const { error } = await supabase
        .from('vciso_log_entries' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vciso-log-entries'] });
      toast({ title: 'Entrada atualizada' });
    },
    onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vciso_log_entries' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vciso-log-entries'] });
      toast({ title: 'Entrada removida' });
    },
    onError: () => toast({ title: 'Erro ao remover', variant: 'destructive' }),
  });

  return { ...query, createEntry, updateEntry, deleteEntry };
}
