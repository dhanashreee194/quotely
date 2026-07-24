import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

type PageShellProps = {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  /** Cap content width; pages stay full-bleed within the shell up to this. */
  maxWidth?: number | string
}

/**
 * Shared page chrome: uniform heading/subtitle spacing, actions row, and content width.
 */
export default function PageShell({
  title,
  subtitle,
  actions,
  children,
  maxWidth = 1400
}: PageShellProps): React.JSX.Element {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth,
        mx: 'auto',
        minWidth: 0
      }}
    >
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'flex-start' },
            gap: 1.5
          }}
        >
          <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
            <Typography variant="h4" sx={{ wordBreak: 'break-word' }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {actions ? (
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                flexShrink: 0
              }}
            >
              {actions}
            </Stack>
          ) : null}
        </Stack>
        {children}
      </Stack>
    </Box>
  )
}
