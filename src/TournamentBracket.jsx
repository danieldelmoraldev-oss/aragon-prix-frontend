import { useState, useRef, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const ROUND_ORDER = ['dieciseisavos', 'octavos', 'cuartos', 'semifinales', 'final']
const ROUND_LABELS = {
  dieciseisavos: 'Dieciseisavos',
  octavos: 'Octavos',
  cuartos: 'Cuartos',
  semifinales: 'Semifinales',
  final: 'Final',
}
// Cuántos partidos tiene cada fase para armar el esqueleto matemático
const MATCHES_PER_ROUND = [16, 8, 4, 2, 1] 

// --- CONSTANTES DE DISEÑO (en píxeles) ---
const CARD_W = 280      // Ancho de la tarjeta
const COL_GAP = 60      // Hueco horizontal entre fases (para la línea)
const COL_W = CARD_W + COL_GAP
const H_ACTIVE = 110    // Altura de tarjeta normal
const H_COMPACT = 52    // Altura de tarjeta "escachada"
const GAP_ACTIVE = 24   // Hueco vertical normal
const GAP_COMPACT = 8   // Hueco vertical escachado

export default function TournamentBracket() {
  const { matches, userVotes, isVotingOpen, setSelectedMatch } = useOutletContext()
  const [activeRound, setActiveRound] = useState(0)
  const hasAutoSelectedRound = useRef(false)
  const scrollRef = useRef(null)

  // Al entrar al cuadro, nos colocamos en la fase actual del torneo (no siempre en dieciseisavos)
  useEffect(() => {
    if (hasAutoSelectedRound.current || matches.length === 0) return

    const activeMatch = matches.find(m => m.status === 'active')
    const targetRound = activeMatch
      ? activeMatch.round
      : [...ROUND_ORDER].reverse().find(r => matches.some(m => m.round === r))

    const idx = ROUND_ORDER.indexOf(targetRound)
    if (idx !== -1) setActiveRound(idx)
    hasAutoSelectedRound.current = true
  }, [matches])

  // 1. Agrupamos los partidos reales que vienen de Mongo
  const roundMap = {}
  ROUND_ORDER.forEach(r => roundMap[r] = [])
  matches.forEach(m => {
    if (roundMap[m.round]) roundMap[m.round].push(m)
  })

  // 2. EL CEREBRO DEL LAYOUT: Calcula posiciones absolutas
  const layout = useMemo(() => {
    const pos = []
    for (let i = 0; i < ROUND_ORDER.length; i++) pos.push([])

    // A. Fase Activa (Centro gravitacional normal)
    let currentY = 40 
    for (let i = 0; i < MATCHES_PER_ROUND[activeRound]; i++) {
      pos[activeRound].push({
        centerY: currentY + H_ACTIVE / 2,
        height: H_ACTIVE,
        type: 'active'
      })
      currentY += H_ACTIVE + GAP_ACTIVE
    }

    // B. Fases Futuras (Derecha - Posición media)
    for (let r = activeRound + 1; r < ROUND_ORDER.length; r++) {
      for (let i = 0; i < MATCHES_PER_ROUND[r]; i++) {
        const child1 = pos[r - 1][i * 2]
        const child2 = pos[r - 1][i * 2 + 1]
        pos[r].push({
          centerY: (child1.centerY + child2.centerY) / 2,
          height: H_ACTIVE,
          type: 'next'
        })
      }
    }

    // C. Fases Pasadas (Izquierda - Contracción / Escachado)
    for (let r = activeRound - 1; r >= 0; r--) {
      for (let i = 0; i < MATCHES_PER_ROUND[r]; i++) {
        const parent = pos[r + 1][Math.floor(i / 2)]
        const isTopChild = i % 2 === 0
        
        const isImmPrev = r === activeRound - 1
        const h = isImmPrev ? H_COMPACT : 0
        const offset = isImmPrev ? (H_COMPACT / 2 + GAP_COMPACT / 2) : 0

        pos[r].push({
          centerY: parent.centerY + (isTopChild ? -offset : offset),
          height: h,
          type: isImmPrev ? 'prev' : 'hidden'
        })
      }
    }

    return pos
  }, [activeRound])

  // Altura total dinámica del lienzo para que haya scroll vertical si hace falta
  const totalHeight = Math.max((MATCHES_PER_ROUND[activeRound] * (H_ACTIVE + GAP_ACTIVE)) + 80, 300)
  const totalWidth = ROUND_ORDER.length * COL_W + 100

  // 3. IntersectionObserver: Detecta qué fase ves al arrastrar con el dedo
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'))
          setActiveRound(prev => prev !== index ? index : prev)
        }
      })
    }, {
      root: container,
      threshold: 1.0,
      rootMargin: "0px -40% 0px -40%" 
    })

    const markers = container.querySelectorAll('.scroll-marker')
    markers.forEach(m => observer.observe(m))

    return () => observer.disconnect()
  }, [])

  // 4. Mueve el scroll cuando tocas las flechitas
  useEffect(() => {
    if (scrollRef.current) {
      // Centramos la columna activa matemáticamente
      const targetX = (activeRound * COL_W) + 40 - (scrollRef.current.clientWidth / 2) + (CARD_W / 2)
      scrollRef.current.scrollTo({
        left: Math.max(0, targetX),
        behavior: 'smooth'
      })
    }
  }, [activeRound])

  return (
    <div className="bracket-wrapper">
      {/* NAVEGACIÓN */}
      <div className="bracket-nav">
        <button onClick={() => setActiveRound(prev => Math.max(0, prev - 1))} disabled={activeRound === 0}>
          <ChevronLeft size={24} />
        </button>
        <h2>{ROUND_LABELS[ROUND_ORDER[activeRound]]}</h2>
        <button onClick={() => setActiveRound(prev => Math.min(ROUND_ORDER.length - 1, prev + 1))} disabled={activeRound === ROUND_ORDER.length - 1}>
          <ChevronRight size={24} />
        </button>
      </div>

      {/* ÁREA DE DIBUJO Y SCROLL */}
      <div className="bracket-scroll-area" ref={scrollRef}>
        <div className="bracket-canvas" style={{ width: `${totalWidth}px`, height: `${totalHeight}px` }}>
          
          {/* Marcadores invisibles para detectar el scroll */}
          {ROUND_ORDER.map((round, rIndex) => (
            <div key={`marker-${round}`} className="scroll-marker snap-column" data-index={rIndex}
              style={{ left: `${rIndex * COL_W + 40 + (CARD_W / 2)}px` }} />
          ))}

          {/* LÍNEAS RECTAS SVG (Por debajo de todo) */}
          <svg className="bracket-lines-svg">
            {layout.map((roundMatches, rIndex) => {
              if (rIndex === ROUND_ORDER.length - 1) return null // La final no lanza líneas

              return roundMatches.map((startPos, mIndex) => {
                const parentPos = layout[rIndex + 1][Math.floor(mIndex / 2)]
                
                // Si origen y destino están ocultos, no dibujamos la línea
                if (startPos.type === 'hidden' && parentPos.type === 'hidden') return null

                const startX = (rIndex * COL_W) + CARD_W + 40
                const endX = ((rIndex + 1) * COL_W) + 40
                const midX = (startX + endX) / 2

                const path = `M ${startX} ${startPos.centerY} L ${midX} ${startPos.centerY} L ${midX} ${parentPos.centerY} L ${endX} ${parentPos.centerY}`

                return (
                  <path key={`line-${rIndex}-${mIndex}`} d={path} fill="none" stroke="#3a3d4a" strokeWidth="2"
                    className="svg-line-transition"
                    style={{ opacity: startPos.type === 'hidden' ? 0 : 1 }}
                  />
                )
              })
            })}
          </svg>

          {/* TARJETAS DE LOS PARTIDOS */}
          {layout.map((roundPositions, rIndex) => {
            return roundPositions.map((pos, mIndex) => {
              const match = roundMap[ROUND_ORDER[rIndex]][mIndex]
              const isHidden = pos.type === 'hidden'
              const isCompact = pos.type === 'prev'
              const isActive = pos.type === 'active'

              // Si la base de datos no tiene partido aquí aún, pintamos un placeholder
              if (!match) {
                return (
                  <div key={`empty-${rIndex}-${mIndex}`} 
                    className={`bracket-card-wrapper ${isHidden ? 'hidden-card' : ''}`}
                    style={{ left: `${rIndex * COL_W + 40}px`, width: `${CARD_W}px`, height: `${pos.height}px`, transform: `translateY(${pos.centerY - pos.height / 2}px)` }}>
                    <div className={`match-card placeholder-card ${isCompact ? 'compact-card' : ''}`}>
                      <span style={{opacity: isCompact ? 0 : 1}}>Por determinar</span>
                    </div>
                  </div>
                )
              }

              // Partido Real
              const total = match.votesA + match.votesB || 1
              const pctA = (match.votesA / total) * 100
              const pctB = (match.votesB / total) * 100
              // Ya ha pasado si la fase se cerró oficialmente, o si sigue "activa" pero
              // el temporizador global de votación ya ha expirado (aún sin avanzar de fase)
              const isPast = match.status === 'finished' || (match.status === 'active' && !isVotingOpen)
              const isVotable = match.status === 'active' && isVotingOpen

              return (
                <div key={match.id}
                  className={`bracket-card-wrapper ${isHidden ? 'hidden-card' : ''}`}
                  style={{ left: `${rIndex * COL_W + 40}px`, width: `${CARD_W}px`, height: `${pos.height}px`, transform: `translateY(${pos.centerY - pos.height / 2}px)`, zIndex: isActive ? 10 : 2 }}>
                  <div
                    className={`match-card ${isPast ? 'match-past' : ''} ${isVotable ? 'active-match' : ''} ${isCompact ? 'compact-card' : ''}`}
                    onClick={() => !isHidden && setSelectedMatch(match)}
                    style={{ height: '100%', borderColor: isActive ? 'var(--primary-green)' : '' }}>

                    {isPast && !isCompact && (
                      <span className="match-status-badge">
                        {match.status === 'finished' ? 'Finalizado' : 'Votación cerrada'}
                      </span>
                    )}

                    <div className={`team-row ${isPast && match.votesA >= match.votesB ? 'team-winner' : ''}`}>
                      <div className={`progress-bg ${pctA > pctB ? 'winning' : ''}`} style={{ width: `${pctA}%` }} />
                      <span className="team-name">{match.teamA || '???'} {userVotes[match.id] === 'teamA' && '✅'}</span>
                      <span className="team-score">{match.teamA ? `${Math.round(pctA)}%` : ''}</span>
                    </div>

                    <div className={`team-row ${isPast && match.votesB > match.votesA ? 'team-winner' : ''}`}>
                      <div className={`progress-bg ${pctB > pctA ? 'winning' : ''}`} style={{ width: `${pctB}%` }} />
                      <span className="team-name">{match.teamB || '???'} {userVotes[match.id] === 'teamB' && '✅'}</span>
                      <span className="team-score">{match.teamB ? `${Math.round(pctB)}%` : ''}</span>
                    </div>
                  </div>
                </div>
              )
            })
          })}
        </div>
      </div>
    </div>
  )
}