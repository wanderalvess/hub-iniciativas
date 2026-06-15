# WSH PDVSYNC — Diagrama de Fluxo Ponta a Ponta

> **[Visualizar Diagrama Interativo HTML](WORKFLOW_PDVSYNC.html)**

**Serviço WSH:** `winthor-integracao-core`
**Repositório de referência:** `pdvsync/rotas` (master)

---

## Sumário

1. [Arquitetura Geral](#1-arquitetura-geral)
2. [Fluxo de Envio — WTA → PDVSYNC](#2-fluxo-de-envio--wta--pdvsync)
3. [Fluxo de Recebimento — PDVSYNC → WTA](#3-fluxo-de-recebimento--pdvsync--wta)
4. [Processos Online — PDVOmni → WTA (direto)](#4-processos-online--pdvomni--wta-direto)
5. [Mapeamento Completo de Fluxos, Rotas e Projetos](#5-mapeamento-completo-de-fluxos-rotas-e-projetos)
6. [Agendamentos](#6-agendamentos)

---

## 1. Arquitetura Geral

O WSH (Winthor Smart Hub) é composto pelo serviço **winthor-integracao-core** que orquestra a troca de dados entre o ERP Winthor, o PDVSYNC e o PDVOmni.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              ERP WINTHOR (Oracle DB)                      │
│                                                                            │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │                        WTA APIs                                   │   │
│   │  winthor-filiais         │  winthor-estoque-vtex                  │   │
│   │  winthor-pedido-venda    │  winthor-tributacao                    │   │
│   │  winthor-integracao-precos│  winthor-integracao-varejo            │   │
│   │  winthor-integracao-matcon│  winthor-integracao-config            │   │
│   │  winthor-integracao-cliente│ winthor-integracao-cadastros         │   │
│   │  winthor-ferramenta-usuario│ winthor-venda                        │   │
│   └───────────────────────────────┬──────────────────────────────────┘   │
└───────────────────────────────────│──────────────────────────────────────┘
                  ▲ ENVIAR WTA      │ BUSCAR WTA
                  │ (Recebimento)   │ (Envio)
     ┌────────────┴────────────────▼─────────────────┐
     │          WSH / winthor-integracao-core          │
     │   Motor de Integração — 38 Fluxos | 87 Rotas   │
     │   (executa fluxos de sincronização bidirecional)│
     └────────────────────┬──────────────┬────────────┘
          BUSCAR PDVSYNC  │              │ ENVIAR PDVSYNC
          (Recebimento)   │              │ (Envio)
                          ▼              ▼
               ┌──────────────────────────┐
               │         PDVSYNC           │
               │  pdvsync.varejo.totvs     │
               │     .com.br               │
               └────────────┬─────────────┘
                            │ Dados sincronizados
                            ▼
               ┌──────────────────────────┐
               │         PDVOmni           │
               │    (Frente de Caixa)      │
               └────────────┬─────────────┘
                            │ Processos Online (direto, sem WSH)
                            ▼
               WTA APIs (12 endpoints diretos)
```

| Sistema | Papel | Autenticação |
|---------|-------|--------------|
| **ERP Winthor / WTA** | Fonte e destino master dos dados do ERP | Bearer Token — expira em 2h |
| **WSH (winthor-integracao-core)** | Motor de integração — executa os Fluxos 01-38 | — |
| **PDVSYNC** | Camada de sincronização do PDV | OAuth 2.0 RAC — expira em 20min |
| **PDVOmni** | Frente de caixa (POS) — consome e gera dados | — |

---

## 2. Fluxo de Envio — WTA → PDVSYNC

Dados do ERP Winthor são sincronizados para o PDVSYNC, onde ficam disponíveis para o PDVOmni.

**Fluxos de Envio:** 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 17, 18, 21, 22, 23, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38

```
WSH (winthor-integracao-core)
    │
    ├─[1]─► Autenticar no WTA
    │           POST {{URL_BASE}}/winthor/autenticacao/v1/login
    │           Token válido por 2 horas
    │
    ├─[2]─► Buscar dados no WTA  (Rota BUSCAR WTA)
    │           GET/POST {{URL_BASE}}/winthor/... ou /api/...
    │           (endpoint específico por fluxo — ver §5)
    │
    ├─[3]─► Transformar dados
    │           Transformações JOLT / custom-totvs
    │
    ├─[4]─► Autenticar no PDVSYNC (RAC OAuth 2.0)
    │           POST /autenticacao/oauth/token
    │           Token válido por 20 minutos
    │
    ├─[5]─► Criar lote / variável temporária no PDVSYNC
    │           POST /controleprocesso/...
    │
    ├─[6]─► Enviar dados ao PDVSYNC  (Rota ENVIAR PDVSYNC)
    │           POST/PUT {{URL_PDVSYNC}}/...
    │           (endpoint específico por fluxo — ver §5)
    │
    └─[7]─► Fechar lote / variável temporária
                PUT /controleprocesso/...
                → Dados disponíveis para o PDVOmni
```

**Categorias de dados enviados ao PDVSYNC:**

| Categoria | Fluxos |
|-----------|--------|
| Compartilhamentos / Filiais | 01, 02, 03 |
| Perfil e Usuários | 04, 08 |
| Fiscal / Tributação | 05, 06, 07, 34, 35, 36, 38 |
| Produtos | 09 |
| Estoque | 10 |
| Preços | 11, 29, 30, 32, 33 |
| Formas de Pagamento | 12, 13, 14, 21 |
| Clientes | 17 |
| Status de Pedidos | 18 |
| Dados Complementares | 22, 23 |
| Cadastros | 26, 27, 28, 31 |

---

## 3. Fluxo de Recebimento — PDVSYNC → WTA

Transações geradas no PDVOmni (vendas, pedidos, movimentações) são coletadas do PDVSYNC e enviadas ao ERP Winthor.

**Fluxos de Recebimento:** 15, 16, 19, 20, 37  
**Fluxos de Monitor/Status:** 24, 25

```
PDVOmni (Frente de Caixa)
    │
    └─[1]─► Gera transação (venda / pedido / movimentação / cliente)
                Dado fica pendente no PDVSYNC

WSH (winthor-integracao-core) — acionado por agendamento (300s)
    │
    ├─[2]─► Autenticar no PDVSYNC (RAC OAuth 2.0)
    │
    ├─[3]─► Buscar transações pendentes do PDVSYNC  (Rota BUSCAR PDVSYNC)
    │           GET {{URL_PDVSYNC}}/comercial/... ou /controleprocesso/...
    │
    ├─[4]─► Transformar dados
    │           Transformações JOLT / custom-totvs
    │
    ├─[5]─► Autenticar no WTA
    │           POST {{URL_BASE}}/winthor/autenticacao/v1/login
    │
    ├─[6]─► Enviar dados ao WTA  (Rota ENVIAR WTA)
    │           POST/PUT {{URL_BASE}}/winthor/varejo/... ou /matcon/...
    │
    ├─[7]─► WTA processa → retorna status
    │
    └─[8]─► Atualizar status no PDVSYNC
                PUT {{URL_PDVSYNC}}/controle/...
```

**Transações recebidas pelo ERP:**

| Tipo de Transação | Fluxo |
|-------------------|-------|
| Movimentações de Caixa | FLUXO-15 |
| Vendas | FLUXO-16 |
| Pedidos Recebidos | FLUXO-19 |
| Pedidos Cancelados | FLUXO-20 |
| Cadastro de Clientes (retaguarda) | FLUXO-37 |
| Atualização Status Lote (monitor) | FLUXO-24 |
| Atualização Status Venda (monitor) | FLUXO-25 |

---

## 4. Processos Online — PDVOmni → WTA (direto)

O PDVOmni realiza requisições **diretamente** ao WTA para operações em tempo real, **sem intermediação do WSH**:

| Endpoint PDVOmni | Método | API WTA | Projeto WTA |
|-----------------|--------|---------|-------------|
| EndpointPreVendaEnvio | POST | `/winthor/varejo/matcon/v1/orders/pdvsync` | winthor-integracao-matcon |
| EndpointCreditoConsumo | POST | `/winthor/varejo/v1/credito-cliente` | winthor-integracao-varejo |
| EndpointNotaSaidaEnvio | POST | `/api/stock-vtex/v1/available/pdv-sync` | winthor-estoque-vtex |
| EndpointCreditoConsulta | GET | `/winthor/varejo/v1/credito-cliente/list` | winthor-integracao-varejo |
| EndpointEstoqueConsulta | GET | `/api/stock-vtex/v1/available/pdv-sync` | winthor-estoque-vtex |
| EndpointIdentificadorPDV | GET | `/winthor/varejo/matcon/v1/pdv/detalhepdv` | winthor-integracao-matcon |
| EndpointNotaEntradaEnvio | POST | `/winthor/varejo/matcon/v1/orders/pdvsync` | winthor-integracao-matcon |
| EndpointPreVendaAtualiza | PUT | `/winthor/varejo/matcon/v1/orders/pdvsync` | winthor-integracao-matcon |
| EndpointReservaEstoqueEnvio | POST | `/winthor/varejo/matcon/v1/orders/pdvsync` | winthor-integracao-matcon |
| EndpointFormasCondicoesCliente | GET | `/winthor/cliente/v1/payments/pdvsync` | winthor-integracao-cliente |
| EndpointPreVendaConsultaPedido | GET | `/winthor/varejo/matcon/v1/orders/pdvsync/consulta` | winthor-integracao-matcon |
| EndpointPreVendaConsultaListaPedido | GET | `/winthor/varejo/matcon/v1/orders/pdvsync/consulta` | winthor-integracao-matcon |

---

## 5. Mapeamento Completo de Fluxos, Rotas e Projetos

**Legenda de Direção:**
- **→ PDVSYNC** = WSH busca no WTA e envia ao PDVSYNC (Fluxo de Envio)
- **→ WTA** = WSH busca no PDVSYNC e envia ao WTA (Fluxo de Recebimento)
- **Monitor** = Fluxo de monitoramento e atualização de status

---

### 5.1 Compartilhamentos e Filiais

| Fluxo | Nome | Rota WTA (BUSCAR) | URL WTA | Projeto WTA | Rota PDVSYNC (ENVIAR) | Dir. |
|-------|------|-------------------|---------|-------------|----------------------|------|
| FLUXO-01 | Compartilhamento Master | WTA - PDVSYNC COMPARTILHAMENTO MASTER | N/A | N/A | PDVSYNC - ENVIAR COMPARTILHAMENTOS | → PDVSYNC |
| FLUXO-02 | Filiais Lojas | WTA - Buscar Filiais Lojas | `/api/branch/v1/` | winthor-filiais | PDVSYNC - ENVIAR LOJAS | → PDVSYNC |
| FLUXO-03 | Compartilhamento Lojas | WTA - Buscar Filiais Compartilhamento | `/api/branch/v1/` | winthor-filiais | PDVSYNC - ENVIAR COMPARTILHAMENTOS | → PDVSYNC |

### 5.2 Perfil e Usuários

| Fluxo | Nome | Rota WTA (BUSCAR) | URL WTA | Projeto WTA | Rota PDVSYNC (ENVIAR) | Dir. |
|-------|------|-------------------|---------|-------------|----------------------|------|
| FLUXO-04 | Perfil | WTA - BUSCAR PERFIL PADRAO | N/A | N/A | PDVSYNC - SALVAR PERFIL | → PDVSYNC |
| FLUXO-08 | Usuario Operador | WTA - Buscar Usuario Operador | `/winthor/ferramenta/usuario/v1/listar/detalhes` | winthor-ferramenta-usuario | PDVSYNC - SALVAR USUARIO OPERADOR | → PDVSYNC |

### 5.3 Fiscal / Tributação

| Fluxo | Nome | Rota WTA (BUSCAR) | URL WTA | Projeto WTA | Rota PDVSYNC (ENVIAR) | Dir. |
|-------|------|-------------------|---------|-------------|----------------------|------|
| FLUXO-05 | NCM CEST | WTA - Buscar Imposto NCM PDV | `/winthor/tributacao/v0/saida/ncm/consultar` | winthor-tributacao | PDVSYNC - SALVAR IMPOSTO NCM | → PDVSYNC |
| FLUXO-06 | PisCofins | WTA - Buscar Pis Cofins | `/winthor/tributacao/v0/saida/piscofins/consultar` | winthor-tributacao | PDVSYNC - ENVIAR PIS COFINS | → PDVSYNC |
| FLUXO-07 | ICMS | WTA - Buscar ICMS | `/winthor/tributacao/v0/saida/icms/consultar` | winthor-tributacao | PDVSYNC - ENVIAR ICMS | → PDVSYNC |
| FLUXO-34 | Imposto Reforma Tributaria | WTA - BUSCAR IMPOSTO REFORMA TRIBUTARIA | `/winthor/tributacao/v0/saida/tributacao/consultar/pdvsync` | winthor-tributacao | PDVSYNC - ENVIAR IMPOSTO REFORMA | → PDVSYNC |
| FLUXO-35 | Filtro NCM Reforma Tributaria | WTA - BUSCAR NCM REFORMA TRIBUTARIA | `/winthor/tributacao/v0/saida/tributacao/excecao/consultar/pdvsync` | winthor-tributacao | PDVSYNC - ENVIAR NCM REFORMA TRIBUTARIA | → PDVSYNC |
| FLUXO-36 | Filtro Produto Reforma Tributaria | WTA - BUSCAR PRODUTO REFORMA TRIBUTARIA | `/winthor/tributacao/v0/saida/tributacao/excecao/consultar/pdvsync` | winthor-tributacao | PDVSYNC - ENVIAR PRODUTO REFORMA TRIBUT | → PDVSYNC |
| FLUXO-38 | Filtro CFOP Reforma Tributaria | WTA - BUSCAR CFOP REFORMA TRIBUTARIA | `/winthor/tributacao/v0/saida/tributacao/...` | winthor-tributacao | PDVSYNC - ENVIAR CFOP REFORMA TRIBUTARIA | → PDVSYNC |

### 5.4 Produtos

| Fluxo | Nome | Rota WTA (BUSCAR) | URL WTA | Projeto WTA | Rota PDVSYNC (ENVIAR) | Dir. |
|-------|------|-------------------|---------|-------------|----------------------|------|
| FLUXO-09 | Produto | WTA - Buscar Produto PDV | `/winthor/tributacao/v0/saida/produtotributacao/consultar` | winthor-tributacao | PDVSYNC - SALVAR PRODUTO | → PDVSYNC |

### 5.5 Estoque

| Fluxo | Nome | Rota WTA (BUSCAR) | URL WTA | Projeto WTA | Rota PDVSYNC (ENVIAR) | Dir. |
|-------|------|-------------------|---------|-------------|----------------------|------|
| FLUXO-10 | Estoque | WTA - Buscar Estoque | `/api/stock-vtex/v1/available/list` | winthor-estoque-vtex | PDVSYNC - ENVIAR ESTOQUE DISPONIVEL | → PDVSYNC |

### 5.6 Preços

| Fluxo | Nome | Rota WTA (BUSCAR) | URL WTA | Projeto WTA | Rota PDVSYNC (ENVIAR) | Dir. |
|-------|------|-------------------|---------|-------------|----------------------|------|
| FLUXO-11 | Preco | WTA - Buscar Preco Produto | `/api/wholesale/v1/price/discount-policy` | winthor-pedido-venda | PDVSYNC - ENVIAR PRECO PRODUTO | → PDVSYNC |
| FLUXO-29 | Preco Regiao | WTA - Buscar Preco Regiao | `/winthor/precos/v1/precos-regioes` | winthor-integracao-precos | PDVSYNC - ENVIAR PRECO REGIAO | → PDVSYNC |
| FLUXO-30 | Preco Embalagem | WTA - Buscar Preco Embalagem | `/winthor/precos/v1/precos-embalagens` | winthor-integracao-precos | PDVSYNC - ENVIAR PRECO EMBALAGEM | → PDVSYNC |
| FLUXO-32 | Preco Fixo | WTA - Buscar Preco Fixo | `/winthor/precos/v1/precos-fixos` | winthor-integracao-precos | PDVSYNC - ENVIAR PRECO FIXO | → PDVSYNC |
| FLUXO-33 | Politica Desconto e Acrescimo | WTA - Buscar Desconto e Acrescimo | `/winthor/precos/v1/politica-desconto` | winthor-integracao-precos | PDVSYNC - ENVIAR DESCONTO E ACRESCIMO | → PDVSYNC |

### 5.7 Formas de Pagamento

| Fluxo | Nome | Rota WTA (BUSCAR) | URL WTA | Projeto WTA | Rota PDVSYNC (ENVIAR) | Dir. |
|-------|------|-------------------|---------|-------------|----------------------|------|
| FLUXO-12 | Operadora Cartao | WTA - Buscar Operadora PDV | `/winthor/venda/v0/operadoras` | winthor-venda | PDVSYNC - SALVAR OPERADORA | → PDVSYNC |
| FLUXO-13 | Planos de Pagamento | WTA - Buscar planos de pgto | `/winthor/venda/v0/planos-pagamentos` | winthor-venda | PDVSYNC - ENVIAR PLANOS DE PGTO | → PDVSYNC |
| FLUXO-14 | Cobrancas Forma Pgto | WTA - Buscar Tipos Cobrancas | — | — | PDVSYNC - ENVIAR FORMAS DE PGTO | → PDVSYNC |
| FLUXO-21 | Pagamento Dados Complementares | WTA - DADOS PAGAMENTO | N/A | N/A | PDVSYNC - DADOS PAGAMENTO | → PDVSYNC |

### 5.8 Clientes e Cadastros

| Fluxo | Nome | Rota WTA (BUSCAR) | URL WTA | Projeto WTA | Rota PDVSYNC (ENVIAR) | Dir. |
|-------|------|-------------------|---------|-------------|----------------------|------|
| FLUXO-17 | Clientes | WTA - Buscar Clientes | `/api/wholesale/v1/customer/list` | winthor-pedido-venda | PDVSYNC - SALVAR CLIENTES | → PDVSYNC |
| FLUXO-26 | Profissional | WTA - Buscar Profissionais | `/winthor/cadastros/v1/profissional` | winthor-integracao-cadastros | PDVSYNC - SALVAR PROFISSIONAL | → PDVSYNC |
| FLUXO-27 | Regiao | WTA - Buscar Regiao PDV | `/winthor/cliente/v1/regiao` | winthor-integracao-cliente | PDVSYNC - SALVAR REGIAO | → PDVSYNC |
| FLUXO-28 | Ramo Atividade | WTA - Buscar Ramo Atividade | `/winthor/cliente/v1/ramoatividade` | winthor-integracao-cliente | PDVSYNC - SALVAR RAMO ATIVIDADE | → PDVSYNC |
| FLUXO-31 | Grupo Campanha Cliente | WTA - Buscar Grupo Campanha Cliente | `/winthor/cliente/v1/grupoCampanha` | winthor-integracao-cliente | PDVSYNC - SALVAR GRUPO CAMPANHA CLIENTE | → PDVSYNC |

### 5.9 Transacionais — Recebimento pelo ERP

| Fluxo | Nome | Rota PDVSYNC (BUSCAR) | Rota WTA (ENVIAR) | URL WTA | Projeto WTA | Dir. |
|-------|------|----------------------|-------------------|---------|-------------|------|
| FLUXO-15 | Movimentacoes Caixa | PDVSYNC - BUSCAR MOVIMENTACOES CAIXA | WTA - Enviar movimentacao caixa | `/winthor/varejo/v1/movimentacao` | winthor-integracao-varejo | → WTA |
| FLUXO-16 | Vendas | PDVSYNC - BUSCAR VENDAS | WTA - Enviar venda | `/winthor/varejo/v1/movimentacao/venda` | winthor-integracao-varejo | → WTA |
| FLUXO-19 | Pedido Recebido | PDVSYNC - BUSCAR PEDIDOS RECEBIDO | WTA - ENVIAR PEDIDO RECEBIDO | `/winthor/varejo/matcon/v1/orders/pdvsync` | winthor-integracao-matcon | → WTA |
| FLUXO-20 | Pedido Cancelado | PDVSYNC - BUSCAR PEDIDOS CANCELADA | WTA - ENVIAR PEDIDO CANCELADO | `/winthor/varejo/matcon/v1/orders/pdvsync` | winthor-integracao-matcon | → WTA |
| FLUXO-37 | Cadastrar Cliente Retaguarda | PDVSYNC - BUSCAR CLIENTES | WTA - ENVIAR CLIENTE | — | — | → WTA |

### 5.10 Monitor / Status

| Fluxo | Nome | Rota PDVSYNC | Rotas WTA | URL WTA | Projeto WTA | Dir. |
|-------|------|-------------|-----------|---------|-------------|------|
| FLUXO-18 | Status Pedido | — | WTA - Buscar status pedido | `/api/wholesale/v1/orders/list` | winthor-pedido-venda | Monitor |
| FLUXO-23 | RCA | — | WTA - CONSULTA RCA | `/winthor/varejo/matcon/v1/rca/consulta` | winthor-integracao-matcon | Monitor |
| FLUXO-24 | Atualizar Status Lote Retaguarda | PDVSYNC - CONSULTAR LOTE / CONSULTAR STATUS LOTE | WTA - Buscar lote PDV / Atualizar status lote PDV / Finalizar integra status lote PDV | `/winthor/integracao/fulfillment/v1/lote` | winthor-integracao-config | Monitor |
| FLUXO-25 | Atualizar Status Venda Retaguarda | — | WTA - Buscar Venda Monitor / Atualizar status venda monitor | `/winthor/varejo/v1/retorno/venda` | winthor-integracao-varejo / winthor-integracao-config | Monitor |

### 5.11 Utilitários

| Fluxo | Nome | Rota WTA | URL WTA | Projeto WTA | Dir. |
|-------|------|----------|---------|-------------|------|
| FLUXO-22 | Registrar IP | WTA - Busca Registrar IP Inquilino | — | — | Utilitário |

---

## 6. Agendamentos

Fluxos executados periodicamente pelo motor de agendamento do WSH:

| Agendamento | Fluxo Vinculado | Intervalo | Delay Inicial |
|------------|----------------|-----------|---------------|
| PDVSYNC - CONSULTAR STATUS LOTE | FLUXO-24 (Atualizar Status Lote Retaguarda) | 300s (5 min) | 5s |
| PDVSYNC - MONITOR VENDAS | FLUXO-25 (Atualizar Status Venda Retaguarda) | 300s (5 min) | 5s |
| PDVSYNC - MOVIMENTO CAIXAS | FLUXO-15 (Movimentacoes Caixa) | 300s (5 min) | 5s |
| PDVSYNC - PEDIDO STATUS CANCELADO | FLUXO-20 (Pedido Cancelado) | 300s (5 min) | 5s |
| PDVSYNC - PEDIDO STATUS RECEBIDO | FLUXO-19 (Pedido Recebido) | 300s (5 min) | 5s |
| PDVSYNC - REGISTRAR IP | FLUXO-22 (Registrar IP) | periódico | 5s |
| PDVSYNC - VENDAS | FLUXO-16 (Vendas) | 300s (5 min) | 5s |

---

*Referência: [GitHub — winthor-smart-hub-layouts / pdvsync / rotas](https://github.com/totvs/winthor-smart-hub-layouts/tree/main/pdvsync/rotas)*
