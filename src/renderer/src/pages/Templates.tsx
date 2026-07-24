import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

export default function TemplatesPage(): React.JSX.Element {
  return (
    <Stack spacing={1}>
      <Typography variant="h4">Templates</Typography>
      <Typography color="text.secondary">Reusable quotation templates and layouts.</Typography>
    </Stack>
  )
}
