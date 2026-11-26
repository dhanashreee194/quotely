import './SilexLetterhead.css'

type Props = {
  /** Data URL for the original SILEX brand logo crop (from SILEX KITCHEN.docx). */
  logoDataUrl: string | null
  className?: string
}

/**
 * First-page letterhead from SILEX KITCHEN.docx — isolated reusable block.
 * Table layout (~46–48% left / remaining right) with a thin vertical separator.
 */
export default function SilexLetterhead({ logoDataUrl, className }: Props): React.JSX.Element {
  return (
    <table
      className={['silex-letterhead', className].filter(Boolean).join(' ')}
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
    >
      <tbody>
        <tr>
          <td className="silex-letterhead-left">
            {logoDataUrl ? (
              <img className="silex-letterhead-logo" src={logoDataUrl} alt="SILEX KITCHEN" />
            ) : (
              <div className="silex-letterhead-logo-fallback">SILEX KITCHEN</div>
            )}
            <p className="silex-letterhead-tagline">
              MODULAR KITCHEN | MODULAR FURNITURE | OFFICE FURNITURE
            </p>
          </td>
          <td className="silex-letterhead-divider-cell" aria-hidden>
            <div className="silex-letterhead-divider" />
          </td>
          <td className="silex-letterhead-right">
            <p className="silex-letterhead-name">SILEX KITCHEN</p>
            <p className="silex-letterhead-address">
              SHOWROOM –DHARMBHAKTI COMPLEX, OPP, BURKULE LAWNS
            </p>
            <p className="silex-letterhead-address">
              AMBAD LINK ROAD,NEAR SYMBIOSIS COLLEGE,NASHIK422009
            </p>
            <a className="silex-letterhead-email" href="mailto:admin@silexkitchen.com">
              admin@silexkitchen.com
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
