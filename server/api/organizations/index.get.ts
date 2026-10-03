export default defineEventHandler(() =>
  db.select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations)
    .orderBy(schema.organizations.name)
)
