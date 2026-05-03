import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Alerts from './pages/Alerts'
import { AlertsProvider, useAlerts } from './context/AlertsContext'
import './App.css'

function AppShell() {
  const { liveCount: alertCount } = useAlerts()

  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-body">
        <header className="header">
          <div className="header-inner">
            <h1>AML Intelligence Engine</h1>
            <div className="header-actions">
              <Link to="/alerts" className="alerts-icon" aria-label={`${alertCount} alerts`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {alertCount > 0 && <span className="alerts-icon-badge">{alertCount}</span>}
              </Link>
            </div>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AlertsProvider>
        <AppShell />
      </AlertsProvider>
    </BrowserRouter>
  )
}
