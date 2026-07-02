import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { Outlet } from 'react-router-dom'
import Layout from './Layout.jsx'
import VotingModal from './VotingModal.jsx'
import './App.css'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'
const socket = io(SERVER_URL)

export default function App() {
  const [matches, setMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [userVotes, setUserVotes] = useState({})
  const [timerEndDate, setTimerEndDate] = useState(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [isVotingOpen, setIsVotingOpen] = useState(true)

  const totalGlobalVotes = matches.reduce((total, match) => total + match.votesA + match.votesB, 0)

  useEffect(() => {
    socket.on('initialData', setMatches)
    socket.on('yourVotes', setUserVotes)
    socket.on('matchUpdate', (updatedMatch) => {
      setMatches(current => current.map(m => m.id === updatedMatch.id ? updatedMatch : m))
      setSelectedMatch(prev => prev?.id === updatedMatch.id ? updatedMatch : prev)
    })

    fetch(`${SERVER_URL}/api/config`)
      .then(res => res.json())
      .then(data => { if (data) setTimerEndDate(new Date(data.timerEndDate)) })

    socket.on('timerUpdate', (newDate) => setTimerEndDate(new Date(newDate)))

    return () => {
      socket.off('initialData')
      socket.off('matchUpdate')
      socket.off('yourVotes')
      socket.off('timerUpdate')
    }
  }, [])

  useEffect(() => {
    if (!timerEndDate) return
    const interval = setInterval(() => {
      const distance = timerEndDate.getTime() - Date.now()
      if (distance < 0) {
        clearInterval(interval)
        setTimeLeft('VOTACIONES CERRADAS')
        setIsVotingOpen(false)
      } else {
        setIsVotingOpen(true)
        const days = Math.floor(distance / 86400000)
        const hours = Math.floor((distance % 86400000) / 3600000)
        const minutes = Math.floor((distance % 3600000) / 60000)
        const seconds = Math.floor((distance % 60000) / 1000)
        setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [timerEndDate])

  const handleVote = (matchId, team) => {
    const currentVote = userVotes[matchId]
    if (currentVote === team) return
    if (navigator.vibrate) navigator.vibrate(50)
    socket.emit('vote', { matchId, team, previousVote: currentVote })

    const updatedMatch = { ...selectedMatch }
    if (currentVote) {
      if (currentVote === 'teamA') updatedMatch.votesA -= 1
      if (currentVote === 'teamB') updatedMatch.votesB -= 1
    }
    if (team === 'teamA') updatedMatch.votesA += 1
    if (team === 'teamB') updatedMatch.votesB += 1

    setUserVotes(prev => ({ ...prev, [matchId]: team }))
    setSelectedMatch(updatedMatch)
    setMatches(prev => prev.map(m => m.id === matchId ? updatedMatch : m))
  }

  const shareMatch = async () => {
    const text = `¡VOTA! ¿Cuáles son las mejores fiestas? ${selectedMatch.teamA} VS ${selectedMatch.teamB} en el Aragón Prix. ¡Entra y apoya a tu pueblo! 👇`
    if (navigator.share) {
      try { await navigator.share({ title: 'Aragón Prix', text, url: window.location.href }) }
      catch (err) { console.log('Error compartiendo:', err) }
    } else {
      navigator.clipboard.writeText(text)
      alert('¡Enlace copiado!')
    }
  }

  return (
    <Layout totalVotes={totalGlobalVotes} timeLeft={timeLeft} isVotingOpen={isVotingOpen}>
      <Outlet context={{ matches, userVotes, isVotingOpen, setSelectedMatch, handleVote, shareMatch }} />
      {selectedMatch && (
        <VotingModal
          match={selectedMatch}
          userVote={userVotes[selectedMatch.id]}
          onClose={() => setSelectedMatch(null)}
          onVote={handleVote}
          onShare={shareMatch}
          isVotingOpen={isVotingOpen}
        />
      )}
    </Layout>
  )
}
