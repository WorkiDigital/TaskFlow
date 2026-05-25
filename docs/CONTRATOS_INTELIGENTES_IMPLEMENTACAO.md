# Implementação — Contratos Inteligentes no TaskFlow

## Objetivo

Implementar um módulo de **Contratos Inteligentes** no TaskFlow para permitir que cada agência/prestador de serviço:

- Cadastre vários modelos de contrato.
- Associe contratos a serviços diferentes.
- Configure entregáveis, valores, prazos e datas.
- Mapeie variáveis do contrato para dados reais do sistema.
- Gere formulários automaticamente com base nas variáveis faltantes.
- Gere contratos completos com dados do cliente, serviço, formulário e proposta.
- Envie contratos para assinatura via Autentique.
- Use assinatura como gatilho para automações e criação de projetos.

A ideia central é garantir que **contrato, formulário, serviço e onboarding nunca fiquem desconectados**.

---

## Estado atual do repositório

O TaskFlow já possui uma base funcional para contratos e assinatura.

Arquivos relevantes existentes:

```txt
src/routes/_app.contracts.tsx
src/components/contracts/ContractBuilder.tsx
src/components/contracts/ContractList.tsx
src/services/contractsService.ts
supabase/functions/onboarding-execute/index.ts
supabase/functions/contract-send-autentique/index.ts
supabase/functions/autentique-webhook/index.ts
```

### O que já existe

- Listagem de contratos.
- Criação de contrato em rascunho.
- Atualização de contrato.
- Exclusão de contrato.
- Listagem/criação/edição de `contract_templates`.
- Envio de contrato ao Autentique via Edge Function.
- Webhook do Autentique marcando contrato como assinado.
- `onboarding-execute` já consegue gerar contrato e enviar para assinatura.

### Limitações atuais

- `contract_templates` ainda não têm uma estrutura completa de variáveis mapeadas.
- Não existe cadastro formal de serviços/produtos da agência.
- Não existe camada de dados comerciais do cliente/deal.
- O formulário ainda não é gerado automaticamente com base nas variáveis do contrato.
- Não existe validação forte de “variável obrigatória sem origem”.
- A importação de contrato ainda não transforma texto em template estruturado.
- A IA ainda não atua como assistente opcional para sugerir variáveis e campos.

---

## Conceito de arquitetura

O fluxo ideal deve ser:

```txt
Serviço contratado
  ↓
Define modelo de contrato padrão
  ↓
Modelo possui variáveis
  ↓
Variáveis são mapeadas para cliente, formulário, serviço, dados comerciais ou valor fixo
  ↓
Formulário coleta apenas dados faltantes
  ↓
Contrato é gerado completo
  ↓
Contrato é enviado para assinatura
  ↓
Assinatura dispara automações e/ou criação de projeto
```

O centro da arquitetura deve ser o **serviço contratado**.

Um serviço define:

```txt
modelo de contrato padrão
template operacional/projeto padrão
valor padrão
prazo padrão
entregáveis padrão
campos comerciais necessários
```

---

## Menu/UX sugerido

Dentro de `/contracts`, organizar a interface em abas ou submódulos:

```txt
Contratos
├── Contratos gerados
├── Modelos
├── Serviços
└── Variáveis
```

### Aba: Contratos gerados

Lista contratos reais gerados para clientes.

Deve mostrar:

- Cliente.
- Serviço contratado.
- Modelo usado.
- Valor.
- Prazo.
- Status.
- Data de criação.
- Link de assinatura.
- Ações: visualizar, editar rascunho, enviar assinatura, reenviar link, cancelar.

### Aba: Modelos

CRUD de modelos de contrato.

Deve permitir:

- Criar modelo.
- Editar conteúdo.
- Duplicar modelo.
- Arquivar modelo.
- Detectar variáveis `{{variavel}}`.
- Mapear variáveis.
- Validar modelo.
- Publicar modelo.

### Aba: Serviços

CRUD de serviços/produtos da agência.

Cada serviço deve ter:

- Nome.
- Categoria.
- Tipo de cobrança.
- Valor padrão.
- Prazo padrão.
- Entregáveis.
- Modelo de contrato padrão.
- Template operacional/projeto padrão.

### Aba: Variáveis

Biblioteca e status das variáveis usadas nos contratos.

Estados possíveis:

