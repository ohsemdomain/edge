import { createTheme, rem } from '@mantine/core'

export const theme = createTheme({
	// Primary color
	primaryColor: 'blue',

	// Define the blue color palette
	colors: {
		blue: ['#ecefff', '#d5dafb', '#a9b1f1', '#7a87e9', '#5362e1', '#3a4bdd', '#2c40dc', '#1f32c4', '#182cb0', '#0a259c']
	},

	radius: {
		xs: rem(2),
		sm: rem(5),
		md: rem(8),
		lg: rem(12),
		xl: rem(16)
	},

	/*   fontFamily:
    'InterVar, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
  fontSizes: {
    xs: rem(12),
    sm: rem(14),
    md: rem(16),
    lg: rem(18),
    xl: rem(20),
  }, */

	components: {
		Button: {
			defaultProps: {
				variant: 'light',
				size: 'xs',
				fw: '500',
				radius: 'sm'
			}
		},
		Card: {
			defaultProps: {
				shadow: 'none'
			}
		}
	}
})
