export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, volunteerSchema.parse)
  try {
    const [volunteer] = await db.insert(schema.volunteers).values(input).returning()
    return volunteer!
  } catch (err) {
    rethrowDuplicate(err, 'Já existe um cadastro com esse e-mail')
  }
})
