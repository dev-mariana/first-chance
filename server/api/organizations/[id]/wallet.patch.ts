import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const { walletAddress } = await readValidatedBody(event, walletSchema.parse)
  const [organization] = await db.update(schema.organizations)
    .set({ walletAddress })
    .where(eq(schema.organizations.id, id))
    .returning()
  if (!organization) notFound('OSC')
  return organization
})
