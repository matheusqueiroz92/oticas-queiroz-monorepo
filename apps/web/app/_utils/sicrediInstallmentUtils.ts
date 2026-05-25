export interface SicrediInstallmentScheduleItem {
  dueDate: string;
  amount: number;
}

export interface SicrediInstallmentsPlan {
  total: number;
  schedule: SicrediInstallmentScheduleItem[];
}

export function buildEqualInstallmentSchedule(
  remainingAmount: number,
  installmentCount: number,
  firstDueDate: string
): SicrediInstallmentsPlan {
  const baseAmount = Math.floor((remainingAmount / installmentCount) * 100) / 100;
  const schedule: SicrediInstallmentScheduleItem[] = [];
  let allocated = 0;

  for (let i = 0; i < installmentCount; i++) {
    const due = new Date(firstDueDate);
    due.setMonth(due.getMonth() + i);

    let amount = baseAmount;
    if (i === installmentCount - 1) {
      amount = Math.round((remainingAmount - allocated) * 100) / 100;
    }
    allocated = Math.round((allocated + amount) * 100) / 100;
    schedule.push({
      dueDate: due.toISOString().split("T")[0],
      amount,
    });
  }

  return { total: installmentCount, schedule };
}

export function validateScheduleSum(
  remainingAmount: number,
  schedule: SicrediInstallmentScheduleItem[]
): boolean {
  const sum = schedule.reduce((acc, item) => acc + item.amount, 0);
  return Math.round(sum * 100) / 100 === Math.round(remainingAmount * 100) / 100;
}
