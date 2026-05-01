import { useState } from 'react'
import Logo from '../components/Logo'
import { signUp } from '../lib/auth'

export default function Signup({ onLoginClick }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await signUp(formData.email, formData.password, formData.name)
    } catch (err) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <Logo />
        <h2>Criar sua conta</h2>
        
        {error && (
          <div className="error-message" style={{ display: 'block' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome Completo</label>
            <input 
              type="text" 
              id="name" 
              placeholder="Como deseja ser chamada?" 
              required 
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">E-mail profissional</label>
            <input 
              type="email" 
              id="email" 
              placeholder="seu@email.com" 
              required 
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Mínimo 6 caracteres" 
              minLength="6" 
              required 
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input 
              type="password" 
              id="confirmPassword" 
              placeholder="Repita sua senha" 
              required 
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Gerando acesso...' : 'Criar conta'}
          </button>
        </form>

        <div className="link-action">
          Já tem uma conta? <a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }}>Faça login</a>
        </div>
      </div>
    </div>
  )
}
