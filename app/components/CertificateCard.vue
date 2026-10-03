<script setup lang="ts">
const props = defineProps<{
  assignmentId: number
  kind: 'full' | 'partial'
  taskTitle: string
  organizationName: string
  competencies: string[]
  certifiedAt: string | null
  txSignature: string
  hash: string | null
}>()

const verifying = ref(false)
const result = ref<{ authentic: boolean, reason?: string }>()

async function verify() {
  verifying.value = true
  try {
    result.value = await $fetch(`/api/assignments/${props.assignmentId}/verify`)
  } catch (err) {
    result.value = { authentic: false, reason: errorMessage(err) }
  } finally {
    verifying.value = false
  }
}
</script>

<template>
  <UCard :class="kind === 'full' ? 'border-l-4 border-l-success' : 'border-l-4 border-l-warning'">
    <div class="space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <UBadge
          :label="kind === 'full' ? 'Entrega completa' : 'Entrega parcial'"
          :color="kind === 'full' ? 'success' : 'warning'"
          :icon="kind === 'full' ? 'i-lucide-badge-check' : 'i-lucide-circle-dashed'"
        />
        <span class="text-sm text-muted">{{ formatDate(certifiedAt) }}</span>
      </div>
      <p class="font-semibold text-lg">
        {{ taskTitle }}
      </p>
      <p class="text-sm">
        Certificado por <span class="font-medium">{{ organizationName }}</span>
      </p>
      <div class="flex flex-wrap gap-1">
        <UBadge
          v-for="c in competencies"
          :key="c"
          :label="c"
          size="sm"
          variant="soft"
          color="neutral"
        />
      </div>
      <p v-if="hash" class="text-xs text-muted font-mono break-all">
        hash: {{ hash }}
      </p>
      <div class="flex flex-wrap items-center gap-3 pt-1">
        <UButton
          label="Verificar autenticidade"
          icon="i-lucide-shield-check"
          size="sm"
          variant="soft"
          :loading="verifying"
          @click="verify"
        />
        <ULink
          :to="explorerTxUrl(txSignature)"
          target="_blank"
          class="text-sm text-primary inline-flex items-center gap-1"
        >
          <UIcon name="i-lucide-external-link" /> Solana Explorer
        </ULink>
      </div>
      <UAlert
        v-if="result"
        :color="result.authentic ? 'success' : 'error'"
        variant="subtle"
        :icon="result.authentic ? 'i-lucide-shield-check' : 'i-lucide-shield-x'"
        :title="result.authentic ? 'Certificado autêntico: assinado pela carteira da OSC na Solana' : 'Não foi possível verificar'"
        :description="result.reason"
      />
    </div>
  </UCard>
</template>