```txt
Preenchida
Faltando origem
Vem do cliente
Vem do formulário
Vem dos dados comerciais
Vem do serviço
Valor fixo
Manual na geração
```

---

## Fase 1 — Estrutura de banco

Criar/ajustar tabelas para contratos inteligentes.

### Tabela: `contract_templates`

A tabela já existe, mas deve ser expandida.

Campos sugeridos:

```sql
id uuid primary key default gen_random_uuid(),
agency_id uuid not null,
name text not null,
description text,
category text,
service_type text,
content text not null,
variables jsonb default '[]'::jsonb,
required_variables jsonb default '[]'::jsonb,
status text not null default 'draft',
created_at timestamptz default now(),
updated_at timestamptz default now()
```

Status possíveis:

```txt
draft
published
archived
```

Regras:

- Todo template precisa de `agency_id`.
- Templates publicados não podem ter variáveis obrigatórias sem origem.
- Templates arquivados não devem aparecer como opção padrão.

---

### Tabela: `contract_template_variables`

Nova tabela para mapear variáveis do contrato.

```sql
id uuid primary key default gen_random_uuid(),
agency_id uuid not null,
template_id uuid not null references contract_templates(id) on delete cascade,
variable_key text not null,
label text not null,
source_type text not null,
source_id text,
required boolean default true,
field_type text default 'text',
fallback_value text,
created_at timestamptz default now(),
updated_at timestamptz default now()
```

Valores possíveis para `source_type`:

```txt
client_field
form_field
commercial_field
service_field
fixed_value
manual_input
```

Valores possíveis para `field_type`:

```txt
text
email
phone
cpf_cnpj
currency
number
date
textarea
select
checkbox
```

Exemplo:

```txt
variable_key: valor_contrato
label: Valor do contrato
source_type: commercial_field
field_type: currency
required: true
```

---

### Tabela: `services`

Cadastro de serviços/produtos da agência.

```sql
id uuid primary key default gen_random_uuid(),
agency_id uuid not null,
name text not null,
description text,
category text,
pricing_type text,
default_price numeric,
default_duration_months integer,
default_contract_template_id uuid references contract_templates(id),
default_project_template_id uuid,
created_at timestamptz default now(),
updated_at timestamptz default now()
```

Valores possíveis para `pricing_type`:

```txt
recurring
one_time
setup
consulting
custom
```

---

### Tabela: `service_deliverables`

Entregáveis padrão de cada serviço.

```sql
id uuid primary key default gen_random_uuid(),
agency_id uuid not null,
service_id uuid not null references services(id) on delete cascade,
title text not null,
description text,
position integer default 0,
created_at timestamptz default now(),
updated_at timestamptz default now()
```

---

### Tabela: `client_deals`

Representa o serviço contratado pelo cliente.

```sql
id uuid primary key default gen_random_uuid(),
agency_id uuid not null,
client_id uuid not null references clients(id) on delete cascade,
service_id uuid references services(id),
contract_template_id uuid references contract_templates(id),
value numeric,
payment_terms text,
duration_months integer,
start_date date,
end_date date,
status text default 'draft',
custom_deliverables jsonb default '[]'::jsonb,
created_at timestamptz default now(),
updated_at timestamptz default now()
```

Status possíveis:

```txt
draft
active
contract_sent
signed
cancelled
finished
```

---

## Fase 2 — RLS e multiagência

Todas as novas tabelas precisam respeitar `agency_id`.

Aplicar RLS em:

```txt
contract_templates
contract_template_variables
services
service_deliverables
client_deals
contracts
```

Regra geral:

```sql
agency_id = current_user_agency_id
```

No front, sempre usar o helper existente:

```ts
getCurrentUserAgency()
```

Arquivos a revisar:

```txt
src/services/contractsService.ts
src/lib/auth.ts
```

Atenção:

- `listContracts()` já filtra por `agency_id`.
- `createDraft()` já tenta inserir `agency_id`.
- `getContract()`, `updateContract()` e `deleteContract()` devem ser revisados para também validar agência.
- `listContractTemplates()` ainda precisa filtrar por `agency_id`.
- `createContractTemplate()` precisa inserir `agency_id`.

---

## Fase 3 — Utilitários de variáveis

Criar arquivo:

```txt
src/lib/contractVariables.ts
```

