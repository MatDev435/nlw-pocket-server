import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getPendingGoals } from '../../functions/get-pending-goals'

export const getPendingGoalsRoute: FastifyPluginAsyncZod = async app => {
  app.get('/pending-goals', async () => {
    const { pendingGoals } = await getPendingGoals()

    return { pendingGoals }
  })
}
