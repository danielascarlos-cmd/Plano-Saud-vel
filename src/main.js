import './style.css'
import { signUp, signIn, signOut, onAuthChange, getCurrentUser } from './lib/auth'
import { getTotalPatients, getWeeklyConsultations, getPatientsWithoutReturn, getAllPatients, savePatient } from './lib/data'
import logoUrl from './assets/logo.png'

// Estado da Aplicação
let state = {
  view: 'loading', // 'login', 'signup', 'dashboard', 'pacientes', 'novo-paciente', 'loading'
  activeTab: 'dashboard', // Sidebar tab
  formTab: 'pessoal', // Novo Paciente form tab
  user: null,
  error: null,
  success: null,
  isSubmitting: false,
  isLoadingData: false,
  searchQuery: '',
  dashboardData: {
    totalPatients: 0,
    weeklyConsultations: 0,
    inactivePatients: []
  },
  patientList: []
}

const appEl = document.getElementById('app')

// --- Views (Geradores de HTML) ---

function Logo(isSidebar = false) {
  if (isSidebar) {
    return `
      <div class="sidebar-logo">
        <img src="${logoUrl}" alt="Plano Saudável">
        <h1>Plano Saudável</h1>
      </div>
    `
  }
  return `
    <div class="logo">
      <img src="${logoUrl}" alt="Plano Saudável" style="height: 80px; margin-bottom: 10px;">
      <h1>Plano Saudável</h1>
      <span>NutriSystem</span>
    </div>
  `
}

function LoadingView() {
  return `<div style="text-align:center; padding: 50px;">Carregando...</div>`
}

function LoginView() {
  return `
    <div class="auth-container">
      <div class="card auth-card">
        ${Logo()}
        <h2>Bem-vinda de volta</h2>
        
        <div id="error-box" class="error-message" style="${state.error ? 'display:block' : ''}">
          ${state.error || ''}
        </div>

        <form id="login-form">
          <div class="form-group">
            <label for="email">E-mail</label>
            <input type="email" id="email" placeholder="seu@email.com" required>
          </div>
          <div class="form-group">
            <label for="password">Senha</label>
            <input type="password" id="password" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn" ${state.isSubmitting ? 'disabled' : ''}>
            ${state.isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div class="link-action">
          Não tem uma conta? <a href="#" id="go-to-signup">Cadastre-se</a>
        </div>
      </div>
    </div>
  `
}

function SignupView() {
  return `
    <div class="auth-container">
      <div class="card auth-card">
        ${Logo()}
        <h2>Criar sua conta</h2>
        
        <div id="error-box" class="error-message" style="${state.error ? 'display:block' : ''}">
          ${state.error || ''}
        </div>

        <form id="signup-form">
          <div class="form-group">
            <label for="name">Nome Completo</label>
            <input type="text" id="name" placeholder="Como deseja ser chamada?" required>
          </div>
          <div class="form-group">
            <label for="email">E-mail profissional</label>
            <input type="email" id="email" placeholder="seu@email.com" required>
          </div>
          <div class="form-group">
            <label for="password">Senha</label>
            <input type="password" id="password" placeholder="Mínimo 6 caracteres" minlength="6" required>
          </div>
          <div class="form-group">
            <label for="confirm-password">Confirmar Senha</label>
            <input type="password" id="confirm-password" placeholder="Repita sua senha" required>
          </div>
          <button type="submit" class="btn" ${state.isSubmitting ? 'disabled' : ''}>
            ${state.isSubmitting ? 'Gerando acesso...' : 'Criar conta'}
          </button>
        </form>

        <div class="link-action">
          Já tem uma conta? <a href="#" id="go-to-login">Faça login</a>
        </div>
      </div>
    </div>
  `
}

function Sidebar() {
  return `
    <aside class="sidebar">
      ${Logo(true)}
      <nav class="nav-menu">
        <a href="#" class="nav-item ${state.activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Dashboard</span>
        </a>
        <a href="#" class="nav-item ${state.activeTab === 'pacientes' ? 'active' : ''}" data-tab="pacientes">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>Pacientes</span>
        </a>
      </nav>
      <div class="sidebar-footer">
        <button id="logout-btn" class="logout-btn" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  `
}

