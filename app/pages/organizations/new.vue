<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

const toast = useToast()
const { signInAs } = useSession()

const state = reactive<Partial<OrganizationInput>>({})
const submitting = ref(false)

async function onSubmit(event: FormSubmitEvent<OrganizationInput>) {
  submitting.value = true
  try {
    const organization = await $fetch('/api/organizations', { method: 'POST', body: event.data })
    await refreshNuxtData('organizations-list')
    toast.add({ title: `${organization.name} cadastrada!`, color: 'success' })
    signInAs('org', organization.id)
  } catch (err) {
    toast.add({ title: errorMessage(err), color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-3xl font-bold">
        Cadastro da OSC
      </h1>
      <p class="text-muted">
        Organizações da sociedade civil publicam demandas reais e certificam, na Solana, quem ajudar.
      </p>
    </div>

    <UCard>
      <UForm
        :schema="organizationSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Nome da organização" name="name" required>
          <UInput v-model="state.name" class="w-full" placeholder="Instituto Esperança" />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="CNPJ" name="cnpj" required>
            <UInput v-model="state.cnpj" class="w-full" placeholder="12.345.678/0001-90" />
          </UFormField>
          <UFormField label="Causa / área de atuação" name="cause" required>
            <UInput v-model="state.cause" class="w-full" placeholder="Infância e adolescência" />
          </UFormField>
        </div>

        <UFormField label="Sobre a OSC" name="description" required>
          <UTextarea
            v-model="state.description"
            class="w-full"
            :rows="3"
            placeholder="Quem vocês atendem, onde e como"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="E-mail" name="email" required>
            <UInput v-model="state.email" type="email" class="w-full" />
          </UFormField>
          <UFormField label="Telefone / WhatsApp" name="phone" required>
            <UInput v-model="state.phone" class="w-full" placeholder="(21) 99999-0000" />
          </UFormField>
        </div>

        <UFormField label="Site ou Instagram" name="website" hint="Opcional">
          <UInput v-model="state.website" class="w-full" placeholder="https://..." />
        </UFormField>

        <UButton
          type="submit"
          label="Cadastrar OSC"
          icon="i-lucide-building-2"
          :loading="submitting"
          block
        />
      </UForm>
    </UCard>
  </div>
</template>
