export interface SicrediInstallmentScheduleItem {
  dueDate: Date;
  amount: number;
}

export interface SicrediInstallmentsPlan {
  total: number;
  schedule: SicrediInstallmentScheduleItem[];
}

/**
 * Divide o saldo em N parcelas; a última absorve centavos de arredondamento.
 */
export function buildEqualInstallmentSchedule(
  remainingAmount: number,
  installmentCount: number,
  firstDueDate: Date
): SicrediInstallmentsPlan {
  if (installmentCount < 1) {
    throw new Error("Número de parcelas deve ser pelo menos 1");
  }
  if (remainingAmount <= 0) {
    throw new Error("Saldo para parcelamento deve ser maior que zero");
  }

  const baseAmount = Math.floor((remainingAmount / installmentCount) * 100) / 100;
  const schedule: SicrediInstallmentScheduleItem[] = [];
  let allocated = 0;

  for (let i = 0; i < installmentCount; i++) {
    const dueDate = new Date(firstDueDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    let amount = baseAmount;
    if (i === installmentCount - 1) {
      amount = Math.round((remainingAmount - allocated) * 100) / 100;
    }
    allocated = Math.round((allocated + amount) * 100) / 100;
    schedule.push({ dueDate, amount });
  }

  return { total: installmentCount, schedule };
}

export function validateInstallmentSchedule(
  remainingAmount: number,
  plan: SicrediInstallmentsPlan
): void {
  if (plan.schedule.length !== plan.total) {
    throw new Error("Quantidade de parcelas não confere com o cronograma");
  }

  const sum = plan.schedule.reduce((acc, item) => acc + item.amount, 0);
  const roundedSum = Math.round(sum * 100) / 100;
  const roundedRemaining = Math.round(remainingAmount * 100) / 100;

  if (roundedSum !== roundedRemaining) {
    throw new Error(
      `Soma das parcelas (R$ ${roundedSum}) deve ser igual ao saldo (R$ ${roundedRemaining})`
    );
  }

  for (const item of plan.schedule) {
    if (item.amount <= 0) {
      throw new Error("Valor de cada parcela deve ser maior que zero");
    }
  }
}

export function resolveSeuNumeroForParcel(
  serviceOrder: string | undefined,
  paymentId: string,
  installmentNumber: number
): string {
  const base = (serviceOrder || paymentId).replace(/\D/g, "");
  const normalized = base.length > 0 ? base : paymentId.replace(/\D/g, "");
  const suffix = String(installmentNumber).padStart(2, "0");
  const combined = `${normalized}${suffix}`;
  return combined.substring(Math.max(0, combined.length - 10));
}
