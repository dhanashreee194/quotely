import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

export default function QuotationsPage(): React.JSX.Element {
  return (
    <Stack spacing={1}>
      <Typography variant="h4">Quotations</Typography>
      <Typography color="text.secondary">Create and manage customer quotations.</Typography>
    </Stack>
  )
}
