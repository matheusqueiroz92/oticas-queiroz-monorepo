# Integração SICREDI - API de Cobrança

## 📋 Visão Geral

Esta integração permite gerar boletos bancários através da API de cobrança da SICREDI, oferecendo uma solução completa para emissão, consulta e cancelamento de boletos.

## 🚀 Funcionalidades

- ✅ **Geração de Boletos**: Criação automática de boletos via API SICREDI
- ✅ **Consulta de Status**: Verificação do status de pagamento dos boletos
- ✅ **Cancelamento**: Cancelamento de boletos com motivos específicos
- ✅ **Autenticação OAuth**: Autenticação segura usando OAuth 2.0
- ✅ **Ambiente de Testes**: Suporte para homologação e produção
- ✅ **Sincronização Automática**: Atualização automática de status e débitos
- ✅ **Gestão de Débitos**: Atualização automática de débitos dos clientes

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`. Você pode usar o arquivo `env.example` como referência:

```bash
# SICREDI - API de Cobrança
SICREDI_ENVIRONMENT=homologation  # ou production
SICREDI_CLIENT_ID=seu_client_id_sicredi
SICREDI_CLIENT_SECRET=seu_client_secret_sicredi
SICREDI_COOPERATIVE_CODE=seu_codigo_cooperativa
SICREDI_POST_CODE=seu_codigo_posto
SICREDI_ACCESS_CODE=seu_codigo_acesso_internet_banking
SICREDI_ACCESS_TOKEN=seu_token_acesso_sicredi

# Sincronização Automática
SICREDI_AUTO_SYNC=true
SICREDI_SYNC_INTERVAL=30
```

#### 📁 **Arquivo de Exemplo**

Um arquivo `env.example` foi criado no diretório `apps/backend/` com todas as variáveis necessárias. Para configurar:

1. **Copie o arquivo**: `cp env.example .env`
2. **Edite o arquivo**: Substitua os valores de exemplo pelos seus dados reais
3. **Configure as variáveis da SICREDI** com as credenciais fornecidas

### 2. Credenciais da API

- **Client ID**: Fornecido pela SICREDI
- **Client Secret**: Fornecido pela SICREDI
- **Código da Cooperativa**: Seu código de cooperativa
- **Código do Posto**: Seu código de posto (OBRIGATÓRIO)
- **Código de Acesso**: Gerado no Internet Banking da SICREDI
- **Token de Acesso**: Token fornecido pela SICREDI para autenticação nas requisições

### 3. Sobre o Código do Posto

O **código do posto** é uma informação **OBRIGATÓRIA** segundo a documentação oficial da SICREDI. Este código:

- **Identifica o posto de atendimento** dentro da cooperativa SICREDI
- **É fornecido pelo gerente da sua conta** no SICREDI
- **Geralmente é composto por dois dígitos numéricos**
- **É necessário para a integração funcionar corretamente**

**⚠️ IMPORTANTE**: Sem o código do posto correto, a integração com a SICREDI não funcionará. Você deve entrar em contato com seu gerente de conta no SICREDI para obter essa informação.

### 4. Como Gerar o Código de Acesso

O **código de acesso** é gerado no Internet Banking da SICREDI e é necessário para a autenticação:

1. **Acesse o Internet Banking** da SICREDI
2. **Navegue para o menu "Cobrança"**
3. **Selecione "Código de Acesso"**
4. **Clique em "Gerar"** para criar um novo código
5. **Siga as instruções** para concluir a geração
6. **Configure a variável** `SICREDI_ACCESS_CODE` com o código gerado

**⚠️ IMPORTANTE**: 
- O código de acesso tem **validade limitada** (geralmente 24 horas)
- Você precisará **regenerar periodicamente** o código
- Mantenha o código **atualizado** para evitar falhas na integração

### 5. Sobre o Token de Acesso

O **token de acesso** é fornecido pela SICREDI e é necessário para autenticar todas as requisições à API:

- **É fornecido pela SICREDI** junto com as outras credenciais
- **Deve ser configurado** na variável `SICREDI_ACCESS_TOKEN`
- **É usado automaticamente** em todas as requisições da API
- **É obrigatório** para o funcionamento da integração

**⚠️ IMPORTANTE**: Sem o token de acesso correto, todas as requisições à API da SICREDI falharão com erro de autenticação.

## 📡 Endpoints da API

### Sincronização Automática

#### Iniciar Sincronização
```http
POST /api/sicredi-sync/start
Content-Type: application/json

