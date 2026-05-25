import dotenv from 'dotenv';
import axios from 'axios';
import { getSicrediConfig } from '../../src/config/sicredi';

dotenv.config();

const authURL = 'https://api-parceiro.sicredi.com.br/sb/auth/openapi/token';

async function tryAuth(
  label: string,
  apiKey: string,
  username: string,
  password: string
): Promise<void> {
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
    scope: 'cobranca',
  });

  const res = await axios.post(authURL, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-api-key': apiKey,
      context: 'COBRANCA',
    },
    validateStatus: () => true,
  });

  const ok = res.status === 200;
  console.log(
    `${ok ? 'OK' : 'FAIL'} | ${label} | status=${res.status} | ${JSON.stringify(res.data)}`
  );
}

async function main() {
  const c = getSicrediConfig();
  const realUsername = `${c.beneficiaryCode}${c.cooperativeCode}`;
  const tokenAcesso = c.apiKey;
  const clientIdSandbox = '7b498006-5df1-41ba-bb2d-87f90f654229';

  console.log('--- Homologação (/sb) ---');
  await tryAuth('Manual sandbox + Token de Acesso', tokenAcesso, '123456789', 'teste123');
  await tryAuth('Credenciais reais + Token de Acesso', tokenAcesso, realUsername, c.accessCode);
  await tryAuth('Manual sandbox + Client ID como x-api-key', clientIdSandbox, '123456789', 'teste123');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
