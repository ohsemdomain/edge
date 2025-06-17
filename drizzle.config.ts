import type { Config } from 'drizzle-kit'

export default {
	schema: './_server/db/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	driver: 'd1'
} satisfies Config