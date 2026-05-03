import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⬡' },
  { to: '/alerts', label: 'Alerts', icon: '🔔' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-mark">⬡</span>
        <span className="sidebar-logo-text">AML Engine</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-link-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
