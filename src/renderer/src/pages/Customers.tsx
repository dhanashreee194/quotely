import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

export default function CustomersPage(): React.JSX.Element {
  return (
    <Stack spacing={1}>
      <Typography variant="h4">Customers</Typography>
      <Typography color="text.secondary">Maintain your customer directory.</Typography>
    </Stack>
  )
}
