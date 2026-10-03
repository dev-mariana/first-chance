<script setup lang="ts">
const route = useRoute()
const toast = useToast()
const { connect } = usePhantom()
const organizationId = Number(route.params.id)

const { data, refresh } = await useFetch(`/api/organizations/${organizationId}/dashboard`)

const newDates = reactive<Record<number, string>>({})
const connecting = ref(false)

async function connectWallet() {
  connecting.value = true
  try {
    const walletAddress = await connect()
    await $fetch(`/api/organizations/${organizationId}/wallet`, { method: 'PATCH', body: { walletAddress } })
    toast.add({ title: 'Carteira conectada', color: 'success' })
    await refresh()
  } catch (err) {
    toast.add({ title: errorMessage(err), color: 'error' })
  } finally {
    connecting.value = false
  }
}

async function changeDueDate(taskId: number, action: 'reopen' | 'extend') {
  try {
    await $fetch(`/api/tasks/${taskId}/${action}`, { method: 'POST', body: { dueDate: newDates[taskId] } })
    toast.add({ title: action === 'reopen' ? 'Demanda reaberta' : 'Prazo prorrogado', color: 'success' })
    await refresh()
  } catch (err) {
    toast.add({ title: errorMessage(err), color: 'error' })
  }
}
</script>

<template>
  <div v-if="data" class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">
          {{ data.organization.name }}
        </h1>
        <p class="text-muted">
          Painel da OSC · {{ data.organization.cause }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          :to="`/organizations/${organizationId}`"
          label="Perfil público"
          variant="outline"
          icon="i-lucide-eye"
        />
        <UButton
          :to="`/organizations/${organizationId}/tasks/new`"
          label="Nova demanda"
          icon="i-lucide-plus"
          :disabled="data.pendings.length > 0"
        />
      </div>
    </div>

    <UCard>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-wallet" class="size-6 text-primary" />
          <div>
            <p class="font-medium">
              Carteira da OSC (Solana devnet)
            </p>
            <p v-if="data.organization.walletAddress" class="text-sm text-muted break-all">
              {{ data.organization.walletAddress }}
            </p>
            <p v-else class="text-sm text-muted">
              Necessária para assinar os certificados
            </p>
          </div>
        </div>
        <UButton
          :label="data.organization.walletAddress ? 'Trocar carteira' : 'Conectar Phantom'"
          :variant="data.organization.walletAddress ? 'outline' : 'solid'"
          :loading="connecting"
          @click="connectWallet"
        />
      </div>
    </UCard>

    <UAlert
      v-if="data.pendings.length"
      color="error"
      variant="subtle"
      icon="i-lucide-lock"
      title="Novas demandas bloqueadas"
      :description="`O prazo de ajustes venceu e ainda faltam certificados: ${data.pendings.map(p => p.title).join(', ')}. Emita-os para voltar a publicar.`"
    />

    <UEmpty
      v-if="!data.tasks.length"
      icon="i-lucide-inbox"
      title="Nenhuma demanda ainda"
      description="Publique a primeira demanda da OSC."
    />

    <UCard v-for="task in data.tasks" :key="task.id">
      <template #header>
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 class="font-semibold text-lg">
              {{ task.title }}
            </h2>
            <p class="text-sm text-muted">
              {{ taskTypeLabel(task.type) }} · entrega até {{ formatDate(task.dueDate) }}
              <span v-if="task.extended">(prorrogado)</span>
              · {{ task.revisionWindowDays }} dia(s) para ajustes
            </p>
          </div>
          <UBadge :label="TASK_STATUS[task.status].label" :color="TASK_STATUS[task.status].color" variant="subtle" />
        </div>
      </template>

      <div class="space-y-3">
        <p v-if="task.status === 'open'" class="text-sm text-muted">
          Aguardando um voluntário na vitrine.
        </p>

        <div v-if="task.status === 'overdue' || (task.status === 'in_progress' && !task.extended && task.assignments[0]?.status === 'in_progress')" class="flex flex-wrap items-end gap-2">
          <UFormField :label="task.status === 'overdue' ? 'Reabrir com novo prazo' : 'Prorrogar prazo (uma vez)'">
            <UInput v-model="newDates[task.id]" type="date" :min="todayISO()" />
          </UFormField>
          <UButton
            :label="task.status === 'overdue' ? 'Reabrir demanda' : 'Prorrogar'"
            variant="soft"
            :disabled="!newDates[task.id]"
            @click="changeDueDate(task.id, task.status === 'overdue' ? 'reopen' : 'extend')"
          />
        </div>

        <AssignmentReview
          v-for="assignment in task.assignments.slice(0, 1)"
          :key="assignment.id"
          :assignment="assignment"
          :task-skills="task.skills"
          :wallet-address="data.organization.walletAddress"
          @changed="refresh"
        />

        <p v-if="task.assignments.length > 1" class="text-xs text-muted">
          Histórico: {{ task.assignments.slice(1).map(a => `${a.volunteer.name} (${ASSIGNMENT_STATUS[a.status].label})`).join(' · ') }}
        </p>
      </div>
    </UCard>
  </div>
</template>
