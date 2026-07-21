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
          created_at: string
          data: string | null
          titolo: string
          descrizione: string | null
          descrizione_estesa: string | null
          prezzo: number
          difficolta: string | null
          posti_disponibili: number
          immagine_url: string | null
          gallery_urls: string[] | null
          durata: string | null
          attrezzatura_consigliata: string | null
          attrezzatura: string | null
          categoria: 'giornata' | 'multi_giorno' | null
        }
        Insert: {
          id?: string
          created_at?: string
          data?: string | null
          titolo: string
          descrizione?: string | null
          descrizione_estesa?: string | null
          prezzo: number
          difficolta?: string | null
          posti_disponibili: number
          immagine_url?: string | null
          gallery_urls?: string[] | null
          durata?: string | null
          attrezzatura_consigliata?: string | null
          attrezzatura?: string | null
          categoria?: 'giornata' | 'multi_giorno' | null
        }
        Update: {
          id?: string
          created_at?: string
          data?: string | null
          titolo?: string
          descrizione?: string | null
          descrizione_estesa?: string | null
          prezzo?: number
          difficolta?: string | null
          posti_disponibili?: number
          immagine_url?: string | null
          gallery_urls?: string[] | null
          durata?: string | null
          attrezzatura_consigliata?: string | null
          attrezzatura?: string | null
          categoria?: 'giornata' | 'multi_giorno' | null
        }
      }
      corsi: {
        Row: {
          id: string
          created_at: string
          titolo: string
          descrizione: string | null
          descrizione_estesa: string | null
          prezzo: number
          durata: string | null
          immagine_url: string | null
          gallery_urls: string[] | null
          categoria: string | null
          attrezzatura_consigliata: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          titolo: string
          descrizione?: string | null
          descrizione_estesa?: string | null
          prezzo: number
          durata?: string | null
          immagine_url?: string | null
          gallery_urls?: string[] | null
          categoria?: string | null
          attrezzatura_consigliata?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          titolo?: string
          descrizione?: string | null
          descrizione_estesa?: string | null
          prezzo?: number
          durata?: string | null
          immagine_url?: string | null
          gallery_urls?: string[] | null
          categoria?: string | null
          attrezzatura_consigliata?: string | null
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
      altour_leads: {
        Row: {
          id: string
          created_at: string
          nome: string
          cognome: string
          email: string
          livello_suggerito: string
          punteggio: number
          vuole_gae: boolean
          risposte_dettagliate: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          nome: string
          cognome: string
          email: string
          livello_suggerito: string
          punteggio: number
          vuole_gae?: boolean
          risposte_dettagliate?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          nome?: string
          cognome?: string
          email?: string
          livello_suggerito?: string
          punteggio?: number
          vuole_gae?: boolean
          risposte_dettagliate?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}