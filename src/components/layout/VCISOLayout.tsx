import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { VCISOSidebar } from './VCISOSidebar';
import { Separator } from '@/components/ui/separator';
import { Loader2, Eye } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { StarField } from '@/components/ui/star-field';
import { PageTransition } from './PageTransition';
import { AUTH_ROUTE } from '@/lib/constants';
import { useVCISOAccess } from '@/hooks/useVCISOAccess';
import { VCISOPaywall } from './VCISOPaywall';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeTitles: Record<string, string> = {
  '/vciso': 'Painel Executivo',
  '/vciso/roadmap': 'Roadmap Estratégico',
  '/vciso/kris': 'Key Risk Indicators',
  '/vciso/diario': 'Diário de Bordo',
  '/vciso/continuidade': 'Testes de Continuidade',
  '/vciso/riscos': 'Registro de Riscos',
  '/vciso/configuracoes': 'Configurações',
};

export function VCISOLayout() {
  const { user, loading: authLoading } = useAuth();
  const { organization, organizations, loading: orgLoading } = useOrganization();
  const { hasAccess, isLoading: accessLoading } = useVCISOAccess();
  const location = useLocation();

  if (authLoading || orgLoading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to={AUTH_ROUTE} replace />;
  if (organizations.length === 0 && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  if (!organization && organizations.length > 0 && location.pathname !== '/selecionar-organizacao') return <Navigate to="/selecionar-organizacao" replace />;

  const currentTitle = routeTitles[location.pathname] || 'vCISO';
  const breadcrumbItems = [
    { path: '/vciso', label: 'vCISO', isCurrentPage: location.pathname === '/vciso' },
  ];

  if (location.pathname !== '/vciso') {
    breadcrumbItems.push({ path: location.pathname, label: currentTitle, isCurrentPage: true });
    breadcrumbItems[0].isCurrentPage = false;
  }

  return (
    <SidebarProvider>
      <StarField starCount={60} dustCount={20} />
      <div className="min-h-screen flex w-full">
        <VCISOSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4 mx-2" />
            <div className="flex items-center gap-2 text-amber-500">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">vCISO</span>
            </div>
            <Separator orientation="vertical" className="h-4 mx-2" />
            <Breadcrumb className="flex-1">
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                  <BreadcrumbItem key={item.path}>
                    {index > 0 && <BreadcrumbSeparator />}
                    {item.isCurrentPage ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.path}>{item.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            <NotificationCenter />
          </header>
          <main className="flex-1 relative overflow-hidden">
            {!hasAccess && <VCISOPaywall />}
            <div
              className={`h-full overflow-auto p-6 ${!hasAccess ? 'pointer-events-none select-none' : ''}`}
            >
              <PageTransition>
                <Outlet context={{ isDemo: !hasAccess }} />
              </PageTransition>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
