# 📚 Documentação - Sistema Óticas Queiroz

Bem-vindo à central de documentação do Sistema de Gestão Óticas Queiroz!

---

## 📖 Manuais para Usuários

### 🎯 Para Funcionários da Loja

Documentos escritos em linguagem simples, com exemplos práticos e ilustrações didáticas:

| Manual | Descrição | Para Quem |
|--------|-----------|-----------|
| **[📖 Manual do Usuário](./MANUAL_USUARIO.md)** | Guia completo do sistema | Todos |
| **[📦 Manual de Pedidos](./MANUAL_PEDIDOS.md)** | Guia detalhado de vendas | Funcionários |
| **[💰 Manual de Caixa](./MANUAL_CAIXA.md)** | Gestão do caixa diário | Funcionários |
| **[⚡ Guia Rápido](./GUIA_RAPIDO.md)** | Referência rápida | Todos |

### 🔧 Para Desenvolvedores

Documentação técnica para manutenção e desenvolvimento:

| Documento | Descrição |
|-----------|-----------|
| **[DESENVOLVIMENTO.md](../DESENVOLVIMENTO.md)** | Guia para iniciar desenvolvimento |
| **[README Técnico](../apps/backend/README.md)** | Documentação técnica do backend |

---

## 🗂️ Organização da Documentação

```
docs/
├── MANUAL_USUARIO.md          ← Manual principal
├── MANUAL_PEDIDOS.md          ← Detalhes de pedidos
├── MANUAL_CAIXA.md            ← Detalhes de caixa
├── GUIA_RAPIDO.md             ← Consulta rápida
└── README.md                  ← Este arquivo

info/
├── PRESCRICAO_OPCIONAL_ORDERS.md        ← Documentação técnica
├── STATUS_AUTOMATICO_PEDIDOS_LENTES.md  ← Documentação técnica
└── FIX_PASSWORD_RESET.md                ← Documentação de correções
```

---

## 📋 Índice Completo por Funcionalidade

### 👥 Gestão de Pessoas

- **Clientes**
  - Cadastro: [Manual Usuário §3.2](./MANUAL_USUARIO.md#32-cadastrar-novo-cliente)
  - Busca: [Manual Usuário §3.3](./MANUAL_USUARIO.md#33-buscar-um-cliente)
  - Categorias: [Manual Usuário §3.4](./MANUAL_USUARIO.md#34-categorias-de-clientes)

- **Funcionários** (Admin)
  - Cadastro: [Manual Usuário §9.2](./MANUAL_USUARIO.md#92-cadastrar-funcionário)
  - Reset senha: [Manual Usuário §9.3](./MANUAL_USUARIO.md#93-resetar-senha-de-funcionário)

- **Instituições**
  - Cadastro: [Manual Usuário §10.2](./MANUAL_USUARIO.md#102-cadastrar-instituição)
  - Pedidos: [Manual Usuário §10.3](./MANUAL_USUARIO.md#103-fazer-pedido-para-instituição)

### 📦 Vendas e Produção

- **Pedidos**
  - Criar pedido: [Manual Pedidos - Completo](./MANUAL_PEDIDOS.md#criar-novo-pedido)
  - Status: [Manual Pedidos - Status](./MANUAL_PEDIDOS.md#status-dos-pedidos)
  - Status automático: [Manual Pedidos - Automático](./MANUAL_PEDIDOS.md#status-automático-por-tipo)
  - Prescrição: [Manual Pedidos - Prescrição](./MANUAL_PEDIDOS.md#prescrição-médica)
  - Laboratório: [Manual Pedidos - Laboratório](./MANUAL_PEDIDOS.md#associar-laboratório)
  - Casos práticos: [Manual Pedidos - Casos](./MANUAL_PEDIDOS.md#casos-práticos)

- **Produtos**
  - Cadastro: [Manual Usuário §5.3](./MANUAL_USUARIO.md#53-cadastrar-novo-produto)
  - Tipos: [Manual Usuário §5.2](./MANUAL_USUARIO.md#52-tipos-de-produtos)
  - Estoque: [Manual Usuário §5.4](./MANUAL_USUARIO.md#54-controle-de-estoque)

- **Laboratórios**
  - Cadastro: [Manual Usuário §8.2](./MANUAL_USUARIO.md#82-cadastrar-laboratório)
  - Associação: [Manual Pedidos - Laboratório](./MANUAL_PEDIDOS.md#associar-laboratório)

### 💰 Financeiro

- **Caixa**
  - Abrir: [Manual Caixa - Abrir](./MANUAL_CAIXA.md#abrir-o-caixa)
  - Sangria: [Manual Caixa - Sangria](./MANUAL_CAIXA.md#fazer-sangria)
  - Fechar: [Manual Caixa - Fechar](./MANUAL_CAIXA.md#fechar-o-caixa)
  - Conferência: [Manual Caixa - Conferência](./MANUAL_CAIXA.md#conferência-de-valores)
  - Casos práticos: [Manual Caixa - Casos](./MANUAL_CAIXA.md#casos-práticos)

- **Pagamentos**
  - Registro: [Manual Usuário §6.2](./MANUAL_USUARIO.md#62-criar-um-novo-pagamento)
  - Status: [Manual Usuário §6.4](./MANUAL_USUARIO.md#64-status-de-pagamento)
  - Histórico: [Manual Usuário §6.5](./MANUAL_USUARIO.md#65-histórico-de-pagamentos)

- **Relatórios**
  - Tipos: [Manual Usuário §12.2](./MANUAL_USUARIO.md#122-tipos-de-relatórios)
  - Gerar: [Manual Usuário §12.3](./MANUAL_USUARIO.md#123-gerar-relatório)

### ⚙️ Configurações

- **Meu Perfil**
  - Alterar senha: [Manual Usuário §13.2](./MANUAL_USUARIO.md#132-alterar-minha-senha)
  - Atualizar foto: [Manual Usuário §13.3](./MANUAL_USUARIO.md#133-atualizar-foto-do-perfil)

---

## 🎯 Consultas Rápidas

### Status de Pedidos
```
⏳ Pendente      → Aguarda laboratório
⚙️  Em Produção  → No laboratório
✅ Pronto        → Pode entregar
📦 Entregue      → Cliente já pegou
❌ Cancelado     → Não vai sair
```

### Categorias de Clientes
```
👑 VIP      → 5+ compras
⭐ Regular  → 1-4 compras
👤 Novo     → 0 compras
```

### Formas de Pagamento
```
💵 Dinheiro    💳 Crédito     💳 Débito
📱 PIX         📄 Boleto      📝 Promissória
🏦 Crediário   📃 Cheque
```

---

## 🆘 Precisa de Ajuda?

### Problemas Técnicos
📞 TI: (77) 9999-9999

### Dúvidas de Processo
📞 Supervisor: (77) 9999-8888

### Emergências
📞 Gerente: (77) 9999-7777

### Email Geral
📧 suporte@oticasqueiroz.com.br

---

## 📚 Documentos Detalhados

Para informações mais completas, consulte:

- **Iniciante?** Leia o [Manual do Usuário](./MANUAL_USUARIO.md)
- **Dúvidas sobre Pedidos?** Leia o [Manual de Pedidos](./MANUAL_PEDIDOS.md)
- **Dúvidas sobre Caixa?** Leia o [Manual de Caixa](./MANUAL_CAIXA.md)
- **Precisa de algo rápido?** Este guia tem as respostas!

---

**Última atualização:** Outubro 2025  
**Versão:** 1.0

