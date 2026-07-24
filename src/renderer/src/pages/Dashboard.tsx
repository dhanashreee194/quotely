import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

export default function DashboardPage(): React.JSX.Element {
  return (
    <Stack spacing={1}>
      <Typography variant="h4">Dashboard</Typography>
      <Typography color="text.secondary">
        Overview of quotations, customers, and recent activity.
      </Typography>
    </Stack>
  )
}
