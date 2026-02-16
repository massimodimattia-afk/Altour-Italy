/*
  # Create Altour Italy Database Schema

  ## Overview
  Complete database schema for Altour Italy outdoor activities platform including hikes, courses, users, and membership cards with badges.

  ## New Tables
  
  ### 1. `users`
  Stores registered members information
  - `id` (uuid, primary key)
  - `email` (text, unique)
  - `nome` (text) - First name
  - `cognome` (text) - Last name
  - `telefono` (text) - Phone number
  - `created_at` (timestamptz)
  
  ### 2. `escursioni`
  Stores hiking trips information
  - `id` (uuid, primary key)
  - `titolo` (text) - Hike title
  - `descrizione` (text) - Description
  - `data` (date) - Hike date
  - `difficolta` (text) - Difficulty: 'Facile', 'Medio', 'Difficile'
  - `prezzo` (numeric) - Price in EUR
  - `immagine_url` (text) - Image URL
  - `posti_disponibili` (integer) - Available spots
  - `created_at` (timestamptz)
  
  ### 3. `corsi`
  Stores training courses information
  - `id` (uuid, primary key)
  - `titolo` (text) - Course title
  - `descrizione` (text) - Description
  - `durata` (text) - Duration (e.g., "2 giorni", "4 ore")
  - `prezzo` (numeric) - Price in EUR
  - `immagine_url` (text) - Image URL
  - `categoria` (text) - Category (e.g., "Cartografia", "Sopravvivenza")
  - `created_at` (timestamptz)
  
  ### 4. `prenotazioni`
  Stores bookings for hikes and courses
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `escursione_id` (uuid, foreign key to escursioni, nullable)
  - `corso_id` (uuid, foreign key to corsi, nullable)
  - `stato` (text) - Status: 'pending', 'confirmed', 'completed', 'cancelled'
  - `created_at` (timestamptz)
  
  ### 5. `tessera_escursioni`
  Tracks completed hikes for membership badges (hiking boot icons)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `escursione_id` (uuid, foreign key to escursioni)
  - `completata_il` (timestamptz) - Completion date
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to read public data
  - Add policies for users to manage their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  nome text NOT NULL,
  cognome text NOT NULL,
  telefono text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create escursioni table
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

ALTER TABLE escursioni ENABLE ROW LEVEL SECURITY;

-- Create corsi table
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

ALTER TABLE corsi ENABLE ROW LEVEL SECURITY;

-- Create prenotazioni table
CREATE TABLE IF NOT EXISTS prenotazioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  escursione_id uuid REFERENCES escursioni(id) ON DELETE CASCADE,
  corso_id uuid REFERENCES corsi(id) ON DELETE CASCADE,
  stato text NOT NULL DEFAULT 'pending' CHECK (stato IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT booking_type_check CHECK (
    (escursione_id IS NOT NULL AND corso_id IS NULL) OR
    (escursione_id IS NULL AND corso_id IS NOT NULL)
  )
);

ALTER TABLE prenotazioni ENABLE ROW LEVEL SECURITY;

-- Create tessera_escursioni table
CREATE TABLE IF NOT EXISTS tessera_escursioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  escursione_id uuid NOT NULL REFERENCES escursioni(id) ON DELETE CASCADE,
  completata_il timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, escursione_id)
);

ALTER TABLE tessera_escursioni ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for escursioni (public read)
CREATE POLICY "Anyone can view escursioni"
  ON escursioni FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for corsi (public read)
CREATE POLICY "Anyone can view corsi"
  ON corsi FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for prenotazioni
CREATE POLICY "Users can view own prenotazioni"
  ON prenotazioni FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prenotazioni"
  ON prenotazioni FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prenotazioni"
  ON prenotazioni FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for tessera_escursioni
CREATE POLICY "Users can view own tessera"
  ON tessera_escursioni FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all tessere"
  ON tessera_escursioni FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add to own tessera"
  ON tessera_escursioni FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_escursioni_data ON escursioni(data);
CREATE INDEX IF NOT EXISTS idx_escursioni_difficolta ON escursioni(difficolta);
CREATE INDEX IF NOT EXISTS idx_prenotazioni_user ON prenotazioni(user_id);
CREATE INDEX IF NOT EXISTS idx_tessera_user ON tessera_escursioni(user_id);

-- Insert sample data for escursioni
INSERT INTO escursioni (titolo, descrizione, data, difficolta, prezzo, immagine_url, posti_disponibili)
VALUES 
  ('Sentiero del Viandante - Lago di Como', 'Escursione panoramica lungo l''antico sentiero che collega i borghi della sponda orientale del Lago di Como. Paesaggi mozzafiato tra lago e montagna.', '2026-03-15', 'Medio', 45.00, 'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=1200', 15),
  ('Monte Grona - Trekking Avanzato', 'Salita impegnativa alla vetta del Monte Grona (1736m). Panorama a 360° su Alpi e Prealpi. Richiesta buona preparazione fisica.', '2026-03-22', 'Difficile', 55.00, 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=1200', 12),
  ('Val Grande - Wilderness Experience', 'Immersione nel parco nazionale della Val Grande, l''area wilderness più grande d''Italia. Natura selvaggia e sentieri storici.', '2026-03-29', 'Medio', 50.00, 'https://images.pexels.com/photos/1562/italian-landscape-mountains-nature.jpg?auto=compress&cs=tinysrgb&w=1200', 15),
  ('Anello dei Rifugi - Facile', 'Escursione adatta a tutti che collega tre rifugi alpini attraverso prati e boschi. Perfetta per famiglie e principianti.', '2026-04-05', 'Facile', 35.00, 'https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg?auto=compress&cs=tinysrgb&w=1200', 20),
  ('Cresta Panoramica - Via Ferrata', 'Esperienza su via ferrata attrezzata con vista spettacolare. Equipaggiamento incluso. Emozioni garantite!', '2026-04-12', 'Difficile', 65.00, 'https://images.pexels.com/photos/869258/pexels-photo-869258.jpeg?auto=compress&cs=tinysrgb&w=1200', 10),
  ('Boschi del Ticino - Nordic Walking', 'Escursione dolce nei boschi del Parco del Ticino con tecnica Nordic Walking. Bastoncini forniti. Relax e natura.', '2026-04-19', 'Facile', 30.00, 'https://images.pexels.com/photos/1236701/pexels-photo-1236701.jpeg?auto=compress&cs=tinysrgb&w=1200', 18);

-- Insert sample data for corsi
INSERT INTO corsi (titolo, descrizione, durata, prezzo, categoria, immagine_url)
VALUES 
  ('Corso di Cartografia e Orientamento', 'Impara a leggere le carte topografiche, usare bussola e GPS. Esercitazioni pratiche sul campo. Diventa autonomo nei tuoi trekking.', '1 giorno (8 ore)', 80.00, 'Cartografia', 'https://images.pexels.com/photos/1252500/pexels-photo-1252500.jpeg?auto=compress&cs=tinysrgb&w=1200'),
  ('Survival Base - Tecniche di Sopravvivenza', 'Corso pratico di sopravvivenza: costruzione rifugi, accensione fuoco, ricerca acqua, nodi e primi soccorsi in ambiente outdoor.', '2 giorni', 150.00, 'Sopravvivenza', 'https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&w=1200'),
  ('Trekking Base - Primi Passi in Montagna', 'Corso per principianti: equipaggiamento, tecniche di cammino, sicurezza in montagna, meteorologia di base. Teoria e pratica.', '1 giorno (6 ore)', 60.00, 'Trekking', 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1200'),
  ('Fotografia Naturalistica in Montagna', 'Combina la passione per il trekking con la fotografia. Tecniche di composizione, luce naturale, wildlife photography.', '1 giorno (8 ore)', 90.00, 'Fotografia', 'https://images.pexels.com/photos/1034940/pexels-photo-1034940.jpeg?auto=compress&cs=tinysrgb&w=1200');
