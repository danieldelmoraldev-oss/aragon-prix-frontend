import { X, Share2 } from 'lucide-react'

export default function VotingModal({ match, userVote, onClose, onVote, onShare, isVotingOpen }) {
  const total = match.votesA + match.votesB || 1
  const pctA = ((match.votesA / total) * 100).toFixed(1)
  const pctB = ((match.votesB / total) * 100).toFixed(1)
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'

  // Ya ha pasado si la fase se cerró oficialmente, o si sigue "activa" pero
  // el temporizador global de votación ya ha expirado (aún sin avanzar de fase)
  const isPast = match.status === 'finished' || (match.status === 'active' && !isVotingOpen)

  return (
    <div className="voting-overlay" onClick={onClose}>
      <div className={`voting-modal ${isPast ? 'voting-modal-past' : ''}`} onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h2>{isPast ? (match.status === 'finished' ? 'Resultado Final' : 'Votación Cerrada') : '¡VOTA AHORA!'}</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        {isPast && (
          <p className="modal-past-banner">
            {match.status === 'finished'
              ? 'Este duelo ya ha terminado. Aquí tienes el resultado final.'
              : 'La votación de esta fase ya se ha cerrado. Estos son los resultados.'}
          </p>
        )}

        <div className="duel-container">
          <div className={`vote-card ${match.votesA > match.votesB ? 'active' : ''}`}>
            {match.teamA_image ? (
              <img src={match.teamA_image} alt={match.teamA} className="town-image"/>
            ) : (
              <div className="town-image-placeholder">[Foto de {match.teamA}]</div>
            )}
            <h3>{isPast && match.votesA >= match.votesB && '🏆 '}{match.teamA}</h3>
            <div className="vote-stats">
              <span>{match.votesA.toLocaleString()} votos</span>
              <span>{pctA}%</span>
            </div>
            <div className="bar-container">
              <div className="bar-fill" style={{ width: `${pctA}%` }}></div>
            </div>
            <button
              className={`vote-btn ${userVote === 'teamA' ? 'voted' : ''}`}
              onClick={() => {
                if (!isVotingOpen) { alert('El tiempo se ha acabado.'); return }
                if (match.status !== 'active') { alert('Esta ronda ya terminó.'); return }
                onVote(match.id, 'teamA')
              }}
              disabled={!isVotingOpen || match.status !== 'active'}
              style={{ opacity: (!isVotingOpen || match.status !== 'active') ? 0.5 : 1 }}
            >
              {userVote === 'teamA' ? '✅ VOTADO' : `VOTAR A ${match.teamA}`}
            </button>
          </div>

          <span className="vs-badge">VS</span>

          <div className={`vote-card ${match.votesB > match.votesA ? 'active' : ''}`}>
            {match.teamB_image ? (
              <img src={match.teamB_image} alt={match.teamB} className="town-image"/>
            ) : (
              <div className="town-image-placeholder">[Foto de {match.teamB}]</div>
            )}
            <h3>{isPast && match.votesB > match.votesA && '🏆 '}{match.teamB}</h3>
            <div className="vote-stats">
              <span>{match.votesB.toLocaleString()} votos</span>
              <span>{pctB}%</span>
            </div>
            <div className="bar-container">
              <div className="bar-fill" style={{ width: `${pctB}%` }}></div>
            </div>
            <button
              className={`vote-btn ${userVote === 'teamB' ? 'voted' : ''}`}
              onClick={() => {
                if (!isVotingOpen) { alert('El tiempo se ha acabado.'); return }
                if (match.status !== 'active') { alert('Esta ronda ya terminó.'); return }
                onVote(match.id, 'teamB')
              }}
              disabled={!isVotingOpen || match.status !== 'active'}
              style={{ opacity: (!isVotingOpen || match.status !== 'active') ? 0.5 : 1 }}
            >
              {userVote === 'teamB' ? '✅ VOTADO' : `VOTAR A ${match.teamB}`}
            </button>
          </div>
        </div>

        <button className="share-btn" onClick={onShare}>
          <Share2 size={20} /> Compartir este duelo
        </button>
      </div>
    </div>
  )
}
