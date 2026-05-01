import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getTotalPatients, getWeeklyConsultations, getPatientsWithoutReturn } from '../lib/data'
import { signOut } from '../lib/auth'

export default function Dashboard({ user, activeTab, setActiveTab, onNavigateToPatient }) {
  const [data, setData] = useState({
    totalPatients: 0,
    weeklyConsultations: 0,
    inactivePatients: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      setIsLoading(true)
      try {
        const [total, weekly, inactive] = await Promise.all([
          getTotalPatients(user.id),
          getWeeklyConsultations(user.id),
          getPatientsWithoutReturn(user.id)
        ])
        setData({
          totalPatients: total,
          weeklyConsultations: weekly,
          inactivePatients: inactive
        })
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

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
        <header className="dashboard-header">
          <div>
            <h2>Dashboard</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bem-vinda, Nutricionista</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
              {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consultório Digital</p>
          </div>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="label">Total de Pacientes</span>
            <span className="value">{isLoading ? '...' : data.totalPatients}</span>
          </div>
          <div className="stat-card">
            <span className="label">Consultas da Semana</span>
            <span className="value">{isLoading ? '...' : data.weeklyConsultations}</span>
          </div>
        </div>

        <div className="patients-list-card">
          <h3>Pacientes sem retorno (&gt;30 dias)</h3>
          {isLoading ? (
            <p className="empty-state">Carregando pacientes...</p>
          ) : data.inactivePatients.length > 0 ? (
            data.inactivePatients.map(p => (
              <div 
                key={p.id} 
                className="patient-item" 
                onClick={() => onNavigateToPatient(p.id)}
              >
                <span className="patient-name">{p.nome}</span>
                <span className="patient-days">{p.dias_sem_retorno} dias sem consulta</span>
              </div>
            ))
          ) : (
            <p className="empty-state">Nenhum paciente sem retorno no momento</p>
          )}
        </div>
      </div>
    </div>
  )
}
