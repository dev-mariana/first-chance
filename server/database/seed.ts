import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

process.loadEnvFile()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

// Team Phantom wallet (devnet) used as the issuer wallet in the live demo
const DEMO_WALLET = 'BMFUMhwqfq9jnShBTKpxFQC1XfNYiNW6YHgb5PWNE9AA'

const DAY_MS = 24 * 60 * 60 * 1000
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY_MS)
const dateFromNow = (n: number) => daysFromNow(n).toISOString().slice(0, 10)

await db.execute('TRUNCATE assignments, tasks, volunteers, organizations RESTART IDENTITY CASCADE')

const [esperanca, criancaFeliz, mulheresTech] = await db.insert(schema.organizations).values([
  {
    name: 'Instituto Esperança',
    cnpj: '12.345.678/0001-90',
    cause: 'Infância e adolescência',
    description: 'Atende 200 crianças no contraturno escolar com reforço, esporte e alimentação na Zona Norte do Rio.',
    email: 'contato@institutoesperanca.org',
    phone: '(21) 99999-1111',
    website: 'https://institutoesperanca.org',
    walletAddress: DEMO_WALLET
  },
  {
    name: 'Casa Criança Feliz',
    cnpj: '23.456.789/0001-01',
    cause: 'Proteção à criança',
    description: 'Acolhimento e acompanhamento de famílias em situação de vulnerabilidade, em rede com outras organizações.',
    email: 'ola@criancafeliz.org',
    phone: '(21) 98888-2222',
    walletAddress: DEMO_WALLET
  },
  {
    name: 'Coletivo Mulheres na Tech',
    cnpj: '34.567.890/0001-12',
    cause: 'Empregabilidade feminina',
    description: 'Formação gratuita em tecnologia para mulheres em transição de carreira e retorno ao mercado.',
    email: 'coletivo@mulheresnatech.org',
    phone: '(21) 97777-3333'
  }
]).returning()

const [ana, beatriz, carla, daniela] = await db.insert(schema.volunteers).values([
  {
    name: 'Ana Souza',
    email: 'ana.souza@email.com',
    phone: '(21) 96666-4444',
    linkedinUrl: 'https://www.linkedin.com/in/ana-souza',
    skills: ['Excel', 'Power BI', 'SQL'],
    bio: 'Assistente administrativa em transição para análise de dados.'
  },
  {
    name: 'Beatriz Lima',
    email: 'bia.lima@email.com',
    phone: '(21) 95555-5555',
    linkedinUrl: 'https://www.linkedin.com/in/beatriz-lima',
    githubUrl: 'https://github.com/bialima',
    skills: ['JavaScript', 'Google Sheets', 'Vue'],
    bio: 'Estudante de Sistemas de Informação buscando o primeiro estágio.'
  },
  {
    name: 'Carla Mendes',
    email: 'carla.mendes@email.com',
    phone: '(21) 94444-6666',
    linkedinUrl: 'https://www.linkedin.com/in/carla-mendes',
    skills: ['Prestação de contas', 'Finanças', 'Excel'],
    bio: 'Contadora voltando ao mercado depois de 5 anos.'
  },
  {
    name: 'Daniela Rocha',
    email: 'dani.rocha@email.com',
    phone: '(21) 93333-7777',
    linkedinUrl: 'https://www.linkedin.com/in/daniela-rocha',
    skills: ['Redes sociais', 'Canva', 'Redação'],
    bio: 'Comunicadora aprendendo marketing digital.'
  },
  {
    name: 'Eduarda Alves',
    email: 'duda.alves@email.com',
    phone: '(21) 92222-8888',
    linkedinUrl: 'https://www.linkedin.com/in/eduarda-alves',
    githubUrl: 'https://github.com/dudaalves',
    skills: ['JavaScript', 'Node.js', 'Banco de dados'],
    bio: 'Bootcamp de desenvolvimento web concluído, buscando a primeira experiência.'
  }
]).returning()

