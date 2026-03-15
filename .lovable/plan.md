# Plano: Módulo vCISO — Análise de Arquitetura e Implementação

## Análise da Viabilidade

O CosmoSec já possui **80%+ da infraestrutura** necessária para o módulo vCISO. A maioria das funcionalidades solicitadas já existe em módulos separados. O trabalho principal é criar um **novo módulo agregador** que reúne e complementa o que já existe.

---

## Mapeamento: O que JÁ EXISTE vs. O que PRECISA SER CRIADO


| Funcionalidade solicitada          | Status    | Onde está                                          |
| ---------------------------------- | --------- | -------------------------------------------------- |
| Score de Risco Global              | Existe    | `ExecutiveSummaryCard`, `SecurityPostureScore`     |
| Radar de Maturidade                | Existe    | `ComplianceRadarChart`                             |
| Top 5 Riscos Críticos              | Existe    | `TopThreatsWidget`, `CriticalRisksAlert`           |
| Kanban de Tarefas                  | Existe    | `KanbanBoard` em Plano de Ação                     |
| Registro Central de Riscos         | Existe    | Módulo Riscos completo com matriz, tratamento      |
| Aprovação de Aceite de Risco       | Parcial   | Riscos têm `treatment`, falta log formal de aceite |
| BIA / PCN / PRD                    | Existe    | ISO 22301 framework com 236 controles              |
| Gestão de Fornecedores (TPRM)      | Existe    | Módulo VRM completo                                |
| Questionários Automatizados        | Existe    | Qualificação com portal externo                    |
| Registro de Incidentes             | Existe    | `vendor_incidents` (precisa generalizar)           |
| RBAC                               | Existe    | `user_roles` com admin/auditor/analyst             |
| Multi-org                          | Existe    | `organizations` + `OrganizationContext`            |
| Notificações de prazo              | Existe    | `SendDeadlineNotifications`                        |
| **KRIs (indicadores de negócio)**  | **Criar** | Nova tabela + UI                                   |
| **Roadmap Estratégico (Gantt)**    | **Criar** | Nova página com timeline visual                    |
| **Log do vCISO (Diário de Bordo)** | **Criar** | Nova tabela + UI                                   |
| **Painel C-Level dedicado**        | **Criar** | Nova página agregadora                             |
| **Calendário de Testes (BIA)**     | **Criar** | Nova tabela + UI                                   |
| **Role "clevel" (só leitura)**     | **Criar** | Novo role no RBAC                                  |
| **White-label (logo do cliente)**  | Parcial   | `organizations.logo_url` existe, falta exibir      |


---

## Arquitetura Proposta

O módulo vCISO será o **4º módulo** do CosmoSec, acessível via `/vciso/*`, seguindo o padrão dos módulos VRM e Policies.

### Fase 1 — Infraestrutura (DB + Layout)

**Banco de dados** — 4 novas tabelas:

1. `**vciso_log_entries**` — Diário de bordo do vCISO
  - `id`, `organization_id`, `user_id`, `entry_date`, `category` (reunião/parecer/aprovação/outro), `title`, `description`, `hours_spent`, `created_at`
2. `**key_risk_indicators**` — KRIs de negócio
  - `id`, `organization_id`, `framework_id`, `name`, `description`, `current_value`, `target_value`, `unit`, `trend` (up/down/stable), `severity` (low/medium/high/critical), `measured_at`, `created_at`
3. `**strategic_roadmap_items**` — Itens do roadmap/Gantt
  - `id`, `organization_id`, `title`, `description`, `category`, `start_date`, `end_date`, `status` (planned/in_progress/done/blocked), `priority`, `assigned_to`, `quarter`, `created_at`
4. `**continuity_tests**` — Calendário de testes de continuidade
  - `id`, `organization_id`, `test_type` (tabletop/restore/failover/drill), `title`, `description`, `scheduled_date`, `executed_date`, `status`, `lessons_learned`, `report_url`, `conducted_by`, `created_at`

**RBAC** — Adicionar role `clevel` ao enum `app_role` com permissões de somente leitura.

**Layout** — Criar `VCISOLayout` e `VCISOSidebar` seguindo o padrão do `VendorLayout`.

### Fase 2 — Páginas Core

