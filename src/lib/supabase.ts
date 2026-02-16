import { createClient } from '@supabase/supabase-js'

// Workaround per l'errore "Property 'env' does not exist on type 'ImportMeta'"
// In futuro, assicurati che il file src/vite-env.d.ts esista e sia configurato correttamente.
export const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
export const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

// Validazione
if (!supabaseUrl) {
  throw new Error('❌ VITE_SUPABASE_URL non definita nel file .env')
}
if (!supabaseAnonKey) {
  throw new Error('❌ VITE_SUPABASE_ANON_KEY non definita nel file .env')
}

// Crea il client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

console.log('✅ Supabase client creato per:', supabaseUrl.split('//')[1]?.split('.')[0] + '...')

// Precarica lo schema della tabella 'contatti'
;(async function warmUpSchema() {
  try {
    const { error } = await supabase
      .from('contatti')
      .select('*', { count: 'exact', head: true })

    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn('⏳ Tabella contatti non ancora disponibile, riprovo tra 1s...')
        setTimeout(async () => {
          await supabase.from('contatti').select('*', { head: true })
          console.log('✅ Schema contatti precaricato al secondo tentativo')
        }, 1000)
      } else {
        console.warn('⚠️ Errore nel precaricamento schema:', error.message)
      }
    } else {
      console.log('✅ Schema contatti precaricato con successo')
    }
  } catch (err) {
    console.warn('⚠️ Eccezione durante precaricamento schema:', err)
  }
})()

export async function testSupabaseConnection() {
  try {
    const { error } = await supabase
      .from('contatti')
      .select('*', { head: true })
    if (error) throw error
    console.log('✅ Connessione Supabase funzionante')
    return true
  } catch (error) {
    console.error('❌ Connessione Supabase fallita:', error)
    return false
  }
}
