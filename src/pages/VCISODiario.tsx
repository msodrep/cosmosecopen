import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function VCISODiario() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <BookOpen className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-space">Diário de Bordo</h1>
          <p className="text-muted-foreground">Registro de atividades, reuniões e pareceres do vCISO</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-space">Em breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">O diário de bordo será implementado na Etapa 2.</p>
        </CardContent>
      </Card>
    </div>
  );
}
