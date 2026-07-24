import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import theme from './theme'
import AppLayout from './layout/AppLayout'
import DashboardPage from './pages/Dashboard'
import QuotationsPage from './pages/Quotations'
import QuotationEditorPage from './pages/QuotationEditor'
import QuotationPreviewPage from './pages/QuotationPreview'
import CustomersPage from './pages/Customers'
import ProductsPage from './pages/Products'
import TemplatesPage from './pages/Templates'
import SettingsPage from './pages/Settings'

export default function App(): React.JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route path="quotations/:id/preview" element={<QuotationPreviewPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="quotations/new" element={<QuotationEditorPage />} />
            <Route path="quotations/:id" element={<QuotationEditorPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}
