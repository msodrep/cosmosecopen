import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';

export default function VCISORoadmap() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Map className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-space">Roadmap Estratégico</h1>
          <p className="text-muted-foreground">Timeline visual com projetos de segurança por trimestre</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-space">Em breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">O roadmap estratégico será implementado na Etapa 2.</p>
        </CardContent>
      </Card>
    </div>
  );
}
