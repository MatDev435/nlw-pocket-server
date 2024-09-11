import fastify from 'fastify'
import { env } from '../env'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { createGoal } from '../functions/create-goal'
import { getPendingGoals } from '../functions/get-pending-goals'
import { completeGoal } from '../functions/complete-goal'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.post(
  '/goals',
  {
    schema: {
      body: z.object({
        title: z.string(),
        desiredWeeklyFrequency: z.number().min(1).max(7),
      }),
    },
  },
  async (request, reply) => {
    const { title, desiredWeeklyFrequency } = request.body

    await createGoal({
      title,
      desiredWeeklyFrequency,
    })
  }
)

app.post(
  '/completions',
  {
    schema: {
      body: z.object({
        goalId: z.string(),
      }),
    },
  },
  async (request, reply) => {
    const { goalId } = request.body

    await completeGoal({
      goalId,
    })
  }
)

app.get('/pending-goals', async () => {
  const { pendingGoals } = await getPendingGoals()

  return { pendingGoals }
})

app.listen({ port: env.PORT }).then(() => {
  console.log('🔥HTTP Server Running!')
})
