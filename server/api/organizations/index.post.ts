export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, organizationSchema.parse)
  try {
    const [organization] = await db.insert(schema.organizations).values(input).returning()
    return organization!
  } catch (err) {
    rethrowDuplicate(err, 'Já existe uma OSC com esse CNPJ')
  }
})
