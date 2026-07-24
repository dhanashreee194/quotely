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
import logoUrl from '../../../../resources/logo.png'

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardOutlinedIcon /> },
  { label: 'Quotations', path: '/quotations', icon: <RequestQuoteOutlinedIcon /> },
  { label: 'Customers', path: '/customers', icon: <PeopleAltOutlinedIcon /> },
  { label: 'Products', path: '/products', icon: <Inventory2OutlinedIcon /> },
  { label: 'Templates', path: '/templates', icon: <DescriptionOutlinedIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsOutlinedIcon /> }
] as const

type SidebarProps = {
  width: number
}

export default function Sidebar({ width }: SidebarProps): React.JSX.Element {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width,
          boxSizing: 'border-box'
        }
      }}
    >
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
      <Box sx={{ overflow: 'auto', px: 1 }}>
        <List disablePadding>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              end={item.path === '/'}
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
    </Drawer>
  )
}
