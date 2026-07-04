import { NavLink } from 'react-router-dom'
import { Users, Radio, Trophy } from 'lucide-react'

export default function Layout({ totalVotes, timeLeft, isVotingOpen, children }) {
  return (
    <div className="app-wrapper">
      <header className="hero">
        <h1 className="brand-logo">
          <span className="brand-word">Aragón</span>
          <span className="brand-word brand-accent">Prix</span>
        </h1>
        <p>¿Cuáles son las mejores fiestas de pueblos?</p>

        <div className="live-stats">
          <div className={`stat-badge${!isVotingOpen ? ' closed' : ''}`}>
            {isVotingOpen ? '🟢 Quedan: ' : '🔴 '}{timeLeft}
          </div>
          <div className="stat-badge">
            <Users size={16} />
            {totalVotes.toLocaleString()} votos
          </div>
        </div>

        <nav className="desktop-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `desktop-nav-link${isActive ? ' active' : ''}`}
          >
            <Radio size={16} />
            En Directo
          </NavLink>
          <NavLink
            to="/bracket"
            className={({ isActive }) => `desktop-nav-link${isActive ? ' active' : ''}`}
          >
            <Trophy size={16} />
            Cuadro
          </NavLink>
        </nav>
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer className="sponsors">
        <p>Colaboradores: Hoy Aragón | Anagan | Air Horizont | Granier</p>
      </footer>

      <nav className="bottom-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `bottom-nav-btn${isActive ? ' active' : ''}`}
        >
          <Radio size={22} />
          <span>En Directo</span>
        </NavLink>
        <NavLink
          to="/bracket"
          className={({ isActive }) => `bottom-nav-btn${isActive ? ' active' : ''}`}
        >
          <Trophy size={22} />
          <span>Cuadro</span>
        </NavLink>
      </nav>
    </div>
  )
}
