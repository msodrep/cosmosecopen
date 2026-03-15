import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function VCISOContinuidade() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <ShieldCheck className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-space">Testes de Continuidade</h1>
          <p className="text-muted-foreground">Calendário de testes de BIA, restore e tabletop exercises</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-space">Em breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">O calendário de testes será implementado na Etapa 3.</p>
        </CardContent>
      </Card>
    </div>
  );
}
