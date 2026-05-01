import { useState, useEffect } from 'react'
import { onAuthChange, getCurrentUser } from './lib/auth'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import NovoPaciente from './pages/NovoPaciente'
import PerfilPaciente from './pages/PerfilPaciente'
import MealPlanGenerator from './pages/MealPlanGenerator'

export default function App() {
  const [view, setView] = useState('loading')
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          setView('dashboard')
        } else {
          setView('login')
        }
      } catch (err) {
        console.error('Erro na inicialização:', err)
        setView('login')
      }
    }

    init()

    const { data: { subscription } } = onAuthChange((event, session) => {
      if (session) {
        setUser(session.user)
        if (view === 'login' || view === 'signup' || view === 'loading') {
          setView('dashboard')
          setActiveTab('dashboard')
        }
      } else {
        setUser(null)
        setView('login')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleNavigateToPatient = (id) => {
    setSelectedPatientId(id)
    setView('perfil-paciente')
  }

  if (view === 'loading') {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando...</div>
  }

  if (view === 'login') {
    return <Login onSignupClick={() => setView('signup')} />
  }

  if (view === 'signup') {
    return <Signup onLoginClick={() => setView('login')} />
  }

  // Dashboard / Pacientes routing
  if (view === 'dashboard' && activeTab === 'dashboard') {
    return (
      <Dashboard 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onNavigateToPatient={handleNavigateToPatient}
      />
    )
  }

  if (view === 'pacientes' || (view === 'dashboard' && activeTab === 'pacientes')) {
    return (
      <Pacientes 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onNewPatient={() => setView('novo-paciente')}
        onPatientClick={handleNavigateToPatient}
      />
    )
  }

  if (view === 'novo-paciente') {
    return (
      <NovoPaciente 
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCancel={() => setView('pacientes')}
        onSuccess={() => setView('pacientes')}
      />
    )
  }

  if (view === 'perfil-paciente') {
    return (
      <PerfilPaciente 
        user={user}
        patientId={selectedPatientId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBack={() => setView('pacientes')}
        onGenerateMealPlan={(p) => {
          setSelectedPatient(p)
          setView('meal-plan-generator')
        }}
      />
    )
  }

  if (view === 'meal-plan-generator') {
    return (
      <MealPlanGenerator 
        user={user}
        patient={selectedPatient}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBack={() => setView('perfil-paciente')}
        onSuccess={() => setView('perfil-paciente')}
      />
    )
  }

  return <div>Página não encontrada</div>
}


