export const TASK_TYPES = [
  { value: 'programming', label: 'Programação / Sistemas' },
  { value: 'data', label: 'Dados / BI' },
  { value: 'design', label: 'Design' },
  { value: 'communication', label: 'Comunicação / Redes sociais' },
  { value: 'administrative', label: 'Administrativo' },
  { value: 'financial', label: 'Financeiro / Prestação de contas' },
  { value: 'legal', label: 'Jurídico' },
  { value: 'fundraising', label: 'Captação de recursos' },
  { value: 'other', label: 'Outro' }
] as const

export type TaskType = (typeof TASK_TYPES)[number]['value']

export const SKILLS = [
  'JavaScript', 'TypeScript', 'Node.js', 'Vue', 'Python', 'SQL', 'Banco de dados',
  'Excel', 'Power BI', 'Google Sheets', 'Figma', 'UX/UI', 'Canva',
  'Redes sociais', 'Redação', 'Gestão de projetos', 'Prestação de contas',
  'Finanças', 'Jurídico', 'Captação de recursos', 'Atendimento', 'Planejamento'
]

export function taskTypeLabel(type: string) {
  return TASK_TYPES.find(t => t.value === type)?.label ?? type
}

export const TASK_STATUS = {
  open: { label: 'Aberta', color: 'success' },
  in_progress: { label: 'Em andamento', color: 'warning' },
  overdue: { label: 'Prazo vencido', color: 'error' },
  completed: { label: 'Concluída', color: 'neutral' }
} as const

export const ASSIGNMENT_STATUS = {
  in_progress: { label: 'Em andamento', color: 'warning' },
  submitted: { label: 'Entregue', color: 'info' },
  revision_requested: { label: 'Ajustes solicitados', color: 'warning' },
  certified_full: { label: 'Certificado completo', color: 'success' },
  certified_partial: { label: 'Certificado parcial', color: 'primary' },
  rejected: { label: 'Reprovada', color: 'error' },
  withdrawn: { label: 'Desistiu', color: 'neutral' },
  expired: { label: 'Expirada', color: 'neutral' }
} as const

export const MEMO_PREFIX = 'FirstChance|certificate|v1|'

export const explorerTxUrl = (signature: string) => `https://explorer.solana.com/tx/${signature}?cluster=devnet`
export const explorerAddressUrl = (address: string) => `https://explorer.solana.com/address/${address}?cluster=devnet`

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
