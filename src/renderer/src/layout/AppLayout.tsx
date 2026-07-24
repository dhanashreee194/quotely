import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import Sidebar from './Sidebar'

export const DRAWER_WIDTH = 240

export default function AppLayout(): React.JSX.Element {
  const theme = useTheme()
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = (): void => setMobileOpen(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar
        width={DRAWER_WIDTH}
        variant={isNarrow ? 'temporary' : 'permanent'}
        open={isNarrow ? mobileOpen : true}
        onClose={closeMobile}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minWidth: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {isNarrow && (
          <AppBar
            position="sticky"
            color="inherit"
            elevation={0}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Toolbar sx={{ minHeight: 56, gap: 1 }}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" color="primary" noWrap>
                Quotely
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        <Box
          sx={{
            flexGrow: 1,
            px: { xs: 2, sm: 2.5, md: 3 },
            py: { xs: 2, sm: 2.5, md: 3 },
            minWidth: 0,
            overflowX: 'hidden'
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
