import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { saveMealPlan } from '../lib/data'
import { signOut } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function MealPlanGenerator({ user, patient, activeTab, setActiveTab, onBack, onSuccess }) {
  const [planoSemanal, setPlanoSemanal] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleLogout = async () => {
    await signOut()
  }

  const handleGenerateAI = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('gerar-plano', {
        body: { patientData: patient }
      })

      if (fnError) throw fnError
      
      if (data && data.plano_semanal) {
        setPlanoSemanal(data.plano_semanal)
      } else {
        throw new Error("Formato de resposta inválido da IA.")
      }
    } catch (err) {
      console.error(err)
      setError("Erro ao gerar plano com IA. Verifique se a GOOGLE_API_KEY está configurada corretamente nos Secrets do Supabase.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOptionChange = (dayIndex, mealKey, optionIndex, value) => {
    const newPlano = [...planoSemanal]
    newPlano[dayIndex].refeicoes[mealKey][optionIndex] = value
    setPlanoSemanal(newPlano)
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const payload = {
        paciente_id: patient.id,
        conteudo: { plano_semanal: planoSemanal }
      }
      
      await saveMealPlan(payload)
      alert('Plano alimentar salvo com sucesso!')
      onSuccess()
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar plano alimentar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const mealLabels = {
    cafe_da_manha: "☀️ Café da Manhã",
    lanche_manha: "🍎 Lanche da Manhã",
    almoco: "🍛 Almoço",
    lanche_tarde: "☕ Lanche da Tarde",
    jantar: "🥗 Jantar"
  }

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
              <h2>Gerador de Plano Alimentar IA</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Paciente: {patient.nome}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleGenerateAI} 
              className="btn" 
              style={{ width: 'auto', margin: 0, padding: '12px 30px', background: 'var(--primary-dark)' }}
              disabled={isGenerating || isSubmitting}
            >
              {isGenerating ? 'IA Gerando...' : '🪄 Gerar com IA'}
            </button>
            {planoSemanal.length > 0 && (
              <button 
                onClick={handleSave} 
                className="btn" 
                style={{ width: 'auto', margin: 0, padding: '12px 30px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : '💾 Salvar Plano'}
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="error-message" style={{ display: 'block', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {isGenerating && (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 20px', width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <h3>Analisando perfil e criando plano...</h3>
            <p style={{ color: 'var(--text-muted)' }}>Isso pode levar alguns segundos.</p>
            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}

        {!isGenerating && planoSemanal.length > 0 && (
          <div className="meal-plan-grid" style={{ marginTop: '20px' }}>
            {planoSemanal.map((dia, dayIdx) => (
              <div key={dayIdx} className="day-card card" style={{ marginBottom: '30px', padding: '25px' }}>
                <h3 style={{ borderBottom: '2px solid #edf2f7', paddingBottom: '15px', marginBottom: '25px', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  📅 {dia.dia}
                </h3>
                <div className="meals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                  {Object.entries(dia.refeicoes).map(([key, options]) => (
                    <div key={key} className="meal-group">
                      <h4 style={{ marginBottom: '15px', color: '#4a5568' }}>{mealLabels[key] || key}</h4>
                      {options.map((option, optIdx) => (
                        <div key={optIdx} style={{ marginBottom: '8px' }}>
                          <input 
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(dayIdx, key, optIdx, e.target.value)}
                            placeholder={`Opção ${optIdx + 1}`}
                            style={{ 
                              width: '100%', 
                              padding: '10px 15px', 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0',
                              fontSize: '0.9rem',
                              transition: 'border-color 0.2s',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isGenerating && planoSemanal.length === 0 && (
          <div className="empty-state" style={{ textAlign: 'center', padding: '80px 20px', background: '#f8fafc', borderRadius: '15px', border: '2px dashed #e2e8f0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🤖</div>
            <h3>Inteligência Artificial pronta!</h3>
            <p style={{ maxWidth: '500px', margin: '0 auto 20px', color: 'var(--text-muted)' }}>
              A IA analisará os objetivos, alergias e restrições de <strong>{patient.nome}</strong> para gerar um plano semanal personalizado com 5 opções por refeição.
            </p>
            <button 
              onClick={handleGenerateAI}
              className="btn"
              style={{ width: 'auto', padding: '12px 40px' }}
            >
              Iniciar Geração Automática
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
