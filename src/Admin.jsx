import { useState, useEffect } from 'react'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [matches, setMatches] = useState([])
  const [config, setConfig] = useState(null)
  const [newDate, setNewDate] = useState('')

  // Cargar los partidos cuando entramos al panel
  useEffect(() => {
    if (isAuthenticated) {
      fetch(`${SERVER_URL}/api/matches`)
        .then(res => res.json())
        .then(data => setMatches(data))
      
      fetch(`${SERVER_URL}/api/config`)
        .then(res => res.json())
        .then(data => setConfig(data))
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