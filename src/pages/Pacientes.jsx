import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getAllPatients } from '../lib/data'
import { signOut } from '../lib/auth'

export default function Pacientes({ user, activeTab, setActiveTab, onNewPatient, onPatientClick }) {
  const [patients, setPatients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPatients = async () => {
      if (!user) return
      setIsLoading(true)
      try {
        const data = await getAllPatients(user.id, searchQuery)
        setPatients(data)
      } catch (err) {
        console.error('Erro ao carregar pacientes:', err)
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(() => {
      loadPatients()
    }, searchQuery ? 500 : 0)

    return () => clearTimeout(timeoutId)
  }, [user, searchQuery])

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="dashboard-layout">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      <div className="main-content">
        <header className="patient-list-header">
          <div className="search-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Buscar paciente por nome..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={onNewPatient}
            className="btn" 
            style={{ width: 'auto', padding: '12px 25px', marginTop: 0 }}
          >
            + Novo Paciente
          </button>
        </header>

        {isLoading ? (
          <p className="empty-state">Carregando pacientes...</p>
        ) : patients.length > 0 ? (
          <div className="patients-grid">
            {patients.map(p => (
              <div 
                key={p.id} 
                className="patient-card"
                onClick={() => onPatientClick(p.id)}
              >
                <h3>{p.nome}</h3>
                <div className="goal">
                  {p.objetivos?.join(', ') || p.objetivo_texto || 'Sem objetivo definido'}
                </div>
                <div className="last-visit">
                  Última consulta: {p.data_ultima_consulta ? new Date(p.data_ultima_consulta).toLocaleDateString('pt-BR') : 'Nenhuma realizada'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="patients-list-card">
            <p className="empty-state">
              {searchQuery ? 'Nenhum paciente encontrado para esta busca.' : 'Nenhum paciente cadastrado ainda.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
