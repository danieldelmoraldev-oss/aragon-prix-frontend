import { useOutletContext } from 'react-router-dom'

export default function LiveMatches() {
  const { matches, userVotes, setSelectedMatch } = useOutletContext()

  // ¡FILTRAMOS PARA QUEDARNOS SOLO CON LOS ACTIVOS!
  const activeMatches = matches.filter(m => m.status === 'active')

  return (
    <div className="live-container">
      <div className="round-column">
        <h3 className="round-title">Partidos en Directo</h3>

        {activeMatches.length === 0 ? (
          <p className="empty-state">No hay partidos en directo ahora mismo...</p>
        ) : (
          activeMatches.map(match => {
            const total = match.votesA + match.votesB || 1
            const pctA = (match.votesA / total) * 100
            const pctB = (match.votesB / total) * 100
            const userVotedThisMatch = userVotes[match.id]

            return (
              <div
                key={match.id}
                className={`match-card${match.status === 'active' ? ' live-card' : ''}`}
                onClick={() => setSelectedMatch(match)}
              >
                {match.status === 'active' && (
                  <div className="live-badge">EN DIRECTO</div>
                )}
                <div className="team-row">
                  <div className={`progress-bg ${pctA > pctB ? 'winning' : ''}`} style={{ width: `${pctA}%` }} />
                  <span className="team-name">
                    {match.teamA}
                    {userVotedThisMatch === 'teamA' && ' ✅'}
                  </span>
                  <span className="team-score">{Math.round(pctA)}%</span>
                </div>
                <div className="team-row">
                  <div className={`progress-bg ${pctB > pctA ? 'winning' : ''}`} style={{ width: `${pctB}%` }} />
                  <span className="team-name">
                    {match.teamB}
                    {userVotedThisMatch === 'teamB' && ' ✅'}
                  </span>
                  <span className="team-score">{Math.round(pctB)}%</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
