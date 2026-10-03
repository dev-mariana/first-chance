<script setup lang="ts">
const route = useRoute()
const { data: organization } = await useFetch(`/api/organizations/${route.params.id}`)
</script>

<template>
  <div v-if="organization" class="space-y-8">
    <div class="space-y-2">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="text-3xl font-bold">
          {{ organization.name }}
        </h1>
        <UBadge
          v-if="organization.verified"
          label="OSC verificada"
          icon="i-lucide-shield-check"
          variant="subtle"
        />
      </div>
      <p class="text-primary font-medium">
        {{ organization.cause }}
      </p>
      <p class="text-muted max-w-3xl">
        {{ organization.description }}
      </p>
      <div class="flex flex-wrap gap-4 text-sm">
        <ULink
          v-if="organization.website"
          :to="organization.website"
          target="_blank"
          class="text-primary"
        >
          {{ organization.website }}
        </ULink>
        <ULink
          v-if="organization.walletAddress"
          :to="explorerAddressUrl(organization.walletAddress)"
          target="_blank"
          class="text-primary inline-flex items-center gap-1"
        >
          <UIcon name="i-lucide-wallet" /> Carteira emissora na Solana
        </ULink>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <UCard>
        <p class="text-sm text-muted">
          Certificados emitidos
        </p>
        <p class="text-3xl font-bold">
          {{ organization.certificates.length }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          Demandas ativas
        </p>
        <p class="text-3xl font-bold">
          {{ organization.tasks.length }}
        </p>
      </UCard>
    </div>

    <div class="space-y-3">
      <h2 class="text-2xl font-bold">
        Certificados emitidos
      </h2>
      <UEmpty
        v-if="!organization.certificates.length"
        icon="i-lucide-award"
        title="Nenhum certificado emitido ainda"
      />
      <UCard v-for="c in organization.certificates" :key="c.assignmentId">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="font-medium">
              {{ c.task.title }}
            </p>
            <NuxtLink :to="`/volunteers/${c.volunteer.id}`" class="text-sm text-primary hover:underline">
              {{ c.volunteer.name }}
            </NuxtLink>
            <span class="text-sm text-muted"> · {{ formatDate(c.certifiedAt) }}</span>
          </div>
          <div class="flex items-center gap-3">
            <UBadge
              :label="c.status === 'certified_full' ? 'Completo' : 'Parcial'"
              :color="c.status === 'certified_full' ? 'success' : 'warning'"
              variant="subtle"
            />
            <ULink
              v-if="c.txSignature"
              :to="explorerTxUrl(c.txSignature)"
              target="_blank"
              class="text-sm text-primary"
            >
              Explorer
            </ULink>
          </div>
        </div>
      </UCard>
    </div>

    <div class="space-y-3">
      <h2 class="text-2xl font-bold">
        Demandas
      </h2>
      <UCard v-for="task in organization.tasks" :key="task.id">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="font-medium">
              {{ task.title }}
            </p>
            <p class="text-sm text-muted">
              {{ taskTypeLabel(task.type) }} · entrega até {{ formatDate(task.dueDate) }}
            </p>
          </div>
          <UBadge :label="TASK_STATUS[task.status].label" :color="TASK_STATUS[task.status].color" variant="subtle" />
        </div>
      </UCard>
    </div>
  </div>
</template>
