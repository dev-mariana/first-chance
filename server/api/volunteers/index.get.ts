export default defineEventHandler(() =>
  db.select({ id: schema.volunteers.id, name: schema.volunteers.name })
    .from(schema.volunteers)
    .orderBy(schema.volunteers.name)
)