Funções necessárias:

```ts
export function extractTemplateVariables(content: string): string[]
```

Responsável por extrair variáveis no formato:

```txt
{{nome_cliente}}
{{valor_contrato}}
{{data_inicio}}
```

Regras:

- Remover duplicadas.
- Normalizar espaços.
- Retornar apenas o nome da variável, sem chaves.

Exemplo:

```ts
extractTemplateVariables('Olá {{ nome_cliente }}, valor {{valor_contrato}}')
// ['nome_cliente', 'valor_contrato']
```

---

```ts
export function renderContractTemplate(content: string, values: Record<string, string>): string
```

Responsável por substituir variáveis pelo valor resolvido.

---

```ts
export function validateTemplateVariables(args: {
  requiredVariables: string[]
  resolvedValues: Record<string, unknown>
}): { valid: boolean; missing: string[] }
```

Responsável por bloquear geração/envio se faltar variável obrigatória.

---

```ts
export function resolveContractVariables(args: {
  client: Record<string, unknown>
  deal?: Record<string, unknown>
  service?: Record<string, unknown>
  formPayload?: Record<string, unknown>
  fixedValues?: Record<string, unknown>
  mappings: Array<ContractTemplateVariable>
}): Record<string, string>
```

Responsável por montar o mapa final de variáveis.

---

## Fase 4 — Service de contratos

Atualizar:

```txt
src/services/contractsService.ts
```

Adicionar funções:

```ts
listContractTemplates()
getContractTemplate(id)
createContractTemplate(input)
updateContractTemplate(id, input)
archiveContractTemplate(id)
duplicateContractTemplate(id)
extractVariablesFromTemplate(content)
listTemplateVariables(templateId)
upsertTemplateVariableMapping(templateId, variables)
validateContractTemplate(templateId)
generateContractFromTemplate(input)
```

### `generateContractFromTemplate(input)`

Entrada sugerida:

```ts
type GenerateContractInput = {
  clientId: string
  dealId?: string
  templateId: string
  formPayload?: Record<string, unknown>
  manualValues?: Record<string, unknown>
}
```

Fluxo:

```txt
1. Buscar agência atual.
2. Buscar cliente.
3. Buscar deal, se informado.
4. Buscar serviço, se informado.
5. Buscar template.
6. Buscar mapeamentos de variáveis.
7. Resolver variáveis.
8. Validar obrigatórias.
9. Renderizar conteúdo.
10. Criar contrato em contracts com status draft ou ready_to_send.
```

Status recomendado:

```txt
draft
ready_to_send
sent
signed
cancelled
expired
```

---

## Fase 5 — Tela de modelos de contrato

Criar componentes:

```txt
src/components/contracts/templates/ContractTemplatesManager.tsx
src/components/contracts/templates/ContractTemplateEditor.tsx
src/components/contracts/templates/ContractVariablePanel.tsx
src/components/contracts/templates/VariableMappingDialog.tsx
```

### `ContractTemplatesManager`

Responsável por:

- Listar templates.
- Criar template.
- Duplicar template.
- Arquivar template.
- Abrir editor.

### `ContractTemplateEditor`

Layout sugerido:

```txt
Editor de contrato à esquerda
Painel de variáveis à direita
Barra de status no topo
```

Ações:

```txt
Salvar rascunho
Validar modelo
Publicar modelo
Duplicar
Arquivar
```

### `ContractVariablePanel`

Mostrar:

```txt
Variável
Label
Origem
Obrigatória?
Tipo de campo
Status
```

Estados:

```txt
Mapeada
Faltando origem
Valor fixo
Manual
Campo de formulário necessário
```

### `VariableMappingDialog`

Permitir mapear variável para:

```txt
Campo do cliente
Campo do formulário
Dado comercial
Campo do serviço
Valor fixo
Preenchimento manual
```

---

## Fase 6 — Formulário conectado ao contrato

Objetivo: gerar campos de formulário com base nas variáveis faltantes.

Criar função:

```ts
getMissingVariablesForForm(templateId, existingSources)
```

Exemplo:

Contrato contém:

```txt
{{nome_cliente}}
{{cpf_cnpj_cliente}}
{{valor_contrato}}
{{data_inicio}}
```

Se:

```txt
nome_cliente -> client_field
valor_contrato -> commercial_field
data_inicio -> commercial_field
```

