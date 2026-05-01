import logoUrl from '../assets/logo.png'

export default function Logo({ isSidebar = false }) {
  if (isSidebar) {
    return (
      <div className="sidebar-logo">
        <img src={logoUrl} alt="Plano Saudável" />
        <h1>Plano Saudável</h1>
      </div>
    )
  }
  return (
    <div className="logo">
      <img src={logoUrl} alt="Plano Saudável" style={{ height: '80px', marginBottom: '10px' }} />
      <h1>Plano Saudável</h1>
      <span>NutriSystem</span>
    </div>
  )
}