function DashboardContent() {
  const { totalPatients, weeklyConsultations, inactivePatients } = state.dashboardData

  return `
    <div class="main-content">
      <header class="dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Bem-vinda, Nutricionista</p>
        </div>
        <div style="text-align: right">
          <p style="font-weight: 600; color: var(--primary-dark)">${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p>
          <p style="font-size: 0.8rem; color: var(--text-muted)">Consultório Digital</p>
        </div>
      </header>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="label">Total de Pacientes</span>
          <span class="value">${state.isLoadingData ? '...' : totalPatients}</span>
        </div>
        <div class="stat-card">
          <span class="label">Consultas da Semana</span>
          <span class="value">${state.isLoadingData ? '...' : weeklyConsultations}</span>
        </div>
      </div>

      <div class="patients-list-card">
        <h3>Pacientes sem retorno (>30 dias)</h3>
        ${state.isLoadingData ? 
          '<p class="empty-state">Carregando pacientes...</p>' : 
          inactivePatients.length > 0 ? 
            inactivePatients.map(p => `
              <div class="patient-item" data-id="${p.id}">
                <span class="patient-name">${p.nome}</span>
                <span class="patient-days">${p.dias_sem_retorno} dias sem consulta</span>
              </div>
            `).join('') : 
            '<p class="empty-state">Nenhum paciente sem retorno no momento</p>'
        }
      </div>
    </div>
  `
}

function DashboardView() {
  return `
    <div class="dashboard-layout">
      ${Sidebar()}
      ${DashboardContent()}
    </div>
  `
}

