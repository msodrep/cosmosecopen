import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useVCISOAccess() {
  const { organization } = useOrganization();

  const { data: hasAccess = false, isLoading } = useQuery({
    queryKey: ['vciso-access', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return false;
      const { data, error } = await supabase
        .from('organizations')
        .select('vciso_enabled')
        .eq('id', organization.id)
        .single();
      if (error) return false;
      return (data as any)?.vciso_enabled === true;
    },
    enabled: !!organization?.id,
  });

  return { hasAccess, isLoading };
}
