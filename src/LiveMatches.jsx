import { useOutletContext } from 'react-router-dom'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'

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
            const aLeading = pctA > pctB
            const bLeading = pctB > pctA

            return (
              <div
                key={match.id}
                className="duel-card"
                onClick={() => setSelectedMatch(match)}
              >
                <div className="live-badge">EN DIRECTO</div>

                <div className="duel-visual">
                  <div className={`duel-side side-a${userVotedThisMatch === 'teamA' ? ' voted-side' : ''}`}>
                    {match.teamA_image ? (
                      <img src={`${SERVER_URL}${match.teamA_image}`} alt={match.teamA} />
                    ) : (
                      <div className="duel-side-fallback">{match.teamA}</div>
                    )}
                  </div>
                  <div className={`duel-side side-b${userVotedThisMatch === 'teamB' ? ' voted-side' : ''}`}>
                    {match.teamB_image ? (
                      <img src={`${SERVER_URL}${match.teamB_image}`} alt={match.teamB} />
                    ) : (
                      <div className="duel-side-fallback">{match.teamB}</div>
                    )}
                  </div>

                  <span className="duel-team-label label-a">
                    {match.teamA}
                    {userVotedThisMatch === 'teamA' && <span className="check"> ✅</span>}
                  </span>
                  <span className="duel-team-label label-b">
                    {match.teamB}
                    {userVotedThisMatch === 'teamB' && <span className="check"> ✅</span>}
                  </span>

                  <div className="vs-circle">VS</div>
                </div>

                <div className="duel-stats">
                  <div className="duel-stats-row">
                    <span className={`pct${aLeading ? ' leading' : ''}`}>{Math.round(pctA)}%</span>
                    <span className={`pct${bLeading ? ' leading' : ''}`}>{Math.round(pctB)}%</span>
                  </div>
                  <div className="duel-bar">
                    <div className="duel-bar-fill side-a" style={{ width: `${pctA}%` }} />
                    <div className="duel-bar-fill side-b" style={{ width: `${pctB}%` }} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
