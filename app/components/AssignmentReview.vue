<script setup lang="ts">
interface Assignment {
  id: number
  status: keyof typeof ASSIGNMENT_STATUS
  submissionUrl: string | null
  revisionDeadline: string | null
  revisionCount: number
  revisionComment: string | null
  txSignature: string | null
  volunteer: { name: string, email: string, phone: string, linkedinUrl: string, githubUrl: string | null, skills: string[] }
}

const props = defineProps<{
  assignment: Assignment
  taskSkills: string[]
  walletAddress: string | null
}>()
const emit = defineEmits<{ changed: [] }>()

const toast = useToast()
const { signMemo } = usePhantom()

const windowOpen = computed(() => !!props.assignment.revisionDeadline && new Date(props.assignment.revisionDeadline) > new Date())
const certificateKind = computed(() => {
  if (props.assignment.status === 'submitted') return 'full'
  if (props.assignment.status === 'revision_requested' && !windowOpen.value) return 'partial'
  return null
})

const competencyOptions = computed(() => [...new Set([...props.taskSkills, ...props.assignment.volunteer.skills])])
const competencies = ref<string[]>([...props.taskSkills])
const revisionComment = ref('')
const rejectionReason = ref('')
const mode = ref<'certify' | 'revision' | 'reject' | null>(null)
const busy = ref(false)

async function run(action: () => Promise<unknown>, success: string) {
  busy.value = true
  try {
    await action()
    toast.add({ title: success, color: 'success' })
    mode.value = null
    emit('changed')
  } catch (err) {
    toast.add({ title: errorMessage(err), color: 'error' })
  } finally {
    busy.value = false
  }
}

const requestRevision = () => run(
  () => $fetch(`/api/assignments/${props.assignment.id}/revision`, { method: 'POST', body: { comment: revisionComment.value } }),
  'Ajustes solicitados'
)

const reject = () => run(
  () => $fetch(`/api/assignments/${props.assignment.id}/reject`, { method: 'POST', body: { reason: rejectionReason.value } }),
  'Entrega reprovada. A demanda voltou para a vitrine.'
)

// prepare (server builds the hash) -> Phantom signs the memo -> server checks the tx on devnet
const issueCertificate = () => run(async () => {
  const body = { competencies: competencies.value }
  const { memo, issuerWallet } = await $fetch(`/api/assignments/${props.assignment.id}/certificate/prepare`, { method: 'POST', body })
  const txSignature = await signMemo(memo, issuerWallet)
  await $fetch(`/api/assignments/${props.assignment.id}/certificate`, { method: 'POST', body: { ...body, txSignature } })
}, certificateKind.value === 'partial' ? 'Certificado parcial emitido na Solana!' : 'Certificado emitido na Solana!')
</script>

<template>
  <div class="rounded-lg border border-default p-4 space-y-3">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p class="font-semibold">
          {{ assignment.volunteer.name }}
        </p>
        <p class="text-sm text-muted">
          {{ assignment.volunteer.email }} · {{ assignment.volunteer.phone }}
        </p>
        <div class="flex gap-3 text-sm mt-1">
          <ULink :to="assignment.volunteer.linkedinUrl" target="_blank" class="text-primary">
            LinkedIn
          </ULink>
          <ULink
            v-if="assignment.volunteer.githubUrl"
            :to="assignment.volunteer.githubUrl"
            target="_blank"
            class="text-primary"
          >
            GitHub
          </ULink>
        </div>
      </div>
      <UBadge :label="ASSIGNMENT_STATUS[assignment.status].label" :color="ASSIGNMENT_STATUS[assignment.status].color" variant="subtle" />
    </div>

    <div v-if="assignment.submissionUrl" class="text-sm space-y-1">
      <p>
        Entrega:
        <ULink :to="assignment.submissionUrl" target="_blank" class="text-primary break-all">
          {{ assignment.submissionUrl }}
        </ULink>
      </p>
      <p v-if="assignment.revisionDeadline && ['submitted', 'revision_requested'].includes(assignment.status)" class="text-muted">
        Prazo de ajustes: {{ formatDate(assignment.revisionDeadline) }}
        <UBadge
          v-if="!windowOpen"
          label="vencido"
          color="error"
          size="sm"
          variant="soft"
        />
      </p>
      <p v-if="assignment.revisionComment && assignment.status === 'revision_requested'" class="text-muted">
        Ajustes pedidos: "{{ assignment.revisionComment }}"
      </p>
    </div>

    <p v-if="assignment.status === 'revision_requested' && windowOpen" class="text-sm text-muted">
      Aguardando o voluntário reenviar os ajustes.
    </p>

    <ULink
      v-if="assignment.txSignature"
      :to="explorerTxUrl(assignment.txSignature)"
      target="_blank"
      class="text-sm text-primary inline-flex items-center gap-1"
    >
      <UIcon name="i-lucide-external-link" /> Ver certificado no Solana Explorer
    </ULink>

    <div v-if="certificateKind || assignment.status === 'submitted'" class="flex flex-wrap gap-2">
      <UButton
        v-if="certificateKind"
        :label="certificateKind === 'partial' ? 'Emitir certificado parcial' : 'Validar e emitir certificado'"
        icon="i-lucide-badge-check"
        size="sm"
        @click="mode = 'certify'"
      />
      <UButton
        v-if="assignment.status === 'submitted' && windowOpen"
        label="Pedir ajustes"
        icon="i-lucide-message-square-warning"
        size="sm"
        color="warning"
        variant="soft"
        @click="mode = 'revision'"
      />
      <UButton
        v-if="assignment.status === 'submitted' && assignment.revisionCount > 0"
        label="Reprovar"
        icon="i-lucide-x"
        size="sm"
        color="error"
        variant="soft"
        @click="mode = 'reject'"
      />
    </div>

    <div v-if="mode === 'certify'" class="space-y-3 rounded-md bg-elevated p-3">
      <UAlert
        v-if="!walletAddress"
        color="warning"
        variant="subtle"
        title="Conecte a carteira da OSC no topo do painel antes de emitir certificados."
      />
      <p class="text-sm font-medium">
        Quais competências foram de fato aplicadas?
      </p>
      <UCheckboxGroup v-model="competencies" :items="competencyOptions" orientation="horizontal" />
      <div class="flex gap-2">
        <UButton
          :label="certificateKind === 'partial' ? 'Assinar certificado parcial na Phantom' : 'Assinar certificado na Phantom'"
          icon="i-lucide-pen-line"
          :loading="busy"
          :disabled="!walletAddress || !competencies.length"
          @click="issueCertificate"
        />
        <UButton label="Cancelar" variant="ghost" @click="mode = null" />
      </div>
    </div>

    <div v-if="mode === 'revision'" class="space-y-2 rounded-md bg-elevated p-3">
      <UTextarea v-model="revisionComment" class="w-full" placeholder="O que precisa ser ajustado?" />
      <div class="flex gap-2">
        <UButton
          label="Enviar pedido de ajustes"
          color="warning"
          :loading="busy"
          @click="requestRevision"
        />
        <UButton label="Cancelar" variant="ghost" @click="mode = null" />
      </div>
    </div>

    <div v-if="mode === 'reject'" class="space-y-2 rounded-md bg-elevated p-3">
      <UTextarea v-model="rejectionReason" class="w-full" placeholder="Justificativa da reprovação" />
      <div class="flex gap-2">
        <UButton
          label="Confirmar reprovação"
          color="error"
          :loading="busy"
          @click="reject"
        />
        <UButton label="Cancelar" variant="ghost" @click="mode = null" />
      </div>
    </div>
  </div>
</template>
