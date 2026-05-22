/**
 * Formata uma data no fuso local (YYYY-MM-DD) para parâmetros de API.
 * Evita deslocamento de dia ao usar toISOString() (UTC).
 */
export function formatLocalDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Retorna uma nova instância de Date referente ao dia anterior (fuso local). */
export function getYesterdayDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
}
