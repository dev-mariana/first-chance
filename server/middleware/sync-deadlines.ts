export default defineEventHandler(async (event) => {
  if (event.path.startsWith('/api/')) await syncDeadlines()
})
