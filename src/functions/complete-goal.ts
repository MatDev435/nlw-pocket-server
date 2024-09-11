import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { gaolCompletions, goals } from '../db/schema'
import dayjs from 'dayjs'

interface CreateGoalProps {
  goalId: string
}

export async function completeGoal({ goalId }: CreateGoalProps) {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  const goalCompletionCounts = db.$with('goalCompletionCounts').as(
    db
      .select({
        goalId: gaolCompletions.goalId,
        completionCount: count(gaolCompletions.id).as('completionCount'),
      })
      .from(gaolCompletions)
      .where(
        and(
          gte(gaolCompletions.createdAt, firstDayOfWeek),
          lte(gaolCompletions.createdAt, lastDayOfWeek),
          eq(gaolCompletions.goalId, goalId)
        )
      )
      .groupBy(gaolCompletions.goalId)
  )

  const result = await db
    .with(goalCompletionCounts)
    .select({
      desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
      completionCount: sql`
            COALESCE(${goalCompletionCounts.completionCount}, 0)
        `.mapWith(Number),
    })
    .from(goals)
    .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
    .where(eq(goals.id, goalId))
    .limit(1)

  const { completionCount, desiredWeeklyFrequency } = result[0]

  if (completionCount >= desiredWeeklyFrequency) {
    throw new Error('Goal already completed this week.')
  }

  const insertResult = await db
    .insert(gaolCompletions)
    .values({
      goalId,
    })
    .returning()

  const goalCompletion = insertResult[0]

  return { goalCompletion }
}
