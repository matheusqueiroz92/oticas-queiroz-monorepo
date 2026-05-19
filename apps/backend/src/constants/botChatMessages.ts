function resolveExamPriceBrl(): string {
  const raw = process.env.BOT_EXAM_PRICE_BRL;
  if (!raw) return "150";
  const parsed = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) return "150";
  return parsed.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export const BOT_EXAM_PRICE_BRL = resolveExamPriceBrl();

export function resolveSessionTtlMinutes(): number {
  const raw = process.env.BOT_SESSION_TTL_MINUTES;
  if (!raw) return 30;
  const minutes = Number.parseInt(raw, 10);
  if (!Number.isFinite(minutes) || minutes <= 0) return 30;
  return minutes;
}

export function buildSessionExpiredMenuText(): string {
  const minutes = resolveSessionTtlMinutes();
  const inactivityLabel =
    minutes === 1 ? "1 minuto" : `${minutes} minutos`;

  return `Sua sessão anterior foi encerrada por *inatividade* (sem mensagens por ${inactivityLabel}).

Vamos recomeçar:

${BOT_MAIN_MENU_TEXT}`;
}

export const BOT_MAIN_MENU_TEXT = `Olá! Bem-vindo(a) à *Óticas Queiroz*. 👓

Escolha uma opção digitando o número:

*1* — Consultar status do pedido (O.S.)
*2* — Consultar débitos por CPF
*3* — Agendar exame de vista
*4* — Solicitar orçamento

Digite o número da opção desejada.`;

export const BOT_BACK_TO_MENU_HINT =
  "\n\n_Digite *0* para voltar ao menu principal._";

export const BOT_AFTER_FLOW_MENU_HINT =
  "\n\nDigite *0* para voltar ao menu principal.";

/** Uma linha, para mensagens montadas por array (resultados de consulta). */
export const BOT_BACK_TO_MENU_LINE =
  "Digite *0* para voltar ao menu principal.";

export const BOT_INVALID_OPTION_TEXT = `Opção inválida. Por favor, escolha uma das opções abaixo:

${BOT_MAIN_MENU_TEXT}`;

export const BOT_ASK_OS_TEXT =
  "Por favor, informe o número da *Ordem de Serviço (O.S.)* do seu pedido." +
  BOT_BACK_TO_MENU_HINT;

export const BOT_ASK_CPF_TEXT =
  "Por favor, informe o *CPF* do titular (com ou sem pontuação)." +
  BOT_BACK_TO_MENU_HINT;

export const BOT_ASK_AGENDAMENTO_TEXT = `*Agendamento de exame de vista*

O valor da consulta é *R$ ${BOT_EXAM_PRICE_BRL}*.

Para agendar, envie em *uma única mensagem* os dados da pessoa que fará o exame:

• Nome completo
• Telefone para contato
• Endereço (rua, número, bairro e cidade)
• Melhor dia/horário para contato (opcional)

*Exemplo:*
Maria Silva
(77) 98888-7777
Rua das Flores, 120, Centro, Vitória da Conquista
Manhãs de segunda a sexta${BOT_BACK_TO_MENU_HINT}`;

export const BOT_AGENDAMENTO_CONFIRMED_TEXT = `Solicitação de agendamento recebida! ✅

Nossa equipe entrará em contato em breve para confirmar data e horário.

*Valor da consulta:* R$ ${BOT_EXAM_PRICE_BRL}${BOT_AFTER_FLOW_MENU_HINT}`;

export const BOT_ASK_ORCAMENTO_TEXT = `*Solicitação de orçamento*

Envie em *uma única mensagem*:

• Uma *foto da receita oftalmológica* (descreva os graus se não tiver imagem), ou
• As *informações do óculos* desejado (tipo de lente, grau, armação, etc.)

Nossa equipe analisará e retornará o orçamento o mais breve possível.${BOT_BACK_TO_MENU_HINT}`;

export const BOT_ORCAMENTO_CONFIRMED_TEXT = `Solicitação de orçamento recebida! ✅

Nossa equipe analisará as informações enviadas e entrará em contato em breve.${BOT_AFTER_FLOW_MENU_HINT}`;

export const BOT_AGENDAMENTO_DATA_TOO_SHORT =
  "Os dados informados parecem incompletos. Envie nome completo, telefone e endereço em uma única mensagem.";

export const BOT_ORCAMENTO_DATA_TOO_SHORT =
  "Por favor, descreva a receita ou as informações do óculos para que possamos elaborar o orçamento.";