{
  "intervalMinutes": 30
}
```

#### Parar Sincronização
```http
POST /api/sicredi-sync/stop
```

#### Status da Sincronização
```http
GET /api/sicredi-sync/status
```

#### Executar Sincronização Manual
```http
POST /api/sicredi-sync/perform
```

#### Sincronizar Cliente Específico
```http
POST /api/sicredi-sync/client/{clientId}
```

### Teste de Conexão
```http
GET /api/sicredi/test-connection
```

### Gerar Boleto
```http
POST /api/sicredi/generate-boleto
Content-Type: application/json

{
  "paymentId": "507f1f77bcf86cd799439011",
  "customerData": {
    "cpfCnpj": "12345678901",
    "nome": "João Silva",
    "endereco": {
      "logradouro": "Rua das Flores",
      "numero": "123",
      "complemento": "Apto 45",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "uf": "SP",
      "cep": "01234-567"
    }
  }
}
```

### Consultar Status
```http
GET /api/sicredi/check-status/{paymentId}
```

### Cancelar Boleto
```http
POST /api/sicredi/cancel-boleto
Content-Type: application/json

{
  "paymentId": "507f1f77bcf86cd799439011",
  "motivo": "APEDIDODOCLIENTE"
}
```

## 🔧 Uso no Frontend

### 1. Seleção do Método de Pagamento

Ao criar um pagamento, selecione "Boleto SICREDI" como método de pagamento:

```typescript
const paymentData = {
  amount: 150.50,
  type: "sale",
  paymentMethod: "sicredi_boleto",
  // ... outros campos
};
```

### 2. Geração do Boleto

Após criar o pagamento, gere o boleto:

```typescript
const response = await fetch('/api/sicredi/generate-boleto', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    paymentId: paymentId,
    customerData: {
      cpfCnpj: "12345678901",
      nome: "João Silva",
      endereco: {
        logradouro: "Rua das Flores",
        numero: "123",
        bairro: "Centro",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01234-567"
      }
    }
  })
});

