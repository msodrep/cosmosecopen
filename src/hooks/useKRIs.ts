import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from '@/hooks/use-toast';

export interface KRI {
  id: string;
  organization_id: string;
  framework_id: string | null;
  name: string;
  description: string | null;
  current_value: number;
  target_value: number;
  unit: string;
  trend: string;
  severity: string;
  measured_at: string;
  created_at: string;
  updated_at: string;
}

export function useKRIs() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['kris', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('key_risk_indicators' as any)
        .select('*')
        .eq('organization_id', organization.id)
        .order('severity', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as KRI[];
    },
    enabled: !!organization?.id,
  });

  const createKRI = useMutation({
    mutationFn: async (kri: Omit<KRI, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('key_risk_indicators' as any)
        .insert({ ...kri, organization_id: organization!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kris'] });
      toast({ title: 'KRI criado com sucesso' });
    },
    onError: () => toast({ title: 'Erro ao criar KRI', variant: 'destructive' }),
  });

  const updateKRI = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KRI> & { id: string }) => {
      const { error } = await supabase
        .from('key_risk_indicators' as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kris'] });
      toast({ title: 'KRI atualizado' });
    },
    onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
  });

  const deleteKRI = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('key_risk_indicators' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kris'] });
      toast({ title: 'KRI removido' });
    },
    onError: () => toast({ title: 'Erro ao remover', variant: 'destructive' }),
  });

  return { ...query, createKRI, updateKRI, deleteKRI };
}
