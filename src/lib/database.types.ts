export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nome: string
          cognome: string
          telefono: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          nome: string
          cognome: string
          telefono?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          cognome?: string
          telefono?: string | null
          created_at?: string
        }
      }
      escursioni: {
        Row: {
          id: string
          titolo: string
          descrizione: string
          data: string
          difficolta: 'Facile' | 'Medio' | 'Difficile'
          prezzo: number
          immagine_url: string | null
          posti_disponibili: number
          created_at: string
        }
        Insert: {
          id?: string
          titolo: string
          descrizione: string
          data: string
          difficolta: 'Facile' | 'Medio' | 'Difficile'
          prezzo?: number
          immagine_url?: string | null
          posti_disponibili?: number
          created_at?: string
        }
        Update: {
          id?: string
          titolo?: string
          descrizione?: string
          data?: string
          difficolta?: 'Facile' | 'Medio' | 'Difficile'
          prezzo?: number
          immagine_url?: string | null
          posti_disponibili?: number
          created_at?: string
        }
      }
      corsi: {
        Row: {
          id: string
          titolo: string
          descrizione: string
          durata: string
          prezzo: number
          immagine_url: string | null
          categoria: string
          created_at: string
        }
        Insert: {
          id?: string
          titolo: string
          descrizione: string
          durata: string
          prezzo?: number
          immagine_url?: string | null
          categoria: string
          created_at?: string
        }
        Update: {
          id?: string
          titolo?: string
          descrizione?: string
          durata?: string
          prezzo?: number
          immagine_url?: string | null
          categoria?: string
          created_at?: string
        }
      }
      prenotazioni: {
        Row: {
          id: string
          user_id: string
          escursione_id: string | null
          corso_id: string | null
          stato: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          escursione_id?: string | null
          corso_id?: string | null
          stato?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          escursione_id?: string | null
          corso_id?: string | null
          stato?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at?: string
        }
      }
      tessera_escursioni: {
        Row: {
          id: string
          user_id: string
          escursione_id: string
          completata_il: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          escursione_id: string
          completata_il?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          escursione_id?: string
          completata_il?: string
          created_at?: string
        }
      }
    }
  }
}
