import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '~s/index'

export const trpc = createTRPCReact<AppRouter>()
