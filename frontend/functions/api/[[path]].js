// Proxy de /api/* hacia el backend de Render.
//
// Reemplaza al intento anterior con `_redirects` (rewrite 200): Cloudflare
// Pages solo proxea GET a través de ese mecanismo, y esta API recibe POST/PUT
// (login, refresh, crear pedidos, subir fotos). Una Pages Function corre en
// el edge de Cloudflare y sí reenvía cualquier método, streaming de body
// incluido, preservando headers y cookies tal cual — el navegador nunca ve
// que el pedido termina en otro origen (Render), así el CORS y la cookie
// httpOnly de refresh (sameSite=strict) siguen funcionando sin tocarlos.
const BACKEND_ORIGIN = 'https://mbda-revendedores-backend.onrender.com'

export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  const target = BACKEND_ORIGIN + url.pathname + url.search

  const headers = new Headers(request.headers)
  headers.delete('host')

  const hasBody = !['GET', 'HEAD'].includes(request.method)

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    duplex: hasBody ? 'half' : undefined,
    redirect: 'manual',
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}
