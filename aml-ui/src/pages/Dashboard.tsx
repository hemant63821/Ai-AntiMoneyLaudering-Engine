export default function Dashboard() {
  return (
    <main className="main">
      <section className="hero">
        <h2>RAG-Powered Compliance Assistant</h2>
        <p>Query FATF guidance, FinCEN typologies, and SAR cases using natural language.</p>
      </section>

      <div className="cards">
        <div className="card">
          <div className="card-icon">📋</div>
          <h3>FATF Guidance</h3>
          <p>Access FATF sanctions lists, grey-listed jurisdictions, and typology reports.</p>
        </div>
        <div className="card">
          <div className="card-icon">🔍</div>
          <h3>FinCEN Typologies</h3>
          <p>Search structuring, layering, and integration patterns from FinCEN advisories.</p>
        </div>
        <div className="card">
          <div className="card-icon">🚨</div>
          <h3>SAR Cases</h3>
          <p>Retrieve suspicious activity report cases relevant to your investigation.</p>
        </div>
      </div>
    </main>
  )
}
