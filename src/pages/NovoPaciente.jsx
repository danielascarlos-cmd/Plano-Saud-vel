import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { savePatient } from '../lib/data'
import { signOut } from '../lib/auth'

export default function NovoPaciente({ user, activeTab, setActiveTab, onCancel, onSuccess }) {
  const [formTab, setFormTab] = useState('pessoal')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [],
    patologias_extra: '',
    restricoes_alimentares: [],
    alergias: [],
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: '',
    litros_agua: '',
    horario_acorda: '',
    horario_dorme: '',
    atividade_fisica: 'false',
    atividade_fisica_descricao: '',
    observacoes: ''
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      const currentValues = formData[name] || []
      const newValues = checked 
        ? [...currentValues, value]
        : currentValues.filter(v => v !== value)
      setFormData({ ...formData, [name]: newValues })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload = {
      nutricionista_id: user.id,
      nome: formData.nome,
      data_nascimento: formData.data_nascimento || null,
      sexo: formData.sexo || null,
      whatsapp: formData.whatsapp || null,
      email: formData.email || null,
      peso_inicial: formData.peso_inicial ? parseFloat(formData.peso_inicial) : null,
      altura: formData.altura ? parseFloat(formData.altura) : null,
      objetivos: formData.objetivos,
      objetivo_texto: formData.objetivo_texto || null,
      nivel_atividade: formData.nivel_atividade || null,
      patologias: formData.patologias,
      restricoes_alimentares: formData.restricoes_alimentares,
      alergias: formData.alergias,
      medicamentos: formData.medicamentos || null,
      suplementos: formData.suplementos || null,
      refeicoes_por_dia: formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia) : null,
      horario_acorda: formData.horario_acorda || null,
      horario_dorme: formData.horario_dorme || null,
      litros_agua: formData.litros_agua ? parseFloat(formData.litros_agua) : null,
      atividade_fisica: formData.atividade_fisica === 'true',
      atividade_fisica_descricao: formData.atividade_fisica_descricao || null,
      observacoes: formData.observacoes || null
    }

    try {
      await savePatient(payload)
      alert('Paciente cadastrado com sucesso!')
      onSuccess()
    } catch (err) {
      console.error('Erro ao salvar paciente:', err)
      setError('Erro ao salvar paciente. Verifique se todos os campos estão corretos.')
      setIsSubmitting(false)
    }
  }

  const calculateAge = (date) => {
    if (!date) return ''
    const birth = new Date(date)
    return `${new Date().getFullYear() - birth.getFullYear()} anos`
  }

  const calculateIMC = () => {
    const peso = parseFloat(formData.peso_inicial)
    const altura = parseFloat(formData.altura) / 100
    if (peso && altura) {
      return (peso / (altura * altura)).toFixed(1)
    }
    return '-'
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
            <h2>{formData.nome ? `Novo Paciente: ${formData.nome}` : 'Novo Paciente'}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Preencha os dados para iniciar o acompanhamento</p>
          </div>
          <button onClick={onCancel} className="btn-secondary btn" style={{ width: 'auto', marginTop: 0 }}>Cancelar</button>
        </header>

        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-tabs">
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

          <div className="form-content">
            {/* ABA 1: PESSOAL */}
            {formTab === 'pessoal' && (
              <div className="tab-pane active">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="nome">Nome Completo *</label>
                    <input 
                      type="text" 
                      name="nome" 
                      placeholder="Nome completo do paciente" 
                      required 
                      value={formData.nome}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="data_nascimento">Data de Nascimento</label>
                    <input 
                      type="date" 
                      name="data_nascimento"
                      value={formData.data_nascimento}
                      onChange={handleChange}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', marginTop: '5px', fontWeight: 600 }}>
                      {calculateAge(formData.data_nascimento)}
                    </p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="sexo">Sexo</label>
                    <select 
                      name="sexo" 
                      className="btn btn-secondary" 
                      style={{ background: 'white', textAlign: 'left', fontWeight: 400 }}
                      value={formData.sexo}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="whatsapp">WhatsApp</label>
                    <input 
                      type="tel" 
                      name="whatsapp" 
                      placeholder="(00) 00000-0000"
                      value={formData.whatsapp}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="email">E-mail</label>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="email@exemplo.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: CLÍNICO */}
            {formTab === 'clinico' && (
              <div className="tab-pane active">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="peso_inicial">Peso Atual</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        step="0.1" 
                        name="peso_inicial" 
                        placeholder="0.0"
                        value={formData.peso_inicial}
                        onChange={handleChange}
                      />
                      <span className="suffix">kg</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="altura">Altura</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        name="altura" 
                        placeholder="0"
                        value={formData.altura}
                        onChange={handleChange}
                      />
                      <span className="suffix">cm</span>
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label>IMC (Calculado)</label>
                    <input type="text" className="readonly-field" readOnly value={calculateIMC()} style={{ textAlign: 'center', fontSize: '1.2rem' }} />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Objetivos</label>
                    <div className="choice-grid">
                      {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map(obj => (
                        <label key={obj} className={`choice-item ${formData.objetivos.includes(obj) ? 'selected' : ''}`}>
                          <input 
                            type="checkbox" 
                            name="objetivos" 
                            value={obj}
                            checked={formData.objetivos.includes(obj)}
                            onChange={handleChange}
                          />
                          <span>{obj}</span>
                        </label>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      name="objetivo_texto" 
                      placeholder="Outro objetivo ou observação..." 
                      style={{ marginTop: '15px' }}
                      value={formData.objetivo_texto}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="nivel_atividade">Nível de Atividade Física</label>
                    <select 
                      name="nivel_atividade" 
                      className="btn btn-secondary" 
                      style={{ background: 'white', textAlign: 'left', fontWeight: 400 }}
                      value={formData.nivel_atividade}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      <option value="Sedentário">Sedentário</option>
                      <option value="Levemente ativo">Levemente ativo</option>
                      <option value="Moderadamente ativo">Moderadamente ativo</option>
                      <option value="Muito ativo">Muito ativo</option>
                      <option value="Extremamente ativo">Extremamente ativo</option>
                    </select>
                  </div>

                  {/* Adicionar Patologias, Restrições, etc. conforme necessário */}
                </div>
              </div>
            )}

            {/* ABA 3: HÁBITOS */}
            {formTab === 'habitos' && (
              <div className="tab-pane active">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="refeicoes_por_dia">Refeições por dia</label>
                    <input 
                      type="number" 
                      name="refeicoes_por_dia" 
                      placeholder="Ex: 5"
                      value={formData.refeicoes_por_dia}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="litros_agua">Água por dia</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        step="0.1" 
                        name="litros_agua" 
                        placeholder="0.0"
                        value={formData.litros_agua}
                        onChange={handleChange}
                      />
                      <span className="suffix">litros</span>
                    </div>
                  </div>
                  {/* Horários e Atividade Física */}
                  <div className="form-group full-width">
                    <label>Pratica atividade física?</label>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="atividade_fisica" 
                          value="true"
                          checked={formData.atividade_fisica === 'true'}
                          onChange={handleChange}
                        /> Sim
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="atividade_fisica" 
                          value="false"
                          checked={formData.atividade_fisica === 'false'}
                          onChange={handleChange}
                        /> Não
                      </label>
                    </div>
                  </div>
                  {formData.atividade_fisica === 'true' && (
                    <div className="form-group full-width">
                      <label htmlFor="atividade_fisica_descricao">Qual atividade e frequência semanal?</label>
                      <input 
                        type="text" 
                        name="atividade_fisica_descricao" 
                        placeholder="Ex: Musculação 5x/semana"
                        value={formData.atividade_fisica_descricao}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                  <div className="form-group full-width">
                    <label htmlFor="observacoes">Observações gerais</label>
                    <textarea 
                      name="observacoes" 
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #edf2f7', minHeight: '100px' }}
                      value={formData.observacoes}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="error-message" style={{ display: 'block' }}>{error}</div>}
            
            <div className="form-actions">
              <button type="submit" className="btn" style={{ width: 'auto', padding: '12px 40px' }} disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Paciente'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
