// Business rules smoke test against a freshly seeded database: `npm run db:reset && npm run test:smoke`
const BASE = process.env.BASE_URL ?? 'http://localhost:3000/api'
let failures = 0

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
  return { status: res.status, data: await res.json().catch(() => null) }
}

function check(name, condition, detail = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${condition ? '' : `  ${detail}`}`)
  if (!condition) failures++
}

const dateFromNow = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
const newTask = {
  title: 'Planilha de controle de estoque',
  type: 'administrative',
  problem: 'Os alimentos doados vencem no estoque porque ninguém sabe o que entrou e quando vence.',
  requirements: 'Criar uma planilha de entrada e saída de alimentos com alerta de validade próxima.',
  deliverables: 'Planilha pronta + guia de uso.',
  skills: ['Excel'],
  estimatedHours: 4,
  dueDate: dateFromNow(10),
  revisionWindowDays: 3
}

// Organization block
let r = await call('POST', '/organizations/2/tasks', newTask)
check('blocked organization cannot create task', r.status === 409, JSON.stringify(r.data))
r = await call('POST', '/organizations/1/tasks', newTask)
check('organization without pendings creates task', r.status === 200, JSON.stringify(r.data))
const taskId = r.data?.id
r = await call('POST', '/organizations/1/tasks', { ...newTask, dueDate: dateFromNow(-1) })
check('due date in the past is rejected', r.status === 400)

// Deadline sync: Beatriz missed the due date of task 5
r = await call('GET', '/tasks')
const triage = r.data.find(t => t.id === 5)
check('task past due date becomes overdue', triage?.status === 'overdue', triage?.status)
r = await call('POST', '/tasks/5/assign', { volunteerId: 5 })
check('overdue task cannot be assigned', r.status === 409)
r = await call('POST', '/tasks/5/reopen', { dueDate: dateFromNow(7) })
check('overdue task is reopened with a new due date', r.status === 200 && r.data.status === 'open')

// Assignment rules
r = await call('POST', `/tasks/${taskId}/assign`, { volunteerId: 5 })
check('volunteer assigns an open task', r.status === 200, JSON.stringify(r.data))
const assignmentId = r.data?.id
r = await call('POST', `/tasks/${taskId}/assign`, { volunteerId: 2 })
check('second volunteer cannot take the same task', r.status === 409)
r = await call('POST', '/tasks/2/assign', { volunteerId: 5 })
check('volunteer cannot hold two active tasks', r.status === 409)
r = await call('POST', '/tasks/2/assign', { volunteerId: 4 })
check('volunteer whose revision window expired can take a new task', r.status === 200, JSON.stringify(r.data))

// Withdraw
r = await call('POST', `/assignments/${r.data?.id}/withdraw`)
check('volunteer withdraws and the task reopens', r.status === 200 && r.data.status === 'open', JSON.stringify(r.data))

// Extension
r = await call('POST', `/tasks/${taskId}/extend`, { dueDate: dateFromNow(12) })
check('due date extended once', r.status === 200 && r.data.extended === true)
r = await call('POST', `/tasks/${taskId}/extend`, { dueDate: dateFromNow(14) })
check('second extension is rejected', r.status === 400)

// Submission, revision and rejection
r = await call('POST', `/assignments/${assignmentId}/reject`, { reason: 'Entrega fora do escopo combinado.' })
check('cannot reject before submission', r.status === 400)
r = await call('PATCH', `/assignments/${assignmentId}/submission`, { submissionUrl: 'https://drive.google.com/x' })
check('volunteer submits and the revision window starts', r.status === 200 && !!r.data.revisionDeadline)
r = await call('POST', `/assignments/${assignmentId}/reject`, { reason: 'Entrega fora do escopo combinado.' })
check('cannot reject without a revision request first', r.status === 400)
r = await call('POST', `/assignments/${assignmentId}/revision`, { comment: 'Falta o alerta de validade.' })
check('organization requests a revision', r.status === 200 && r.data.revisionCount === 1)
r = await call('POST', `/assignments/${assignmentId}/certificate/prepare`, { competencies: ['Excel'] })
check('no certificate while the revision window is open', r.status === 400)
r = await call('PATCH', `/assignments/${assignmentId}/submission`, { submissionUrl: 'https://drive.google.com/y' })
check('volunteer resubmits within the window', r.status === 200 && r.data.status === 'submitted')
r = await call('POST', `/assignments/${assignmentId}/reject`, { reason: 'Entrega fora do escopo combinado.' })
check('organization rejects after a revision request', r.status === 200 && r.data.status === 'rejected')

// Certificates (preparation only; issuing needs a real signature from the organization wallet)
r = await call('PATCH', '/organizations/3/wallet', { walletAddress: 'not-a-wallet' })
check('invalid wallet address is rejected', r.status === 400)
r = await call('POST', '/assignments/3/certificate/prepare', { competencies: ['Canva'] })
check('expired revision without resubmission yields a partial certificate', r.data?.payload?.kind === 'partial', JSON.stringify(r.data))
r = await call('POST', '/assignments/2/certificate/prepare', { competencies: ['Excel'] })
check('submitted work yields a full certificate', r.data?.payload?.kind === 'full', JSON.stringify(r.data))
r = await call('POST', '/assignments/2/certificate', { competencies: ['Excel'], txSignature: '1'.repeat(88) })
check('fake transaction signature is rejected', r.status === 400)

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
