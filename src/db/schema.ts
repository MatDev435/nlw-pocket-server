import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const goals = pgTable('goals', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  desiredWeeklyFrequency: integer('desiredWeeklyFrequency').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