Então o formulário deve gerar apenas:

```txt
cpf_cnpj_cliente
```

A UI deve permitir:

```txt
Gerar formulário a partir das variáveis faltantes
```

Esse formulário pode ser salvo no workspace de onboarding ou em uma tabela própria, dependendo da arquitetura atual de formulários.

---

## Fase 7 — Serviços e entregáveis

Criar componentes:

```txt
src/components/contracts/services/ServicesManager.tsx
src/components/contracts/services/ServiceFormDialog.tsx
src/components/contracts/services/DeliverablesEditor.tsx
```

Funcionalidades:

- Criar serviço.
- Editar serviço.
- Arquivar serviço.
- Definir entregáveis.
- Definir valor padrão.
- Definir prazo padrão.
- Definir modelo de contrato padrão.
- Definir template operacional/projeto padrão.

Exemplo de serviço:

```txt
Nome: Gestão de Tráfego
Tipo: Recorrente
Valor padrão: R$ 2.000/mês
Prazo padrão: 6 meses
Modelo de contrato: Contrato Gestão de Tráfego
Template operacional: Gestão de Tráfego
Entregáveis:
- Planejamento de campanhas
- Gestão Meta Ads
- Otimização semanal
- Relatório mensal
```

---

## Fase 8 — Dados comerciais na criação do cliente

Atualizar:

```txt
src/components/clients/ClientFormDialog.tsx
```

Adicionar seção opcional:

```txt
Dados comerciais
```

Campos:

```txt
Serviço contratado
Modelo de contrato
Valor
Forma de pagamento
Prazo em meses
Data de início
Data de fim calculada
Entregáveis personalizados
Responsável comercial
```

Ao criar cliente:

```txt
1. Criar registro em clients.
2. Criar registro em client_deals.
3. Passar dealId para onboarding, quando aplicável.
```

O onboarding poderá usar o deal para gerar contrato corretamente.

---

## Fase 9 — Atualizar `onboarding-execute`

Arquivo:

```txt
supabase/functions/onboarding-execute/index.ts
```

Hoje ele já gera contrato usando `contract_templates` e variáveis básicas.

Atualizar para:

```txt
1. Buscar client_deal ativo do cliente.
2. Buscar serviço contratado.
3. Buscar contract_template do deal ou serviço.
4. Buscar mapeamentos em contract_template_variables.
5. Resolver variáveis com client + deal + service + formPayload.
6. Bloquear geração se faltar variável obrigatória.
7. Criar contrato com status ready_to_send.
8. Enviar para Autentique apenas se contrato estiver completo.
```

A etapa `generate_contract` não deve mais pegar apenas o último template por `created_at`.

Deve seguir prioridade:

```txt
1. contract_template_id do client_deal
2. default_contract_template_id do service
3. template definido na config da etapa
4. fallback controlado apenas se configurado
```

---

## Fase 10 — Importação de contrato sem IA

Implementar primeiro sem IA para reduzir custo.

Funcionalidades:

```txt
Colar contrato em texto
Importar arquivo convertido para texto
Detectar variáveis existentes {{variavel}}
Selecionar trecho e transformar em variável
Salvar como template
```

Exemplo:

Texto original:

```txt
Contratante: João da Silva
```

Usuário seleciona `João da Silva` e escolhe:

```txt
Transformar em variável → {{nome_cliente}}
```

Resultado:

```txt
Contratante: {{nome_cliente}}
```

---

## Fase 11 — IA opcional

A IA deve ser opcional para controlar custo.

Botões possíveis:

```txt
Detectar variáveis com IA
Transformar contrato em template
Sugerir campos de formulário
Sugerir entregáveis
Classificar tipo de contrato
```

A IA deve apenas sugerir. O usuário precisa confirmar antes de aplicar.

Exemplo de sugestão:

```txt
“João da Silva” parece ser nome do cliente → {{nome_cliente}}
“R$ 2.000,00” parece valor do contrato → {{valor_contrato}}
“6 meses” parece prazo contratual → {{prazo_meses}}
```

Possível Edge Function futura:

```txt
supabase/functions/contract-ai-assistant/index.ts
```

Payload sugerido:

```json
{
  "action": "suggest_variables",
  "content": "texto do contrato",
  "agencyId": "..."
}
```

