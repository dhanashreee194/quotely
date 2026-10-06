import { NavLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import logoUrl from '../../../../resources/logo.png'
import { useAuthStore } from '../stores/authStore'

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardOutlinedIcon /> },
  { label: 'Quotations', path: '/quotations', icon: <RequestQuoteOutlinedIcon /> },
  { label: 'Customers', path: '/customers', icon: <PeopleAltOutlinedIcon /> },
  { label: 'Products', path: '/products', icon: <Inventory2OutlinedIcon /> },
  { label: 'Templates', path: '/templates', icon: <DescriptionOutlinedIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsOutlinedIcon /> }
] as const

export type SidebarProps = {
  width: number
  /** permanent on wide screens; temporary (hamburger) on narrow */
  variant: 'permanent' | 'temporary'
  open: boolean
  onClose: () => void
}

function NavContent({ onNavigate }: { onNavigate?: () => void }): React.JSX.Element {
  const { user, setUser } = useAuthStore()

  return (
    <>
      <Toolbar sx={{ px: 2, gap: 1.25, minHeight: 64 }}>
        <Box
          component="img"
          src={logoUrl}
          alt=""
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
            display: 'block'
          }}
        />
        <Typography variant="h6" color="primary" noWrap>
          Quotely
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', px: 1, flexGrow: 1 }}>
        <List disablePadding>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              end={item.path === '/'}
              onClick={onNavigate}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                color: 'text.secondary',
                '&.active': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'inherit'
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>
      {user && (
        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {user.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            Quote series {user.quotePrefix}
          </Typography>
          <ListItemButton
            onClick={() => {
              void window.api.auth.logout().then(() => setUser(null))
            }}
            sx={{ borderRadius: 1, mt: 1, px: 1, color: 'text.secondary' }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sign out" slotProps={{ primary: { variant: 'body2' } }} />
          </ListItemButton>
        </Box>
      )}
    </>
  )
}

export default function Sidebar({
  width,
  variant,
  open,
  onClose
}: SidebarProps): React.JSX.Element {
  const paperSx = {
    width,
    boxSizing: 'border-box' as const
  }

  if (variant === 'temporary') {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          [`& .MuiDrawer-paper`]: paperSx
        }}
      >
        <NavContent onNavigate={onClose} />
      </Drawer>
    )
  }

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        display: { xs: 'none', md: 'block' },
        width,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: paperSx
      }}
    >
      <NavContent />
    </Drawer>
  )
}