const result = await response.json();
if (result.success) {
  // Boleto gerado com sucesso
  console.log('Nosso Número:', result.data.nossoNumero);
  console.log('Linha Digitável:', result.data.linhaDigitavel);
  console.log('PDF URL:', result.data.pdfUrl);
}
```

### 3. Consulta de Status

```typescript
const response = await fetch(`/api/sicredi/check-status/${paymentId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
if (result.success) {
  console.log('Status:', result.data.status);
  console.log('Valor Pago:', result.data.valorPago);
}
```

## 📊 Status dos Boletos

| Status | Descrição |
|--------|-----------|
| `REGISTRADO` | Boleto registrado na SICREDI |
| `PAGO` | Boleto pago |
| `VENCIDO` | Boleto vencido |
| `CANCELADO` | Boleto cancelado |
| `BAIXADO` | Boleto baixado |
| `PROTESTADO` | Boleto protestado |

## 🚨 Motivos de Cancelamento

| Motivo | Descrição |
|--------|-----------|
| `ACERTOS` | Acertos |
| `APEDIDODOCLIENTE` | A pedido do cliente |
| `PAGODIRETOAOCLIENTE` | Pagamento direto ao cliente |
| `SUBSTITUICAO` | Substituição |
| `FALTADESOLUCAO` | Falta de solução |
| `APEDIDODOBENEFICIARIO` | A pedido do beneficiário |

## 🔄 Sincronização Automática

### Como Funciona

A sincronização automática verifica periodicamente o status dos boletos SICREDI e atualiza automaticamente:

1. **Status dos Pagamentos**: Consulta o status de todos os boletos pendentes
2. **Débitos dos Clientes**: Quando um boleto é pago, desconta automaticamente do débito do cliente
3. **Histórico de Pagamentos**: Mantém o histórico atualizado

### Configuração

```bash
# Habilitar sincronização automática
SICREDI_AUTO_SYNC=true

# Intervalo em minutos (padrão: 30)
SICREDI_SYNC_INTERVAL=30
```

### Fluxo de Sincronização

1. **Inicialização**: O servidor inicia a sincronização automaticamente
2. **Verificação Periódica**: A cada intervalo configurado, verifica todos os boletos pendentes
3. **Atualização de Status**: Consulta a API da SICREDI para cada boleto
4. **Atualização de Débitos**: Se um boleto foi pago, desconta do débito do cliente
5. **Logs**: Registra todas as operações para auditoria

### Exemplo de Uso

```typescript
// Verificar status da sincronização
const response = await fetch('/api/sicredi-sync/status', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const status = await response.json();
console.log('Sincronização ativa:', status.data.isRunning);
console.log('Total de pagamentos SICREDI:', status.data.stats.totalSicrediPayments);

// Executar sincronização manual
const syncResponse = await fetch('/api/sicredi-sync/perform', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

const result = await syncResponse.json();
console.log('Pagamentos processados:', result.data.totalProcessed);
console.log('Débitos atualizados:', result.data.updatedDebts);
```

## 🔍 Monitoramento

### Logs
A integração gera logs detalhados para monitoramento:

```bash
✅ SICREDI: Configurado para ambiente homologation
📋 SICREDI: Cooperativa 1234, Posto 01
✅ SICREDI: Autenticação realizada com sucesso
✅ SICREDI: Boleto gerado com sucesso
```

### Teste de Conexão
Use o endpoint de teste para verificar se a integração está funcionando:

```bash
curl -X GET "http://localhost:3333/api/sicredi/test-connection" \
  -H "Authorization: Bearer seu_token"
```

## 🛠️ Desenvolvimento

### Estrutura de Arquivos

```
src/
├── config/
│   └── sicredi.ts                    # Configuração da API
├── controllers/
│   ├── SicrediController.ts          # Controller da API
│   └── SicrediSyncController.ts      # Controller de sincronização
├── interfaces/
│   └── ISicredi.ts                   # Interfaces TypeScript
├── routes/
│   ├── sicrediRoutes.ts              # Rotas da API
│   └── sicrediSyncRoutes.ts          # Rotas de sincronização
├── services/
│   ├── SicrediService.ts             # Serviço de integração
│   ├── SicrediSyncService.ts         # Serviço de sincronização
│   └── PaymentService.ts             # Serviço de pagamentos (atualizado)
├── scripts/
│   └── startSicrediSync.ts           # Script de inicialização
└── schemas/
    └── PaymentSchema.ts              # Schema do MongoDB (atualizado)
```

### Testes

Para testar a integração:

1. **Configure as variáveis de ambiente**
2. **Inicie o servidor**
3. **Teste a conexão**: `GET /api/sicredi/test-connection`
4. **Crie um pagamento** com método `sicredi_boleto`
5. **Gere o boleto**: `POST /api/sicredi/generate-boleto`

## 🔒 Segurança

- **Autenticação**: OAuth 2.0 com Client ID e Client Secret
- **Autorização**: Apenas admin e employee podem usar
- **Validação**: Dados validados antes do envio
- **Logs**: Todas as operações são logadas

## 📞 Suporte

Para dúvidas sobre a integração:

1. **Documentação SICREDI**: Consulte o manual oficial
2. **Logs do Sistema**: Verifique os logs para erros
3. **Teste de Conexão**: Use o endpoint de teste
4. **Contato**: Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido para Óticas Queiroz** 🏥
