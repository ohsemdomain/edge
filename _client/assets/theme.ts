import { createTheme, rem } from '@mantine/core'

export const theme = createTheme({
	// Primary color
	primaryColor: 'blue',

	// Define the blue color palette
	colors: {
		blue: ['#ecefff', '#d5dafb', '#a9b1f1', '#7a87e9', '#5362e1', '#3a4bdd', '#2c40dc', '#1f32c4', '#182cb0', '#0a259c']
	},

	fontFamily: "'Inter Tight', 'Geist', sans-serif",

	headings: {
		fontFamily: "'Inter Tight', 'Geist', sans-serif"
	},

	radius: {
		xs: rem(2),
		sm: rem(5),
		md: rem(8),
		lg: rem(12),
		xl: rem(16)
	},

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
