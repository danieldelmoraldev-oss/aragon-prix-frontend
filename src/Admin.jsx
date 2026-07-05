import { useState, useEffect } from 'react'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [matches, setMatches] = useState([])
  const [config, setConfig] = useState(null)
  const [newDate, setNewDate] = useState('')

  // === INICIO MODO SIMULACIÓN: estado (borrar este bloque para quitar la función) ===
  const [simStatus, setSimStatus] = useState({ active: false, backedUpAt: null })
  const [simMin, setSimMin] = useState(1000)
  const [simMax, setSimMax] = useState(50000)
  const [simTargetRound, setSimTargetRound] = useState('octavos')
  const [simLiveRunning, setSimLiveRunning] = useState(false)
  const [simLiveSpeed, setSimLiveSpeed] = useState('normal')
  // === FIN MODO SIMULACIÓN: estado ===

  // Cargar los partidos cuando entramos al panel
  useEffect(() => {
    if (isAuthenticated) {
      fetch(`${SERVER_URL}/api/matches`)
        .then(res => res.json())
        .then(data => setMatches(data))

      fetch(`${SERVER_URL}/api/config`)
        .then(res => res.json())
        .then(data => setConfig(data))

      // === INICIO MODO SIMULACIÓN (borrar para quitar la función) ===
      fetch(`${SERVER_URL}/api/simulation/status`)
        .then(res => res.json())
        .then(data => setSimStatus(data))

      fetch(`${SERVER_URL}/api/simulation/live/status`)
        .then(res => res.json())
        .then(data => setSimLiveRunning(data.running))
      // === FIN MODO SIMULACIÓN ===
    }
  }, [isAuthenticated])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === 'aragon2026') setIsAuthenticated(true)
    else alert('Contraseña incorrecta')
  }

  // Manejar cambios en los campos de texto
  const handleChange = (matchId, field, value) => {
    setMatches(current => current.map(m => m.id === matchId ? { ...m, [field]: value } : m))
  }

  // Subir la imagen al servidor y guardar la URL
  const handleImageUpload = async (matchId, team, file) => {
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch(`${SERVER_URL}/api/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      
      // Actualizamos el estado con la nueva URL de la imagen
      if (data.imageUrl) {
        const field = team === 'A' ? 'teamA_image' : 'teamB_image'
        handleChange(matchId, field, data.imageUrl)
        alert('✅ Imagen subida correctamente. Recuerda darle a Guardar Partido.')
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error)
      alert('Error al subir la imagen')
    }
  }

  // Guardar los cambios de un partido en MongoDB
  const handleSaveMatch = async (match) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamA: match.teamA,
          teamB: match.teamB,
          teamA_image: match.teamA_image,
          teamB_image: match.teamB_image
        })
      })
      if (response.ok) {
        alert(`✅ Duelo ${match.id} actualizado`)
      }
    } catch (error) {
      console.error('Error guardando:', error)
      alert('Error al guardar el partido')
    }
  }
  // Cambiar la fecha del temporizador
  const handleUpdateTimer = async () => {
    if (!newDate) return;
    const response = await fetch(`${SERVER_URL}/api/config/timer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timerEndDate: new Date(newDate) })
    })
    if (response.ok) {
      const updatedConfig = await response.json();
      setConfig(updatedConfig);
      alert('⏰ Temporizador actualizado');
    }
  }

  // Cerrar votaciones al instante
  const handleCloseVoting = async () => {
    if(!window.confirm('¿Seguro que quieres cerrar las votaciones ahora mismo?')) return;
    const pastDate = new Date(Date.now() - 10000); // Fecha en el pasado
    const response = await fetch(`${SERVER_URL}/api/config/timer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timerEndDate: pastDate })
    })
    if (response.ok) {
      const updatedConfig = await response.json();
      setConfig(updatedConfig);
      alert('🛑 Votaciones cerradas');
    }
  }

  // El botón mágico para pasar de fase
  const handleAdvancePhase = async () => {
    if(!window.confirm('⚠️ ATENCIÓN: Esto calculará los ganadores, congelará esta fase y creará la siguiente. ¿Estás seguro?')) return;
    
    const response = await fetch(`${SERVER_URL}/api/config/advance`, { method: 'POST' })
    if (response.ok) {
      alert('🚀 ¡Siguiente fase generada con éxito!');
      window.location.reload(); // Recargar para ver los nuevos partidos
    } else {
      const err = await response.json();
      alert('Error: ' + err.error);
    }
  }

  // === INICIO MODO SIMULACIÓN: handlers (borrar este bloque para quitar la función) ===
  const handleEnableSimulation = async () => {
    if (!window.confirm('Esto hará una copia de seguridad de los datos reales y activará el Modo Simulación. ¿Continuar?')) return;
    try {
      const response = await fetch(`${SERVER_URL}/api/simulation/enable`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) return alert('Error: ' + data.error)
      setSimStatus({ active: data.active, backedUpAt: data.backedUpAt })
      alert('🧪 Modo Simulación activado. Copia de seguridad creada.')
    } catch (error) {
      console.error(error)
      alert('Error activando el modo simulación')
    }
  }

  const handleRestoreReal = async () => {
    if (!window.confirm('⚠️ Esto eliminará toda la simulación y restaurará los datos reales. ¿Estás seguro?')) return;
    try {
      const response = await fetch(`${SERVER_URL}/api/simulation/restore`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) return alert('Error: ' + data.error)
      alert('✅ Datos reales restaurados')
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert('Error restaurando los datos reales')
    }
  }

  const handleGenerateSimulation = async () => {
    if (!window.confirm(`Se generarán votos falsos (entre ${simMin} y ${simMax}) para la ronda actual. ¿Continuar?`)) return;
    try {
      const response = await fetch(`${SERVER_URL}/api/simulation/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ min: simMin, max: simMax })
      })
      const data = await response.json()
      if (!response.ok) return alert('Error: ' + data.error)
      alert(`🎲 Simulación generada: ${data.votesInserted} votos en ${data.matchesAffected} partidos`)
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert('Error generando la simulación')
    }
  }

  const handleAdvanceToPhase = async () => {
    if (!window.confirm(`Esto avanzará automáticamente el torneo (generando votos y usando la lógica real de avance de fase) hasta "${simTargetRound}". ¿Continuar?`)) return;
    try {
      const response = await fetch(`${SERVER_URL}/api/simulation/advance-to`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRound: simTargetRound, min: simMin, max: simMax })
      })
      const data = await response.json()
      if (!response.ok) return alert('Error: ' + data.error)
      alert('🚀 Simulación completada hasta la fase: ' + data.currentRound)
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert('Error simulando hasta la fase indicada')
    }
  }

  const SIM_SPEED_OPTIONS = {
    lento: { intervalMs: 3000, matchesPerTick: 1 },
    normal: { intervalMs: 1500, matchesPerTick: 2 },
    rapido: { intervalMs: 700, matchesPerTick: 3 }
  }

  const handleStartLiveSimulation = async () => {
    try {
      const { intervalMs, matchesPerTick } = SIM_SPEED_OPTIONS[simLiveSpeed]
      const response = await fetch(`${SERVER_URL}/api/simulation/live/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMs, matchesPerTick })
      })
      const data = await response.json()
      if (!response.ok) return alert('Error: ' + data.error)
      setSimLiveRunning(true)
    } catch (error) {
      console.error(error)
      alert('Error iniciando la simulación de votos en tiempo real')
    }
  }

  const handleStopLiveSimulation = async () => {
    try {
      await fetch(`${SERVER_URL}/api/simulation/live/stop`, { method: 'POST' })
      setSimLiveRunning(false)
    } catch (error) {
      console.error(error)
      alert('Error deteniendo la simulación de votos en tiempo real')
    }
  }
  // === FIN MODO SIMULACIÓN: handlers ===

  // Resetear el torneo por completo (fuera del Modo Simulación, acción permanente)
  const handleResetTournament = async () => {
    if (!window.confirm('⚠️ Esto BORRARÁ todos los partidos y votos actuales, y creará el torneo desde cero (16 duelos de dieciseisavos con nombres genéricos). Los nombres y fotos que hayas puesto se perderán. ¿Seguro?')) return;
    const confirmText = window.prompt('Escribe RESETEAR (en mayúsculas) para confirmar:')
    if (confirmText !== 'RESETEAR') { alert('Cancelado'); return; }
    try {
      const response = await fetch(`${SERVER_URL}/api/admin/reset-tournament`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) return alert('Error: ' + data.error)
      alert(`🔄 Torneo reseteado correctamente. Se archivaron ${data.matchesArchived} partidos y ${data.votesArchived} votos para estadísticas futuras.`)
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert('Error reseteando el torneo')
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0b0f' }}>
        <form onSubmit={handleLogin} style={{ background: '#17181f', padding: '2rem', borderRadius: '16px', border: '1px solid #23252f', boxShadow: '0 12px 32px -8px rgba(0,0,0,0.6)', textAlign: 'center', width: '320px' }}>
          <h2 style={{ color: '#f4f6fa', marginBottom: '1rem' }}>Acceso Restringido</h2>
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '0.75rem', width: '100%', marginBottom: '1rem', background: '#1a1c24', color: '#f4f6fa', border: '1px solid #2d303c', borderRadius: '8px' }} />
          <button type="submit" style={{ width: '100%', padding: '0.75rem', background: '#00ffa3', color: '#04140d', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Entrar al Panel</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', background: '#0a0b0f' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00ffa3', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ color: '#f4f6fa' }}>⚙️ Panel de Control - Aragón Prix</h1>
        <button onClick={() => setIsAuthenticated(false)} style={{ background: '#ff4d61', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Sesión</button>
      </header>
      {/* PANEL DE CONTROL GLOBAL */}
      {config && (
        <div style={{ background: '#17181f', padding: '1.5rem', borderRadius: '12px', border: '2px solid #00ffa3', marginBottom: '2rem', boxShadow: '0 0 24px rgba(0,255,163,0.15)' }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#f4f6fa' }}>Fase Actual: {config.currentRound.toUpperCase()}</h2>
          <p style={{ marginBottom: '1rem', color: '#8b8d9a' }}>
            <strong style={{ color: '#f4f6fa' }}>Cierre de votaciones:</strong> {new Date(config.timerEndDate).toLocaleString('es-ES')}
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', color: '#8b8d9a' }}>Nueva fecha de cierre:</label>
              <input
                type="datetime-local"
                onChange={(e) => setNewDate(e.target.value)}
                style={{ padding: '0.5rem', background: '#1a1c24', color: '#f4f6fa', border: '1px solid #2d303c', borderRadius: '6px' }}
              />
            </div>
            <button onClick={handleUpdateTimer} style={{ padding: '0.6rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Actualizar Tiempo</button>
            <button onClick={handleCloseVoting} style={{ padding: '0.6rem 1rem', background: '#ff4d61', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Parar Votaciones Ya</button>

            <div style={{ flexGrow: 1, textAlign: 'right' }}>
              <button onClick={handleAdvancePhase} style={{ padding: '0.8rem 1.5rem', background: '#00ffa3', color: '#04140d', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                ⚡ AVANZAR A SIGUIENTE FASE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ZONA DE PELIGRO: acciones permanentes, independientes del Modo Simulación */}
      <div style={{ background: '#17181f', padding: '1.5rem', borderRadius: '12px', border: '2px solid #ff4d61', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: '#f4f6fa' }}>⚠️ Zona de Peligro</h2>
        <p style={{ marginBottom: '1rem', color: '#8b8d9a' }}>
          Borra todos los partidos y votos actuales y recrea el torneo desde cero, con los 16 duelos iniciales de dieciseisavos. Antes de borrar nada, guarda una copia permanente de los datos actuales (para estadísticas futuras), pero no los restaura automáticamente.
        </p>
        <button onClick={handleResetTournament} style={{ padding: '0.7rem 1.2rem', background: '#ff4d61', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          🔄 Resetear Torneo
        </button>
      </div>

      {/* === INICIO MODO SIMULACIÓN (borrar todo este bloque para quitar la función) === */}
      <div style={{ background: '#17181f', padding: '1.5rem', borderRadius: '12px', border: '2px solid #ffb020', marginBottom: '2rem', boxShadow: '0 0 24px rgba(255,176,32,0.12)' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: '#f4f6fa' }}>🧪 Modo Simulación</h2>
        <p style={{ marginBottom: '1rem', color: '#8b8d9a' }}>
          Estado: <strong style={{ color: simStatus.active ? '#ffb020' : '#00ffa3' }}>{simStatus.active ? 'MODO SIMULACIÓN' : 'MODO REAL'}</strong>
          {simStatus.active && simStatus.backedUpAt && (
            <> — copia de seguridad creada el {new Date(simStatus.backedUpAt).toLocaleString('es-ES')}</>
          )}
        </p>

        {!simStatus.active ? (
          <button onClick={handleEnableSimulation} style={{ padding: '0.7rem 1.2rem', background: '#ffb020', color: '#04140d', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Activar Modo Simulación
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', color: '#8b8d9a' }}>Votos mínimos</label>
                <input
                  type="number"
                  min="0"
                  value={simMin}
                  onChange={(e) => setSimMin(Number(e.target.value))}
                  style={{ padding: '0.5rem', width: '140px', background: '#1a1c24', color: '#f4f6fa', border: '1px solid #2d303c', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', color: '#8b8d9a' }}>Votos máximos</label>
                <input
                  type="number"
                  min="0"
                  value={simMax}
                  onChange={(e) => setSimMax(Number(e.target.value))}
                  style={{ padding: '0.5rem', width: '140px', background: '#1a1c24', color: '#f4f6fa', border: '1px solid #2d303c', borderRadius: '6px' }}
                />
              </div>
              <button onClick={handleGenerateSimulation} style={{ padding: '0.7rem 1.2rem', background: '#00ffa3', color: '#04140d', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                🎲 Generar Simulación
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', color: '#8b8d9a' }}>Simular hasta la fase</label>
                <select
                  value={simTargetRound}
                  onChange={(e) => setSimTargetRound(e.target.value)}
                  style={{ padding: '0.55rem', background: '#1a1c24', color: '#f4f6fa', border: '1px solid #2d303c', borderRadius: '6px' }}
                >
                  <option value="dieciseisavos">Dieciseisavos</option>
                  <option value="octavos">Octavos</option>
                  <option value="cuartos">Cuartos</option>
                  <option value="semifinales">Semifinales</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <button onClick={handleAdvanceToPhase} style={{ padding: '0.7rem 1.2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ⚡ Simular hasta esta fase
              </button>
            </div>

            <div style={{ background: '#1a1c24', padding: '1rem', borderRadius: '8px', border: '1px solid #23252f', marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.6rem', color: '#8b8d9a' }}>
                Votos en tiempo real: simula votantes llegando poco a poco (suben, bajan o ambas a la vez) para comprobar que la web pública se actualiza sola sin romper nada.
              </label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={simLiveSpeed}
                  onChange={(e) => setSimLiveSpeed(e.target.value)}
                  disabled={simLiveRunning}
                  style={{ padding: '0.55rem', background: '#0a0b0f', color: '#f4f6fa', border: '1px solid #2d303c', borderRadius: '6px' }}
                >
                  <option value="lento">Velocidad: Lenta</option>
                  <option value="normal">Velocidad: Normal</option>
                  <option value="rapido">Velocidad: Rápida</option>
                </select>

                {!simLiveRunning ? (
                  <button onClick={handleStartLiveSimulation} style={{ padding: '0.6rem 1.1rem', background: '#00ffa3', color: '#04140d', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ▶️ Iniciar votos en tiempo real
                  </button>
                ) : (
                  <button onClick={handleStopLiveSimulation} style={{ padding: '0.6rem 1.1rem', background: '#ff4d61', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ⏹️ Detener votos en tiempo real
                  </button>
                )}

                {simLiveRunning && <span style={{ color: '#00ffa3', fontWeight: 'bold' }}>● En marcha</span>}
              </div>
            </div>

            <button onClick={handleRestoreReal} style={{ padding: '0.7rem 1.2rem', background: '#ff4d61', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              🔴 Restaurar datos reales
            </button>
          </>
        )}
      </div>
      {/* === FIN MODO SIMULACIÓN === */}

      <div style={{ display: 'grid', gap: '2rem' }}>
        {matches.map((match) => (
          <div key={match.id} style={{ background: '#17181f', padding: '1.5rem', borderRadius: '12px', border: '1px solid #23252f', boxShadow: '0 4px 16px -4px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#f4f6fa' }}>Duelo {match.id} - {match.round}</h3>
              <button onClick={() => handleSaveMatch(match)} style={{ background: '#00ffa3', color: '#04140d', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                💾 Guardar Duelo
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Equipo A */}
              <div style={{ background: '#1a1c24', padding: '1rem', borderRadius: '8px', border: '1px solid #23252f' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem', color: '#f4f6fa' }}>Pueblo 1</label>
                <input
                  type="text"
                  value={match.teamA}
                  onChange={(e) => handleChange(match.id, 'teamA', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', background: '#0a0b0f', color: '#f4f6fa', border: '1px solid #2d303c' }}
                />
                <label style={{ fontSize: '0.9rem', color: '#8b8d9a', display: 'block', marginBottom: '0.5rem' }}>Foto Pueblo 1</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(match.id, 'A', e.target.files[0])}
                  style={{ marginBottom: '0.5rem', color: '#8b8d9a' }}
                />
                {match.teamA_image && <img src={`${SERVER_URL}${match.teamA_image}`} alt="Vista previa" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', display: 'block', border: '1px solid #2d303c' }} />}
              </div>

              {/* Equipo B */}
              <div style={{ background: '#1a1c24', padding: '1rem', borderRadius: '8px', border: '1px solid #23252f' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem', color: '#f4f6fa' }}>Pueblo 2</label>
                <input
                  type="text"
                  value={match.teamB}
                  onChange={(e) => handleChange(match.id, 'teamB', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', background: '#0a0b0f', color: '#f4f6fa', border: '1px solid #2d303c' }}
                />
                <label style={{ fontSize: '0.9rem', color: '#8b8d9a', display: 'block', marginBottom: '0.5rem' }}>Foto Pueblo 2</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(match.id, 'B', e.target.files[0])}
                  style={{ marginBottom: '0.5rem', color: '#8b8d9a' }}
                />
                {match.teamB_image && <img src={`${SERVER_URL}${match.teamB_image}`} alt="Vista previa" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', display: 'block', border: '1px solid #2d303c' }} />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}