A resposta deve trazer sugestões, não alterar o banco automaticamente.

---

## Fase 12 — Atualizar UI de `/contracts`

Arquivo:

```txt
src/routes/_app.contracts.tsx
```

A tela deve ter abas:

```txt
Contratos gerados
Modelos
Serviços
Variáveis
```

A rota atual pode continuar a mesma, mas o conteúdo precisa ser reorganizado.

---

## Regras obrigatórias de implementação

1. Tudo precisa ter `agency_id`.
2. Toda query precisa filtrar por agência.
3. Nenhum template pode ser publicado com variável obrigatória sem origem.
4. Nenhum contrato pode ser enviado para assinatura se faltar variável obrigatória.
5. Contrato e formulário precisam compartilhar o mesmo mapa de variáveis.
6. Serviços precisam poder definir contrato padrão e template operacional padrão.
7. IA deve ser opcional, nunca automática por padrão.
8. O usuário precisa conseguir ter vários modelos de contrato por serviço/segmento.
9. A geração automática deve priorizar o contrato do `client_deal`.
10. O sistema deve mostrar claramente quais variáveis estão preenchidas e quais estão pendentes.

---

## Critérios de aceite

### Banco

- [ ] Criar/ajustar tabelas necessárias.
- [ ] Adicionar `agency_id` em todas as tabelas novas.
- [ ] Criar RLS por agência.
- [ ] Criar índices para `agency_id`, `template_id`, `service_id`, `client_id`.

### Contratos

- [ ] Criar CRUD de modelos de contrato.
- [ ] Detectar variáveis no conteúdo.
- [ ] Mapear variáveis para origens.
- [ ] Bloquear publicação se faltar origem obrigatória.
- [ ] Gerar contrato com variáveis resolvidas.
- [ ] Bloquear envio para assinatura se faltar variável.

### Serviços

- [ ] Criar CRUD de serviços.
- [ ] Criar entregáveis por serviço.
- [ ] Associar modelo de contrato padrão.
- [ ] Associar template operacional padrão.

### Cliente/deal

- [ ] Adicionar dados comerciais ao fluxo de criação/edição.
- [ ] Criar `client_deals`.
- [ ] Usar deal na geração de contrato.

### Onboarding

- [ ] Atualizar `onboarding-execute` para usar deal + serviço + template + mapeamentos.
- [ ] Garantir que `generate_contract` use o modelo correto.
- [ ] Garantir que `send_contract_signature` só rode se o contrato estiver completo.

### IA opcional

- [ ] Criar experiência de sugestão com confirmação humana.
- [ ] Não alterar dados automaticamente.
- [ ] Não rodar IA por padrão.

---

## Ordem recomendada de implementação

1. Banco e RLS.
2. Utilitários de variáveis.
3. Atualização do `contractsService.ts`.
4. CRUD de modelos de contrato.
5. Painel de variáveis e mapeamento.
6. Cadastro de serviços e entregáveis.
7. Dados comerciais do cliente/deal.
8. Geração de contrato com variáveis resolvidas.
9. Integração com onboarding.
10. Importação sem IA.
11. IA opcional.

---

## Comando sugerido para Vibecoding/Claude

```txt
Implemente o módulo de Contratos Inteligentes no TaskFlow seguindo o arquivo docs/CONTRATOS_INTELIGENTES_IMPLEMENTACAO.md.

Comece pela fundação:
1. Criar migrations/tabelas/RLS para contract_template_variables, services, service_deliverables e client_deals.
2. Ajustar contract_templates para agency_id, status, variables e required_variables.
3. Criar src/lib/contractVariables.ts com extractTemplateVariables, renderContractTemplate, validateTemplateVariables e resolveContractVariables.
4. Atualizar src/services/contractsService.ts para filtrar tudo por agency_id e adicionar CRUD/mapeamento/validação/geração.
5. Reorganizar /contracts em abas: Contratos gerados, Modelos, Serviços e Variáveis.

Não implemente IA ainda. Primeiro entregue a versão funcional sem IA.

Regras obrigatórias:
- Tudo com agency_id.
- Tudo filtrado por agência.
- Não publicar template com variável obrigatória sem origem.
- Não enviar contrato se faltar variável obrigatória.
- Contrato, formulário e dados comerciais precisam compartilhar o mesmo mapa de variáveis.
```
