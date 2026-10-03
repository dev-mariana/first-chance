<script setup lang="ts">
const route = useRoute()
const toast = useToast()
const { role, id: sessionId } = useSession()
const volunteerId = Number(route.params.id)

const { data: volunteer, refresh } = await useFetch(`/api/volunteers/${volunteerId}`)

const isOwner = computed(() => role.value === 'vol' && sessionId.value === volunteerId)
const certificates = computed(() => volunteer.value?.assignments.filter(a => a.status === 'certified_full' || a.status === 'certified_partial') ?? [])
const current = computed(() => volunteer.value?.assignments.find(a =>
  a.status === 'in_progress' || a.status === 'submitted' || a.status === 'revision_requested'))
const history = computed(() => volunteer.value?.assignments.filter(a => ['rejected', 'withdrawn', 'expired'].includes(a.status)) ?? [])

const canSubmit = computed(() => {
  const a = current.value
  if (!a) return false
  if (a.status === 'in_progress') return true
  return a.status === 'revision_requested' && !!a.revisionDeadline && new Date(a.revisionDeadline) > new Date()
})

const submissionUrl = ref('')
const busy = ref(false)

async function run(action: () => Promise<unknown>, success: string) {
  busy.value = true
  try {
    await action()
    toast.add({ title: success, color: 'success' })
    submissionUrl.value = ''
    await refresh()
  } catch (err) {
    toast.add({ title: errorMessage(err), color: 'error' })
  } finally {
    busy.value = false
  }
}

const submit = () => run(
  () => $fetch(`/api/assignments/${current.value!.id}/submission`, { method: 'PATCH', body: { submissionUrl: submissionUrl.value } }),
  'Entrega enviada! Agora é com a OSC.'
)

const withdraw = () => run(
  () => $fetch(`/api/assignments/${current.value!.id}/withdraw`, { method: 'POST' }),
  'Você desistiu da demanda. Ela voltou para a vitrine.'
)
</script>

<template>
  <div v-if="volunteer" class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold">
          {{ volunteer.name }}
        </h1>
        <p v-if="volunteer.bio" class="text-muted max-w-2xl">
          {{ volunteer.bio }}
        </p>
        <div class="flex flex-wrap gap-1">
          <UBadge
            v-for="skill in volunteer.skills"
            :key="skill"
            :label="skill"
            variant="soft"
            color="neutral"
          />
        </div>
      </div>
      <div class="flex gap-2">
        <UButton
          :to="volunteer.linkedinUrl"
          target="_blank"
          icon="i-simple-icons-linkedin"
          label="LinkedIn"
          variant="outline"
        />
        <UButton
          v-if="volunteer.githubUrl"
          :to="volunteer.githubUrl"
          target="_blank"
          icon="i-simple-icons-github"
          label="GitHub"
          variant="outline"
        />
      </div>
    </div>

    <UCard v-if="current && isOwner">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-sm text-muted">
              Demanda em andamento
            </p>
            <h2 class="font-semibold text-lg">
              {{ current.task.title }}
            </h2>
          </div>
          <UBadge :label="ASSIGNMENT_STATUS[current.status].label" :color="ASSIGNMENT_STATUS[current.status].color" variant="subtle" />
        </div>
      </template>

      <div class="space-y-3 text-sm">
        <p>
          <span class="font-medium">{{ current.organization.name }}</span> ·
          {{ current.organization.email }} · {{ current.organization.phone }}
        </p>
        <p><span class="font-medium">Entregáveis:</span> {{ current.task.deliverables }}</p>
        <p><span class="font-medium">Prazo de entrega:</span> {{ formatDate(current.task.dueDate) }}</p>
        <p v-if="current.revisionDeadline">
          <span class="font-medium">Prazo de ajustes:</span> {{ formatDate(current.revisionDeadline) }}
        </p>

        <UAlert
          v-if="current.status === 'revision_requested'"
          color="warning"
          variant="subtle"
          icon="i-lucide-message-square-warning"
          title="A OSC pediu ajustes"
          :description="current.revisionComment ?? ''"
        />
        <p v-if="current.status === 'submitted'" class="text-muted">
          Entrega enviada. Aguardando a avaliação da OSC.
        </p>

        <div v-if="canSubmit" class="flex flex-wrap items-end gap-2">
          <UFormField label="Link da entrega" class="flex-1 min-w-64">
            <UInput v-model="submissionUrl" class="w-full" placeholder="Repositório, Drive, Figma..." />
          </UFormField>
          <UButton
            :label="current.status === 'revision_requested' ? 'Reenviar com ajustes' : 'Enviar entrega'"
            icon="i-lucide-send"
            :loading="busy"
            :disabled="!submissionUrl"
            @click="submit"
          />
        </div>

        <UButton
          v-if="current.status === 'in_progress'"
          label="Desistir da demanda"
          color="error"
          variant="ghost"
          size="sm"
          :loading="busy"
          @click="withdraw"
        />
      </div>
    </UCard>

    <div class="space-y-4">
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <UIcon name="i-lucide-badge-check" class="text-primary" /> Certificados
      </h2>
      <UEmpty
        v-if="!certificates.length"
        icon="i-lucide-award"
        title="Nenhum certificado ainda"
        description="Assuma uma demanda na vitrine para conquistar o primeiro."
      />
      <div class="grid gap-4 md:grid-cols-2">
        <CertificateCard
          v-for="a in certificates"
          :key="a.id"
          :assignment-id="a.id"
          :kind="a.status === 'certified_full' ? 'full' : 'partial'"
          :task-title="a.task.title"
          :organization-name="a.organization.name"
          :competencies="a.certificateCompetencies ?? []"
          :certified-at="a.certifiedAt"
          :tx-signature="a.txSignature!"
          :hash="a.certificateHash"
        />
      </div>
    </div>

    <p v-if="history.length && isOwner" class="text-sm text-muted">
      Histórico: {{ history.map(a => `${a.task.title} (${ASSIGNMENT_STATUS[a.status].label})`).join(' · ') }}
    </p>
  </div>
</template>
