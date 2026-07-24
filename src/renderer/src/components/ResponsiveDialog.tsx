import Dialog, { type DialogProps } from '@mui/material/Dialog'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

type ResponsiveDialogProps = DialogProps

/** Dialog that goes fullScreen below the `sm` breakpoint for usable forms on narrow windows. */
export default function ResponsiveDialog({
  fullWidth = true,
  maxWidth = 'sm',
  fullScreen,
  ...props
}: ResponsiveDialogProps): React.JSX.Element {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('sm'))
  return (
    <Dialog fullWidth={fullWidth} maxWidth={maxWidth} fullScreen={fullScreen ?? compact} {...props} />
  )
}
