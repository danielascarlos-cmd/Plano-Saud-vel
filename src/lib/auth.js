import { supabase } from './supabase'

/**
 * Cadastra uma nova nutricionista
 * @param {string} email 
 * @param {string} password 
 * @param {string} fullName 
 */
export async function signUp(email, password, fullName) {
  // 1. Criar o usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError

  // Se o cadastro for bem sucedido (mesmo se o email estiver pendente, mas aqui está desativado)
  // O trigger do BD pode cuidar disso, mas vamos fazer manual para garantir o campo 'nome'
  if (authData.user) {
    const { error: dbError } = await supabase
      .from('nutricionistas')
      .insert([
        { 
          id: authData.user.id, 
          nome: fullName, 
          email: email 
        }
      ])

    if (dbError) {
      console.error('Erro ao salvar dados profissionais:', dbError)
      // Nota: O usuário foi criado no Auth, mas falhou no DB. 
      // Dependendo da RLS, isso pode ser um problema.
      throw dbError
    }
  }

  return authData
}

/**
 * Realiza login
 * @param {string} email 
 * @param {string} password 
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

/**
 * Encerra a sessão
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Obtém o usuário atual
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Monitora mudanças na autenticação
 * @param {Function} callback 
 */
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}