function PacientesView() {
  return `
    <div class="dashboard-layout">
      ${Sidebar()}
      <div class="main-content">
        <header class="patient-list-header">
          <div class="search-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="patient-search" placeholder="Buscar paciente por nome..." value="${state.searchQuery}">
          </div>
          <button id="btn-new-patient" class="btn" style="width: auto; padding: 12px 25px; margin-top: 0;">+ Novo Paciente</button>
        </header>

        ${state.isLoadingData ? 
          '<p class="empty-state">Carregando pacientes...</p>' : 
          state.patientList.length > 0 ? `
            <div class="patients-grid">
              ${state.patientList.map(p => `
                <div class="patient-card" data-id="${p.id}">
                  <h3>${p.nome}</h3>
                  <div class="goal">${p.objetivos?.join(', ') || p.objetivo_texto || 'Sem objetivo definido'}</div>
                  <div class="last-visit">
                    Última consulta: ${p.data_ultima_consulta ? new Date(p.data_ultima_consulta).toLocaleDateString('pt-BR') : 'Nenhuma realizada'}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="patients-list-card">
              <p class="empty-state">${state.searchQuery ? 'Nenhum paciente encontrado para esta busca.' : 'Nenhum paciente cadastrado ainda.'}</p>
            </div>
          `
        }
      </div>
    </div>
  `
}

function NovoPacienteView() {
  return `
    <div class="dashboard-layout">
      ${Sidebar()}
      <div class="main-content">
        <header class="dashboard-header">
          <div>
            <h2 id="patient-form-name">Novo Paciente</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Preencha os dados para iniciar o acompanhamento</p>
          </div>
          <button id="btn-cancel-form" class="btn-secondary btn" style="width: auto; margin-top: 0;">Cancelar</button>
        </header>

        <form id="new-patient-form" class="form-container">
          <div class="form-tabs">
            <button type="button" class="tab-btn ${state.formTab === 'pessoal' ? 'active' : ''}" data-tab="pessoal">Pessoal</button>
            <button type="button" class="tab-btn ${state.formTab === 'clinico' ? 'active' : ''}" data-tab="clinico">Clínico</button>
            <button type="button" class="tab-btn ${state.formTab === 'habitos' ? 'active' : ''}" data-tab="habitos">Hábitos</button>
          </div>

          <div class="form-content">
            <!-- ABA 1: PESSOAL -->
            <div class="tab-pane ${state.formTab === 'pessoal' ? 'active' : ''}" id="pane-pessoal">
              <div class="form-grid">
                <div class="form-group full-width">
                  <label for="nome">Nome Completo *</label>
                  <input type="text" id="nome" name="nome" placeholder="Nome completo do paciente" required>
                </div>
                <div class="form-group">
                  <label for="data_nascimento">Data de Nascimento</label>
                  <input type="date" id="data_nascimento" name="data_nascimento">
                  <p id="display-idade" style="font-size: 0.8rem; color: var(--primary-dark); margin-top: 5px; font-weight: 600;"></p>
                </div>
                <div class="form-group">
                  <label for="sexo">Sexo</label>
                  <select id="sexo" name="sexo" class="btn btn-secondary" style="background: white; text-align: left; font-weight: 400;">
                    <option value="">Selecione</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div class="form-group full-width">
                  <label for="whatsapp">WhatsApp</label>
                  <input type="tel" id="whatsapp" name="whatsapp" placeholder="(00) 00000-0000">
                </div>
                <div class="form-group full-width">
                  <label for="email_p">E-mail</label>
                  <input type="email" id="email_p" name="email" placeholder="email@exemplo.com">
                </div>
              </div>
            </div>

            <!-- ABA 2: CLÍNICO -->
            <div class="tab-pane ${state.formTab === 'clinico' ? 'active' : ''}" id="pane-clinico">
              <div class="form-grid">
                <div class="form-group">
                  <label for="peso_inicial">Peso Atual</label>
                  <div class="input-with-suffix">
                    <input type="number" step="0.1" id="peso_inicial" name="peso_inicial" placeholder="0.0">
                    <span class="suffix">kg</span>
                  </div>
                </div>
                <div class="form-group">
                  <label for="altura">Altura</label>
                  <div class="input-with-suffix">
                    <input type="number" id="altura" name="altura" placeholder="0">
                    <span class="suffix">cm</span>
                  </div>
                </div>
                <div class="form-group full-width">
                  <label>IMC (Calculado)</label>
                  <input type="text" id="display-imc" class="readonly-field" readonly value="-" style="text-align: center; font-size: 1.2rem;">
                </div>
                
                <div class="form-group full-width">
                  <label>Objetivos</label>
                  <div class="choice-grid">
                    ${['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map(obj => `
                      <label class="choice-item">
                        <input type="checkbox" name="objetivos" value="${obj}">
                        <span>${obj}</span>
                      </label>
                    `).join('')}
                  </div>
                  <input type="text" name="objetivo_texto" placeholder="Outro objetivo ou observação..." style="margin-top: 15px;">
                </div>

                <div class="form-group full-width">
                  <label for="nivel_atividade">Nível de Atividade Física</label>
                  <select id="nivel_atividade" name="nivel_atividade" class="btn btn-secondary" style="background: white; text-align: left; font-weight: 400;">
                    <option value="">Selecione</option>
                    <option value="Sedentário">Sedentário</option>
                    <option value="Levemente ativo">Levemente ativo</option>
                    <option value="Moderadamente ativo">Moderadamente ativo</option>
                    <option value="Muito ativo">Muito ativo</option>
                    <option value="Extremamente ativo">Extremamente ativo</option>
                  </select>
                </div>

                <div class="form-group full-width">
                  <label>Patologias ou Condições</label>
                  <div class="choice-grid">
                    ${['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'].map(pat => `
                      <label class="choice-item">
                        <input type="checkbox" name="patologias" value="${pat}">
                        <span>${pat}</span>
                      </label>
                    `).join('')}
                    <label class="choice-item">
                      <input type="checkbox" name="patologias" value="Nenhum">
                      <span>Nenhum</span>
                    </label>
                  </div>
                  <input type="text" name="patologias_extra" placeholder="Outras patologias..." style="margin-top: 15px;">
                </div>

                <div class="form-group full-width">
                  <label>Restrições Alimentares</label>
                  <div class="choice-grid">
                    ${['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'].map(res => `
                      <label class="choice-item">
                        <input type="checkbox" name="restricoes_alimentares" value="${res}">
                        <span>${res}</span>
                      </label>
                    `).join('')}
                    <label class="choice-item">
                      <input type="checkbox" name="restricoes_alimentares" value="Nenhum">
                      <span>Nenhum</span>
                    </label>
                  </div>
                </div>

                <div class="form-group full-width">
                  <label>Alergias Alimentares</label>
                  <div class="choice-grid">
                    ${['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'].map(ale => `
                      <label class="choice-item">
                        <input type="checkbox" name="alergias" value="${ale}">
                        <span>${ale}</span>
                      </label>
                    `).join('')}
                    <label class="choice-item">
                      <input type="checkbox" name="alergias" value="Nenhum">
                      <span>Nenhum</span>
                    </label>
                  </div>
                </div>

                <div class="form-group full-width">
                  <label for="medicamentos">Medicamentos contínuos</label>
                  <textarea id="medicamentos" name="medicamentos" style="width: 100%; padding: 12px; border-radius: 12px; border: 2px solid #edf2f7; min-height: 80px;"></textarea>
                </div>
                <div class="form-group full-width">
                  <label for="suplementos">Suplementos em uso</label>
                  <textarea id="suplementos" name="suplementos" style="width: 100%; padding: 12px; border-radius: 12px; border: 2px solid #edf2f7; min-height: 80px;"></textarea>
                </div>
              </div>
            </div>

            <!-- ABA 3: HÁBITOS -->
            <div class="tab-pane ${state.formTab === 'habitos' ? 'active' : ''}" id="pane-habitos">
              <div class="form-grid">
                <div class="form-group">
                  <label for="refeicoes_por_dia">Refeições por dia</label>
                  <input type="number" id="refeicoes_por_dia" name="refeicoes_por_dia" placeholder="Ex: 5">
                </div>
                <div class="form-group">
                  <label for="litros_agua">Água por dia</label>
                  <div class="input-with-suffix">
                    <input type="number" step="0.1" id="litros_agua" name="litros_agua" placeholder="0.0">
                    <span class="suffix">litros</span>
                  </div>
                </div>
                <div class="form-group">
                  <label for="horario_acorda">Horário que acorda</label>
                  <input type="number" id="horario_acorda" name="horario_acorda" placeholder="Ex: 630 para 06:30">
                  <p id="display-acorda" style="font-size: 0.8rem; color: var(--primary-dark); margin-top: 5px; font-weight: 600;"></p>
                </div>
                <div class="form-group">
                  <label for="horario_dorme">Horário que dorme</label>
                  <input type="number" id="horario_dorme" name="horario_dorme" placeholder="Ex: 2230 para 22:30">
                  <p id="display-dorme" style="font-size: 0.8rem; color: var(--primary-dark); margin-top: 5px; font-weight: 600;"></p>
                </div>
                <div class="form-group full-width">
                  <label>Pratica atividade física?</label>
                  <div style="display: flex; gap: 20px; margin-top: 10px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="radio" name="atividade_fisica" value="true"> Sim
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="radio" name="atividade_fisica" value="false" checked> Não
                    </label>
                  </div>
                </div>
                <div id="extra-atividade" class="form-group full-width" style="display: none;">
                  <label for="atividade_fisica_descricao">Qual atividade e frequência semanal?</label>
                  <input type="text" id="atividade_fisica_descricao" name="atividade_fisica_descricao" placeholder="Ex: Musculação 5x/semana">
                </div>
                <div class="form-group full-width">
                  <label for="observacoes">Observações gerais</label>
                  <textarea id="observacoes" name="observacoes" style="width: 100%; padding: 12px; border-radius: 12px; border: 2px solid #edf2f7; min-height: 100px;"></textarea>
                </div>
              </div>
            </div>

            <div id="form-error" class="error-message"></div>
            
            <div class="form-actions">
              <button type="submit" class="btn" style="width: auto; padding: 12px 40px;" ${state.isSubmitting ? 'disabled' : ''}>
                ${state.isSubmitting ? 'Salvando...' : 'Salvar Paciente'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `
}

// --- Lógica de Dados ---

async function loadDashboardData() {
  if (!state.user) return

  state.isLoadingData = true
  render()

  try {
    const [total, weekly, inactive] = await Promise.all([
      getTotalPatients(state.user.id),
      getWeeklyConsultations(state.user.id),
      getPatientsWithoutReturn(state.user.id)
    ])

    state.dashboardData = {
      totalPatients: total,
      weeklyConsultations: weekly,
      inactivePatients: inactive
    }
  } catch (err) {
    console.error('Erro ao carregar dados do dashboard:', err)
  } finally {
    state.isLoadingData = false
    render()
  }
}

async function loadPatientsData() {
  if (!state.user) return
  state.isLoadingData = true
  render()
  try {
    const patients = await getAllPatients(state.user.id, state.searchQuery)
    state.patientList = patients
  } catch (err) {
    console.error('Erro ao carregar pacientes:', err)
  } finally {
    state.isLoadingData = false
    render()
  }
}

// --- Lógica Principal ---

function render() {
  if (state.view === 'loading') {
    appEl.innerHTML = LoadingView()
  } else if (state.view === 'login') {
    appEl.innerHTML = LoginView()
    attachLoginListeners()
  } else if (state.view === 'signup') {
    appEl.innerHTML = SignupView()
    attachSignupListeners()
  } else if (state.view === 'dashboard') {
    appEl.innerHTML = DashboardView()
    attachDashboardListeners()
  } else if (state.view === 'pacientes') {
    appEl.innerHTML = PacientesView()
    attachPacientesListeners()
  } else if (state.view === 'novo-paciente') {
    appEl.innerHTML = NovoPacienteView()
    attachNovoPacienteListeners()
  }
}

function navigate(view) {
  state.view = view
  state.error = null
  state.success = null
  render()
  
  if (view === 'dashboard') {
    loadDashboardData()
  } else if (view === 'pacientes') {
    loadPatientsData()
  }
}

// --- Listeners de Eventos ---

function attachLoginListeners() {
  document.getElementById('go-to-signup')?.addEventListener('click', (e) => {
    e.preventDefault()
    navigate('signup')
  })

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = e.target.email.value
    const password = e.target.password.value

    state.isSubmitting = true
    state.error = null
    render()

    try {
      await signIn(email, password)
      // O onAuthChange cuidará da navegação para o dashboard
    } catch (err) {
      state.error = 'Login falhou. Verifique seu e-mail e senha.'
      state.isSubmitting = false
      render()
    }
  })
}

function attachSignupListeners() {
  document.getElementById('go-to-login')?.addEventListener('click', (e) => {
    e.preventDefault()
    navigate('login')
  })

  document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const name = e.target.name.value
    const email = e.target.email.value
    const password = e.target.password.value
    const confirmPassword = e.target['confirm-password'].value

    if (password !== confirmPassword) {
      state.error = 'As senhas não coincidem.'
      render()
      return
    }

    if (password.length < 6) {
      state.error = 'A senha deve ter pelo menos 6 caracteres.'
      render()
      return
    }

    state.isSubmitting = true
    state.error = null
    render()

    try {
      await signUp(email, password, name)
    } catch (err) {
      state.error = err.message || 'Erro ao criar conta. Tente novamente.'
      state.isSubmitting = false
      render()
    }
  })
}

