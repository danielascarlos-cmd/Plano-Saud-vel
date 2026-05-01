import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { getPatientById, getConsultationsByPatientId, getMealPlansByPatientId, updatePatient, saveConsultation } from '../lib/data'
import { signOut } from '../lib/auth'

export default function PerfilPaciente({ user, patientId, activeTab, setActiveTab, onBack, onGenerateMealPlan }) {
  const [profileTab, setProfileTab] = useState('dados')
  const [formTab, setFormTab] = useState('pessoal')
  const [patient, setPatient] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [mealPlans, setMealPlans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConsultationModal, setShowConsultationModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [metric, setMetric] = useState('peso')
  const chartRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [p, c, mp] = await Promise.all([
          getPatientById(patientId),
          getConsultationsByPatientId(patientId),
          getMealPlansByPatientId(patientId)
        ])
        setPatient(p)
        setConsultations(c)
        setMealPlans(mp)
      } catch (err) {
        console.error('Erro ao carregar perfil:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [patientId])

  useEffect(() => {
    if (profileTab === 'consultas' && consultations.length > 0 && canvasRef.current) {
      if (chartRef.current) {
        chartRef.current.destroy()
      }

      const sortedConsults = [...consultations].sort((a, b) => new Date(a.data_consulta) - new Date(b.data_consulta))
      const filteredConsults = sortedConsults.filter(c => c[metric] !== null)
      
      if (filteredConsults.length === 0 && (metric !== 'peso' || !patient.peso_inicial)) return

      const labels = filteredConsults.map(c => new Date(c.data_consulta).toLocaleDateString('pt-BR'))
      const values = filteredConsults.map(c => c[metric])

      if (metric === 'peso' && patient.peso_inicial) {
        labels.unshift('Inicial')
        values.unshift(patient.peso_inicial)
      }

      const metricLabels = {
        peso: 'Peso (kg)',
        cintura: 'Cintura (cm)',
        quadril: 'Quadril (cm)',
        percentual_gordura: 'Gordura (%)'
      }

      const colors = {
        peso: '#3b82f6',
        cintura: '#10b981',
        quadril: '#f59e0b',
        percentual_gordura: '#ef4444'
      }

      const ctx = canvasRef.current.getContext('2d')
      chartRef.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: metricLabels[metric],
            data: values,
            borderColor: colors[metric],
            backgroundColor: `${colors[metric]}1a`,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: colors[metric],
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: false, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
          }
        }
      })
    }
    return () => {
      if (chartRef.current) chartRef.current.destroy()
    }
  }, [profileTab, consultations, patient, metric])

  const handleLogout = async () => {
    await signOut()
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      const currentValues = patient[name] || []
      const newValues = checked 
        ? [...currentValues, value]
        : currentValues.filter(v => v !== value)
      setPatient({ ...patient, [name]: newValues })
    } else {
      setPatient({ ...patient, [name]: value })
    }
  }

  const handleUpdatePatient = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Limpar dados para o banco
    const { id, created_at, ...cleanData } = patient
    const payload = {
      ...cleanData,
      peso_inicial: cleanData.peso_inicial ? parseFloat(cleanData.peso_inicial) : null,
      altura: cleanData.altura ? parseFloat(cleanData.altura) : null,
      refeicoes_por_dia: cleanData.refeicoes_por_dia ? parseInt(cleanData.refeicoes_por_dia) : null,
      litros_agua: cleanData.litros_agua ? parseFloat(cleanData.litros_agua) : null,
      atividade_fisica: cleanData.atividade_fisica === 'true' || cleanData.atividade_fisica === true
    }

    try {
      await updatePatient(id, payload)
      alert('Dados do paciente atualizados com sucesso!')
    } catch (err) {
      console.error(err)
      alert('Erro ao atualizar dados do paciente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveConsultation = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const payload = {
      paciente_id: patient.id,
      data_consulta: formData.get('data_consulta'),
      peso: parseFloat(formData.get('peso')),
      cintura: formData.get('cintura') ? parseFloat(formData.get('cintura')) : null,
      quadril: formData.get('quadril') ? parseFloat(formData.get('quadril')) : null,
      percentual_gordura: formData.get('percentual_gordura') ? parseFloat(formData.get('percentual_gordura')) : null,
      proximo_retorno: formData.get('proximo_retorno') || null,
      observacoes: formData.get('observacoes') || null
    }

    setIsSubmitting(true)
    try {
      await saveConsultation(payload)
      const newConsultations = await getConsultationsByPatientId(patient.id)
      setConsultations(newConsultations)
      setShowConsultationModal(false)
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar consulta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando prontuário...</div>

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <div className="main-content">
        <header className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={onBack} className="btn-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <div>
              <h2>{patient.nome}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Prontuário Completo</p>
            </div>
          </div>
        </header>

        <div className="profile-tabs">
          {['dados', 'consultas', 'planos'].map(tab => (
            <button 
              key={tab}
              className={`profile-tab-btn ${profileTab === tab ? 'active' : ''}`}
              onClick={() => setProfileTab(tab)}
            >
              {tab === 'dados' ? '📋 Dados' : tab === 'consultas' ? '📈 Evolução' : '🍎 Planos'}
            </button>
          ))}
        </div>

        <div className="profile-content">
          {profileTab === 'dados' && (
            <div className="profile-section active">
              <div className="form-tabs" style={{ marginTop: 0, background: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
                {['pessoal', 'clinico', 'habitos'].map(tab => (
                  <button 
                    key={tab}
                    type="button" 
                    className={`tab-btn ${formTab === tab ? 'active' : ''}`}
                    onClick={() => setFormTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <form onSubmit={handleUpdatePatient} className="form-container" style={{ borderRadius: '0 0 12px 12px', borderTop: 'none' }}>
                {formTab === 'pessoal' && (
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Nome Completo</label>
                      <input type="text" name="nome" value={patient.nome} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Data de Nascimento</label>
                      <input type="date" name="data_nascimento" value={patient.data_nascimento || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Sexo</label>
                      <select name="sexo" value={patient.sexo || ''} onChange={handleChange}>
                        <option value="">Selecione</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>WhatsApp</label>
                      <input type="tel" name="whatsapp" value={patient.whatsapp || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>E-mail</label>
                      <input type="email" name="email" value={patient.email || ''} onChange={handleChange} />
                    </div>
                  </div>
                )}

                {formTab === 'clinico' && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Peso Inicial (kg)</label>
                      <input type="number" step="0.1" name="peso_inicial" value={patient.peso_inicial || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Altura (cm)</label>
                      <input type="number" name="altura" value={patient.altura || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group full-width">
                      <label>Objetivos</label>
                      <div className="choice-grid">
                        {['Emagrecer', 'Ganhar massa', 'Saúde geral', 'Performance'].map(obj => (
                          <label key={obj} className={`choice-item ${patient.objetivos?.includes(obj) ? 'selected' : ''}`}>
                            <input type="checkbox" name="objetivos" value={obj} checked={patient.objetivos?.includes(obj)} onChange={handleChange} />
                            <span>{obj}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="form-group full-width">
                      <label>Medicamentos / Suplementos</label>
                      <textarea name="medicamentos" value={patient.medicamentos || ''} onChange={handleChange} placeholder="Liste os medicamentos em uso..."></textarea>
                    </div>
                  </div>
                )}

                {formTab === 'habitos' && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Refeições/dia</label>
                      <input type="number" name="refeicoes_por_dia" value={patient.refeicoes_por_dia || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Água/dia (L)</label>
                      <input type="number" step="0.1" name="litros_agua" value={patient.litros_agua || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group full-width">
                      <label>Observações Adicionais</label>
                      <textarea name="observacoes" value={patient.observacoes || ''} onChange={handleChange} style={{ minHeight: '120px' }}></textarea>
                    </div>
                  </div>
                )}

                <div className="form-actions" style={{ marginTop: '20px' }}>
                  <button type="submit" className="btn" style={{ width: 'auto', padding: '12px 30px' }} disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : '💾 Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {profileTab === 'consultas' && (
            <div className="profile-section active">
              <div className="chart-card card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                  <h3>Evolução do Paciente</h3>
                  <div className="metric-selectors" style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    {[
                      { id: 'peso', label: 'Peso' },
                      { id: 'cintura', label: 'Cintura' },
                      { id: 'quadril', label: 'Quadril' },
                      { id: 'percentual_gordura', label: '% Gordura' }
                    ].map(m => (
                      <button key={m.id} onClick={() => setMetric(m.id)} className={`tab-btn ${metric === m.id ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: 'auto' }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowConsultationModal(true)} className="btn" style={{ width: 'auto', margin: 0, padding: '8px 20px' }}>+ Nova Consulta</button>
                </div>
                <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                  <canvas ref={canvasRef}></canvas>
                  {consultations.length === 0 && (metric !== 'peso' || !patient.peso_inicial) && (
                    <div className="empty-chart-overlay">Dados insuficientes para esta métrica</div>
                  )}
                </div>
              </div>
              <div className="consultations-list" style={{ marginTop: '25px' }}>
                <h3>Histórico de Consultas</h3>
                {consultations.sort((a, b) => new Date(b.data_consulta) - new Date(a.data_consulta)).map(c => (
                  <div key={c.id} className="consult-item card" style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{new Date(c.data_consulta).toLocaleDateString('pt-BR')}</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{c.peso} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profileTab === 'planos' && (
            <div className="profile-section active">
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <button onClick={() => onGenerateMealPlan(patient)} className="btn" style={{ width: 'auto', padding: '12px 30px' }}>✨ Gerar Plano com IA</button>
              </div>
              <div className="meal-plans-list">
                <h3>Planos Anteriores</h3>
                {mealPlans.length > 0 ? (
                  mealPlans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(mp => (
                    <div key={mp.id} className="meal-plan-item card" style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><strong>Data:</strong> {new Date(mp.created_at).toLocaleDateString('pt-BR')}</div>
                        <button onClick={() => setSelectedPlan(mp)} className="btn-secondary btn" style={{ width: 'auto', padding: '5px 15px', background: '#e2e8f0' }}>Visualizar</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">Nenhum plano gerado ainda.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedPlan && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Plano Alimentar - {new Date(selectedPlan.created_at).toLocaleDateString('pt-BR')}</h3>
              <button onClick={() => setSelectedPlan(null)} className="btn-icon">×</button>
            </div>
            <div className="plan-details-content" style={{ padding: '20px 0' }}>
              {selectedPlan.conteudo.plano_semanal?.map((dia, dIdx) => (
                <div key={dIdx} style={{ marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                  <h4 style={{ color: 'var(--primary-dark)', marginBottom: '15px' }}>📅 {dia.dia}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {Object.entries(dia.refeicoes).map(([refeicao, opções]) => (
                      <div key={refeicao}>
                        <strong style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>{refeicao.replace(/_/g, ' ')}</strong>
                        <ul style={{ paddingLeft: '20px', marginTop: '5px', fontSize: '0.9rem' }}>
                          {opções.map((opt, oIdx) => <li key={oIdx} style={{ marginBottom: '3px' }}>{opt}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )) || <pre>{JSON.stringify(selectedPlan.conteudo, null, 2)}</pre>}
            </div>
            <div className="form-actions">
              <button onClick={() => setSelectedPlan(null)} className="btn">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {showConsultationModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nova Consulta</h3>
              <button onClick={() => setShowConsultationModal(false)} className="btn-icon">×</button>
            </div>
            <form onSubmit={handleSaveConsultation}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Data</label>
                  <input type="date" name="data_consulta" defaultValue={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-group">
                  <label>Peso (kg)</label>
                  <input type="number" step="0.1" name="peso" placeholder="0.0" required />
                </div>
                <div className="form-group">
                  <label>Cintura (cm)</label>
                  <input type="number" step="0.1" name="cintura" placeholder="Opcional" />
                </div>
                <div className="form-group">
                  <label>Gordura (%)</label>
                  <input type="number" step="0.1" name="percentual_gordura" placeholder="Opcional" />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
