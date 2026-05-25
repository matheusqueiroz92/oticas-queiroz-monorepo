import dotenv from 'dotenv';
import axios from 'axios';
import { getSicrediConfig } from '../../src/config/sicredi';

dotenv.config();

async function main() {
  const c = getSicrediConfig();
  const authURL = 'https://api-parceiro.sicredi.com.br/auth/openapi/token';
  const username = `${c.beneficiaryCode}${c.cooperativeCode}`;
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password: c.accessCode,
    scope: 'cobranca',
  });

  const res = await axios.post(authURL, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-api-key': c.apiKey,
      context: 'COBRANCA',
    },
    validateStatus: () => true,
  });

  console.log('production auth | username length:', username.length);
  console.log('status:', res.status);
  console.log('response:', JSON.stringify(res.data, null, 2));
}

main().catch(console.error);
