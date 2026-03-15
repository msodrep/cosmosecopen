

# Melhorias para o Módulo vCISO

Após análise completa das 6 páginas, hooks e layout, identifiquei melhorias organizadas por impacto.

---

## 1. Dashboard Executivo — Enriquecer significativamente

**Problema atual**: O dashboard é básico — 4 métricas, 2 gráficos e lista de planos atrasados. Falta a visão de "Torre de Controle" prometida.

**Melhorias**:
- Adicionar **widget de KRIs resumido** (top 3 críticos com sparklines) direto no dashboard
- Adicionar **resumo do Roadmap** (próximos marcos, % conclusão trimestral)
- Adicionar **mini-calendário de testes** com próximos testes agendados
- Adicionar **contagem de riscos aceitos formalmente** com link para `/vciso/riscos`
- Adicionar **horas do vCISO no mês** (consumidas do diário de bordo)
- Botão **"Gerar Relatório Executivo"** que compila tudo em PDF (via edge function)
- Exibir **logo da organização** (white-label) de forma mais proeminente no header

---

## 2. Roadmap — Gantt Visual Real

**Problema atual**: É uma lista agrupada por trimestre com barra de progresso simples. Não há visualização de timeline real.

**Melhorias**:
- Implementar **Gantt visual horizontal** com eixo temporal (meses) e barras por item
- **Cálculo automático do trimestre** baseado nas datas (em vez de input manual)
- Adicionar **dependências entre itens** (campo `depends_on`)
- Adicionar **percentual de conclusão manual** (0-100%) além do automático por data
- Confirmação antes de deletar itens

---

## 3. KRIs — Histórico e Alertas

**Problema atual**: KRIs são estáticos — mostram valor atual vs meta, sem histórico de evolução.

**Melhorias**:
- Criar tabela **`kri_history`** para registrar snapshots mensais dos valores
- Adicionar **gráfico de tendência** (linha) mostrando evolução dos últimos 6-12 meses
- **Alertas automáticos**: badge piscante quando KRI ultrapassa threshold crítico
- **KRIs sugeridos**: templates pré-definidos (ex: "% funcionários treinados", "tempo médio de patch", "sistemas sem backup")
- Adicionar campo **`threshold_warning`** e **`threshold_critical`** para alertas configuráveis

---

## 4. Diário de Bordo — Exportação e Relatório Mensal

**Problema atual**: Funcional mas sem exportação — o objetivo principal é prestação de contas mensal.

**Melhorias**:
- **Exportação PDF/CSV** do relatório mensal (filtrado por período)
- Adicionar categorias extras: **"incidente"**, **"treinamento"**, **"auditoria"**
- **Resumo automático do mês** com total de horas por categoria (mini-gráfico de pizza)
- **Vinculação** com riscos ou planos de ação (campo opcional `linked_entity_id`)

---

## 5. Testes de Continuidade — Calendário Visual

**Problema atual**: É uma lista plana. Falta a visão de calendário prometida.

**Melhorias**:
- Adicionar **visão calendário mensal** (reusar componente `Calendar` existente) mostrando testes por dia
- **Notificação de teste próximo** (integrar com `send-deadline-notifications`)
- Adicionar campo **participantes** (array de nomes/emails)
- **Anexar evidências** (link para módulo de evidências ou upload direto)

---

## 6. Riscos (Aceite Formal) — Melhorias de Auditoria

**Problema atual**: Funcional, mas o aceite formal poderia ser mais robusto.

**Melhorias**:
- Adicionar **timeline de aceites** — histórico visual de todos os aceites formais feitos
- **Expiração de aceite**: campo `acceptance_expires_at` para forçar reavaliação periódica
- **Filtro por tratamento** na tabela geral (mitigar/aceitar/transferir/evitar)
- Adicionar **risco residual** vs inerente (já existe no schema, exibir visualmente)

---

## 7. Sidebar — Badges e Alertas

**Melhorias**:
- Adicionar **badges numéricos** na sidebar: riscos críticos, testes atrasados, planos vencidos
- Adicionar link para **"Incidentes"** (quando implementado)

---

## 8. Permissões C-Level — Aplicar restrições

**Problema atual**: O role `clevel` existe no RBAC mas não é aplicado nas páginas vCISO.

**Melhorias**:
- Esconder botões de edição/criação/exclusão para usuários `clevel`
- Manter visível apenas: dashboards, visualização de riscos e botão de aceite formal
- Exibir banner "Modo Somente Leitura" para C-Level

---

## Priorização Sugerida

| Prioridade | Melhoria | Impacto |
|---|---|---|
| 1 | Dashboard enriquecido (widgets de KRI, Roadmap, Testes) | Alto — é a tela principal |
| 2 | Exportação PDF do Diário de Bordo | Alto — core do serviço vCISO |
| 3 | Gantt visual no Roadmap | Alto — diferenciador visual |
| 4 | Histórico de KRIs com gráficos | Médio — valor analítico |
| 5 | Calendário visual de Testes | Médio — UX |
| 6 | Permissões C-Level aplicadas | Médio — segurança |
| 7 | Badges na sidebar | Baixo — polish |
| 8 | Timeline de aceites de risco | Baixo — auditoria |

---

## Arquivos Impactados

| Recurso | Ação |
|---------|------|
| Migração SQL | Criar `kri_history` + campos extras |
| `src/pages/VCISODashboard.tsx` | Reescrever — adicionar 5+ widgets |
| `src/pages/VCISORoadmap.tsx` | Reescrever — Gantt visual |
| `src/pages/VCISOKRIs.tsx` | Editar — gráficos de tendência |
| `src/pages/VCISODiario.tsx` | Editar — exportação + categorias |
| `src/pages/VCISOContinuidade.tsx` | Editar — visão calendário |
| `src/pages/VCISORiscos.tsx` | Editar — filtros + timeline |
| `src/components/layout/VCISOSidebar.tsx` | Editar — badges |
| `src/hooks/useKRIs.ts` | Editar — histórico |
| Edge function `generate-vciso-report` | Criar — PDF executivo |

Qual melhoria ou grupo de melhorias deseja implementar primeiro?

