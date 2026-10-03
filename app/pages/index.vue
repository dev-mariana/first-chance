<script setup lang="ts">
const toast = useToast()
const { role, id: sessionId } = useSession()

const typeFilter = ref<string | undefined>()
const skillFilter = ref<string | undefined>()

const { data: tasks, refresh } = await useFetch('/api/tasks', {
  query: { type: typeFilter, skill: skillFilter },
  default: () => []
})

const typeOptions = TASK_TYPES.map(t => ({ label: t.label, value: t.value }))
const assigning = ref<number>()

async function assign(taskId: number) {
  if (role.value !== 'vol') {
    toast.add({ title: 'Escolha um voluntário em "Entrar como..." ou faça seu cadastro', color: 'warning', icon: 'i-lucide-user' })
    return
  }
  assigning.value = taskId
  try {
    await $fetch(`/api/tasks/${taskId}/assign`, { method: 'POST', body: { volunteerId: sessionId.value } })
    toast.add({ title: 'Demanda assumida! Combine os detalhes com a OSC e envie a entrega pelo seu perfil.', color: 'success', icon: 'i-lucide-party-popper' })
    await refresh()
  } catch (err) {
    toast.add({ title: errorMessage(err), color: 'error' })
  } finally {
    assigning.value = undefined
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="text-center space-y-3 max-w-3xl mx-auto">
      <h1 class="text-4xl font-bold">
        Experiência real começa com uma oportunidade
      </h1>
      <p class="text-lg text-muted">
        Organizações da sociedade civil publicam necessidades reais. Voluntários entregam, a OSC avalia
        e a experiência vira um <span class="text-primary font-semibold">certificado verificável na Solana</span>.
      </p>
    </div>

    <div class="flex flex-wrap gap-3 items-center">
      <USelect
        v-model="typeFilter"
        :items="typeOptions"
        placeholder="Todos os tipos"
        class="w-64"
      />
      <USelect
        v-model="skillFilter"
        :items="SKILLS"
        placeholder="Todas as skills"
        class="w-56"
      />
      <UButton
        v-if="typeFilter || skillFilter"
        label="Limpar filtros"
        variant="ghost"
        icon="i-lucide-x"
        @click="typeFilter = undefined; skillFilter = undefined"
      />
      <span class="ms-auto text-sm text-muted">{{ tasks.length }} demanda(s)</span>
    </div>

    <UEmpty
      v-if="!tasks.length"
      icon="i-lucide-search-x"
      title="Nenhuma demanda encontrada"
      description="Tente outros filtros."
    />

    <div class="grid gap-5 md:grid-cols-2">
      <UCard v-for="task in tasks" :key="task.id">
        <template #header>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold text-lg">
                {{ task.title }}
              </h2>
              <NuxtLink :to="`/organizations/${task.organization.id}`" class="text-sm text-primary hover:underline">
                {{ task.organization.name }} · {{ task.organization.cause }}
              </NuxtLink>
            </div>
            <UBadge :label="TASK_STATUS[task.status].label" :color="TASK_STATUS[task.status].color" variant="subtle" />
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <div class="flex flex-wrap gap-2">
            <UBadge :label="taskTypeLabel(task.type)" variant="outline" icon="i-lucide-tag" />
            <UBadge :label="`~${task.estimatedHours}h`" variant="outline" color="neutral" icon="i-lucide-clock" />
            <UBadge :label="`Entrega até ${formatDate(task.dueDate)}`" variant="outline" color="neutral" icon="i-lucide-calendar" />
            <UBadge label="Remoto" variant="outline" color="neutral" icon="i-lucide-wifi" />
          </div>

          <div>
            <p class="font-medium">
              Problema
            </p>
            <p class="text-muted">
              {{ task.problem }}
            </p>
          </div>
          <div>
            <p class="font-medium">
              O que precisa ser feito
            </p>
            <p class="text-muted">
              {{ task.requirements }}
            </p>
          </div>
          <div>
            <p class="font-medium">
              Entregáveis
            </p>
            <p class="text-muted">
              {{ task.deliverables }}
            </p>
          </div>

          <div class="flex flex-wrap gap-1">
            <UBadge
              v-for="skill in task.skills"
              :key="skill"
              :label="skill"
              size="sm"
              color="neutral"
              variant="soft"
            />
          </div>
        </div>

        <template #footer>
          <UButton
            v-if="task.status === 'open'"
            label="Quero ajudar"
            icon="i-lucide-hand-heart"
            block
            :loading="assigning === task.id"
            @click="assign(task.id)"
          />
          <p v-else class="text-sm text-muted text-center">
            {{ task.status === 'overdue' ? 'Prazo vencido: aguardando a OSC reabrir' : 'Esta demanda já tem um voluntário' }}
          </p>
        </template>
      </UCard>
    </div>
  </div>
</template>
