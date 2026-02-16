-- Questo script risolve i problemi di permessi e aggiorna la cache dello schema API
-- Eseguilo nella Dashboard Supabase > SQL Editor

-- 1. Assicurati che RLS sia abilitato (per sicurezza)
ALTER TABLE public.contatti ENABLE ROW LEVEL SECURITY;

-- 2. Concedi i permessi di accesso al ruolo pubblico (anon) e autenticato
-- Questo assicura che l'API possa "vedere" la tabella
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.contatti TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 3. Crea (o ricrea) la policy per permettere l'inserimento a chiunque
DROP POLICY IF EXISTS "Permetti inserimento contatti a chiunque" ON public.contatti;

CREATE POLICY "Permetti inserimento contatti a chiunque"
ON public.contatti
FOR INSERT
TO public
WITH CHECK (true);

-- 4. CRUCIALE: Forza l'aggiornamento della cache delle API di Supabase
-- Questo comando dice a Supabase di ricaricare lo schema immediatamente
NOTIFY pgrst, 'reload config';
