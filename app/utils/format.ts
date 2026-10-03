export const formatDate = (value: string | Date | null | undefined) =>
  value ? new Date(typeof value === 'string' && value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('pt-BR') : '—'
