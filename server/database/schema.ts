import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const taskType = pgEnum('task_type', [
  'programming',
  'data',
  'design',
  'communication',
  'administrative',
  'financial',
  'legal',
  'fundraising',
  'other'
])

export const taskStatus = pgEnum('task_status', ['open', 'in_progress', 'overdue', 'completed'])

export const assignmentStatus = pgEnum('assignment_status', [
  'in_progress',
  'submitted',
  'revision_requested',
  'certified_full',
  'certified_partial',
  'rejected',
  'withdrawn',
  'expired'
])

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  cnpj: text('cnpj').notNull().unique(),
  cause: text('cause').notNull(),
  description: text('description').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  website: text('website'),
  walletAddress: text('wallet_address'),
  // MVP: every organization is verified on signup; production would check the CNPJ
  verified: boolean('verified').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export const volunteers = pgTable('volunteers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  linkedinUrl: text('linkedin_url').notNull(),
  githubUrl: text('github_url'),
  skills: text('skills').array().notNull().default([]),
  bio: text('bio'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: taskType('type').notNull(),
  problem: text('problem').notNull(),
  requirements: text('requirements').notNull(),
  deliverables: text('deliverables').notNull(),
  skills: text('skills').array().notNull().default([]),
  estimatedHours: integer('estimated_hours').notNull(),
  dueDate: date('due_date').notNull(),
  // due date can be extended only once
  extended: boolean('extended').notNull().default(false),
  // days after the first submission for the organization to request revisions and certify
  revisionWindowDays: integer('revision_window_days').notNull().default(7),
  status: taskStatus('status').notNull().default('open'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  volunteerId: integer('volunteer_id').notNull().references(() => volunteers.id, { onDelete: 'cascade' }),
  status: assignmentStatus('status').notNull().default('in_progress'),
  submissionUrl: text('submission_url'),
  submittedAt: timestamp('submitted_at'),
  revisionDeadline: timestamp('revision_deadline'),
  revisionCount: integer('revision_count').notNull().default(0),
  revisionComment: text('revision_comment'),
  rejectionReason: text('rejection_reason'),
  certificateCompetencies: text('certificate_competencies').array(),
  certificateHash: text('certificate_hash'),
  txSignature: text('tx_signature'),
  certifiedAt: timestamp('certified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, t => [
  // Business rule: a task has at most one volunteer working on it
  uniqueIndex('assignments_one_active_per_task')
    .on(t.taskId)
    .where(sql`${t.status} in ('in_progress', 'submitted', 'revision_requested')`)
])
