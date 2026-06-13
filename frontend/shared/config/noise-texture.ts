/**
 * Inline grainy-noise texture used as a decorative overlay on the auth pages.
 *
 * Previously these pages pulled the texture from an external URL
 * (grainy-gradients.vercel.app/noise.svg), which the app's Content-Security-
 * Policy (`img-src 'self' blob: data: <api>`) blocks — producing a console
 * error on every login/register load and adding a third-party dependency.
 *
 * This `data:` SVG (an feTurbulence fractal-noise filter) renders the same
 * effect, is allowed by the CSP `data:` source, and needs no network request.
 */
export const NOISE_TEXTURE_BACKGROUND =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
