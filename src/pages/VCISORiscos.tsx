import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function VCISORiscos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-space">Registro de Riscos</h1>
          <p className="text-muted-foreground">Registro central com aceite formal de riscos pelo C-Level</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-space">Em breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">O registro de riscos com aceite formal será implementado na Etapa 3.</p>
        </CardContent>
      </Card>
    </div>
  );
}
