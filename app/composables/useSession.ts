type Role = 'org' | 'vol'

// "Entrar como": no real login in the MVP, the session is just "org:<id>" or "vol:<id>" in a cookie
export function useSession() {
  const session = useCookie<string | null>('session', { default: () => null })

  const role = computed(() => session.value?.split(':')[0] as Role | undefined)
  const id = computed(() => (session.value ? Number(session.value.split(':')[1]) : undefined))

  const signInAs = (newRole: Role, newId: number) => {
    session.value = `${newRole}:${newId}`
  }

  return { session, role, id, signInAs }
}
