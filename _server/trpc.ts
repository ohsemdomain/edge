// _server/trpc.ts
import { initTRPC } from '@trpc/server'
import type { Env } from './index'

export interface Context {
	env: Env
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const createContext = (env: Env): Context => ({ env })
