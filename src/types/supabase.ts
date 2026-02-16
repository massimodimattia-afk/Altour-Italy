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
      corsi: {
        Row: {
          id: string
          created_at: string
          titolo: string
          descrizione: string | null
          prezzo: number
          durata: string | null
          immagine_url: string | null
          categoria: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          titolo: string
          descrizione?: string | null
          prezzo: number
          durata?: string | null
          immagine_url?: string | null
          categoria?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          titolo?: string
          descrizione?: string | null
          prezzo?: number
          durata?: string | null
          immagine_url?: string | null
          categoria?: string | null
        }
      }
      escursioni: {
        Row: {
          id: string
          created_at: string
          data: string
          titolo: string
          descrizione: string | null
          prezzo: number
          difficolta: string | null
          posti_disponibili: number
          immagine_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          data: string
          titolo: string
          descrizione?: string | null
          prezzo: number
          difficolta?: string | null
          posti_disponibili: number
          immagine_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          data?: string
          titolo?: string
          descrizione?: string | null
          prezzo?: number
          difficolta?: string | null
          posti_disponibili?: number
          immagine_url?: string | null
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