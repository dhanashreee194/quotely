import { useState } from 'react'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import QuotationTemplateEditor from './QuotationTemplateEditor'
import TermsTemplatesPanel from './TermsTemplatesPanel'

export default function TemplatesPage(): React.JSX.Element {
  const [tab, setTab] = useState<'quotation' | 'terms'>('quotation')

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4">Templates</Typography>
        <Typography color="text.secondary">
          Configure quotation layouts (metadata engine) and reusable terms text.
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_event, value: 'quotation' | 'terms') => setTab(value)}
      >
        <Tab label="Quotation templates" value="quotation" />
        <Tab label="Terms templates" value="terms" />
      </Tabs>

      {tab === 'quotation' ? <QuotationTemplateEditor /> : <TermsTemplatesPanel />}
    </Stack>
  )
}
