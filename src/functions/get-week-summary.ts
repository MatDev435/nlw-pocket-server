import dayjs from 'dayjs'
import { gaolCompletions, goals } from '../db/schema'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'

export async function getWeekSummary() {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  const goalsCreatedUpToWeek = db.$with('goalsCreatedUpToWeek').as(
    db
      .select({
        id: goals.id,
        title: goals.title,
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        createdAt: goals.createdAt,
      })
      .from(goals)
      .where(lte(goals.createdAt, lastDayOfWeek))
  )

  const goalsCompletedInWeek = db.$with('goalsCompletedInWeek').as(
    db
      .select({
        id: gaolCompletions.id,
        title: goals.title,
        completedAt: goals.createdAt,
        completedAtDate: sql`
            DATE(${gaolCompletions.createdAt})
        `.as('completedAtDate'),
      })
      .from(gaolCompletions)
      .innerJoin(goals, eq(goals.id, gaolCompletions.goalId))
      .where(
        and(
          gte(gaolCompletions.createdAt, firstDayOfWeek),
          lte(gaolCompletions.createdAt, lastDayOfWeek)
        )
      )
  )

  const goalsCompletedByWeekDay = db.$with('goalsCompletedByWeekDay').as(
    db
      .select({
        completedAtDate: goalsCompletedInWeek.completedAtDate,
        completions: sql`
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', ${goalsCompletedInWeek.id},
                        'title', ${goalsCompletedInWeek.title},
                        'completedAt', ${goalsCompletedInWeek.completedAt}
                    )
                )
            `.as('completions'),
      })
      .from(goalsCompletedInWeek)
      .groupBy(goalsCompletedInWeek.completedAtDate)
  )

  const result = await db
    .with(goalsCreatedUpToWeek, goalsCompletedInWeek, goalsCompletedByWeekDay)
    .select({
      completed: sql`(SELECT COUNT(*) FROM ${goalsCompletedInWeek})`,
      total: sql`(SELECT SUM(${goalsCreatedUpToWeek.desiredWeeklyFrequency}) FROM ${goalsCreatedUpToWeek})`,
      goalsPerDay: sql`
        JSON_OBJECT_AGG(
            ${goalsCompletedByWeekDay.completedAtDate},
            ${goalsCompletedByWeekDay.completions}
        )
      `,
    })
    .from(goalsCompletedByWeekDay)

  return { result }
}
