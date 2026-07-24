import { useState } from 'react'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import PageShell from '../layout/PageShell'
import QuotationTemplateEditor from './QuotationTemplateEditor'
import TermsTemplatesPanel from './TermsTemplatesPanel'

export default function TemplatesPage(): React.JSX.Element {
  const [tab, setTab] = useState<'quotation' | 'terms'>('quotation')

  return (
    <PageShell
      title="Templates"
      subtitle="Configure quotation layouts (metadata engine) and reusable terms text."
    >
      <Tabs
        value={tab}
        onChange={(_event, value: 'quotation' | 'terms') => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab label="Quotation templates" value="quotation" />
        <Tab label="Terms templates" value="terms" />
      </Tabs>

      {tab === 'quotation' ? <QuotationTemplateEditor /> : <TermsTemplatesPanel />}
    </PageShell>
  )
}
