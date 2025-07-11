const { isValidCPF } = require('./src/utils/validators.ts');

const cpfs = {
  admin: '52998224725',
  employee: '87748248800', 
  customer: '71428793860',
  newUser: '61184562847'
};

console.log('Testando CPFs:');
Object.entries(cpfs).forEach(([name, cpf]) => {
  console.log(`${name}: ${cpf} - ${isValidCPF(cpf) ? 'VÁLIDO' : 'INVÁLIDO'}`);
}); 