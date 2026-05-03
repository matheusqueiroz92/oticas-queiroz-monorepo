/**
 * Custom Jest resolver for the web app.
 *
 * Solves two problems:
 *
 * 1. authService alias: tests call jest.mock('@/app/services/authService', factory)
 *    but components import from '@/app/_services/authService'. By redirecting the
 *    resolver for the "services" path to the "_services" physical file, both the
 *    mock registration and the component import resolve to the same file — so the
 *    mock actually intercepts the component's calls.
 *
 * 2. Next.js route groups: the actual page files live under app/(public)/auth/…
 *    but tests import them without the route-group prefix (app/auth/…). When the
 *    default resolver fails, we retry with the (public) group inserted.
 */
module.exports = (request, options) => {
  // Normalise to forward slashes so the checks work on both Windows and Linux.
  const normalized = request.replace(/\\/g, '/');

  // --- 1. Redirect services/authService → _services/authService ---
  if (normalized.includes('/app/services/authService')) {
    return options.defaultResolver(
      normalized.replace('/app/services/authService', '/app/_services/authService'),
      options
    );
  }

  // --- 2. Default resolution with route-group fallback ---
  try {
    return options.defaultResolver(normalized, options);
  } catch (originalError) {
    // If the path looks like an auth page without a route group, retry with (public).
    if (normalized.includes('/app/auth/') || normalized.endsWith('/app/auth')) {
      try {
        return options.defaultResolver(
          normalized.replace('/app/auth/', '/app/(public)/auth/'),
          options
        );
      } catch (_) {
        // Ignore the fallback error; throw the original below.
      }
    }
    throw originalError;
  }
};