const [dashboard, , prestacao, posts, triagem] = await db.insert(schema.tasks).values([
  {
    organizationId: esperanca!.id,
    title: 'Dashboard de acompanhamento de doações',
    type: 'data',
    problem: 'As doações chegam por PIX, depósito e eventos, e ficam espalhadas em planilhas diferentes. A diretoria não sabe quanto entrou por mês nem de onde, o que dificulta prestar contas aos doadores.',
    requirements: 'Unificar as planilhas existentes em uma base única e criar um dashboard com total por mês, por origem e comparativo com metas.',
    deliverables: 'Planilha unificada + dashboard publicado + guia de 1 página explicando como atualizar.',
    skills: ['Excel', 'Power BI'],
    estimatedHours: 6,
    dueDate: dateFromNow(14),
    revisionWindowDays: 7,
    status: 'in_progress'
  },
  {
    organizationId: esperanca!.id,
    title: 'Sistema simples de cadastro das crianças atendidas',
    type: 'programming',
    problem: 'O cadastro das crianças é feito em papel. Quando um responsável liga, a equipe demora para achar a ficha, e não há como saber a frequência de cada criança.',
    requirements: 'Um sistema web para cadastrar crianças e responsáveis, registrar presença diária e buscar por nome. Precisa funcionar no celular e ter login para a equipe.',
    deliverables: 'Sistema funcionando + código no GitHub + instruções de uso para a equipe.',
    skills: ['JavaScript', 'Node.js', 'Banco de dados'],
    estimatedHours: 20,
    dueDate: dateFromNow(30),
    revisionWindowDays: 7
  },
  {
    organizationId: criancaFeliz!.id,
    title: 'Organizar a prestação de contas do semestre',
    type: 'financial',
    problem: 'Precisamos enviar a prestação de contas para um edital, mas notas e recibos estão desorganizados. Sem isso, a OSC pode perder o repasse do próximo semestre.',
    requirements: 'Organizar notas e recibos por categoria, conferir com o extrato bancário e preencher o modelo de prestação de contas do edital.',
    deliverables: 'Modelo do edital preenchido + pasta organizada com comprovantes.',
    skills: ['Prestação de contas', 'Excel', 'Finanças'],
    estimatedHours: 10,
    dueDate: dateFromNow(5),
    revisionWindowDays: 7,
    status: 'in_progress'
  },
  {
    organizationId: criancaFeliz!.id,
    title: 'Calendário de posts para campanha de doação',
    type: 'communication',
    problem: 'A campanha de fim de ano é a principal fonte de doações, mas ninguém da equipe tem tempo para planejar e produzir os posts.',
    requirements: 'Planejar 1 mês de posts para Instagram (texto + arte) com foco na campanha de doação.',
    deliverables: 'Calendário com 12 posts + artes no Canva compartilhadas com a OSC.',
    skills: ['Redes sociais', 'Canva', 'Redação'],
    estimatedHours: 8,
    dueDate: dateFromNow(3),
    revisionWindowDays: 5,
    status: 'in_progress'
  },
  {
    organizationId: mulheresTech!.id,
    title: 'Formulário e triagem automática de inscrições',
    type: 'programming',
    problem: 'Recebemos centenas de inscrições por turma e a triagem é manual, levando semanas.',
    requirements: 'Criar um formulário de inscrição e uma planilha/automação que classifique as candidatas pelos critérios da turma.',
    deliverables: 'Formulário publicado + planilha com classificação automática + documentação.',
    skills: ['Google Sheets', 'JavaScript'],
    estimatedHours: 8,
    dueDate: dateFromNow(-2),
    revisionWindowDays: 7,
    status: 'in_progress'
  },
  {
    organizationId: mulheresTech!.id,
    title: 'Identidade visual da nova turma',
    type: 'design',
    problem: 'A divulgação das turmas usa artes improvisadas e sem padrão, o que passa pouca credibilidade para empresas parceiras.',
    requirements: 'Criar uma identidade visual simples (paleta, tipografia e templates) para posts e materiais de divulgação da nova turma.',
    deliverables: 'Guia visual de 1 página + 5 templates editáveis no Canva ou Figma.',
    skills: ['Figma', 'Canva', 'UX/UI'],
    estimatedHours: 10,
    dueDate: dateFromNow(15),
    revisionWindowDays: 7
  }
]).returning()

await db.insert(schema.assignments).values([
  // Live demo: Ana just submitted, Instituto Esperança can request a revision or certify
  {
    taskId: dashboard!.id,
    volunteerId: ana!.id,
    status: 'submitted',
    submissionUrl: 'https://drive.google.com/drive/folders/exemplo-dashboard',
    submittedAt: new Date(),
    revisionDeadline: daysFromNow(7)
  },
  // Block case 1: submission waiting for Casa Criança Feliz with an expired revision window
  {
    taskId: prestacao!.id,
    volunteerId: carla!.id,
    status: 'submitted',
    submissionUrl: 'https://drive.google.com/drive/folders/exemplo-prestacao',
    submittedAt: daysFromNow(-10),
    revisionDeadline: daysFromNow(-3)
  },
  // Block case 2: revision never resubmitted, Casa Criança Feliz owes a partial certificate
  {
    taskId: posts!.id,
    volunteerId: daniela!.id,
    status: 'revision_requested',
    submissionUrl: 'https://www.canva.com/design/exemplo-posts',
    submittedAt: daysFromNow(-9),
    revisionDeadline: daysFromNow(-4),
    revisionCount: 1,
    revisionComment: 'Faltam as artes das semanas 3 e 4 e os textos precisam citar o link de doação.'
  },
  // Overdue: Beatriz missed the due date, the task becomes overdue on the next request
  { taskId: triagem!.id, volunteerId: beatriz!.id, status: 'in_progress' }
])

console.log('Seed done: 3 organizations, 5 volunteers, 6 tasks, 4 assignments.')
await pool.end()
