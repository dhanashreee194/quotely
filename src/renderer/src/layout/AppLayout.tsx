import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import Sidebar from './Sidebar'

const DRAWER_WIDTH = 240

export default function AppLayout(): React.JSX.Element {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar width={DRAWER_WIDTH} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
