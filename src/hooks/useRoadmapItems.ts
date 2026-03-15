import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface RoadmapItem {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  category: string;
  start_date: string;
  end_date: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  quarter: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useRoadmapItems() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['roadmap-items', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('strategic_roadmap_items' as any)
        .select('*')
        .eq('organization_id', organization.id)
        .order('start_date', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as RoadmapItem[];
    },
    enabled: !!organization?.id,
  });

  const createItem = useMutation({
    mutationFn: async (item: Omit<RoadmapItem, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('strategic_roadmap_items' as any)
        .insert({ ...item, organization_id: organization!.id, created_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap-items'] });
      toast({ title: 'Item adicionado ao roadmap' });
    },
    onError: () => toast({ title: 'Erro ao criar item', variant: 'destructive' }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RoadmapItem> & { id: string }) => {
      const { error } = await supabase
        .from('strategic_roadmap_items' as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap-items'] });
      toast({ title: 'Item atualizado' });
    },
    onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('strategic_roadmap_items' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap-items'] });
      toast({ title: 'Item removido' });
    },
    onError: () => toast({ title: 'Erro ao remover', variant: 'destructive' }),
  });

  return { ...query, createItem, updateItem, deleteItem };
}
