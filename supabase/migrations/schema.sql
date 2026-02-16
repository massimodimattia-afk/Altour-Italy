-- 1. CREAZIONE TABELLE
-- Tabella Utenti
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  nome text NOT NULL,
  cognome text NOT NULL,
  telefono text,
  created_at timestamptz DEFAULT now()
);

-- Tabella Escursioni
CREATE TABLE IF NOT EXISTS escursioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo text NOT NULL,
  descrizione text NOT NULL,
  data date NOT NULL,
  difficolta text NOT NULL CHECK (difficolta IN ('Facile', 'Medio', 'Difficile')),
  prezzo numeric(10,2) NOT NULL DEFAULT 0,
  immagine_url text,
  posti_disponibili integer DEFAULT 20,
  created_at timestamptz DEFAULT now()
);

-- Tabella Corsi
CREATE TABLE IF NOT EXISTS corsi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo text NOT NULL,
  descrizione text NOT NULL,
  durata text NOT NULL,
  prezzo numeric(10,2) NOT NULL DEFAULT 0,
  immagine_url text,
  categoria text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabella Prenotazioni (Aggiornata per accettare anche mail/nome da form diretto)
CREATE TABLE IF NOT EXISTS prenotazioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  escursione_id uuid REFERENCES escursioni(id) ON DELETE CASCADE,
  corso_id uuid REFERENCES corsi(id) ON DELETE CASCADE,
  corso_titolo text,
  nome_cliente text,
  email_cliente text,
  telefono_cliente text,
  stato text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- 2. SICUREZZA (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE escursioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE corsi ENABLE ROW LEVEL SECURITY;
ALTER TABLE prenotazioni ENABLE ROW LEVEL SECURITY;

-- Policy semplici: Tutti possono leggere escursioni e corsi, chiunque può inserire prenotazioni
CREATE POLICY "Public Read Escursioni" ON escursioni FOR SELECT USING (true);
CREATE POLICY "Public Read Corsi" ON corsi FOR SELECT USING (true);
CREATE POLICY "Public Insert Prenotazioni" ON prenotazioni FOR INSERT WITH CHECK (true);

-- 3. DATI DI ESEMPIO
INSERT INTO escursioni (titolo, descrizione, data, difficolta, prezzo, immagine_url)
VALUES 
('Sentiero del Viandante', 'Trekking vista lago di Como', '2026-05-20', 'Medio', 35.00, 'https://images.unsplash.com/photo-1551632623-670059628e0e'),
('Vetta Grigna Meridionale', 'Escursione tecnica per esperti', '2026-06-12', 'Difficile', 50.00, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b');

INSERT INTO corsi (titolo, descrizione, durata, prezzo, categoria, immagine_url)
VALUES 
('Corso Cartografia Base', 'Impara a non perderti mai più', '1 giorno', 80.00, 'Orientamento', 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff'),
('Sopravvivenza Bushcraft', 'Costruisci il tuo rifugio', '2 giorni', 150.00, 'Sopravvivenza', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4');