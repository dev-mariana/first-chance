import type { H3Event } from 'h3'

export function routeId(event: H3Event, name = 'id') {
  const id = Number(getRouterParam(event, name))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: 'ID inválido' })
  return id
}

export function notFound(what: string): never {
  throw createError({ statusCode: 404, message: `${what} não encontrado(a)` })
}

export function badRequest(message: string): never {
  throw createError({ statusCode: 400, message })
}

export function conflict(message: string): never {
  throw createError({ statusCode: 409, message })
}

// Postgres unique violation becomes a friendly 409
export function rethrowDuplicate(err: unknown, message: string): never {
  const e = err as { code?: string, cause?: { code?: string } }
  if (e.code === '23505' || e.cause?.code === '23505') conflict(message)
  throw err
}
