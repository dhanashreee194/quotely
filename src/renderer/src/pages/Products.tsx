import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

export default function ProductsPage(): React.JSX.Element {
  return (
    <Stack spacing={1}>
      <Typography variant="h4">Products</Typography>
      <Typography color="text.secondary">Manage products and pricing used in quotations.</Typography>
    </Stack>
  )
}
