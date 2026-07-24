import Dialog, { type DialogProps } from '@mui/material/Dialog'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

type ResponsiveDialogProps = DialogProps

/**
 * Dialog that goes fullScreen below the `md` breakpoint (~900px), matching the
 * hamburger-nav layout. (Window minWidth is 700, so `sm`/600px would never fire.)
 */
export default function ResponsiveDialog({
  fullWidth = true,
  maxWidth = 'sm',
  fullScreen,
  ...props
}: ResponsiveDialogProps): React.JSX.Element {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('md'))
  return (
    <Dialog fullWidth={fullWidth} maxWidth={maxWidth} fullScreen={fullScreen ?? compact} {...props} />
  )
}