function attachDashboardListeners() {
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await signOut()
  })

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault()
      const tab = e.currentTarget.dataset.tab
      state.activeTab = tab
      navigate(tab)
    })
  })

  document.querySelectorAll('.patient-item').forEach(item => {
    item.addEventListener('click', () => {
      const patientId = item.dataset.id
      console.log('Navegar para perfil do paciente:', patientId)
    })
  })
}

function attachPacientesListeners() {
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await signOut()
  })

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault()
      const tab = e.currentTarget.dataset.tab
      state.activeTab = tab
      navigate(tab)
    })
  })

  document.getElementById('patient-search')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value
    // Debounce manual
    clearTimeout(state.searchTimeout)
    state.searchTimeout = setTimeout(() => {
      loadPatientsData()
    }, 500)
  })

  document.getElementById('btn-new-patient')?.addEventListener('click', () => {
    state.formTab = 'pessoal'
    navigate('novo-paciente')
  })

  document.querySelectorAll('.patient-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id
      console.log('Navegar para perfil:', id)
    })
  })
}

function attachNovoPacienteListeners() {
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await signOut()
  })

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault()
      const tab = e.currentTarget.dataset.tab
      state.activeTab = tab
      navigate(tab)
    })
  })

  document.getElementById('btn-cancel-form')?.addEventListener('click', () => {
    state.activeTab = 'pacientes'
    navigate('pacientes')
  })

  // Alternância de abas (DOM-based para não perder dados do formulário)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab
      state.formTab = targetTab
      
      // Atualizar botões
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      
      // Atualizar painéis
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'))
      document.getElementById(`pane-${targetTab}`)?.classList.add('active')
    })
  })

  const form = document.getElementById('new-patient-form')

  // Cálculos Automáticos
  form?.data_nascimento?.addEventListener('change', (e) => {
    const birth = new Date(e.target.value)
    if (!isNaN(birth)) {
      const age = new Date().getFullYear() - birth.getFullYear()
      document.getElementById('display-idade').textContent = `${age} anos`
    }
  })

  const updateIMC = () => {
    const peso = parseFloat(form.peso_inicial.value)
    const altura = parseFloat(form.altura.value) / 100
    if (peso && altura) {
      const imc = (peso / (altura * altura)).toFixed(1)
      document.getElementById('display-imc').value = imc
    }
  }

  form?.peso_inicial?.addEventListener('input', updateIMC)
  form?.altura?.addEventListener('input', updateIMC)

  const formatTime = (val) => {
    const s = val.toString().padStart(4, '0')
    return `${s.slice(0, 2)}:${s.slice(2, 4)}`
  }

  form?.horario_acorda?.addEventListener('input', (e) => {
    if (e.target.value) document.getElementById('display-acorda').textContent = formatTime(e.target.value)
  })

  form?.horario_dorme?.addEventListener('input', (e) => {
    if (e.target.value) document.getElementById('display-dorme').textContent = formatTime(e.target.value)
  })

  form?.atividade_fisica?.forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.getElementById('extra-atividade').style.display = e.target.value === 'true' ? 'block' : 'none'
    })
  })

  // Atualizar nome no título do formulário em tempo real
  form?.nome?.addEventListener('input', (e) => {
    const titleEl = document.getElementById('patient-form-name')
    if (titleEl) {
      titleEl.textContent = e.target.value ? `Novo Paciente: ${e.target.value}` : 'Novo Paciente'
    }
  })

  // Máscara de WhatsApp
  form?.whatsapp?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)
    
    if (value.length > 10) {
      e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
    } else if (value.length > 6) {
      e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`
    } else if (value.length > 2) {
      e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`
    } else if (value.length > 0) {
      e.target.value = `(${value}`
    }
  })

  // Estilo visual das escolhas
  document.querySelectorAll('.choice-item input').forEach(input => {
    input.addEventListener('change', (e) => {
      e.target.closest('.choice-item').classList.toggle('selected', e.target.checked)
    })
  })

  // Submissão do formulário
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const formData = new FormData(form)
    const payload = {
      nutricionista_id: state.user.id,
      nome: formData.get('nome'),
      data_nascimento: formData.get('data_nascimento') || null,
      sexo: formData.get('sexo') || null,
      whatsapp: formData.get('whatsapp') || null,
      email: formData.get('email') || null,
      peso_inicial: formData.get('peso_inicial') ? parseFloat(formData.get('peso_inicial')) : null,
      altura: formData.get('altura') ? parseFloat(formData.get('altura')) : null,
      objetivos: formData.getAll('objetivos'),
      objetivo_texto: formData.get('objetivo_texto') || null,
      nivel_atividade: formData.get('nivel_atividade') || null,
      patologias: formData.getAll('patologias'),
      restricoes_alimentares: formData.getAll('restricoes_alimentares'),
      alergias: formData.getAll('alergias'),
      medicamentos: formData.get('medicamentos') || null,
      suplementos: formData.get('suplementos') || null,
      refeicoes_por_dia: formData.get('refeicoes_por_dia') ? parseInt(formData.get('refeicoes_por_dia')) : null,
      horario_acorda: formData.get('horario_acorda') ? formatTime(formData.get('horario_acorda')) : null,
      horario_dorme: formData.get('horario_dorme') ? formatTime(formData.get('horario_dorme')) : null,
      litros_agua: formData.get('litros_agua') ? parseFloat(formData.get('litros_agua')) : null,
      atividade_fisica: formData.get('atividade_fisica') === 'true',
      atividade_fisica_descricao: formData.get('atividade_fisica_descricao') || null,
      observacoes: formData.get('observacoes') || null
    }

    state.isSubmitting = true
    render()

    try {
      const patient = await savePatient(payload)
      alert('Paciente cadastrado com sucesso!')
      console.log('Redirecionando para perfil:', patient.id)
      state.activeTab = 'pacientes'
      navigate('pacientes')
    } catch (err) {
      console.error(err)
      document.getElementById('form-error').textContent = 'Erro ao salvar paciente. Tente novamente.'
      document.getElementById('form-error').style.display = 'block'
      state.isSubmitting = false
      render()
    }
  })
}

// --- Inicialização ---

onAuthChange((event, session) => {
  if (session) {
    state.user = session.user
    state.isSubmitting = false
    navigate('dashboard')
  } else {
    state.user = null
    state.isSubmitting = false
    navigate('login')
  }
})

// Checar estado inicial
async function init() {
  const user = await getCurrentUser()
  if (user) {
    state.user = user
    navigate('dashboard')
  } else {
    navigate('login')
  }
}

init()
