import { z } from 'zod'
import { todayISO } from './constants'

const taskTypes = [
  'programming', 'data', 'design', 'communication', 'administrative',
  'financial', 'legal', 'fundraising', 'other'
] as const

const optional = <T extends z.ZodType>(s: T) =>
  z.preprocess(v => (v === '' || v === null ? undefined : v), s.optional())

const futureDate = z.string({ error: 'Informe a data' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data')
  .refine(d => d >= todayISO(), 'A data não pode estar no passado')

export const organizationSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome da organização'),
  cnpj: z.string().trim().regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, 'CNPJ inválido'),
  cause: z.string().trim().min(3, 'Qual é a causa da OSC?'),
  description: z.string().trim().min(20, 'Descreva a OSC em pelo menos 20 caracteres'),
  email: z.email('E-mail inválido'),
  phone: z.string().trim().min(8, 'Informe um telefone/WhatsApp'),
  website: optional(z.url('URL inválida'))
})

export const taskSchema = z.object({
  title: z.string().trim().min(5, 'Dê um título para a demanda'),
  type: z.enum(taskTypes, 'Escolha o tipo da demanda'),
  problem: z.string().trim().min(30, 'Explique o problema em pelo menos 30 caracteres'),
  requirements: z.string().trim().min(30, 'Detalhe o que precisa ser feito (mín. 30 caracteres)'),
  deliverables: z.string().trim().min(10, 'O que conta como "pronto"?'),
  skills: z.array(z.string()).min(1, 'Escolha pelo menos uma skill'),
  estimatedHours: z.coerce.number().int().min(1, 'Mínimo 1 hora').max(200, 'Máximo 200 horas'),
  dueDate: futureDate,
  revisionWindowDays: z.coerce.number().int().min(1, 'Mínimo 1 dia').max(30, 'Máximo 30 dias')
})

export const volunteerSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome'),
  email: z.email('E-mail inválido'),
  phone: z.string().trim().min(8, 'Informe um telefone/WhatsApp'),
  linkedinUrl: z.url('URL inválida').refine(u => u.includes('linkedin.com'), 'Precisa ser um link do LinkedIn'),
  githubUrl: optional(z.url('URL inválida').refine(u => u.includes('github.com'), 'Precisa ser um link do GitHub')),
  skills: z.array(z.string()).min(1, 'Escolha pelo menos uma skill'),
  bio: optional(z.string().trim().max(500, 'Máximo 500 caracteres'))
})

export const assignSchema = z.object({
  volunteerId: z.coerce.number().int().positive()
})

export const submissionSchema = z.object({
  submissionUrl: z.url('Cole o link da entrega (repositório, Drive, Figma...)')
})

export const revisionSchema = z.object({
  comment: z.string().trim().min(10, 'Explique o que precisa ser ajustado (mín. 10 caracteres)')
})

export const rejectionSchema = z.object({
  reason: z.string().trim().min(10, 'Explique o motivo da reprovação (mín. 10 caracteres)')
})

export const newDueDateSchema = z.object({
  dueDate: futureDate
})

export const competenciesSchema = z.object({
  competencies: z.array(z.string()).min(1, 'Marque pelo menos uma competência aplicada')
})

export const issueCertificateSchema = competenciesSchema.extend({
  txSignature: z.string().min(40)
})

export const walletSchema = z.object({
  walletAddress: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Endereço Solana inválido')
})

export type OrganizationInput = z.infer<typeof organizationSchema>
export type TaskInput = z.infer<typeof taskSchema>
export type VolunteerInput = z.infer<typeof volunteerSchema>
