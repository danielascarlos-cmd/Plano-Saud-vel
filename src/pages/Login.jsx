import { useState } from 'react'
import Logo from '../components/Logo'
import { signIn } from '../lib/auth'

export default function Login({ onSignupClick }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await signIn(email, password)
    } catch (err) {
      setError('Login falhou. Verifique seu e-mail e senha.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <Logo />
        <h2>Bem-vinda de volta</h2>
        
        {error && (
          <div className="error-message" style={{ display: 'block' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input 
              type="email" 
              id="email" 
              placeholder="seu@email.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input 
              type="password" 
              id="password" 
              placeholder="••••••••" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="link-action">
          Não tem uma conta? <a href="#" onClick={(e) => { e.preventDefault(); onSignupClick(); }}>Cadastre-se</a>
        </div>
      </div>
    </div>
  )
}
