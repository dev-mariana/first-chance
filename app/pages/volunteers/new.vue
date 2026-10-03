<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

const toast = useToast()
const { signInAs } = useSession()

const state = reactive<Partial<VolunteerInput>>({ skills: [] })
const skillOptions = ref([...SKILLS])
const submitting = ref(false)

function addSkill(skill: string) {
  skillOptions.value.push(skill)
  state.skills = [...(state.skills ?? []), skill]
}

async function onSubmit(event: FormSubmitEvent<VolunteerInput>) {
  submitting.value = true
  try {
    const volunteer = await $fetch('/api/volunteers', { method: 'POST', body: event.data })
    await refreshNuxtData('volunteers-list')
    toast.add({ title: `Boas-vindas, ${volunteer.name}!`, color: 'success' })
    signInAs('vol', volunteer.id)
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
        Quero ser voluntário(a)
      </h1>
      <p class="text-muted">
        Ajude uma OSC com uma demanda real (sempre remota) e ganhe um certificado verificável na Solana.
      </p>
    </div>

    <UCard>
      <UForm
        :schema="volunteerSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Nome" name="name" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="E-mail" name="email" required>
            <UInput v-model="state.email" type="email" class="w-full" />
          </UFormField>
          <UFormField label="Telefone / WhatsApp" name="phone" required>
            <UInput v-model="state.phone" class="w-full" placeholder="(21) 99999-0000" />
          </UFormField>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="LinkedIn" name="linkedinUrl" required>
            <UInput
              v-model="state.linkedinUrl"
              class="w-full"
              icon="i-simple-icons-linkedin"
              placeholder="https://linkedin.com/in/..."
            />
          </UFormField>
          <UFormField label="GitHub" name="githubUrl" hint="Opcional">
            <UInput
              v-model="state.githubUrl"
              class="w-full"
              icon="i-simple-icons-github"
              placeholder="https://github.com/..."
            />
          </UFormField>
        </div>

        <UFormField
          label="Skills"
          name="skills"
          required
          help="Escolha da lista ou digite uma nova"
        >
          <USelectMenu
            v-model="state.skills"
            :items="skillOptions"
            multiple
            create-item
            class="w-full"
            placeholder="Ex.: Excel, Figma, Node.js..."
            @create="addSkill"
          />
        </UFormField>

        <UFormField label="Sobre você" name="bio" hint="Opcional">
          <UTextarea
            v-model="state.bio"
            class="w-full"
            :rows="3"
            placeholder="Ex.: Estudante buscando o primeiro estágio / voltando ao mercado depois de 5 anos"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Criar meu perfil"
          icon="i-lucide-hand-heart"
          :loading="submitting"
          block
        />
      </UForm>
    </UCard>
  </div>
</template>
