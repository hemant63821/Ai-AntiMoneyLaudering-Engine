import { useState } from 'react'
import { useAlerts, type ScreeningAlert } from '../context/AlertsContext'
import InvestigateDrawer from '../components/InvestigateDrawer'

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function Alerts() {
  const { alerts, loading, error } = useAlerts()
  const [selected, setSelected] = useState<ScreeningAlert | null>(null)

  return (
    <main className="main">
      <div className="page-header">
        <h2>Alerts</h2>
        <p>Transactions flagged by FATF jurisdiction screening.</p>
      </div>

      {loading && <p className="alerts-state">Loading alerts…</p>}
      {error && <p className="alerts-state alerts-state--error">Unable to load alerts: {error}</p>}

      {!loading && !error && alerts.length === 0 && (
        <p className="alerts-state">No high or critical alerts at this time.</p>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="alerts-table-wrap">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Risk</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Country</th>
                <th>Amount</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.transactionId}>
                  <td>
                    <span className={`tbl-badge tbl-badge--${alert.riskLevel}`}>
                      {alert.riskLevel === 'critical' ? 'Critical' : 'High'}
                    </span>
                  </td>
                  <td>
                    <span className="tbl-badge tbl-badge--fatf">FATF Sanctions</span>
                  </td>
                  <td className="tbl-cell-primary">{alert.customerName}</td>
                  <td className="tbl-cell-secondary">{alert.flaggedCountry}</td>
                  <td className="tbl-cell-amount">{USD.format(alert.amount)}</td>
                  <td className="tbl-cell-secondary">{alert.transactionDate}</td>
                  <td>
                    <button className="btn-investigate" onClick={() => setSelected(alert)}>
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <InvestigateDrawer alert={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  )
}
