# 📦 Manual de Pedidos
## Sistema Óticas Queiroz

---

## 📑 Índice

1. [Introdução](#introdução)
2. [Criar Novo Pedido](#criar-novo-pedido)
3. [Status dos Pedidos](#status-dos-pedidos)
4. [Status Automático por Tipo](#status-automático-por-tipo)
5. [Prescrição Médica](#prescrição-médica)
6. [Associar Laboratório](#associar-laboratório)
7. [Buscar e Filtrar Pedidos](#buscar-e-filtrar-pedidos)
8. [Editar Pedido](#editar-pedido)
9. [Imprimir Pedido](#imprimir-pedido)
10. [Casos Práticos](#casos-práticos)

---

## Introdução

O módulo de **Pedidos** é o **CORAÇÃO** do sistema! É aqui que você registra todas as vendas de óculos, armações, lentes e acessórios.

```
╔══════════════════════════════════════════════╗
║  🎯 O QUE VOCÊ FAZ NO MÓDULO DE PEDIDOS     ║
╠══════════════════════════════════════════════╣
║  ✅ Registrar vendas                         ║
║  ✅ Acompanhar status dos pedidos            ║
║  ✅ Gerenciar prescrições médicas            ║
║  ✅ Associar pedidos a laboratórios          ║
║  ✅ Controlar pagamentos                     ║
║  ✅ Imprimir comprovantes                    ║
║  ✅ Dar baixa em estoque automaticamente     ║
╚══════════════════════════════════════════════╝
```

---

## Criar Novo Pedido

### Fluxo Completo

```
┌─────────────────────────────────────────────────┐
│           JORNADA DE UM PEDIDO                  │
└─────────────────────────────────────────────────┘
                     ↓
    ┌────────────────────────────────┐
    │ ETAPA 1: SELECIONAR CLIENTE    │
    └───────────────┬────────────────┘
                    ↓
    ┌────────────────────────────────┐
    │ ETAPA 2: ADICIONAR PRODUTOS    │
    └───────────────┬────────────────┘
                    ↓
    ┌────────────────────────────────┐
    │ ETAPA 3: PRESCRIÇÃO (OPCIONAL) │
    └───────────────┬────────────────┘
                    ↓
    ┌────────────────────────────────┐
    │ ETAPA 4: FORMA DE PAGAMENTO    │
    └───────────────┬────────────────┘
                    ↓
    ┌────────────────────────────────┐
    │ ETAPA 5: REVISAR E CONFIRMAR   │
    └───────────────┬────────────────┘
                    ↓
         ✅ PEDIDO CRIADO!
                    ↓
    ┌────────────────────────────────┐
    │   STATUS AUTOMÁTICO APLICADO   │
    │  • COM lentes: PENDENTE        │
    │  • SEM lentes: PRONTO          │
    └────────────────────────────────┘
```

### ETAPA 1: Selecionar Cliente

```
╔════════════════════════════════════════════╗
║  NOVO PEDIDO - ETAPA 1 de 5                ║
║  Selecionar Cliente                        ║
╠════════════════════════════════════════════╣
║                                            ║
║  👤 CLIENTE                                ║
║  ┌────────────────────────────────────┐   ║
║  │ 🔍 Buscar cliente por nome ou CPF  │   ║
║  │ Digite aqui...                     │   ║
║  └────────────────────────────────────┘   ║
║                                            ║
║  Clientes Recentes:                        ║
║  ┌────────────────────────────────────┐   ║
║  │ 👤 João da Silva - 123.456.789-00  │   ║
║  │ 👤 Maria Costa - 987.654.321-00    │   ║
║  │ 👤 Pedro Lima - 555.444.333-22     │   ║
║  └────────────────────────────────────┘   ║
║                                            ║
║  Cliente não cadastrado?                   ║
║  ┌────────────────────────────────────┐   ║
║  │  + Cadastrar Novo Cliente          │   ║
║  └────────────────────────────────────┘   ║
║                                            ║
║  ┌──────────┐  ┌────────────────────┐     ║
║  │ CANCELAR │  │  PRÓXIMO ➜         │     ║
║  └──────────┘  └────────────────────┘     ║
╚════════════════════════════════════════════╝
```

**Dicas:**
- 💡 Digite nome ou CPF completo
- 💡 A busca funciona mesmo com erros de digitação
- 💡 Se não encontrar, cadastre um novo cliente

### ETAPA 2: Adicionar Produtos

```
╔════════════════════════════════════════════╗
║  NOVO PEDIDO - ETAPA 2 de 5                ║
║  Adicionar Produtos                        ║
╠════════════════════════════════════════════╣
║                                            ║
║  🛍️  PRODUTOS DISPONÍVEIS                 ║
║  ┌────────────────────────────────────┐   ║
║  │ 🔍 Buscar produto...               │   ║
║  └────────────────────────────────────┘   ║
║                                            ║
║  ┌─────────────────────────────┬──────┐   ║
║  │ 🕶️  Lentes Antirreflexo     │  +   │   ║
║  │ R$ 280,00 - Estoque: 15    │      │   ║
║  ├─────────────────────────────┼──────┤   ║
║  │ 👓 Armação Ray-Ban Aviador  │  +   │   ║
║  │ R$ 450,00 - Estoque: 8     │      │   ║
║  ├─────────────────────────────┼──────┤   ║
║  │ 😎 Óculos Sol Oakley        │  +   │   ║
║  │ R$ 650,00 - Estoque: 3     │      │   ║
║  └─────────────────────────────┴──────┘   ║
║                                            ║
║  🛒 CARRINHO                               ║
║  ┌─────────────────────────────┬──────┐   ║
║  │ Armação Ray-Ban     R$ 450  │  ❌  │   ║
║  │ Lentes Antirreflexo R$ 280  │  ❌  │   ║
║  │ Estojo Rígido       R$  50  │  ❌  │   ║
║  └─────────────────────────────┴──────┘   ║
║                                            ║
║  💰 VALORES                                ║
║  Subtotal:.............. R$ 780,00         ║
║  Desconto (opcional):... R$  80,00         ║
║  ────────────────────────────────           ║
║  TOTAL:................. R$ 700,00         ║
║                                            ║
║  ┌──────────┐  ┌────────────────────┐     ║
║  │ ← VOLTAR │  │  PRÓXIMO ➜         │     ║
║  └──────────┘  └────────────────────┘     ║
╚════════════════════════════════════════════╝
```

**Dicas:**
- 💡 Verifique o estoque antes de adicionar
- 💡 Você pode adicionar quantos produtos quiser
- 💡 Clique em ❌ para remover se errar
- 💡 O desconto é opcional

### ETAPA 3: Prescrição Médica (OPCIONAL)

**⚠️ IMPORTANTE:** Esta etapa é **TOTALMENTE OPCIONAL**!

```
╔════════════════════════════════════════════╗
║  NOVO PEDIDO - ETAPA 3 de 5                ║
║  Dados da Prescrição         [OPCIONAL]    ║
╠════════════════════════════════════════════╣
║                                            ║
║  ℹ️  QUANDO PREENCHER?                     ║
║                                            ║
║  ✅ Pedido COM lentes de grau              ║
║  ✅ Cliente trouxe receita médica          ║
║                                            ║
║  ❌ Óculos de sol (sem grau)               ║
║  ❌ Armação sem lentes                     ║
║  ❌ Cliente não tem receita ainda          ║
║                                            ║
║  ──────────────────────────────────        ║
║                                            ║
║  👨‍⚕️ DADOS DO MÉDICO                       ║
║  ┌──────────────────┐ ┌─────────────────┐ ║
║  │ Dr. João Silva   │ │ Clínica XYZ     │ ║
║  └──────────────────┘ └─────────────────┘ ║
║                                            ║
║  ┌─────────────────┐                       ║
║  │ Data: 10/10/2025│                       ║
║  └─────────────────┘                       ║
║                                            ║
║  👁️  OLHO DIREITO (OD)                     ║
║  ┌──────┬──────┬──────┬──────┐            ║
║  │ ESF  │ CIL  │ EIXO │  DP  │            ║
║  │-1.50 │-0.75 │  90° │ 32mm │            ║
║  └──────┴──────┴──────┴──────┘            ║
║                                            ║
║  👁️  OLHO ESQUERDO (OE)                    ║
║  ┌──────┬──────┬──────┬──────┐            ║
║  │ ESF  │ CIL  │ EIXO │  DP  │            ║
║  │-1.25 │-0.50 │  85° │ 30mm │            ║
║  └──────┴──────┴──────┴──────┘            ║
║                                            ║
║  📏 MEDIDAS ADICIONAIS                     ║
║  ┌────┬────┬────┬────┬────┬────┬────┐    ║
║  │ ND │ OC │ADD │PNT │ARO │ AV │ AM │    ║
║  │ 64 │ 32 │+2.0│ 18 │ 50 │ 18 │ 40 │    ║
║  └────┴────┴────┴────┴────┴────┴────┘    ║
║                                            ║
║  💡 DICA: Não sabe preencher?              ║
║  Deixe em branco! Você pode adicionar      ║
║  depois ou pular esta etapa.               ║
║                                            ║
║  ┌──────────┐  ┌────────────────────┐     ║
║  │ ← VOLTAR │  │  PRÓXIMO ➜         │     ║
║  └──────────┘  └────────────────────┘     ║
╚════════════════════════════════════════════╝
```

**Glossário Rápido:**
- **ESF** (Esférico) = Grau de miopia (-) ou hipermetropia (+)
- **CIL** (Cilíndrico) = Grau de astigmatismo
- **EIXO** = Direção do astigmatismo (0° a 180°)
- **DP** (Distância Pupilar) = Distância entre as pupilas
- **ADD** (Adição) = Grau adicional para perto (óculos multifocal)

### ETAPA 4: Forma de Pagamento

```
╔════════════════════════════════════════════╗
║  NOVO PEDIDO - ETAPA 4 de 5                ║
║  Forma de Pagamento                        ║
╠════════════════════════════════════════════╣
║                                            ║
║  💳 ESCOLHA A FORMA DE PAGAMENTO:          ║
║                                            ║
║  ⚪ 💵 Dinheiro                            ║
║  ⚪ 💳 Cartão de Crédito                   ║
║  ⚪ 💳 Cartão de Débito                    ║
║  🔘 📱 PIX                                 ║
║  ⚪ 📄 Boleto Bancário                     ║
║  ⚪ 📝 Nota Promissória                    ║
║  ⚪ 🏦 Crediário (Parcelado)               ║
║  ⚪ 📃 Cheque                              ║
║                                            ║
║  STATUS DO PAGAMENTO:                      ║
║  🔘 Pago                                   ║
║  ⚪ Parcialmente Pago                      ║
║  ⚪ Pendente                               ║
║                                            ║
║  ─────────────────────────────────         ║
║                                            ║
║  💰 VALOR DA ENTRADA (Opcional)            ║
║  ┌─────────────────────────────────────┐  ║
║  │ R$ 200,00                            │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  📅 NÚMERO DE PARCELAS (Opcional)          ║
║  ┌─────────────────────────────────────┐  ║
║  │ 3x de R$ 166,67                      │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  ┌──────────┐  ┌────────────────────┐     ║
║  │ ← VOLTAR │  │  PRÓXIMO ➜         │     ║
║  └──────────┘  └────────────────────┘     ║
╚════════════════════════════════════════════╝
```

**Formas de Pagamento - Quando Usar:**

| Forma | Quando Usar | Observação |
|-------|-------------|------------|
| 💵 **Dinheiro** | Cliente paga em espécie | Entra no caixa físico |
| 💳 **Crédito** | Cartão de crédito | Pode parcelar |
| 💳 **Débito** | Cartão de débito | À vista |
| 📱 **PIX** | Transferência instantânea | Confirme recebimento |
| 📄 **Boleto** | Cliente prefere boleto | Gera cobrança |
| 📝 **Nota Promissória** | Pagamento a prazo | Cliente assina nota |
| 🏦 **Crediário** | Parcelado na loja | Controle interno |
| 📃 **Cheque** | Cliente paga com cheque | Anotar dados |

### ETAPA 5: Resumo e Confirmação

```
╔════════════════════════════════════════════╗
║  NOVO PEDIDO - ETAPA 5 de 5                ║
║  Revisar e Confirmar                       ║
╠════════════════════════════════════════════╣
║                                            ║
║  📋 RESUMO DO PEDIDO                       ║
║                                            ║
║  👤 CLIENTE                                ║
║  João da Silva                             ║
║  CPF: 123.456.789-00                       ║
║  Tel: (77) 98888-7777                      ║
║                                            ║
║  ──────────────────────────────────        ║
║  🛍️  PRODUTOS                              ║
║  ──────────────────────────────────        ║
║  • Armação Ray-Ban Aviador.. R$ 450,00    ║
║  • Lentes Antirreflexo...... R$ 280,00    ║
║  • Estojo Rígido............ R$  50,00    ║
║  ──────────────────────────────────        ║
║                                            ║
║  💰 VALORES                                ║
║  Subtotal:.................. R$ 780,00    ║
║  Desconto:.................. R$  80,00    ║
║  ═══════════════════════════════════       ║
║  TOTAL A PAGAR:............. R$ 700,00    ║
║  ═══════════════════════════════════       ║
║                                            ║
║  💳 PAGAMENTO                              ║
║  Forma: PIX                                ║
║  Status: Pago                              ║
║  Entrada: R$ 200,00                        ║
║  Parcelado: 3x R$ 166,67                   ║
║                                            ║
║  📅 DATAS                                  ║
║  Venda: 15/10/2025                         ║
║  Entrega Prevista: 22/10/2025              ║
║                                            ║
║  📊 STATUS INICIAL                         ║
║  ⏳ Pendente (Tem lentes - aguarda lab)    ║
║                                            ║
║  ┌──────────┐  ┌────────────────────┐     ║
║  │ ← VOLTAR │  │ ✅ CONFIRMAR PEDIDO│     ║
║  └──────────┘  └────────────────────┘     ║
╚════════════════════════════════════════════╝
```

**Após Confirmar:**

```
╔════════════════════════════════════════════╗
║                                            ║
║           🎉 SUCESSO!                      ║
║                                            ║
║     Pedido #1234 criado com sucesso!      ║
║                                            ║
║  ──────────────────────────────────        ║
║                                            ║
║  O QUE FAZER AGORA?                        ║
║                                            ║
║  ┌────────────────────────────────────┐   ║
║  │  📄 Imprimir Pedido                │   ║
║  │  (Entregar ao cliente)             │   ║
║  └────────────────────────────────────┘   ║
║                                            ║
║  ┌────────────────────────────────────┐   ║
║  │  📱 Enviar por WhatsApp            │   ║
║  │  (Comprovante digital)             │   ║
║  └────────────────────────────────────┘   ║
║                                            ║
║  ┌────────────────────────────────────┐   ║
║  │  🔬 Associar Laboratório           │   ║
║  │  (Se tiver lentes)                 │   ║
║  └────────────────────────────────────┘   ║
║                                            ║
║  ┌────────────────────────────────────┐   ║
║  │  ➕ Criar Outro Pedido             │   ║
║  └────────────────────────────────────┘   ║
║                                            ║
║  ┌────────────────────────────────────┐   ║
║  │  🏠 Voltar ao Dashboard            │   ║
║  └────────────────────────────────────┘   ║
║                                            ║
╚════════════════════════════════════════════╝
```

---

## Status dos Pedidos

### Ciclo de Vida de um Pedido

```
┌──────────────────────────────────────────────────────┐
│          CICLO DE VIDA DOS PEDIDOS                   │
└──────────────────────────────────────────────────────┘

    SEM LENTES                      COM LENTES
        ↓                               ↓
   ┌─────────┐                     ┌─────────┐
   │ ✅ PRONTO│                     │⏳PENDENTE│
   └────┬────┘                     └────┬────┘
        │                               │
        │                          Associar
        │                          Laboratório
        │                               ↓
        │                         ┌──────────┐
        │                         │⚙️PRODUÇÃO │
        │                         └────┬─────┘
        │                              │
        │                         Laboratório
        │                         Finaliza
        │                              ↓
        ↓                              ↓
   ┌─────────┐                    ┌─────────┐
   │ ✅ PRONTO│◄───────────────────│ ✅ PRONTO│
   └────┬────┘                    └────┬────┘
        │                              │
        └──────────┬───────────────────┘
                   ↓
            ┌───────────┐
            │📦 ENTREGUE│
            └─────┬─────┘
                  │
                  ↓
             🎉 CONCLUÍDO!
```

### Detalhes de Cada Status

```
╔═══════════════════════════════════════════════════╗
║  ⏳ PENDENTE                                       ║
╠═══════════════════════════════════════════════════╣
║  O que significa?                                 ║
║  • Pedido foi criado                              ║
║  • TEM lentes para confeccionar                   ║
║  • Aguardando associação de laboratório           ║
║                                                   ║
║  O que fazer?                                     ║
║  ➜ Associar um laboratório                        ║
║                                                   ║
║  Quanto tempo fica neste status?                  ║
║  • Até você associar o laboratório                ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║  ⚙️  EM PRODUÇÃO                                   ║
╠═══════════════════════════════════════════════════╣
║  O que significa?                                 ║
║  • Laboratório foi associado                      ║
║  • Lentes estão sendo confeccionadas              ║
║  • Aguardando finalização do laboratório          ║
║                                                   ║
║  O que fazer?                                     ║
║  ➜ Aguardar prazo do laboratório                  ║
║  ➜ Acompanhar data de entrega prevista            ║
║                                                   ║
║  Quanto tempo fica neste status?                  ║
║  • Geralmente 7 a 15 dias (conforme laboratório)  ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║  ✅ PRONTO                                        ║
╠═══════════════════════════════════════════════════╣
║  O que significa?                                 ║
║  • Produto finalizado                             ║
║  • Pronto para retirada/entrega                   ║
║  • Cliente pode ser avisado                       ║
║                                                   ║
║  O que fazer?                                     ║
║  ➜ Ligar para o cliente                           ║
║  ➜ Avisar que o óculos está pronto                ║
║  ➜ Agendar retirada                               ║
║                                                   ║
║  Quando muda para este status?                    ║
║  • Pedidos SEM lentes: Automaticamente            ║
║  • Pedidos COM lentes: Após laboratório finalizar ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║  📦 ENTREGUE                                      ║
╠═══════════════════════════════════════════════════╣
║  O que significa?                                 ║
║  • Cliente já retirou o produto                   ║
║  • Pedido concluído                               ║
║  • Processo finalizado                            ║
║                                                   ║
║  O que fazer?                                     ║
║  ➜ Nada! Pedido está concluído                    ║
║  ➜ Pode imprimir comprovante se necessário        ║
║                                                   ║
║  Importante:                                      ║
║  • Pedidos entregues não podem mais ser editados  ║
║  • Ficam no histórico do cliente                  ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║  ❌ CANCELADO                                     ║
╠═══════════════════════════════════════════════════╣
║  O que significa?                                 ║
║  • Pedido foi cancelado                           ║
║  • Não será mais processado                       ║
║  • Estoque foi devolvido                          ║
║                                                   ║
║  Quando cancelar?                                 ║
║  • Cliente desistiu da compra                     ║
║  • Produto não está disponível                    ║
║  • Erro no cadastro do pedido                     ║
║                                                   ║
║  Atenção:                                         ║
║  ❌ Pedidos entregues NÃO podem ser cancelados    ║
╚═══════════════════════════════════════════════════╝
```

---

## Status Automático por Tipo

### 🤖 Lógica Inteligente

O sistema agora é **INTELIGENTE**! Ele define automaticamente o status inicial baseado no tipo de produto:

```
╔═══════════════════════════════════════════════════╗
║  🧠 COMO O SISTEMA DECIDE O STATUS?               ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║         PEDIDO É CRIADO                           ║
║                ↓                                  ║
║      ┌─────────────────┐                          ║
║      │ Sistema analisa │                          ║
║      │  os produtos    │                          ║
║      └────────┬────────┘                          ║
║               ↓                                   ║
║    TEM LENTES NO PEDIDO?                          ║
║         ┌─────┴─────┐                             ║
║         │           │                             ║
║       SIM          NÃO                            ║
║         │           │                             ║
║         ↓           ↓                             ║
║   ┌──────────┐  ┌──────────┐                     ║
║   │ PENDENTE │  │  PRONTO  │                     ║
║   └──────────┘  └──────────┘                     ║
║         │           │                             ║
║         ↓           ↓                             ║
║   Precisa       Produto                           ║
║   Laboratório   já está                           ║
║                 pronto!                           ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

### Exemplos Práticos

**EXEMPLO 1: Óculos de Sol** 🕶️

```
┌──────────────────────────────────────┐
│ PEDIDO #1234                         │
├──────────────────────────────────────┤
│ Cliente: João Silva                  │
│ Produto: Óculos de Sol Ray-Ban       │
│                                      │
│ TEM LENTES DE GRAU? ❌ NÃO           │
│         ↓                            │
│ STATUS AUTOMÁTICO: ✅ PRONTO         │
│                                      │
│ O que isso significa?                │
│ • Produto já está pronto!            │
│ • NÃO precisa ir para laboratório    │
│ • Cliente pode retirar agora         │
│ • Processo mais rápido!              │
└──────────────────────────────────────┘
```

**EXEMPLO 2: Armação sem Lentes** 👓

```
┌──────────────────────────────────────┐
│ PEDIDO #1235                         │
├──────────────────────────────────────┤
│ Cliente: Maria Costa                 │
│ Produto: Armação Prada (só armação)  │
│                                      │
│ TEM LENTES DE GRAU? ❌ NÃO           │
│         ↓                            │
│ STATUS AUTOMÁTICO: ✅ PRONTO         │
│                                      │
│ O que isso significa?                │
│ • Cliente comprou só a armação       │
│ • Vai colocar lentes depois          │
│ • Armação já pode ser entregue       │
└──────────────────────────────────────┘
```

**EXEMPLO 3: Óculos de Grau Completo** 👓🔍

```
┌──────────────────────────────────────┐
│ PEDIDO #1236                         │
├──────────────────────────────────────┤
│ Cliente: Pedro Lima                  │
│ Produtos:                            │
│ • Armação Oakley                     │
│ • Lentes Multifocais Antirreflexo    │
│                                      │
│ TEM LENTES DE GRAU? ✅ SIM           │
│         ↓                            │
│ STATUS AUTOMÁTICO: ⏳ PENDENTE       │
│                                      │
│ O que isso significa?                │
│ • Precisa ir para laboratório        │
│ • Você deve associar um laboratório  │
│ • Lentes serão confeccionadas        │
│         ↓                            │
│ APÓS ASSOCIAR LABORATÓRIO            │
│         ↓                            │
│ STATUS MUDA PARA: ⚙️  EM PRODUÇÃO    │
└──────────────────────────────────────┘
```

**EXEMPLO 4: Apenas Lentes** 🔍

```
┌──────────────────────────────────────┐
│ PEDIDO #1237                         │
├──────────────────────────────────────┤
│ Cliente: Ana Santos                  │
│ Produto: Lentes para armação própria │
│                                      │
│ TEM LENTES DE GRAU? ✅ SIM           │
│         ↓                            │
│ STATUS AUTOMÁTICO: ⏳ PENDENTE       │
│                                      │
│ Prescrição médica: PREENCHIDA        │
│ Laboratório: AGUARDANDO              │
└──────────────────────────────────────┘
```

---

## Prescrição Médica

### Quando Preencher?

```
╔══════════════════════════════════════════════════╗
║  ✅ PREENCHER PRESCRIÇÃO QUANDO:                 ║
╠══════════════════════════════════════════════════╣
║  • Pedido tem lentes de grau                     ║
║  • Cliente trouxe receita médica                 ║
║  • Lentes multifocais ou progressivas            ║
║  • Óculos de grau completo                       ║
╚══════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════╗
║  ⭕ NÃO PRECISA PREENCHER QUANDO:                ║
╠══════════════════════════════════════════════════╣
║  • Óculos de sol sem grau                        ║
║  • Armação sem lentes                            ║
║  • Cliente não trouxe receita ainda              ║
║  • Lentes de limpeza/proteção sem grau           ║
╚══════════════════════════════════════════════════╝
```

### Como Ler uma Receita Médica

Exemplo de receita médica:

```
┌────────────────────────────────────────────────┐
│  Dr. João Silva - CRM 12345                    │
│  Clínica Oftalmológica Visão Perfeita          │
│  Data: 10/10/2025                              │
├────────────────────────────────────────────────┤
│                                                │
│  PRESCRIÇÃO PARA ÓCULOS                        │
│                                                │
│           ESF    CIL   EIXO    DP              │
│  OD     -1.50  -0.75   90°    32mm            │
│  OE     -1.25  -0.50   85°    30mm            │
│                                                │
│  DNP: 64mm                                     │
│  Adição: +2.00                                 │
│                                                │
│  Observações: Lentes antirreflexo             │
│                                                │
│  _______________                               │
│  Assinatura Médico                             │
└────────────────────────────────────────────────┘
```

**Como transcrever para o sistema:**

| Campo | O que é | Onde está na receita | Exemplo |
|-------|---------|---------------------|---------|
| **ESF** | Esférico (grau) | Primeira coluna | -1.50 |
| **CIL** | Cilíndrico (astigmatismo) | Segunda coluna | -0.75 |
| **EIXO** | Eixo do astigmatismo | Terceira coluna | 90° |
| **DP** | Distância Pupilar | Última coluna | 32mm |
| **ADD** | Adição (multifocal) | Abaixo dos olhos | +2.00 |

---

## Associar Laboratório

### Quando Associar?

**APENAS** quando o pedido tiver lentes!

```
╔════════════════════════════════════════════╗
║  PRECISA ASSOCIAR LABORATÓRIO?             ║
╠════════════════════════════════════════════╣
║                                            ║
║  ✅ SIM - SEMPRE que tiver:                ║
║  • Lentes de grau                          ║
║  • Lentes multifocais                      ║
║  • Lentes progressivas                     ║
║  • Qualquer tipo de lente corretiva        ║
║                                            ║
║  ❌ NÃO - NUNCA quando tiver apenas:       ║
║  • Óculos de sol                           ║
║  • Armação sem lentes                      ║
║  • Acessórios                              ║
║                                            ║
╚════════════════════════════════════════════╝
```

### Como Associar

**Passo a Passo:**

1. Abra o pedido que tem lentes
2. Verifique se o status está **"Pendente"**
3. Clique em **"Associar Laboratório"**
4. Veja a tela:

```
╔════════════════════════════════════════════╗
║  ASSOCIAR LABORATÓRIO                      ║
║  Pedido #1234                              ║
╠════════════════════════════════════════════╣
║                                            ║
║  👤 Cliente: João da Silva                 ║
║  📦 Status Atual: ⏳ Pendente              ║
║                                            ║
║  🔬 SELECIONE O LABORATÓRIO:               ║
║                                            ║
║  ⚪ Laboratório Visão Clara                ║
║     Prazo: 7 dias úteis                    ║
║     ⭐⭐⭐⭐⭐ Excelente                      ║
║                                            ║
║  ⚪ Laboratório Óptica Brasil              ║
║     Prazo: 10 dias úteis                   ║
║     ⭐⭐⭐⭐ Muito Bom                        ║
║                                            ║
║  🔘 Laboratório LensCraft                  ║
║     Prazo: 5 dias úteis                    ║
║     ⭐⭐⭐⭐⭐ Excelente                      ║
║                                            ║
║  📅 DATA DE ENTREGA PREVISTA:              ║
║  ┌─────────────────────────────────────┐  ║
║  │ 22/10/2025 (calculada              │  ║
║  │ automaticamente)                    │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  📝 OBSERVAÇÕES (Opcional):                ║
║  ┌─────────────────────────────────────┐  ║
║  │ Cliente pediu urgência...           │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  ┌──────────┐  ┌────────────────────┐     ║
║  │ CANCELAR │  │  CONFIRMAR ✓       │     ║
║  └──────────┘  └────────────────────┘     ║
║                                            ║
╚════════════════════════════════════════════╝
```

5. Clique em **"CONFIRMAR"**
6. **PRONTO!** O status mudará automaticamente para **"Em Produção"** ⚙️

---

## Buscar e Filtrar Pedidos

### Busca Simples

```
┌─────────────────────────────────────────────┐
│ 🔍 Buscar por número, cliente ou CPF       │
└─────────────────────────────────────────────┘

EXEMPLOS DE BUSCA:

✅ "1234" ➜ Encontra pedido #1234
✅ "João Silva" ➜ Todos os pedidos do João
✅ "123.456.789-00" ➜ Pedidos deste CPF
✅ "Ray-Ban" ➜ Pedidos com este produto
```

### Filtros Avançados

Clique em **"🔍 Filtros"** para opções avançadas:

```
╔════════════════════════════════════════════╗
║  FILTROS AVANÇADOS                         ║
╠════════════════════════════════════════════╣
║                                            ║
║  📊 STATUS:                                ║
║  ☑️ Pendente    ☑️ Em Produção             ║
║  ☑️ Pronto      ☑️ Entregue                ║
║  ☐ Cancelado                               ║
║                                            ║
║  📅 PERÍODO:                               ║
║  ⚪ Hoje                                   ║
║  ⚪ Esta Semana                            ║
║  🔘 Este Mês                               ║
║  ⚪ Personalizado:                         ║
║     ┌───────────┐  ┌───────────┐          ║
║     │ De:       │  │ Até:      │          ║
║     │01/10/2025 │  │15/10/2025 │          ║
║     └───────────┘  └───────────┘          ║
║                                            ║
║  🔬 LABORATÓRIO:                           ║
║  ┌─────────────────────────────────┐      ║
║  │ Todos                           │▼     ║
║  └─────────────────────────────────┘      ║
║                                            ║
║  💳 FORMA DE PAGAMENTO:                    ║
║  ┌─────────────────────────────────┐      ║
║  │ Todos                           │▼     ║
║  └─────────────────────────────────┘      ║
║                                            ║
║  💰 VALOR:                                 ║
║  ┌──────────┐     ┌──────────┐            ║
║  │ Mínimo:  │     │ Máximo:  │            ║
║  │ R$ 100   │     │ R$ 1000  │            ║
║  └──────────┘     └──────────┘            ║
║                                            ║
║  ┌────────────┐  ┌──────────┐             ║
║  │ LIMPAR (X) │  │ FILTRAR ✓│             ║
║  └────────────┘  └──────────┘             ║
║                                            ║
╚════════════════════════════════════════════╝
```

---

## Imprimir Pedido

### 2 Versões Disponíveis

**VERSÃO 1: Detalhada (Para o Cliente)**

Use quando: Cliente quer um comprovante completo

```
┌────────────────────────────────────────────┐
│  📄 ÓTICAS QUEIROZ                         │
│  CNPJ: 12.345.678/0001-00                  │
│  Rua Principal, 100 - Itapetinga/BA        │
│  Tel: (77) 3333-4444                       │
├────────────────────────────────────────────┤
│                                            │
│  ORDEM DE SERVIÇO: #1234                   │
│  Data: 15/10/2025                          │
│                                            │
│  CLIENTE:                                  │
│  Nome: João da Silva                       │
│  CPF: 123.456.789-00                       │
│  Tel: (77) 98888-7777                      │
│  Email: joao@email.com                     │
│                                            │
│  ATENDIDO POR:                             │
│  Maria Santos                              │
│                                            │
│  ────────────────────────────────────      │
│  PRODUTOS                                  │
│  ────────────────────────────────────      │
│  • Armação Ray-Ban Aviador.. R$ 450,00     │
│  • Lentes Antirreflexo..... R$ 280,00     │
│  • Estojo Rígido............ R$  50,00     │
│  ────────────────────────────────────      │
│                                            │
│  Subtotal:.................. R$ 780,00     │
│  Desconto:.................. R$  80,00     │
│  ════════════════════════════════════      │
│  TOTAL:..................... R$ 700,00     │
│  ════════════════════════════════════      │
│                                            │
│  PAGAMENTO: Cartão de Crédito 3x           │
│  Entrada: R$ 200,00                        │
│  Parcelas: 3x R$ 166,67                    │
│  Status: ✅ Pago                           │
│                                            │
│  ────────────────────────────────────      │
│  PRESCRIÇÃO MÉDICA                         │
│  ────────────────────────────────────      │
│  Dr. João Silva - Clínica XYZ              │
│  Data da Consulta: 10/10/2025              │
│                                            │
│  OD: ESF -1.50 | CIL -0.75 | EIXO 90°     │
│      DP: 32mm                              │
│                                            │
│  OE: ESF -1.25 | CIL -0.50 | EIXO 85°     │
│      DP: 30mm                              │
│                                            │
│  Adição: +2.00                             │
│  DNP: 64mm                                 │
│  ────────────────────────────────────      │
│                                            │
│  OBSERVAÇÕES:                              │
│  Cliente solicitou entrega urgente         │
│                                            │
│  PRAZO DE ENTREGA: 22/10/2025              │
│  LABORATÓRIO: LensCraft                    │
│                                            │
│  ────────────────────────────────────      │
│                                            │
│  Cliente:_____________________________     │
│          (Assinatura)                      │
│                                            │
│  Via do Cliente                            │
│                                            │
└────────────────────────────────────────────┘
```

**VERSÃO 2: Compacta (Para Laboratório)**

Use quando: Enviar pedido para laboratório

```
┌────────────────────────────────────────────┐
│  🔬 LABORATÓRIO LENSCRAFT                  │
│  ORDEM DE SERVIÇO: #1234                   │
├────────────────────────────────────────────┤
│                                            │
│  CLIENTE: João da Silva                    │
│  TELEFONE: (77) 98888-7777                 │
│                                            │
│  ENTREGA: 22/10/2025 ⚠️  URGENTE           │
│                                            │
│  ────────────────────────────────────      │
│  PRESCRIÇÃO                                │
│  ────────────────────────────────────      │
│  OD: -1.50 -0.75 90° (DP: 32)             │
│  OE: -1.25 -0.50 85° (DP: 30)             │
│                                            │
│  ADD: +2.00    DNP: 64mm                   │
│  ────────────────────────────────────      │
│                                            │
│  PRODUTO: Lentes Multifocais               │
│           Antirreflexo                     │
│                                            │
│  OBSERVAÇÕES:                              │
│  Cliente pediu entrega urgente             │
│                                            │
└────────────────────────────────────────────┘
```

---

## Casos Práticos

### CASO 1: Venda Rápida de Óculos de Sol

```
┌──────────────────────────────────────────┐
│ SITUAÇÃO:                                │
│ Cliente entra na loja e quer comprar     │
│ um óculos de sol Ray-Ban                 │
└──────────────────────────────────────────┘
         ↓
1. Buscar ou cadastrar cliente
         ↓
2. Adicionar: Óculos de Sol Ray-Ban
         ↓
3. PULAR a etapa de prescrição
   (óculos de sol não precisa!)
         ↓
4. Forma de pagamento: Cartão de Débito
   Status: Pago
         ↓
5. Confirmar pedido
         ↓
    ✅ STATUS AUTOMÁTICO: PRONTO
         ↓
    Cliente pode levar NA HORA!
```

### CASO 2: Óculos de Grau Completo

```
┌──────────────────────────────────────────┐
│ SITUAÇÃO:                                │
│ Cliente precisa de óculos de grau        │
│ completo com lentes multifocais          │
└──────────────────────────────────────────┘
         ↓
1. Cadastrar/buscar cliente
         ↓
2. Adicionar produtos:
   • Armação escolhida
   • Lentes multifocais antirreflexo
         ↓
3. Preencher PRESCRIÇÃO completa
   (cliente trouxe receita)
         ↓
4. Pagamento: Crediário 4x
   Entrada: R$ 300,00
   Status: Parcialmente Pago
         ↓
5. Confirmar pedido
         ↓
    ⏳ STATUS AUTOMÁTICO: PENDENTE
         ↓
6. Associar Laboratório LensCraft
   Prazo: 7 dias
         ↓
    ⚙️  STATUS MUDA: EM PRODUÇÃO
         ↓
7. Aguardar 7 dias
         ↓
8. Laboratório finaliza
         ↓
9. Você muda status para: PRONTO
         ↓
10. Liga para cliente avisar
         ↓
11. Cliente retira
         ↓
12. Você muda status para: ENTREGUE
         ↓
    🎉 PEDIDO CONCLUÍDO!
```

### CASO 3: Cliente sem Receita

```
┌──────────────────────────────────────────┐
│ SITUAÇÃO:                                │
│ Cliente quer comprar óculos de grau      │
│ mas esqueceu a receita em casa           │
└──────────────────────────────────────────┘
         ↓
SOLUÇÃO:
         ↓
1. Criar pedido normalmente
         ↓
2. Adicionar armação + lentes
         ↓
3. PULAR a etapa de prescrição
   ⚠️  É OPCIONAL agora!
         ↓
4. Finalizar pagamento
         ↓
5. Confirmar pedido
         ↓
6. Pedir para cliente trazer receita depois
         ↓
7. Quando cliente trouxer:
   • Editar o pedido
   • Adicionar prescrição
   • Associar laboratório
         ↓
    ✅ PROBLEMA RESOLVIDO!
```

### CASO 4: Venda de Armação sem Lentes

```
┌──────────────────────────────────────────┐
│ SITUAÇÃO:                                │
│ Cliente quer apenas a armação            │
│ Vai colocar lentes em outra ótica        │
└──────────────────────────────────────────┘
         ↓
1. Criar pedido
         ↓
2. Adicionar APENAS a armação
   (NÃO adicionar lentes!)
         ↓
3. PULAR prescrição
         ↓
4. Finalizar pagamento
         ↓
5. Confirmar
         ↓
    ✅ STATUS AUTOMÁTICO: PRONTO
         ↓
    Cliente leva NA HORA!
```

---

## ⚠️ Alertas e Avisos Importantes

### Atenção ao Estoque

```
╔════════════════════════════════════════════╗
║  ⚠️  ATENÇÃO: ESTOQUE BAIXO!               ║
╠════════════════════════════════════════════╣
║                                            ║
║  Produto: Armação Ray-Ban Aviador          ║
║  Estoque Atual: 2 unidades                 ║
║                                            ║
║  ⚠️  O que fazer?                           ║
║  1. Finalizar este pedido                  ║
║  2. Avisar administrador                   ║
║  3. Solicitar nova compra                  ║
║                                            ║
║  ✅ Você pode continuar!                   ║
║  Mas lembre-se de repor o estoque.         ║
║                                            ║
╚════════════════════════════════════════════╝
```

### Pedido sem Pagamento

```
╔════════════════════════════════════════════╗
║  ⚠️  ATENÇÃO: PEDIDO A PRAZO               ║
╠════════════════════════════════════════════╣
║                                            ║
║  Cliente: João da Silva                    ║
║  Total: R$ 700,00                          ║
║  Pago: R$ 200,00 (entrada)                 ║
║  Restante: R$ 500,00                       ║
║                                            ║
║  💡 LEMBRE-SE:                             ║
║  • Registre as parcelas no sistema         ║
║  • Acompanhe os vencimentos                ║
║  • Cobre os pagamentos em atraso           ║
║                                            ║
╚════════════════════════════════════════════╝
```

---

## 💡 Dicas Profissionais

### Para Atendimento Rápido

```
┌────────────────────────────────────────────┐
│ ⚡ AGILIZE SEU ATENDIMENTO:                │
│                                            │
│ 1. Tenha o CPF do cliente em mãos         │
│ 2. Verifique se a receita está legível    │
│ 3. Confirme estoque antes de prometer     │
│ 4. Explique prazos claramente             │
│ 5. Ofereça imprimir o comprovante         │
│ 6. Pergunte sobre proteção/garantia       │
└────────────────────────────────────────────┘
```

### Checklist de um Bom Pedido

```
☑️ Cliente cadastrado corretamente
☑️ Produtos corretos selecionados
☑️ Prescrição conferida (se houver)
☑️ Valores calculados corretamente
☑️ Desconto aplicado (se houver)
☑️ Forma de pagamento definida
☑️ Data de entrega combinada
☑️ Laboratório associado (se tiver lentes)
☑️ Cliente entendeu o prazo
☑️ Comprovante impresso
```

---

**Precisa de mais ajuda com pedidos?**  
📧 Fale com seu supervisor  
📖 Consulte o [Manual Principal](./MANUAL_USUARIO.md)

