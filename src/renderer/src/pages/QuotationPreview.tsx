import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import PrintIcon from '@mui/icons-material/Print'
import type { QuotationDocumentModel } from '../../../shared/document'
import QuotationDocument from '../components/QuotationDocument'
import '../components/QuotationDocument.css'

export default function QuotationPreviewPage(): React.JSX.Element {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const quotationId = Number(id)
  const mode = searchParams.get('mode')
  const isHeadless = mode === 'export' || mode === 'print'

  const [model, setModel] = useState<QuotationDocumentModel | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'pdf' | 'print' | null>(null)

  const load = useCallback(async (): Promise<void> => {
    if (!Number.isFinite(quotationId) || quotationId <= 0) {
      setError('Invalid quotation id')
      return
    }
    try {
      const next = await window.api.documents.getModel(quotationId)
      if (!next) {
        setError('Quotation not found')
        setModel(null)
        return
      }
      setModel(next)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
      setModel(null)
    }
  }, [quotationId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!isHeadless) return
    if (!model && !error) return

    let cancelled = false

    const waitForImages = async (): Promise<void> => {
      const root = document.querySelector('.qd-root')
      const images = root ? Array.from(root.querySelectorAll('img')) : []
      await Promise.all(
        images.map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.addEventListener('load', () => resolve(), { once: true })
                  img.addEventListener('error', () => resolve(), { once: true })
                })
        )
      )
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve())
      })
      if (!cancelled) {
        window.api.documents.notifyReady()
      }
    }

    void waitForImages()
    return () => {
      cancelled = true
    }
  }, [model, error, isHeadless])

  const handleExportPdf = async (): Promise<void> => {
    setBusy('pdf')
    setError('')
    try {
      const path = await window.api.documents.exportPdf(quotationId)
      if (path) {
        setError('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed')
    } finally {
      setBusy(null)
    }
  }

  const handlePrint = async (): Promise<void> => {
    setBusy('print')
    setError('')
    try {
      await window.api.documents.print(quotationId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Print failed')
    } finally {
      setBusy(null)
    }
  }

  if (!model && !error) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  return (
    <div className={isHeadless ? undefined : 'qd-screen-frame'}>
      {!isHeadless && (
        <Stack
          className="qd-no-print"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 2,
            px: { xs: 1.5, sm: 2 },
            py: 1.5,
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/quotations/${quotationId}`)}
            >
              Back
            </Button>
            <Typography variant="subtitle1" sx={{ wordBreak: 'break-word' }}>
              Preview {model?.quotation.quotationNumber ?? ''}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              disabled={busy != null || !model}
              onClick={() => void handleExportPdf()}
            >
              {busy === 'pdf' ? 'Exporting…' : 'Export PDF'}
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              disabled={busy != null || !model}
              onClick={() => void handlePrint()}
            >
              {busy === 'print' ? 'Printing…' : 'Print'}
            </Button>
          </Stack>
        </Stack>
      )}

      {error && !isHeadless && (
        <Alert severity="error" sx={{ m: 2 }} className="qd-no-print">
          {error}
        </Alert>
      )}

      {model && <QuotationDocument model={model} />}
    </div>
  )
}
