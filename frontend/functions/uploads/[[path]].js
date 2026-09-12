// Mismo proxy que functions/api/[[path]].js, para /uploads/* — solo se
// ejercita si STORAGE_PROVIDER=local en el backend (en producción se usa
// Cloudinary y las fotos ya vienen con URL absoluta, así que esto es
// más que nada un respaldo).
const BACKEND_ORIGIN = 'https://mbda-revendedores-backend.onrender.com'

export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  const target = BACKEND_ORIGIN + url.pathname + url.search

  const headers = new Headers(request.headers)
  headers.delete('host')

  const response = await fetch(target, {
    method: request.method,
    headers,
    redirect: 'manual',
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}
