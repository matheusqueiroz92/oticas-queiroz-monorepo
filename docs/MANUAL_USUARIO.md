# 📖 Manual Completo do Usuário
## Sistema de Gestão Óticas Queiroz

**Versão:** 1.0  
**Data:** Outubro de 2025  
**Público-alvo:** Funcionários e Administradores

---

## 👋 Bem-vindo ao Sistema Óticas Queiroz!

Este manual foi criado especialmente para você! Aqui está tudo que você precisa saber para usar o sistema no dia a dia, com linguagem simples, exemplos práticos e ilustrações didáticas.

> 💡 **Dica:** Este manual está organizado por módulos. Você pode ler tudo de uma vez ou consultar apenas o que precisa no momento.

---

## 📑 Índice Completo

### PARTE 1: INTRODUÇÃO
1. [Primeiros Passos](#1-primeiros-passos)
   - Como acessar o sistema
   - Recuperar senha
   - Níveis de acesso
   - Navegação básica

2. [Dashboard - Sua Central de Comando](#2-dashboard)
   - Visão geral
   - Estatísticas em tempo real
   - Ações rápidas
   - Busca de pedidos

### PARTE 2: GESTÃO DE PESSOAS
3. [Clientes](#3-clientes)
   - Cadastrar novo cliente
   - Buscar clientes
   - Categorias (VIP, Regular, Novo)
   - Histórico de compras
   - Editar dados

4. [Funcionários](#4-funcionários) ⭐ Apenas Admin
   - Cadastrar funcionário
   - Definir níveis de acesso
   - Resetar senhas
   - Controle de vendas

5. [Instituições](#5-instituições)
   - Cadastrar convênios
   - Pedidos institucionais
   - Descontos especiais

### PARTE 3: VENDAS E ESTOQUE
6. [Pedidos](#6-pedidos) ⭐ PRINCIPAL
   - Criar novo pedido (passo a passo)
   - Status dos pedidos
   - **NOVO:** Status automático por tipo
   - Prescrição médica (opcional)
   - Associar laboratório
   - Imprimir pedido

7. [Produtos](#7-produtos)
   - Tipos de produtos
   - Cadastrar produto
   - Controle de estoque
   - Alertas de estoque baixo

8. [Laboratórios](#8-laboratórios)
   - Cadastrar laboratórios
   - Associar a pedidos
   - Prazos de entrega

### PARTE 4: FINANCEIRO
9. [Pagamentos](#9-pagamentos)
   - Registrar pagamento
   - Formas de pagamento
   - Status (Completo, Parcial, Pendente)
   - Histórico de pagamentos

10. [Caixa](#10-caixa)
    - Abrir caixa
    - Movimentações automáticas
    - Fazer sangria
    - Fechar caixa
    - Conferência de valores

11. [Clientes Legados](#11-clientes-legados)
    - Visualizar devedores
    - Registrar pagamentos antigos
    - Histórico de débitos

### PARTE 5: ANÁLISES E PERFIL
12. [Relatórios](#12-relatórios)
    - Relatório de vendas
    - Relatório de estoque
    - Relatório financeiro
    - Relatório de clientes
    - Exportar em PDF/Excel

13. [Meu Perfil](#13-meu-perfil)
    - Atualizar dados
    - Alterar senha
    - Trocar foto

### PARTE 6: AJUDA
14. [Dúvidas Frequentes (FAQ)](#14-faq)
15. [Glossário de Termos](#15-glossario)
16. [Contato e Suporte](#16-suporte)

---

## 1. Primeiros Passos

### 1.1 Como Acessar o Sistema

**URL do Sistema:**
```
🌐 https://app.oticasqueiroz.com.br
```

**Tela de Login:**

```
╔══════════════════════════════════════════╗
║                                          ║
║         🕶️  ÓTICAS QUEIROZ               ║
║    Sistema de Gestão Completo            ║
║                                          ║
║    ┌──────────────────────────────┐     ║
║    │  📧 Email                    │     ║
║    │  exemplo@email.com           │     ║
║    └──────────────────────────────┘     ║
║                                          ║
║    ┌──────────────────────────────┐     ║
║    │  🔒 Senha                    │     ║
║    │  ••••••••                    │     ║
║    └──────────────────────────────┘     ║
║                                          ║
║    ┌──────────────────────────────┐     ║
║    │        ENTRAR ➜              │     ║
║    └──────────────────────────────┘     ║
║                                          ║
║    Esqueceu sua senha? Clique aqui      ║
║                                          ║
╚══════════════════════════════════════════╝
```

**Passos para acessar:**

1. ✅ Abra seu navegador (Chrome, Firefox ou Edge)
2. ✅ Digite: `app.oticasqueiroz.com.br`
3. ✅ Digite seu **email** e **senha**
4. ✅ Clique em **ENTRAR**
5. ✅ Pronto! Você está no sistema

### 1.2 Recuperar Senha Esquecida

Esqueceu sua senha? Sem problemas!

```
FLUXO DE RECUPERAÇÃO:
┌─────────────────────────┐
│ 1. Clique em           │
│    "Esqueceu senha?"   │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│ 2. Digite seu email     │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│ 3. Clique em           │
│    "Enviar Link"       │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│ 4. Verifique seu email │
│    (pode demorar 1 min) │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│ 5. Clique no link      │
│    do email            │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│ 6. Digite nova senha   │
│    (mínimo 6 caracteres)│
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│ 7. Confirme a senha    │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│ ✅ Senha Alterada!      │
│    Faça login           │
└─────────────────────────┘
```

### 1.3 Níveis de Acesso

O sistema tem 3 níveis de usuário:

```
╔═══════════════════════════════════════════════════╗
║  👨‍💼 ADMINISTRADOR                                 ║
╠═══════════════════════════════════════════════════╣
║  ✅ Acesso TOTAL a todas as funcionalidades       ║
║  ✅ Gerenciar funcionários                        ║
║  ✅ Ver todos os relatórios                       ║
║  ✅ Configurar sistema                            ║
║  ✅ Resetar senhas de outros usuários             ║
║  ✅ Acessar módulo de relatórios avançados        ║
║  ✅ Gerenciar caixas de todos os funcionários     ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║  👔 FUNCIONÁRIO                                    ║
╠═══════════════════════════════════════════════════╣
║  ✅ Cadastrar clientes                            ║
║  ✅ Criar pedidos                                 ║
║  ✅ Registrar pagamentos                          ║
║  ✅ Abrir/Fechar caixa                            ║
║  ✅ Gerenciar produtos                            ║
║  ✅ Resetar senhas de clientes                    ║
║  ❌ NÃO pode criar funcionários                   ║
║  ❌ NÃO acessa relatórios de outros funcionários  ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║  👤 CLIENTE                                        ║
╠═══════════════════════════════════════════════════╣
║  ✅ Ver seus próprios pedidos                     ║
║  ✅ Acompanhar status de pedidos                  ║
║  ✅ Ver histórico de pagamentos                   ║
║  ✅ Consultar débitos                             ║
║  ✅ Atualizar dados pessoais                      ║
║  ❌ NÃO pode criar pedidos                        ║
║  ❌ NÃO acessa dados de outros clientes           ║
╚═══════════════════════════════════════════════════╝
```

---

## 2. Dashboard

### 2.1 Sua Central de Comando

Ao fazer login, você verá o **Dashboard** - sua tela principal:

```
╔════════════════════════════════════════════════════════════╗
║  ÓTICAS QUEIROZ                    👤 Maria Santos  🔔  🌙 ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  📊 ESTATÍSTICAS DO DIA                                    ║
║  ┌───────────────┐ ┌───────────────┐ ┌──────────────┐    ║
║  │ 💰 VENDAS     │ │ 👥 CLIENTES   │ │ 📦 PEDIDOS   │    ║
║  │    Hoje       │ │  Cadastrados  │ │   Pendentes  │    ║
║  │  R$ 2.450,00  │ │      348      │ │      12      │    ║
║  │  ↑ +15%       │ │   ↑ +3 hoje   │ │   ⚠️ Atenção │    ║
║  └───────────────┘ └───────────────┘ └──────────────┘    ║
║                                                            ║
║  🔍 BUSCA RÁPIDA DE PEDIDO                                ║
║  ┌────────────────────────────────────────────────────┐   ║
║  │ Digite o número do pedido ou nome do cliente... 🔎│   ║
║  └────────────────────────────────────────────────────┘   ║
║                                                            ║
║  ⚡ AÇÕES RÁPIDAS                                         ║
║  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        ║
║  │  + Novo     │ │  + Novo     │ │  + Novo     │        ║
║  │   Pedido    │ │   Cliente   │ │   Produto   │        ║
║  └─────────────┘ └─────────────┘ └─────────────┘        ║
║                                                            ║
║  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        ║
║  │   Abrir     │ │  Registrar  │ │     Ver     │        ║
║  │    Caixa    │ │  Pagamento  │ │  Relatórios │        ║
║  └─────────────┘ └─────────────┘ └─────────────┘        ║
║                                                            ║
║  📋 PEDIDOS RECENTES                                      ║
║  ┌────────┬──────────────┬────────────┬──────────────┐   ║
║  │ OS     │ Cliente      │ Total      │ Status       │   ║
║  ├────────┼──────────────┼────────────┼──────────────┤   ║
║  │ #1234  │ João Silva   │ R$ 450,00  │ ✅ Pronto    │   ║
║  │ #1233  │ Maria Costa  │ R$ 320,00  │ ⚙️  Produção │   ║
║  │ #1232  │ Pedro Lima   │ R$ 890,00  │ 📦 Entregue  │   ║
║  │ #1231  │ Ana Santos   │ R$ 210,00  │ ⏳ Pendente  │   ║
║  └────────┴──────────────┴────────────┴──────────────┘   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### 2.2 Menu Lateral de Navegação

```
┌──────────────────────┐
│  MENU PRINCIPAL      │
├──────────────────────┤
│ 🏠 Dashboard         │ ← Você está aqui
│ 👥 Clientes          │
│ 📦 Pedidos           │
│ 🛍️  Produtos         │
│ 💳 Pagamentos        │
│ 💰 Caixa             │
│ 🔬 Laboratórios      │
│ 👔 Funcionários      │ ⭐ Apenas Admin
│ 🏢 Instituições      │
│ 📚 Clientes Legados  │
│ 📊 Relatórios        │
├──────────────────────┤
│ ⚙️  Configurações    │
│ 👤 Meu Perfil        │
│ 🚪 Sair              │
└──────────────────────┘
```

---

## 3. Clientes

### 3.1 O Que é Este Módulo?

O módulo de **Clientes** é onde você:
- ✅ Cadastra novos clientes
- ✅ Busca clientes existentes  
- ✅ Visualiza histórico de compras
- ✅ Acompanha débitos
- ✅ Atualiza dados cadastrais

### 3.2 Cadastrar Novo Cliente

**Passo a Passo Completo:**

```
PASSO 1: Acessar o Módulo
┌────────────────────────────────┐
│ Clique em "Clientes" no menu   │
│ lateral                         │
└────────────────────────────────┘
         ↓
PASSO 2: Iniciar Cadastro
┌────────────────────────────────┐
│ Clique no botão "+ Novo Cliente"│
│ (canto superior direito)        │
└────────────────────────────────┘
         ↓
PASSO 3: Preencher Dados
┌────────────────────────────────┐
│ Veja o formulário abaixo ➜     │
└────────────────────────────────┘
```

**Formulário de Cadastro:**

```
╔════════════════════════════════════════════════════╗
║  CADASTRAR NOVO CLIENTE                            ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  📝 DADOS PESSOAIS                                 ║
║  ┌──────────────────────────────────────────┐     ║
║  │ Nome Completo*                           │     ║
║  │ João da Silva                            │     ║
║  └──────────────────────────────────────────┘     ║
║                                                    ║
║  ┌─────────────────────┐  ┌─────────────────┐    ║
║  │ CPF*                │  │ RG              │    ║
║  │ 123.456.789-00      │  │ 12.345.678      │    ║
║  └─────────────────────┘  └─────────────────┘    ║
║                                                    ║
║  ┌─────────────────────┐  ┌─────────────────┐    ║
║  │ Telefone*           │  │ Data Nascimento │    ║
║  │ (77) 98888-7777     │  │ 15/05/1990      │    ║
║  └─────────────────────┘  └─────────────────┘    ║
║                                                    ║
║  ┌──────────────────────────────────────────┐     ║
║  │ Email                                    │     ║
║  │ joao@email.com                           │     ║
║  └──────────────────────────────────────────┘     ║
║                                                    ║
║  📍 ENDEREÇO                                       ║
║  ┌───────────────┐  ┌──────┐  ┌──────────────┐   ║
║  │ CEP           │  │ Nº   │  │ Complemento  │   ║
║  │ 45000-000     │  │ 123  │  │ Apto 2       │   ║
║  └───────────────┘  └──────┘  └──────────────┘   ║
║                                                    ║
║  ┌──────────────────────────────────────────┐     ║
║  │ Rua                                      │     ║
║  │ Rua das Flores                           │     ║
║  └──────────────────────────────────────────┘     ║
║                                                    ║
║  ┌──────────────┐  ┌────────────┐  ┌───────┐     ║
║  │ Bairro       │  │ Cidade     │  │ UF    │     ║
║  │ Centro       │  │ Itapetinga │  │ BA    │     ║
║  └──────────────┘  └────────────┘  └───────┘     ║
║                                                    ║
║  📸 FOTO (Opcional)                                ║
║  ┌──────────────────────────────────────────┐     ║
║  │  [Clique para adicionar foto]            │     ║
║  └──────────────────────────────────────────┘     ║
║                                                    ║
║  * Campos obrigatórios                            ║
║                                                    ║
║  ┌────────────┐  ┌──────────────────────┐         ║
║  │  CANCELAR  │  │  SALVAR CLIENTE ✓   │         ║
║  └────────────┘  └──────────────────────┘         ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

**Dicas Importantes:**
- 💡 O CPF não pode estar já cadastrado
- 💡 Telefone é usado para contato
- 💡 Email é usado para enviar comprovantes
- 💡 Foto é opcional mas ajuda na identificação

### 3.3 Categorias Automáticas de Clientes

O sistema categoriza automaticamente baseado no histórico:

```
╔═══════════════════════════════════════════════════╗
║  👑 CLIENTE VIP (Ouro)                            ║
╠═══════════════════════════════════════════════════╣
║  Requisitos:                                      ║
║  • 5 ou mais compras realizadas                   ║
║                                                   ║
║  Benefícios:                                      ║
║  • Atendimento prioritário                        ║
║  • Ofertas exclusivas                             ║
║  • Desconto em produtos selecionados              ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║  ⭐ CLIENTE REGULAR (Prata)                       ║
╠═══════════════════════════════════════════════════╣
║  Requisitos:                                      ║
║  • De 1 a 4 compras realizadas                    ║
║                                                   ║
║  Benefícios:                                      ║
║  • Cliente fidelizado                             ║
║  • Comunicação de promoções                       ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║  👤 CLIENTE NOVO (Bronze)                         ║
╠═══════════════════════════════════════════════════╣
║  Características:                                 ║
║  • Nenhuma compra realizada ainda                 ║
║  • Cadastro recente                               ║
║  • Potencial de se tornar Regular/VIP             ║
╚═══════════════════════════════════════════════════╝
```

*Este manual continua com todas as outras funcionalidades. Use o índice para navegar para a seção desejada.*

---

**📄 Para ver o manual completo das outras funcionalidades, consulte os documentos específicos:**

- 📦 [Manual de Pedidos](./MANUAL_PEDIDOS.md) - Guia completo de vendas
- 💰 [Manual de Caixa](./MANUAL_CAIXA.md) - Gestão financeira diária
- 📊 [Manual de Relatórios](./MANUAL_RELATORIOS.md) - Análises e estatísticas

---

**Precisa de ajuda?**  
📧 suporte@oticasqueiroz.com.br  
📱 WhatsApp: (77) 9999-9999

