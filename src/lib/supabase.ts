import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types' // Assicurati che il nome del file coincida

// Workaround per l'errore "Property 'env' does not exist on type 'ImportMeta'"
export const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || ''
export const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase non configurato: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY necessarie')
}

// Crea il client Supabase senza generico per evitare errori con tabelle non tipizzate
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder', 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

if (isSupabaseConfigured) {
  console.log('✅ Supabase client creato per:', supabaseUrl.split('//')[1]?.split('.')[0] + '...')
}

// Precarica lo schema della tabella 'altour_leads'
;(async function warmUpSchema() {
  if (!isSupabaseConfigured) return
  try {
    const { error } = await supabase
      .from('altour_leads')
      .select('*', { count: 'exact', head: true })

    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn('⏳ Tabella altour_leads non ancora disponibile, riprovo tra 1s...')
        setTimeout(async () => {
          await supabase.from('altour_leads').select('*', { head: true })
          console.log('✅ Schema altour_leads precaricato al secondo tentativo')
        }, 1000)
      } else {
        console.warn('⚠️ Errore nel precaricamento schema:', error.message)
      }
    } else {
      console.log('✅ Schema altour_leads precaricato con successo')
    }
  } catch (err) {
    console.warn('⚠️ Eccezione durante precaricamento schema:', err)
  }
})()

export async function testSupabaseConnection() {
  try {
    const { error } = await supabase
      .from('altour_leads')
      .select('*', { head: true })
    if (error) throw error
    console.log('✅ Connessione Supabase funzionante su altour_leads')
    return true
  } catch (error) {
    console.error('❌ Connessione Supabase fallita:', error)
    return false
  }
}