1. `**/vciso**` — Painel C-Level (Dashboard Executivo)
  - Agrega: Score Global, Radar de Maturidade, KRIs, Top 5 Riscos, Planos Atrasados
  - Reusa componentes existentes: `SecurityPostureScore`, `ComplianceRadarChart`, `TopThreatsWidget`
  - Novo: Widget de KRIs, botão "Gerar Relatório Executivo"
2. `**/vciso/roadmap**` — Roadmap Estratégico
  - Timeline visual (Gantt simplificado) com projetos por trimestre
  - Cards por status com drag-and-drop
  - Integração com `action_plans` existentes
3. `**/vciso/kris**` — Gestão de KRIs
  - CRUD de indicadores com gráficos de tendência
  - Alertas visuais quando KRI ultrapassar threshold
4. `**/vciso/diario**` — Diário de Bordo
  - Log de atividades do vCISO (reuniões, pareceres, horas)
  - Filtro por período para prestação de contas mensal
  - Exportação em PDF
5. `**/vciso/continuidade**` — Calendário de Testes
  - Calendário visual com testes agendados e realizados
  - Registro de lições aprendidas
  - Links para planos (PCN/PRD) via módulo de Políticas
6. `**/vciso/riscos**` — Registro de Riscos com Aceite Formal
  - Reusa o módulo de Riscos existente
  - Adiciona: botão de "Aceite Formal" que grava log com timestamp + user_id do C-Level que aprovou

### Fase 3 — Integrações

- **Incidentes generalizados**: Adaptar `vendor_incidents` ou criar tabela `security_incidents` para incidentes não vinculados a fornecedores
- **White-label**: Exibir `organizations.logo_url` no header do módulo vCISO
- **Cobrança automatizada**: Reusar `send-deadline-notifications` edge function existente

---

## Rotas no App.tsx

```text
<Route element={<VCISOLayout />}>
  <Route path="/vciso" element={<VCISODashboard />} />
  <Route path="/vciso/roadmap" element={<VCISOReoadmap />} />
  <Route path="/vciso/kris" element={<VCISOKRIs />} />
  <Route path="/vciso/diario" element={<VCISODiario />} />
  <Route path="/vciso/continuidade" element={<VCISOContinuidade />} />
  <Route path="/vciso/riscos" element={<VCISORiscos />} />
  <Route path="/vciso/configuracoes" element={<Configuracoes />} />
</Route>
```

---

## Arquivos a Criar/Editar


| Recurso                                  | Ação                                             |
| ---------------------------------------- | ------------------------------------------------ |
| Migração SQL                             | Criar — 4 tabelas + role `clevel` + RLS policies |
| `src/components/layout/VCISOLayout.tsx`  | Criar                                            |
| `src/components/layout/VCISOSidebar.tsx` | Criar                                            |
| `src/pages/VCISODashboard.tsx`           | Criar                                            |
| `src/pages/VCISORoadmap.tsx`             | Criar                                            |
| `src/pages/VCISOKRIs.tsx`                | Criar                                            |
| `src/pages/VCISODiario.tsx`              | Criar                                            |
| `src/pages/VCISOContinuidade.tsx`        | Criar                                            |
| `src/pages/VCISORiscos.tsx`              | Criar                                            |
| `src/hooks/useVCISOLogEntries.ts`        | Criar                                            |
| `src/hooks/useKRIs.ts`                   | Criar                                            |
| `src/hooks/useRoadmapItems.ts`           | Criar                                            |
| `src/hooks/useContinuityTests.ts`        | Criar                                            |
| `src/pages/SelecionarModulo.tsx`         | Editar — adicionar card vCISO                    |
| `src/App.tsx`                            | Editar — adicionar rotas `/vciso/*`              |
| `src/hooks/usePermissions.ts`            | Editar — adicionar role `clevel`                 |


---

## Recomendação de Faseamento

Dado o tamanho, sugiro implementar em **3 etapas**:

1. **Etapa 1**: DB (tabelas + RLS) + Layout + Dashboard C-Level + entrada no SelecionarModulo
2. **Etapa 2**: Roadmap + KRIs + Diário de Bordo
3. **Etapa 3**: Calendário de Testes + Aceite Formal de Riscos + Incidentes

Deseja começar pela Etapa 1?