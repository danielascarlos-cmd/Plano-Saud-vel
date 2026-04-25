import { supabase } from './supabase'

/**
 * Busca o total de pacientes ativos da nutricionista
 */
export async function getTotalPatients(nutriId) {
  const { count, error } = await supabase
    .from('pacientes')
    .select('*', { count: 'exact', head: true })
    .eq('nutricionista_id', nutriId)

  if (error) throw error
  return count || 0
}

/**
 * Busca o número de consultas na semana atual
 */
export async function getWeeklyConsultations(nutriId) {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) // Domingo
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // Sábado
  endOfWeek.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('consultas')
    .select('id, paciente_id!inner(nutricionista_id)')
    .eq('paciente_id.nutricionista_id', nutriId)
    .gte('data_consulta', startOfWeek.toISOString().split('T')[0])
    .lte('data_consulta', endOfWeek.toISOString().split('T')[0])

  if (error) throw error
  return data.length || 0
}

/**
 * Busca pacientes cuja última consulta foi há mais de 30 dias 
 * e não possuem retorno agendado para o futuro.
 */
export async function getPatientsWithoutReturn(nutriId) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const dateThreshold = thirtyDaysAgo.toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  // 1. Buscar todos os pacientes da nutri
  const { data: patients, error: pError } = await supabase
    .from('pacientes')
    .select('id, nome')
    .eq('nutricionista_id', nutriId)

  if (pError) throw pError
  if (!patients.length) return []

  // 2. Buscar as consultas desses pacientes para verificar a última
  const { data: consultations, error: cError } = await supabase
    .from('consultas')
    .select('paciente_id, data_consulta, proximo_retorno')
    .in('paciente_id', patients.map(p => p.id))
    .order('data_consulta', { ascending: false })

  if (cError) throw cError

  // 3. Processar lógica em JS (mais simples que consultas complexas com agregação no Supabase client)
  const results = []
  const processedIds = new Set()

  for (const patient of patients) {
    const patientConsults = consultations.filter(c => c.paciente_id === patient.id)
    
    if (patientConsults.length > 0) {
      const latest = patientConsults[0] // Já está ordenado por data descendente
      
      const hasNoFutureReturn = !latest.proximo_retorno || latest.proximo_retorno <= today
      const isOverdue = latest.data_consulta < dateThreshold

      if (isOverdue && hasNoFutureReturn) {
        // Calcular quantos dias faz desde a última consulta
        const lastDate = new Date(latest.data_consulta)
        const diffTime = Math.abs(new Date() - lastDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        results.push({
          id: patient.id,
          nome: patient.nome,
          dias_sem_retorno: diffDays
        })
      }
    }
  }

  return results
}

/**
 * Busca todos os pacientes da nutricionista, com filtro de busca
 */
export async function getAllPatients(nutriId, search = '') {
  let query = supabase
    .from('pacientes')
    .select('id, nome, objetivos, objetivo_texto')
    .eq('nutricionista_id', nutriId)
    .order('nome')

  if (search) {
    query = query.ilike('nome', `%${search}%`)
  }

  const { data: patients, error: pError } = await query
  if (pError) throw pError
  if (!patients.length) return []

  // Buscar a última consulta de cada um
  const { data: consultations, error: cError } = await supabase
    .from('consultas')
    .select('paciente_id, data_consulta')
    .in('paciente_id', patients.map(p => p.id))
    .order('data_consulta', { ascending: false })

  if (cError) throw cError

  return patients.map(patient => {
    const lastConsult = consultations.find(c => c.paciente_id === patient.id)
    return {
      ...patient,
      data_ultima_consulta: lastConsult ? lastConsult.data_consulta : null
    }
  })
}

/**
 * Salva um novo paciente
 */
export async function savePatient(patientData) {
  const { data, error } = await supabase
    .from('pacientes')
    .insert([patientData])
    .select()
    .single()

  if (error) throw error
  return data
}
