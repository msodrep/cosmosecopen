

# Plano: Módulo vCISO com Dados Mockados + Bloqueio de Acesso

## Objetivo
Preencher todo o módulo vCISO com dados mockados visualmente ricos (dashboards, KRIs, roadmap, diário, testes, riscos) mas bloquear a interação real. Um overlay/paywall impede o uso, direcionando o usuário a contatar o proprietário via WhatsApp/email para contratar o serviço.

---

## Arquitetura

### 1. Componente de Bloqueio (`VCISOPaywall`)
- Overlay semi-transparente com blur sobre todo o conteúdo do módulo
- Exibido **por cima** do conteúdo real (dados mockados ficam visíveis por baixo, desfocados)
- Ícone de cadeado, título "Módulo vCISO — Exclusivo", descrição do valor
- Botões: "Falar no WhatsApp" (link `WHATSAPP_URL`) e "Enviar Email" (link `CONTACT_EMAIL`)
- Bloqueia scroll e interação com o conteúdo abaixo

### 2. Hook `useVCISOAccess`
- Verifica na tabela `organizations` se a org tem acesso ao módulo vCISO
- Por padrão, **ninguém** tem acesso (campo `vciso_enabled` = false)
- Retorna `{ hasAccess: boolean, isLoading: boolean }`

### 3. Migração SQL
- Adicionar coluna `vciso_enabled BOOLEAN DEFAULT false` à tabela `organizations`

### 4. Dados Mockados
- Criar arquivo `src/lib/vciso-mock-data.ts` com dados estáticos para todas as seções:
  - **Dashboard**: métricas de compliance (78%), riscos críticos (3), horas vCISO (42h), planos atrasados (2)
  - **KRIs**: 6 indicadores com sparklines (MFA 85%, Patching 12 dias, Backups 1, Vulnerabilidades 4, Treinamento 72%, Incidentes 2)
  - **Roadmap**: 8 itens distribuídos em 4 trimestres com Gantt visual
  - **Diário**: 10 entradas de atividades (reuniões, pareceres, aprovações)
  - **Testes**: 4 testes de continuidade agendados no calendário
  - **Riscos**: 6 riscos com matriz de calor preenchida

### 5. Modificação do `VCISOLayout`
- Verificar `useVCISOAccess()` 
- Se `!hasAccess`: renderizar as páginas com dados mockados + overlay de paywall
- Se `hasAccess`: renderizar normalmente (comportamento atual com dados reais)

### 6. Páginas Mockadas
- Criar versões "demo" de cada página que usam dados estáticos em vez de hooks reais
- Ou: injetar os dados mockados quando `!hasAccess` e renderizar as mesmas páginas com `pointer-events: none` + overlay

**Abordagem escolhida**: Renderizar o conteúdo mockado diretamente no layout com um overlay por cima (mais simples, sem duplicar páginas).

---

## Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| **Migração SQL** | Adicionar `vciso_enabled` a `organizations` |
| `src/hooks/useVCISOAccess.ts` | Criar — verifica acesso |
| `src/lib/vciso-mock-data.ts` | Criar — todos os dados mockados |
| `src/components/layout/VCISOPaywall.tsx` | Criar — overlay de bloqueio |
| `src/components/layout/VCISOLayout.tsx` | Editar — integrar paywall |
| `src/pages/VCISODashboard.tsx` | Editar — usar mock data quando bloqueado |
| `src/pages/VCISORoadmap.tsx` | Editar — usar mock data quando bloqueado |
| `src/pages/VCISOKRIs.tsx` | Editar — usar mock data quando bloqueado |
| `src/pages/VCISODiario.tsx` | Editar — usar mock data quando bloqueado |
| `src/pages/VCISOContinuidade.tsx` | Editar — usar mock data quando bloqueado |
| `src/pages/VCISORiscos.tsx` | Editar — usar mock data quando bloqueado |

---

## Fluxo do Usuário

1. Usuário acessa `/vciso`
2. Vê o dashboard preenchido com dados mockados impressionantes (mas desfocados/bloqueados)
3. Overlay com: "Este módulo é exclusivo para clientes do serviço vCISO. Entre em contato para contratar."
4. Botões de WhatsApp e Email
5. Proprietário habilita `vciso_enabled = true` manualmente no backend
6. Usuário passa a ter acesso completo com dados reais

---

## Detalhes do Paywall Visual

- Background: `backdrop-blur-sm` com gradiente escuro
- Conteúdo mockado visível por baixo (efeito vitrine)
- O overlay é fixo dentro do `<main>` do layout, cobrindo todo o conteúdo
- `pointer-events: none` no conteúdo + `pointer-events: auto` no overlay
- Responsivo para mobile

