const { isValidCPF } = require('./src/utils/validators');

console.log('CPF 12345678909 é válido:', isValidCPF('12345678909'));
console.log('CPF 98765432100 é válido:', isValidCPF('98765432100'));
console.log('CPF 11122233344 é válido:', isValidCPF('11122233344'));
console.log('CPF 12345678901 é válido:', isValidCPF('12345678901'));
console.log('CPF 98765432109 é válido:', isValidCPF('98765432109')); 