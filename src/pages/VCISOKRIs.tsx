import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function VCISOKRIs() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Activity className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-space">Key Risk Indicators</h1>
          <p className="text-muted-foreground">Indicadores de risco de negócio com thresholds e tendências</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-space">Em breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">A gestão de KRIs será implementada na Etapa 2.</p>
        </CardContent>
      </Card>
    </div>
  );
}
