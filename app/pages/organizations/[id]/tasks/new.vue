<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()
const organizationId = Number(route.params.id)

const { data: dashboard } = await useFetch(`/api/organizations/${organizationId}/dashboard`)
const blocked = computed(() => (dashboard.value?.pendings.length ?? 0) > 0)

const state = reactive<Partial<TaskInput>>({ skills: [], estimatedHours: 6, revisionWindowDays: 7 })
const skillOptions = ref([...SKILLS])
const typeOptions = TASK_TYPES.map(t => ({ label: t.label, value: t.value }))
const submitting = ref(false)

function addSkill(skill: string) {
  skillOptions.value.push(skill)
  state.skills = [...(state.skills ?? []), skill]
}

// Examples show the platform works for both technical and administrative needs
const examples: Record<'programming' | 'administrative', Partial<TaskInput>> = {
  programming: {
    title: 'Sistema de controle de doações',
    type: 'programming',
    problem: 'As doações são anotadas em cadernos e planilhas soltas. Não sabemos quanto entra por mês e já perdemos registros na hora de prestar contas.',
    requirements: 'Um sistema web simples para registrar doações (doador, valor, data, forma de pagamento), listar por período e exportar um relatório mensal.',
    deliverables: 'Sistema funcionando + código no GitHub + guia curto de uso para a equipe.',
    skills: ['JavaScript', 'Node.js', 'Banco de dados'],
    estimatedHours: 16
  },
  administrative: {
    title: 'Organizar a prestação de contas do semestre',
    type: 'administrative',
    problem: 'Precisamos prestar contas a um financiador, mas notas e recibos estão espalhados. Sem isso, podemos perder o repasse do próximo semestre.',
    requirements: 'Organizar os comprovantes por categoria, conferir com o extrato bancário e preencher o modelo de prestação de contas do financiador.',
    deliverables: 'Modelo preenchido + pasta digital organizada com todos os comprovantes.',
    skills: ['Prestação de contas', 'Excel'],
    estimatedHours: 10
  }
}

function fillExample(kind: keyof typeof examples) {
  Object.assign(state, examples[kind])
}

async function onSubmit(event: FormSubmitEvent<TaskInput>) {
  submitting.value = true
  try {
    await $fetch(`/api/organizations/${organizationId}/tasks`, { method: 'POST', body: event.data })
    toast.add({ title: 'Demanda publicada!', color: 'success' })
    await navigateTo(`/organizations/${organizationId}/dashboard`)
  } catch (err) {
    toast.add({ title: errorMessage(err), color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">
          Nova demanda
        </h1>
        <p class="text-muted">
          Quanto mais detalhada, mais fácil para o voluntário entregar o que vocês precisam. Toda demanda é remota.
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          label="Exemplo: programação"
          size="sm"
          variant="soft"
          icon="i-lucide-code"
          @click="fillExample('programming')"
        />
        <UButton
          label="Exemplo: administrativo"
          size="sm"
          variant="soft"
          icon="i-lucide-folder-open"
          @click="fillExample('administrative')"
        />
      </div>
    </div>

    <UAlert
      v-if="blocked"
      color="error"
      variant="subtle"
      icon="i-lucide-lock"
      title="Publicação bloqueada"
      :description="`Emita os certificados pendentes com prazo de ajustes vencido antes de abrir uma nova demanda: ${dashboard!.pendings.map(p => p.title).join(', ')}.`"
    />

    <UCard>
      <UForm
        :schema="taskSchema"
        :state="state"
        :disabled="blocked"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Título" name="title" required>
          <UInput v-model="state.title" class="w-full" placeholder="Ex.: Dashboard de acompanhamento de doações" />
        </UFormField>

        <UFormField label="Tipo de demanda" name="type" required>
          <USelect
            v-model="state.type"
            :items="typeOptions"
            class="w-full"
            placeholder="Programação, dados, administrativo..."
          />
        </UFormField>

        <UFormField
          label="Qual problema isso resolve para a OSC?"
          name="problem"
          required
          help="O que acontece hoje, por que é um problema e quem é afetado"
        >
          <UTextarea v-model="state.problem" class="w-full" :rows="4" />
        </UFormField>

        <UFormField
          label="O que precisa ser feito?"
          name="requirements"
          required
          help="Se for um sistema: o que ele precisa fazer. Se for administrativo: quais tarefas"
        >
          <UTextarea v-model="state.requirements" class="w-full" :rows="4" />
        </UFormField>

        <UFormField
          label="Entregáveis"
          name="deliverables"
          required
          help='O que conta como "pronto"?'
        >
          <UTextarea v-model="state.deliverables" class="w-full" :rows="2" />
        </UFormField>

        <UFormField label="Skills necessárias" name="skills" required>
          <USelectMenu
            v-model="state.skills"
            :items="skillOptions"
            multiple
            create-item
            class="w-full"
            @create="addSkill"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-3">
          <UFormField label="Horas estimadas" name="estimatedHours" required>
            <UInputNumber
              v-model="state.estimatedHours"
              :min="1"
              :max="200"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Prazo de entrega" name="dueDate" required>
            <UInput
              v-model="state.dueDate"
              type="date"
              :min="todayISO()"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Prazo de ajustes (dias)"
            name="revisionWindowDays"
            required
            help="Contados a partir da 1ª entrega"
          >
            <UInputNumber
              v-model="state.revisionWindowDays"
              :min="1"
              :max="30"
              class="w-full"
            />
          </UFormField>
        </div>

        <UButton
          type="submit"
          label="Publicar demanda"
          icon="i-lucide-send"
          :loading="submitting"
          :disabled="blocked"
          block
        />
      </UForm>
    </UCard>
  </div>
</template>
