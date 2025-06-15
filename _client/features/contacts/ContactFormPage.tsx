import {
	Box,
	Button,
	Checkbox,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Switch,
	Text,
	TextInput
} from '@mantine/core'
import { Trash } from 'lucide-react'
import { useContactForm } from './useContactForm'

interface ContactFormPageProps {
	mode: 'create' | 'edit'
	onSuccess?: (contactId: string) => void // For future invoice modal
}

export function ContactFormPage({ mode, onSuccess }: ContactFormPageProps) {
	const {
		formData,
		setFormData,
		addresses,
		updateAddress,
		addEmptyAddress,
		removeAddress,
		handleSubmit,
		handleCancel,
		isLoading,
		canSubmit
	} = useContactForm(mode, onSuccess)

	return (
		<ScrollArea h='100%' type='never'>
			<Box maw={800} w='100%' p='md' mx='auto'>
				<Stack mt='xl'>
					<Stack gap='md'>
						<TextInput
							label='Company Name'
							placeholder='Enter company name'
							value={formData.company_name}
							onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
							required
						/>

						<TextInput
							label='Person In Charge'
							placeholder='Enter person in charge'
							value={formData.person_incharge}
							onChange={(e) => setFormData({ ...formData, person_incharge: e.target.value })}
							required
						/>

						<TextInput
							label='Primary Phone'
							placeholder='Enter primary phone'
							value={formData.primary_phone}
							onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value })}
							required
						/>

						<TextInput
							label='Email'
							placeholder='Enter email (optional)'
							type='email'
							value={formData.email}
							onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 1'
							placeholder='Enter alternative phone 1 (optional)'
							value={formData.phone_alt_1}
							onChange={(e) => setFormData({ ...formData, phone_alt_1: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 2'
							placeholder='Enter alternative phone 2 (optional)'
							value={formData.phone_alt_2}
							onChange={(e) => setFormData({ ...formData, phone_alt_2: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 3'
							placeholder='Enter alternative phone 3 (optional)'
							value={formData.phone_alt_3}
							onChange={(e) => setFormData({ ...formData, phone_alt_3: e.target.value })}
						/>

						<Switch
							label='Is Supplier'
							description='Toggle on for Supplier, off for Client'
							checked={formData.is_supplier}
							onChange={(e) => setFormData({ ...formData, is_supplier: e.currentTarget.checked })}
						/>
					</Stack>

					{/* Addresses */}
					<Stack mt='xl'>
						{addresses.map((address, index) => (
							<Paper key={index} p='md' withBorder>
								<Group justify='space-between' mb='md'>
									<Text fw={500}>Address {index + 1}</Text>
									{addresses.length > 1 && (
										<Button
											size='xs'
											color='red'
											variant='subtle'
											leftSection={<Trash size={14} />}
											onClick={() => removeAddress(index)}
										>
											Remove
										</Button>
									)}
								</Group>

								<Stack gap='sm'>
									<TextInput
										label='Receiver'
										placeholder='Enter receiver name'
										value={address.receiver}
										onChange={(e) => updateAddress(index, 'receiver', e.target.value)}
										required
									/>

									<TextInput
										label='Address Line 1'
										placeholder='Enter address line 1'
										value={address.address_line1}
										onChange={(e) => updateAddress(index, 'address_line1', e.target.value)}
										required
									/>

									<TextInput
										label='Address Line 2'
										placeholder='Enter address line 2 (optional)'
										value={address.address_line2}
										onChange={(e) => updateAddress(index, 'address_line2', e.target.value)}
									/>

									<TextInput
										label='Address Line 3'
										placeholder='Enter address line 3 (optional)'
										value={address.address_line3}
										onChange={(e) => updateAddress(index, 'address_line3', e.target.value)}
									/>

									<TextInput
										label='Address Line 4'
										placeholder='Enter address line 4 (optional)'
										value={address.address_line4}
										onChange={(e) => updateAddress(index, 'address_line4', e.target.value)}
									/>

									<Group grow>
										<TextInput
											label='Postcode'
											placeholder='Enter postcode'
											value={address.postcode}
											onChange={(e) => updateAddress(index, 'postcode', e.target.value)}
											required
										/>

										<TextInput
											label='City'
											placeholder='Enter city'
											value={address.city}
											onChange={(e) => updateAddress(index, 'city', e.target.value)}
											required
										/>
									</Group>

									<Group grow>
										<TextInput
											label='State'
											placeholder='Enter state'
											value={address.state}
											onChange={(e) => updateAddress(index, 'state', e.target.value)}
											required
										/>

										<TextInput
											label='Country'
											placeholder='Enter country'
											value={address.country}
											onChange={(e) => updateAddress(index, 'country', e.target.value)}
											required
										/>
									</Group>

									<Group>
										<Checkbox
											label='Default Billing'
											checked={address.is_default_billing}
											onChange={(e) =>
												updateAddress(index, 'is_default_billing', e.currentTarget.checked)
											}
										/>

										<Checkbox
											label='Default Shipping'
											checked={address.is_default_shipping}
											onChange={(e) =>
												updateAddress(index, 'is_default_shipping', e.currentTarget.checked)
											}
										/>
									</Group>
								</Stack>
							</Paper>
						))}

						<Button variant='light' onClick={addEmptyAddress}>
							+ Address
						</Button>
					</Stack>

					<Group mt='xl'>
						<Button onClick={handleSubmit} disabled={!canSubmit}>
							{mode === 'create' ? 'Create' : 'Save'}
						</Button>
						<Button variant='subtle' onClick={handleCancel} disabled={isLoading}>
							Cancel
						</Button>
					</Group>
				</Stack>
			</Box>
		</ScrollArea>
	)
}
