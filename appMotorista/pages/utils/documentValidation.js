export function isValidCpf(value) {
  const cpf = String(value ?? '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;

  for (let position = 9; position <= 10; position += 1) {
    let sum = 0;
    for (let index = 0; index < position; index += 1) {
      sum += Number(cpf[index]) * (position + 1 - index);
    }
    const remainder = (sum * 10) % 11;
    const digit = remainder === 10 ? 0 : remainder;
    if (Number(cpf[position]) !== digit) return false;
  }

  return true;
}

export function isValidCnh(value) {
  const cnh = String(value ?? '').replace(/\D/g, '');
  if (cnh.length !== 11 || /^([0-9])\1{10}$/.test(cnh)) return false;

  let firstSum = 0;
  let secondSum = 0;
  for (let index = 0; index < 9; index += 1) {
    const digit = Number(cnh[index]);
    firstSum += digit * (9 - index);
    secondSum += digit * (index + 1);
  }

  let firstDigit = firstSum % 11;
  let discount = 0;
  if (firstDigit >= 10) {
    firstDigit = 0;
    discount = 2;
  }

  let secondDigit = (secondSum % 11) - discount;
  if (secondDigit < 0) secondDigit += 11;
  if (secondDigit >= 10) secondDigit = 0;
  return Number(cnh[9]) === firstDigit && Number(cnh[10]) === secondDigit;
}
