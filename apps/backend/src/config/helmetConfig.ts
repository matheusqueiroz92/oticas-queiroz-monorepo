import type { HelmetOptions } from "helmet";

const PRODUCTION_ORIGIN = "https://app.oticasqueiroz.com.br";
const DEVELOPMENT_ORIGIN = "http://localhost:3000";

const isProduction = process.env.NODE_ENV === "production";
const appOrigin = isProduction ? PRODUCTION_ORIGIN : DEVELOPMENT_ORIGIN;

/**
 * CSP padrão para rotas da API (retornam JSON — sem renderização de HTML)
 * Política restritiva: bloqueia tudo que não for explicitamente necessário
 */
export const apiCspDirectives: HelmetOptions["contentSecurityPolicy"] = {
  directives: {
    defaultSrc: ["'none'"],
    scriptSrc: ["'none'"],
    styleSrc: ["'none'"],
    imgSrc: ["'none'"],
    connectSrc: ["'self'", appOrigin],
    fontSrc: ["'none'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'none'"],
    frameSrc: ["'none'"],
  },
};

/**
 * CSP para o Swagger UI — permite recursos necessários para a interface interativa.
 * Aplicado somente na rota /api-docs.
 */
export const swaggerCspDirectives: HelmetOptions["contentSecurityPolicy"] = {
  directives: {
    defaultSrc: ["'self'"],
    // Swagger UI precisa de eval() para compilar templates internamente
    scriptSrc: ["'self'", "'unsafe-eval'"],
    // Swagger UI usa estilos inline extensivamente
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", appOrigin],
    fontSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
  },
};

/**
 * Opções base do Helmet aplicadas em todas as rotas.
 * A CSP é configurada por rota — não aqui.
 */
export const baseHelmetOptions: HelmetOptions = {
  contentSecurityPolicy: apiCspDirectives,
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // Garante que o browser nunca faça downgrade de HTTPS → HTTP
  hsts: isProduction
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  // Impede que o site seja embutido em iframes externos
  frameguard: { action: "deny" },
  // Desativa o sniffing de MIME type (evita content-type confusion attacks)
  noSniff: true,
  // Remove o header X-Powered-By
  hidePoweredBy: true,
  // Permite que imagens de perfil sejam referenciadas cross-origin
  crossOriginResourcePolicy: { policy: "same-site" },
};
