// Friendly message from $fetch errors (createError / zod) or a plain Error
export function errorMessage(err: unknown) {
  const e = err as { data?: { statusMessage?: string, message?: string }, message?: string }
  return e.data?.message || e.data?.statusMessage || e.message || 'Algo deu errado'
}
