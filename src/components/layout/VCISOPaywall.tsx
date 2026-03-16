import { Lock, MessageCircle, Mail, Shield, BarChart3, BookOpen, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WHATSAPP_URL, CONTACT_EMAIL } from '@/lib/constants';

const FEATURES = [
  { icon: Shield, label: 'Painel Executivo C-Level' },
  { icon: BarChart3, label: 'KRIs com tendências e alertas' },
  { icon: Map, label: 'Roadmap Estratégico Gantt' },
  { icon: BookOpen, label: 'Diário de Bordo + Relatórios' },
];

export function VCISOPaywall() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[6px]" />

      {/* Content card */}
      <div className="relative z-10 max-w-md w-full bg-card border border-border rounded-2xl shadow-2xl p-8 text-center space-y-6">
        {/* Lock icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Badge variant="outline" className="border-amber-500/30 text-amber-500 mb-2">
            Módulo Premium
          </Badge>
          <h2 className="text-2xl font-bold font-space">Módulo vCISO</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Torre de Controle para gestão executiva de cibersegurança. 
            Entre em contato para ativar este módulo exclusivo.
          </p>
        </div>

        {/* Features list */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm">
              <f.icon className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-muted-foreground text-xs">{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => window.open(WHATSAPP_URL, '_blank')}
          >
            <MessageCircle className="w-4 h-4" />
            Falar no WhatsApp
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => window.open(`mailto:${CONTACT_EMAIL}?subject=Interesse no módulo vCISO`, '_blank')}
          >
            <Mail className="w-4 h-4" />
            Enviar Email
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Ao contratar, o módulo será ativado automaticamente para sua organização.
        </p>
      </div>
    </div>
  );
}
