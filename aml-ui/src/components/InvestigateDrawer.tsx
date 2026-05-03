import { useEffect } from 'react'
import type { ScreeningAlert } from '../context/AlertsContext'
import './InvestigateDrawer.css'

interface Props {
  alert: ScreeningAlert
  onClose: () => void
}

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function riskPercentage(alert: ScreeningAlert): number {
  const topScore = alert.sources[0]?.score ?? 0
  if (alert.riskLevel === 'critical') return Math.round(90 + topScore * 10)
  return Math.round(65 + topScore * 25)
}

function RiskBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? '#ef4444' : '#f59e0b'
  return (
    <div className="risk-bar-wrap">
      <div className="risk-bar-track">
        <div className="risk-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="risk-bar-label" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function InvestigateDrawer({ alert, onClose }: Props) {
  const isOutward = alert.senderCountry !== alert.receiverCountry
  const topScore = alert.sources[0]?.score ?? null
  const riskPct = riskPercentage(alert)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{alert.customerName}</div>
            <div className="drawer-subtitle">{alert.transactionId}</div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="drawer-body">

          {/* Badges row */}
          <div className="drawer-badges">
            <span className={`drw-badge drw-badge--${alert.riskLevel}`}>
              {alert.riskLevel === 'critical' ? 'Critical' : 'High'}
            </span>
            <span className={`drw-badge drw-badge--list-${alert.listType === 'blacklist' ? 'black' : 'grey'}`}>
              {alert.listType === 'blacklist' ? 'FATF Blacklist' : 'FATF Grey-List'}
            </span>
            {isOutward && <span className="drw-badge drw-badge--outward">Outward Transaction</span>}
          </div>

          {/* Transaction flow */}
          <div className="drawer-section">
            <div className="drawer-section-label">Transaction Route</div>
            <div className="drawer-route">
              <div className="drawer-country">
                <span className="drawer-country-code">{alert.senderCountry}</span>
                <span className="drawer-country-role">Sender</span>
              </div>
              <svg className="drawer-route-arrow" width="32" height="16" viewBox="0 0 32 16" fill="none">
                <path d="M0 8h28M22 2l8 6-8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="drawer-country">
                <span className="drawer-country-code">{alert.receiverCountry}</span>
                <span className="drawer-country-role">Receiver</span>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="drawer-section">
            <div className="drawer-section-label">Transaction Details</div>
            <dl className="drawer-grid">
              <dt>Amount</dt>
              <dd className="mono">{USD.format(alert.amount)}</dd>
              <dt>Transaction Date</dt>
              <dd>{alert.transactionDate}</dd>
              <dt>Jurisdiction</dt>
              <dd>{alert.jurisdiction}</dd>
              <dt>Jurisdiction Date</dt>
              <dd>{alert.jurisdictionDate}</dd>
              {alert.flaggedCountry && <><dt>Flagged Country</dt><dd>{alert.flaggedCountry}</dd></>}
            </dl>
          </div>

          {/* Risk analysis */}
          <div className="drawer-section">
            <div className="drawer-section-label">Risk Analysis</div>
            <div className="drawer-risk-block">
              <div className="drawer-risk-row">
                <span className="drawer-risk-key">Potential Risk</span>
                <RiskBar pct={riskPct} />
              </div>
              {topScore !== null && (
                <div className="drawer-risk-row">
                  <span className="drawer-risk-key">Semantic Match Score</span>
                  <span className="drawer-risk-val mono">{topScore.toFixed(3)}</span>
                </div>
              )}
            </div>
            <p className="drawer-reason">{alert.reason}</p>
          </div>

          {/* Sources */}
          {alert.sources.length > 0 && (
            <div className="drawer-section">
              <div className="drawer-section-label">FATF Reference Documents</div>
              <div className="drawer-sources">
                {alert.sources.map((src, i) => (
                  <div key={i} className="drawer-source">
                    <div className="drawer-source-head">
                      <span className="drawer-source-title">{src.title}</span>
                      <span className="drawer-source-score mono">{src.score.toFixed(3)}</span>
                    </div>
                    {src.snippet && <p className="drawer-source-snippet">{src.snippet}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </aside>
    </div>
  )
}
