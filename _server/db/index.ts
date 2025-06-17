import type { D1Database } from '@cloudflare/workers-types'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export const getDb = (d1: D1Database) => {
	return drizzle(d1, { schema })
}

export type Database = ReturnType<typeof getDb>
export { schema }