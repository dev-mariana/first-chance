<script setup lang="ts">
const { session } = useSession()

const { data: organizations } = await useFetch('/api/organizations', { key: 'organizations-list', default: () => [] })
const { data: volunteers } = await useFetch('/api/volunteers', { key: 'volunteers-list', default: () => [] })

const items = computed(() => [
  [
    { type: 'label' as const, label: 'Organizações (OSC)' },
    ...organizations.value.map(o => ({ label: o.name, value: `org:${o.id}`, icon: 'i-lucide-building-2' }))
  ],
  [
    { type: 'label' as const, label: 'Voluntários' },
    ...volunteers.value.map(v => ({ label: v.name, value: `vol:${v.id}`, icon: 'i-lucide-user' }))
  ]
])

// Switching profile goes straight to that profile's home
watch(session, (value) => {
  if (!value) return
  const [role, id] = value.split(':')
  navigateTo(role === 'org' ? `/organizations/${id}/dashboard` : `/volunteers/${id}`)
})
</script>

<template>
  <USelect
    v-model="session"
    :items="items"
    placeholder="Entrar como..."
    icon="i-lucide-log-in"
  />
</template>
