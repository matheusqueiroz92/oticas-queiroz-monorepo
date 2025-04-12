// Função para validar CPF - adicionar em utils/validators.ts
export function isValidCPF(cpfInput: string): boolean {
  // Remover caracteres não numéricos
  const cpf = cpfInput.replace(/[^\d]/g, "");

  // Verificar se tem 11 dígitos
  if (cpf.length !== 11) return false;

  // Verificar se todos os dígitos são iguais (caso inválido)
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cpf.charAt(i)) * (10 - i);
  }

  const remainder1 = sum % 11;
  const checkDigit1 = remainder1 < 2 ? 0 : 11 - remainder1;

  if (Number.parseInt(cpf.charAt(9)) !== checkDigit1) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cpf.charAt(i)) * (11 - i);
  }

  const remainder2 = sum % 11;
  const checkDigit2 = remainder2 < 2 ? 0 : 11 - remainder2;

  return Number.parseInt(cpf.charAt(10)) === checkDigit2;
}

// Função para gerar um CPF válido
export function generateValidCPF() {
  // Gera 9 números aleatórios
  const n = Array(9)
    .fill(0)
    .map(() => Math.floor(Math.random() * 10));

  // Calcula o primeiro dígito verificador
  let d1 = n.reduce((acc, cur, i) => acc + cur * (10 - i), 0) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;

  // Calcula o segundo dígito verificador
  let d2 = [...n, d1].reduce((acc, cur, i) => acc + cur * (11 - i), 0) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;

  // Retorna o CPF formatado
  return [...n, d1, d2].join("");
}

// Função para verificar idade mínima (exemplo: 18 anos)
export function isOldEnough(birthDate: Date, minAge = 18): boolean {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Se ainda não fez aniversário este ano
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    return age - 1 >= minAge;
  }

  return age >= minAge;
}

export function isValidCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]+/g, '');

  if (cnpj.length !== 14) return false;

  // Elimina CNPJs invalidos conhecidos
  if (
    cnpj === '00000000000000' ||
    cnpj === '11111111111111' ||
    cnpj === '22222222222222' ||
    cnpj === '33333333333333' ||
    cnpj === '44444444444444' ||
    cnpj === '55555555555555' ||
    cnpj === '66666666666666' ||
    cnpj === '77777777777777' ||
    cnpj === '88888888888888' ||
    cnpj === '99999999999999'
  )
    return false;

  // Valida DVs
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}
