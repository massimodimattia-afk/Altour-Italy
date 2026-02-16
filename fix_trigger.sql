-- Questo script rimuove il trigger che potrebbe causare l'errore "schema cache"
-- Se il trigger fa riferimento a funzioni non esistenti o errate, la tabella diventa inaccessibile via API.

-- 1. Rimuovi il trigger problematico
DROP TRIGGER IF EXISTS "send-email-on-contact" ON public.contatti;

-- 2. Ricarica la configurazione di Supabase (schema cache)
NOTIFY pgrst, 'reload config';
