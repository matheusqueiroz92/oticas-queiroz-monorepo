/* eslint-disable */
/**
 * Standalone SICREDI auth tester (CommonJS).
 *
 * Pode rodar em qualquer ambiente com Node 18+ (built-in fetch), sem TypeScript,
 * sem ts-node e sem dependencias do monorepo. Use em producao para validar
 * SICREDI_API_KEY, SICREDI_ACCESS_CODE, BENEFICIARY/COOPERATIVE codes e o ambiente.
 *
 * Uso:
 *   cd /var/www/oticas-queiroz/apps/backend
 *   node scripts/dev/test-sicredi-auth.cjs
 *
 * Carrega o .env do diretorio atual (apps/backend/.env).
 */
const fs = require('fs');
const path = require('path');

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnv(path.resolve(process.cwd(), '.env'));

function getConfig() {
  const environment =
    process.env.SICREDI_ENVIRONMENT === 'production' ? 'production' : 'homologation';
  const isProd = environment === 'production';
  return {
    environment,
    authURL: isProd
      ? 'https://api-parceiro.sicredi.com.br/auth/openapi/token'
      : 'https://api-parceiro.sicredi.com.br/sb/auth/openapi/token',
    apiKey: process.env.SICREDI_API_KEY || process.env.SICREDI_ACCESS_TOKEN || '',
    accessCode: process.env.SICREDI_ACCESS_CODE || '',
    beneficiaryCode:
      process.env.SICREDI_BENEFICIARY_CODE || process.env.SICREDI_CLIENT_ID || '',
    cooperativeCode: process.env.SICREDI_COOPERATIVE_CODE || '',
    postCode: process.env.SICREDI_POST_CODE || '',
  };
}

async function tryAuth(label, c, username, password) {
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
    scope: 'cobranca',
  });
  const res = await fetch(c.authURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-api-key': c.apiKey,
      context: 'COBRANCA',
    },
    body: body.toString(),
  });
  let payload;
  try {
    payload = await res.json();
  } catch {
    payload = await res.text();
  }
  console.log(
    `${res.ok ? 'OK  ' : 'FAIL'} | ${label} | status=${res.status} | username=${username}`
  );
  if (!res.ok || process.env.SICREDI_VERBOSE === 'true') {
    console.log('  payload:', JSON.stringify(payload, null, 2));
  } else if (payload && payload.access_token) {
    console.log(
      `  access_token (...${String(payload.access_token).slice(-8)}) | expires_in=${payload.expires_in}s`
    );
  }
  return { ok: res.ok, status: res.status, payload };
}

async function main() {
  const c = getConfig();
  console.log('--- Config carregada ---');
  console.log('environment       :', c.environment);
  console.log('authURL           :', c.authURL);
  console.log('apiKey length     :', c.apiKey.length);
  console.log('accessCode length :', c.accessCode.length);
  console.log('beneficiary       :', c.beneficiaryCode);
  console.log('cooperative       :', c.cooperativeCode);
  console.log('post              :', c.postCode);

  const missing = [];
  if (!c.apiKey) missing.push('SICREDI_API_KEY');
  if (!c.accessCode) missing.push('SICREDI_ACCESS_CODE');
  if (!c.beneficiaryCode) missing.push('SICREDI_BENEFICIARY_CODE');
  if (!c.cooperativeCode) missing.push('SICREDI_COOPERATIVE_CODE');
  if (missing.length) {
    console.error('\nFaltam variaveis no .env:', missing.join(', '));
    process.exit(2);
  }

  console.log('\n--- Tentando autenticar com credenciais reais ---');
  const username = `${c.beneficiaryCode}${c.cooperativeCode}`;
  const realResult = await tryAuth('credenciais .env', c, username, c.accessCode);

  if (c.environment === 'homologation' && !realResult.ok) {
    console.log('\n--- Fallback: sandbox manual (123456789 / teste123) ---');
    const sandboxResult = await tryAuth(
      'sandbox manual',
      c,
      '123456789',
      'teste123'
    );
    if (sandboxResult.ok) {
      console.log(
        '\nDIAGNOSTICO: API Key e ambiente OK. Ajuste credenciais do .env (BENEFICIARY=12345 COOPERATIVE=6789 ACCESS_CODE=teste123).'
      );
    }
  }

  process.exit(realResult.ok ? 0 : 1);
}

main().catch((err) => {
  console.error('fatal:', err && err.message ? err.message : err);
  process.exit(1);
});
