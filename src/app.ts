import fastify from 'fastify'
import { transactrionsRoutes } from './routes/transactions.js'
import fastifyCookie from '@fastify/cookie'

export const app = fastify()

app.register(fastifyCookie)

app.register(transactrionsRoutes, { prefix: '/transactions' })