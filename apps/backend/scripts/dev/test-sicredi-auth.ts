import dotenv from 'dotenv';
import axios from 'axios';
import { getSicrediConfig } from '../../src/config/sicredi';

dotenv.config();

async function main() {
  const c = getSicrediConfig();
  const username = `${c.beneficiaryCode}${c.cooperativeCode}`;
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password: c.accessCode,
    scope: 'cobranca',
  });

  const res = await axios.post(c.authURL, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-api-key': c.apiKey,
      context: 'COBRANCA',
    },
    validateStatus: () => true,
  });

  console.log('authURL:', c.authURL);
  console.log('environment:', c.environment);
  console.log('username:', username);
  console.log('accessCode length:', c.accessCode.length);
  console.log('status:', res.status);
  console.log('response:', JSON.stringify(res.data, null, 2));

  if (c.environment === 'homologation' && res.status !== 200) {
    const sandboxBody = new URLSearchParams({
      grant_type: 'password',
      username: '123456789',
      password: 'teste123',
      scope: 'cobranca',
    });
    const sandboxRes = await axios.post(c.authURL, sandboxBody.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-api-key': c.apiKey,
        context: 'COBRANCA',
      },
      validateStatus: () => true,
    });
    console.log('--- referência manual sandbox (123456789 / teste123) ---');
    console.log('status:', sandboxRes.status);
    if (sandboxRes.status === 200) {
      console.log('API Key e ambiente OK; ajuste SICREDI_ACCESS_CODE=teste123 em homologation.');
    }
  }
}

main().catch((err) => {
  console.error('fatal:', err.message);
  process.exit(1);
});
