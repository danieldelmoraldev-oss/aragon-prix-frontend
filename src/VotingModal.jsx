import { X, Share2 } from 'lucide-react'

export default function VotingModal({ match, userVote, onClose, onVote, onShare, isVotingOpen }) {
  const total = match.votesA + match.votesB || 1
  const pctA = ((match.votesA / total) * 100).toFixed(1)
  const pctB = ((match.votesB / total) * 100).toFixed(1)
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'

  return (
    <div className="voting-overlay" onClick={onClose}>
      <div className="voting-modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h2>¡VOTA AHORA!</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="duel-container">
          <div className={`vote-card ${match.votesA > match.votesB ? 'active' : ''}`}>
            {match.teamA_image ? (
              <img src={`${SERVER_URL}${match.teamA_image}`} alt={match.teamA} className="town-image" />
            ) : (
              <div className="town-image-placeholder">[Foto de {match.teamA}]</div>
            )}
            <h3>{match.teamA}</h3>
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

          <div className={`vote-card ${match.votesB > match.votesA ? 'active' : ''}`}>
            {match.teamB_image ? (
              <img src={`${SERVER_URL}${match.teamB_image}`} alt={match.teamB} className="town-image" />
            ) : (
              <div className="town-image-placeholder">[Foto de {match.teamB}]</div>
            )}
            <h3>{match.teamB}</h3>
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

        <button
          onClick={onShare}
          style={{
            marginTop: '0.5rem', padding: '1rem', borderRadius: '12px',
            background: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', width: '100%'
          }}
        >
          <Share2 size={20} /> Compartir este duelo
        </button>
      </div>
    </div>
  )
}
