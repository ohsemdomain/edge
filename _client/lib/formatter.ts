/**
 * Format timestamp to readable date string
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string like "12.06.2025 . 04:54PM"
 */
export const formatDateTime = (timestamp: number): string => {
	const date = new Date(timestamp * 1000)

	const day = date.getDate().toString().padStart(2, '0')
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const year = date.getFullYear()

	const hours = date.getHours()
	const minutes = date.getMinutes().toString().padStart(2, '0')
	const ampm = hours >= 12 ? 'PM' : 'AM'
	const displayHours = hours % 12 || 12
	const formattedHours = displayHours.toString().padStart(2, '0')

	return `${day}.${month}.${year} • ${formattedHours}:${minutes}${ampm}`
}

/**
 * Format timestamp to date only
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string like "12.06.2025"
 */
export const formatDate = (timestamp: number): string => {
	const date = new Date(timestamp * 1000)

	const day = date.getDate().toString().padStart(2, '0')
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const year = date.getFullYear()

	return `${day}.${month}.${year}`
}

/**
 * Format timestamp to time only
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted time string like "04:54PM"
 */
export const formatTime = (timestamp: number): string => {
	const date = new Date(timestamp * 1000)

	const hours = date.getHours()
	const minutes = date.getMinutes().toString().padStart(2, '0')
	const ampm = hours >= 12 ? 'PM' : 'AM'
	const displayHours = hours % 12 || 12
	const formattedHours = displayHours.toString().padStart(2, '0')

	return `${formattedHours}:${minutes}${ampm}`
}
