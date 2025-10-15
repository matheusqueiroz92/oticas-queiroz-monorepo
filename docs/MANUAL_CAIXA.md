# 💰 Manual de Caixa
## Sistema Óticas Queiroz

---

## 📑 Índice

1. [Introdução](#introdução)
2. [Abrir o Caixa](#abrir-o-caixa)
3. [Movimentações do Dia](#movimentações-do-dia)
4. [Fazer Sangria](#fazer-sangria)
5. [Fechar o Caixa](#fechar-o-caixa)
6. [Conferência de Valores](#conferência-de-valores)
7. [Casos Práticos](#casos-práticos)
8. [Problemas Comuns](#problemas-comuns)

---

## Introdução

O módulo de **Caixa** controla todo o dinheiro FÍSICO que entra e sai da loja no dia a dia.

```
╔══════════════════════════════════════════════╗
║  🎯 O QUE É O CAIXA?                        ║
╠══════════════════════════════════════════════╣
║  É o controle do dinheiro da gaveta!        ║
║                                              ║
║  📊 O sistema registra:                      ║
║  ✅ Quanto você começou o dia (abertura)     ║
║  ✅ Quanto entrou (vendas em dinheiro)       ║
║  ✅ Quanto saiu (despesas, sangrias)         ║
║  ✅ Quanto deveria ter no final (calculado)  ║
║  ✅ Quanto você contou (fechamento)          ║
║  ✅ Diferenças (sobra ou falta)              ║
╚══════════════════════════════════════════════╝
```

### Rotina Diária do Caixa

```
┌─────────────────────────────────────────┐
│       SEU DIA COM O CAIXA               │
└─────────────────────────────────────────┘
              ↓
     🌅 MANHÃ (08:00)
              ↓
   ┌──────────────────────┐
   │  1. ABRIR CAIXA      │
   │  • Valor inicial     │
   │  • Ex: R$ 100,00     │
   └──────────┬───────────┘
              ↓
     ☀️ DURANTE O DIA
              ↓
   ┌──────────────────────┐
   │  2. VENDAS           │
   │  Sistema registra    │
   │  automaticamente     │
   └──────────┬───────────┘
              ↓
   ┌──────────────────────┐
   │  3. SANGRIAS         │
   │  (se necessário)     │
   │  Ex: Depósito banco  │
   └──────────┬───────────┘
              ↓
     🌙 NOITE (18:00)
              ↓
   ┌──────────────────────┐
   │  4. FECHAR CAIXA     │
   │  • Contar dinheiro   │
   │  • Conferir valores  │
   │  • Fechar no sistema │
   └──────────┬───────────┘
              ↓
         ✅ FIM!
```

---

## Abrir o Caixa

### Quando Abrir?

**TODO DIA ao chegar para trabalhar!**

⚠️ **ATENÇÃO:** Você NÃO consegue:
- Registrar vendas
- Receber pagamentos  
- Fazer movimentações

...se o caixa não estiver aberto!

### Como Abrir

**Passo a Passo:**

1. Chegue no trabalho
2. Acesse o menu **"Caixa"**
3. Clique em **"Abrir Caixa"**
4. Preencha:

```
╔════════════════════════════════════════════╗
║  ABRIR CAIXA                               ║
╠════════════════════════════════════════════╣
║                                            ║
║  📅 DATA                                   ║
║  15/10/2025 (Hoje)                         ║
║                                            ║
║  👤 FUNCIONÁRIO                            ║
║  Maria Santos                              ║
║                                            ║
║  💰 VALOR INICIAL                          ║
║  ┌─────────────────────────────────────┐  ║
║  │ R$ 100,00                            │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  ℹ️  O QUE É VALOR INICIAL?                ║
║  É o dinheiro que você coloca no caixa     ║
║  para ter troco. Geralmente R$ 100,00.     ║
║                                            ║
║  💡 DICA:                                  ║
║  Tenha notas variadas para troco:          ║
║  • R$ 50,00 (2 notas)                      ║
║  • R$ 20,00 (3 notas)                      ║
║  • R$ 10,00 (4 notas)                      ║
║  • R$ 5,00 (6 notas)                       ║
║  • R$ 2,00 (10 moedas)                     ║
║                                            ║
║  📝 OBSERVAÇÕES (Opcional):                ║
║  ┌─────────────────────────────────────┐  ║
║  │ Caixa aberto às 08:00h...            │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  ┌──────────┐  ┌────────────────────┐     ║
║  │ CANCELAR │  │  ABRIR CAIXA ✓     │     ║
║  └──────────┘  └────────────────────┘     ║
║                                            ║
╚════════════════════════════════════════════╝
```

5. Clique em **"ABRIR CAIXA"**
6. Pronto! Caixa está aberto! ✅

**Confirmação:**

```
╔════════════════════════════════════════════╗
║                                            ║
║        ✅ CAIXA ABERTO COM SUCESSO!        ║
║                                            ║
║  Agora você pode:                          ║
║  • Fazer vendas                            ║
║  • Registrar pagamentos                    ║
║  • Fazer sangrias                          ║
║                                            ║
║  ⚠️  LEMBRE-SE:                            ║
║  Feche o caixa ao final do dia!            ║
║                                            ║
╚════════════════════════════════════════════╝
```

---

## Movimentações do Dia

### O Que o Sistema Registra Automaticamente

```
╔═══════════════════════════════════════════════════╗
║  📊 MOVIMENTAÇÕES AUTOMÁTICAS                     ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  ✅ ENTRADAS (Dinheiro que ENTRA)                 ║
║  ┌─────────────────────────────────────────────┐ ║
║  │ • Vendas em DINHEIRO                        │ ║
║  │   Sistema registra automaticamente          │ ║
║  │                                             │ ║
║  │ • Vendas em DÉBITO                          │ ║
║  │   Sistema registra automaticamente          │ ║
║  │                                             │ ║
║  │ • Pagamentos recebidos em DINHEIRO          │ ║
║  │   Sistema registra automaticamente          │ ║
║  └─────────────────────────────────────────────┘ ║
║                                                   ║
║  ❌ SAÍDAS (Dinheiro que SAI)                     ║
║  ┌─────────────────────────────────────────────┐ ║
║  │ • Sangrias (você retira)                    │ ║
║  │   PRECISA registrar manualmente             │ ║
║  │                                             │ ║
║  │ • Despesas pagas em dinheiro                │ ║
║  │   PRECISA registrar manualmente             │ ║
║  │                                             │ ║
║  │ • Trocos dados errados                      │ ║
║  │   Sistema NÃO sabe automaticamente          │ ║
║  └─────────────────────────────────────────────┘ ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

### Visualizar Movimentações

Você pode ver todas as movimentações do dia:

```
╔════════════════════════════════════════════════════════╗
║  CAIXA DO DIA - 15/10/2025                             ║
║  Funcionário: Maria Santos                             ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  💰 SALDO ATUAL: R$ 1.320,00                           ║
║                                                        ║
║  ┌────────────────────────────────────────────────┐   ║
║  │ ABERTURA                            08:00      │   ║
║  │ Valor Inicial:.................. R$ 100,00     │   ║
║  └────────────────────────────────────────────────┘   ║
║                                                        ║
║  ┌────────────────────────────────────────────────┐   ║
║  │ ✅ ENTRADAS                                    │   ║
║  ├────────┬───────────┬────────┬─────────────────┤   ║
║  │ Hora   │ Tipo      │ Valor  │ Observação      │   ║
║  ├────────┼───────────┼────────┼─────────────────┤   ║
║  │ 09:15  │ Venda     │ R$ 450 │ Pedido #1234    │   ║
║  │ 10:30  │ Venda     │ R$ 320 │ Pedido #1235    │   ║
║  │ 11:45  │ Pagamento │ R$ 200 │ Cliente João    │   ║
║  │ 14:20  │ Venda     │ R$ 550 │ Pedido #1236    │   ║
║  │ 16:00  │ Pagamento │ R$ 300 │ Cliente Maria   │   ║
║  ├────────┴───────────┼────────┴─────────────────┤   ║
║  │ SUBTOTAL ENTRADAS  │ R$ 1.820,00              │   ║
║  └────────────────────┴──────────────────────────┘   ║
║                                                        ║
║  ┌────────────────────────────────────────────────┐   ║
║  │ ❌ SAÍDAS                                      │   ║
║  ├────────┬───────────┬────────┬─────────────────┤   ║
║  │ Hora   │ Tipo      │ Valor  │ Observação      │   ║
║  ├────────┼───────────┼────────┼─────────────────┤   ║
║  │ 12:00  │ Sangria   │ R$ 500 │ Depósito banco  │   ║
║  │ 15:30  │ Despesa   │ R$ 100 │ Compra material │   ║
║  ├────────┴───────────┼────────┴─────────────────┤   ║
║  │ SUBTOTAL SAÍDAS    │ R$ 600,00                │   ║
║  └────────────────────┴──────────────────────────┘   ║
║                                                        ║
║  ═══════════════════════════════════════════════      ║
║  💰 SALDO ATUAL                                       ║
║  Inicial.......... R$   100,00                        ║
║  + Entradas....... R$ 1.820,00                        ║
║  - Saídas......... R$   600,00                        ║
║  ═══════════════════════════════════════════════      ║
║  = SALDO........... R$ 1.320,00                       ║
║  ═══════════════════════════════════════════════      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

## Fazer Sangria

### O Que é Sangria?

**Sangria** = Retirar dinheiro do caixa

```
╔════════════════════════════════════════════╗
║  🤔 POR QUE FAZER SANGRIA?                 ║
╠════════════════════════════════════════════╣
║                                            ║
║  1. 🏦 DEPÓSITO BANCÁRIO                   ║
║     Levar dinheiro ao banco                ║
║                                            ║
║  2. 🔒 SEGURANÇA                           ║
║     Não deixar muito dinheiro no caixa     ║
║                                            ║
║  3. 💼 PAGAMENTO DE FORNECEDOR             ║
║     Pagar fornecedor em dinheiro           ║
║                                            ║
║  4. 🚨 EMERGÊNCIA                          ║
║     Situações imprevistas                  ║
║                                            ║
╚════════════════════════════════════════════╝
```

### Como Fazer Sangria

```
╔════════════════════════════════════════════╗
║  FAZER SANGRIA                             ║
╠════════════════════════════════════════════╣
║                                            ║
║  💵 VALOR DA SANGRIA                       ║
║  ┌─────────────────────────────────────┐  ║
║  │ R$ 500,00                            │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  📝 MOTIVO DA SANGRIA                      ║
║  ┌─────────────────────────────────────┐  ║
║  │ Depósito bancário - Banco do Brasil  │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  📊 IMPACTO NO CAIXA:                      ║
║  ┌─────────────────────────────────────┐  ║
║  │ Saldo Atual:.......... R$ 1.320,00  │  ║
║  │ Valor da Sangria:..... R$   500,00  │  ║
║  │ ─────────────────────────────────   │  ║
║  │ Novo Saldo:........... R$   820,00  │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  ⚠️  ATENÇÃO:                              ║
║  Este dinheiro será REMOVIDO do caixa!     ║
║  Certifique-se do valor antes de confirmar.║
║                                            ║
║  ┌──────────┐  ┌────────────────────┐     ║
║  │ CANCELAR │  │  CONFIRMAR ✓       │     ║
║  └──────────┘  └────────────────────┘     ║
║                                            ║
╚════════════════════════════════════════════╝
```

**Após Confirmar:**

```
╔════════════════════════════════════════════╗
║        ✅ SANGRIA REGISTRADA!              ║
╠════════════════════════════════════════════╣
║                                            ║
║  Valor: R$ 500,00                          ║
║  Motivo: Depósito bancário                 ║
║  Novo Saldo: R$ 820,00                     ║
║                                            ║
║  📝 PRÓXIMOS PASSOS:                       ║
║  1. Retire o dinheiro do caixa             ║
║  2. Faça o depósito no banco               ║
║  3. Guarde o comprovante                   ║
║                                            ║
╚════════════════════════════════════════════╝
```

---

## Fechar o Caixa

### Quando Fechar?

**TODO DIA no final do expediente!**

⚠️ **IMPORTANTE:** NÃO vá embora sem fechar o caixa!

### Como Fechar

**Passo a Passo:**

```
PASSO 1: Contar o Dinheiro
┌────────────────────────────────┐
│ 1. Pegue todo dinheiro do caixa│
│ 2. Separe por tipo de nota     │
│ 3. Conte DUAS vezes            │
│ 4. Anote o valor total         │
└────────────────────────────────┘
         ↓
PASSO 2: Acessar Fechamento
┌────────────────────────────────┐
│ 1. Menu "Caixa"                │
│ 2. Botão "Fechar Caixa"        │
└────────────────────────────────┘
         ↓
PASSO 3: Ver Resumo do Dia
┌────────────────────────────────┐
│ Sistema mostra o que aconteceu │
│ no dia (veja tela abaixo)      │
└────────────────────────────────┘
         ↓
PASSO 4: Informar Valor Contado
┌────────────────────────────────┐
│ Digite quanto você contou      │
└────────────────────────────────┘
         ↓
PASSO 5: Conferir e Confirmar
┌────────────────────────────────┐
│ Sistema compara valores        │
│ Se correto: Confirma           │
│ Se diferente: Explica diferença│
└────────────────────────────────┘
```

**Tela de Fechamento:**

```
╔════════════════════════════════════════════════════╗
║  FECHAR CAIXA - 15/10/2025                         ║
║  Funcionário: Maria Santos                         ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  📊 RESUMO DO DIA                                  ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         ║
║                                                    ║
║  🌅 ABERTURA (08:00)                               ║
║  Valor Inicial:.................. R$   100,00     ║
║                                                    ║
║  ✅ ENTRADAS                                       ║
║  ├─ Vendas em Dinheiro........... R$   800,00     ║
║  ├─ Vendas em Débito............. R$   650,00     ║
║  ├─ Pagamentos Recebidos......... R$   370,00     ║
║  └─ TOTAL ENTRADAS:.............. R$ 1.820,00     ║
║                                                    ║
║  ❌ SAÍDAS                                         ║
║  ├─ Sangrias..................... R$   500,00     ║
║  ├─ Despesas..................... R$   100,00     ║
║  └─ TOTAL SAÍDAS:................ R$   600,00     ║
║                                                    ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         ║
║  💰 SALDO ESPERADO NO CAIXA                        ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         ║
║  Inicial + Entradas - Saídas = R$ 1.320,00        ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         ║
║                                                    ║
║  💵 AGORA CONTE O DINHEIRO DO CAIXA:               ║
║  ┌──────────────────────────────────────────┐     ║
║  │ Valor Contado: R$ 1.320,00               │     ║
║  └──────────────────────────────────────────┘     ║
║                                                    ║
║  ✅ DIFERENÇA: R$ 0,00                             ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         ║
║  🎉 PARABÉNS! CAIXA ESTÁ CORRETO!                  ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         ║
║                                                    ║
║  ┌──────────┐  ┌──────────────────────────┐       ║
║  │  VOLTAR  │  │  FECHAR CAIXA ✓          │       ║
║  └──────────┘  └──────────────────────────┘       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

---

## Conferência de Valores

### Caixa Bateu Certinho ✅

```
╔════════════════════════════════════════════╗
║                                            ║
║        🎉 CAIXA FECHADO!                   ║
║           TUDO CERTO!                      ║
║                                            ║
║  Esperado:........ R$ 1.320,00             ║
║  Contado:......... R$ 1.320,00             ║
║  Diferença:....... R$     0,00 ✅          ║
║                                            ║
║  Parabéns por manter o caixa organizado!   ║
║                                            ║
║  Até amanhã! 👋                            ║
║                                            ║
╚════════════════════════════════════════════╝
```

### Caixa com Sobra 💰

```
╔════════════════════════════════════════════╗
║                                            ║
║        ⚠️  ATENÇÃO: SOBRA NO CAIXA         ║
║                                            ║
║  Esperado:........ R$ 1.320,00             ║
║  Contado:......... R$ 1.350,00             ║
║  Diferença:....... R$    30,00 ⬆️          ║
║                                            ║
║  😊 Há R$ 30 A MAIS no caixa!              ║
║                                            ║
║  POSSÍVEIS CAUSAS:                         ║
║  • Cliente pagou e não pegou troco         ║
║  • Venda não foi registrada                ║
║  • Erro ao contar na abertura              ║
║                                            ║
║  📝 Explique o motivo (se souber):         ║
║  ┌─────────────────────────────────────┐  ║
║  │ Cliente não quis o troco...          │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  ✅ Você pode fechar o caixa mesmo assim.  ║
║  A diferença ficará registrada.            ║
║                                            ║
║  ┌──────────┐  ┌────────────────────┐     ║
║  │  VOLTAR  │  │  FECHAR MESMO      │     ║
║  └──────────┘  └────────────────────┘     ║
║                                            ║
╚════════════════════════════════════════════╝
```

### Caixa com Falta 📉

```
╔════════════════════════════════════════════╗
║                                            ║
║        ⚠️  ATENÇÃO: FALTA NO CAIXA         ║
║                                            ║
║  Esperado:........ R$ 1.320,00             ║
║  Contado:......... R$ 1.290,00             ║
║  Diferença:....... R$    30,00 ⬇️          ║
║                                            ║
║  😟 Faltam R$ 30 no caixa!                 ║
║                                            ║
║  POSSÍVEIS CAUSAS:                         ║
║  • Troco dado a mais                       ║
║  • Venda registrada mas dinheiro não entrou║
║  • Despesa não registrada                  ║
║  • Erro ao contar                          ║
║                                            ║
║  💡 O QUE FAZER?                            ║
║  1. Conte novamente (pode ser erro)        ║
║  2. Verifique os recibos do dia            ║
║  3. Tente lembrar de algo incomum          ║
║                                            ║
║  📝 Explique o motivo (obrigatório):       ║
║  ┌─────────────────────────────────────┐  ║
║  │ Possível troco dado errado...        │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  ⚠️  A diferença ficará registrada.        ║
║  O administrador será notificado.          ║
║                                            ║
║  ┌──────────┐  ┌────────────────────┐     ║
║  │  VOLTAR  │  │  FECHAR MESMO      │     ║
║  └──────────┘  └────────────────────┘     ║
║                                            ║
╚════════════════════════════════════════════╝
```

---

## Casos Práticos

### CASO 1: Dia Normal

```
DIA TÍPICO DE TRABALHO
═════════════════════════════════════

08:00 - Chega ao trabalho
    ↓
    Abre caixa com R$ 100 de troco
    ✅ Caixa Aberto!
    ↓
09:00-12:00 - Manhã
    ↓
    Vendas:
    • 09:15 - R$ 450 (Dinheiro)
    • 10:30 - R$ 320 (Débito)
    • 11:45 - R$ 200 (Dinheiro)
    ✅ Sistema registra tudo!
    ↓
12:00 - Hora do Almoço
    ↓
    Caixa está com muito dinheiro
    Faz sangria de R$ 500
    Leva ao banco
    ✅ Sangria Registrada!
    ↓
13:00-18:00 - Tarde
    ↓
    Mais vendas e pagamentos
    Sistema continua registrando
    ↓
18:00 - Fim do Expediente
    ↓
    1. Conta o dinheiro
    2. Acessa "Fechar Caixa"
    3. Digita valor contado
    4. Confere que está correto
    5. Confirma fechamento
    ✅ Caixa Fechado!
    ↓
    Pode ir para casa! 🏠
```

### CASO 2: Esqueceu de Abrir o Caixa

```
╔════════════════════════════════════════════╗
║  ⚠️  ERRO: CAIXA NÃO ESTÁ ABERTO           ║
╠════════════════════════════════════════════╣
║                                            ║
║  Você tentou fazer uma venda mas o         ║
║  sistema bloqueou porque o caixa não       ║
║  foi aberto.                               ║
║                                            ║
║  O QUE FAZER:                              ║
║  1. Vá em Menu → Caixa                     ║
║  2. Clique em "Abrir Caixa"                ║
║  3. Informe o valor inicial                ║
║  4. Confirme                               ║
║  5. Volte e finalize a venda               ║
║                                            ║
║  💡 DICA:                                  ║
║  Sempre abra o caixa ANTES de começar      ║
║  a atender clientes!                       ║
║                                            ║
╚════════════════════════════════════════════╝
```

### CASO 3: Diferença no Fechamento

```
SITUAÇÃO:
Você contou R$ 1.290 mas o sistema
esperava R$ 1.320 (faltam R$ 30)

O QUE FAZER:
         ↓
1. NÃO ENTRE EM PÂNICO! 😰
         ↓
2. Conte NOVAMENTE o dinheiro
   (pode ser erro de contagem)
         ↓
3. Confere se bateu?
         ↓
    SIM ✅              NÃO ❌
         │                  │
         ↓                  ↓
    Fechar            Investigar:
    caixa!            • Notas de vendas
                      • Recibos de pagamento
                      • Trocos dados
                      ↓
                      Achou o erro?
                      ↓
                  SIM ✅         NÃO ❌
                      │              │
                      ↓              ↓
                  Corrigir      Registrar
                  e fechar      diferença
                                e fechar
                                    ↓
                                Avisar
                                supervisor
```

---

## 💡 Dicas de Ouro para o Caixa

### Boas Práticas

```
╔════════════════════════════════════════════╗
║  ✅ FAÇA SEMPRE:                           ║
╠════════════════════════════════════════════╣
║  • Abra o caixa ao chegar                  ║
║  • Mantenha notas organizadas              ║
║  • Confira troco antes de dar              ║
║  • Registre sangrias imediatamente         ║
║  • Conte dinheiro em local seguro          ║
║  • Feche caixa antes de sair               ║
║  • Guarde comprovantes do dia              ║
╚════════════════════════════════════════════╝

╔════════════════════════════════════════════╗
║  ❌ NUNCA FAÇA:                            ║
╠════════════════════════════════════════════╣
║  • Deixar caixa aberto ao sair             ║
║  • Misturar dinheiro pessoal com caixa     ║
║  • Fazer sangria sem registrar             ║
║  • Dar troco errado sem avisar             ║
║  • Fechar caixa sem contar                 ║
║  • Ignorar diferenças grandes              ║
╚════════════════════════════════════════════╝
```

### Como Evitar Problemas

```
┌────────────────────────────────────────────┐
│ 🎯 CHECKLIST DIÁRIO DO CAIXA               │
├────────────────────────────────────────────┤
│                                            │
│ MANHÃ:                                     │
│ ☐ Cheguei no horário                       │
│ ☐ Abri o caixa                             │
│ ☐ Conferi o troco inicial                  │
│ ☐ Organizei as notas por valor             │
│                                            │
│ DURANTE O DIA:                             │
│ ☐ Registro vendas corretamente             │
│ ☐ Dou troco com atenção                    │
│ ☐ Guardo todos os recibos                  │
│ ☐ Registro sangrias se necessário          │
│                                            │
│ NOITE:                                     │
│ ☐ Conto o dinheiro com calma               │
│ ☐ Confiro DUAS vezes                       │
│ ☐ Fecho o caixa no sistema                 │
│ ☐ Guardo o dinheiro com segurança          │
│                                            │
└────────────────────────────────────────────┘
```

---

## 🚨 Problemas Comuns e Soluções

### Problema 1: "Não consigo abrir o caixa"

```
POSSÍVEIS CAUSAS:
✅ Já existe um caixa aberto hoje
✅ Você não tem permissão
✅ Sistema está offline

SOLUÇÃO:
1. Verifique se já abriu o caixa hoje
2. Pergunte ao supervisor
3. Verifique sua internet
```

### Problema 2: "Diferença no fechamento"

```
DIFERENÇA PEQUENA (até R$ 10):
• Normal em dias movimentados
• Pode ser erro de contagem
• Registre e feche normalmente

DIFERENÇA MÉDIA (R$ 10 a R$ 50):
• Confira novamente
• Revise movimentações do dia
• Explique no campo de observações
• Avise supervisor

DIFERENÇA GRANDE (acima de R$ 50):
• NÃO feche o caixa ainda
• Chame o supervisor IMEDIATAMENTE
• Investiguem juntos
• Só feche após identificar a causa
```

### Problema 3: "Fiz sangria mas esqueci de registrar"

```
SOLUÇÃO:
1. Acesse "Caixa"
2. Procure "Movimentações do Dia"
3. Clique em "Nova Sangria"
4. Informe valor e motivo
5. Salve
✅ Problema resolvido!
```

---

**Precisa de mais ajuda com o caixa?**  
📧 Fale com seu supervisor  
📖 Consulte o [Manual Principal](./MANUAL_USUARIO.md)

