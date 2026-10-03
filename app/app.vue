<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'pt-BR' },
  title: 'FirstChance'
})

const { role, id } = useSession()

const links = computed(() => [
  { label: 'Demandas', to: '/', icon: 'i-lucide-list-checks' },
  { label: 'Sou uma OSC', to: '/organizations/new', icon: 'i-lucide-building-2' },
  { label: 'Quero ser voluntário(a)', to: '/volunteers/new', icon: 'i-lucide-hand-heart' },
  ...(role.value === 'org' ? [{ label: 'Meu painel', to: `/organizations/${id.value}/dashboard`, icon: 'i-lucide-layout-dashboard' }] : []),
  ...(role.value === 'vol' ? [{ label: 'Meu perfil', to: `/volunteers/${id.value}`, icon: 'i-lucide-badge-check' }] : [])
])
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg">
          <UIcon name="i-lucide-sprout" class="text-primary size-6" />
          FirstChance
        </NuxtLink>
      </template>

      <UNavigationMenu :items="links" />

      <template #right>
        <SessionSwitcher class="hidden lg:inline-flex lg:w-60" />
        <UColorModeButton />
      </template>

      <template #body>
        <SessionSwitcher class="w-full mb-4" />
        <UNavigationMenu :items="links" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>

    <UMain>
      <UContainer class="py-8">
        <NuxtPage />
      </UContainer>
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          FirstChance · Your first experience, proven on-chain · Solana devnet
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
