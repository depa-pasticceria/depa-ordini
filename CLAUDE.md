# DEPA Ordini: gestionale ordini su misura

## Contesto
DEPA (De Pa Pastry Shop) è una pasticceria artigianale a Casali-San Potito, Roccapiemonte (SA), Via Calvanese 104. Chiusa il lunedì.
Oggi gli ordini su misura (torte, cerimonie, ordini aziendali, preordini stagionali) arrivano al telefono o su WhatsApp e vengono scritti a mano su un quaderno.
Obiettivo: un gestionale ordini usabile sia dal PC del negozio sia dallo smartphone, con dati condivisi tra i dispositivi.

## Stato attuale
`index.html` è un'app in un singolo file (HTML/CSS/JS vanilla), mobile-first, stile dark/industrial coerente con il brand.
Backend: Supabase (Postgres + Auth + Realtime), progetto `depa-ordini` (URL `https://yqjiijsjqlaqkidhhzgd.supabase.co`). Schema in `schema.sql`.
I dati non sono più in `localStorage`: ogni ordine è su una tabella condivisa `ordini`, protetta da Row Level Security (solo utenti autenticati leggono/scrivono). La sincronizzazione tra PC e telefono è in tempo reale via Supabase Realtime (subscription su `postgres_changes`), non serve ricaricare la pagina.
Login richiesto (email/password Supabase Auth) prima di poter usare l'app; niente registrazione pubblica, gli account staff si creano manualmente dalla dashboard Supabase.
La funzione "Ripristina dati di esempio" è stata rimossa: con dati condivisi reali sarebbe distruttiva per tutti i dispositivi collegati.

Funzioni già presenti:
- Agenda ordini raggruppata per giorno di ritiro, filtro "da consegnare / tutti", importo da incassare in evidenza
- Stati: confermato → in produzione → pronto → ritirato / consegnato (due stati finali: ritiro in negozio o consegna diretta al cliente)
- Vista Produzione: quantità aggregate per prodotto per giorno + indicazioni per il laboratorio (scritte, allergeni, note)
- Inserimento rapido da telefono (giorni a tocco, lunedì disabilitato, prodotti suggeriti)
- Scheda ordine con chiamata e messaggio WhatsApp precompilato (wa.me), testo diverso quando l'ordine è pronto
- Comande stampabili A4 per giorno o per settimana (un giorno per foglio), ottimizzate per stampa in bianco e nero, da appendere in bacheca produzione
- Installabile come PWA su smartphone e PC (manifest + service worker network-first, sempre aggiornato online)
- Sezione "Altro" in nav: Rubrica clienti (ricavata dagli ordini, raggruppata per telefono, con ricerca e scheda cliente) e Storico ordini (ultimi 12 mesi con barra comparativa ordini/mese, per individuare i periodi di picco/calo, e lista ordini del mese selezionato)

Modello dati di un ordine:
`id, cliente, tel, tipo (Su misura | Cerimonia | Aziendale | Stagionale), prodotto, qty, ritiro (YYYY-MM-DD), ora (HH:MM), scritta, allergeni, totale, acconto, note, stato`

## Prossimi passi proposti (da confermare con Mauro)
1. ~~Backend condiviso con sincronizzazione tra PC e telefono~~ Fatto: Supabase (Postgres + Auth + Realtime)
2. ~~Accesso protetto per lo staff e Row Level Security~~ Fatto: login obbligatorio + RLS, account creati manualmente su Supabase
3. Creare gli account staff su Supabase Auth (Authentication → Users) e disabilitare le registrazioni pubbliche (Authentication → Providers → Email)
4. ~~Testare la sincronizzazione reale tra due dispositivi~~ Fatto: confermato funzionante da Mauro
5. ~~PWA installabile~~ Fatto: manifest + service worker (network-first, si aggiorna da solo ad ogni apertura online)
6. Export CSV e backup periodici
7. ~~Deploy su hosting statico~~ Fatto: live su `depa-ordini.vercel.app` (GitHub org `depa-pasticceria` → Vercel account personale free di `depa.marketing0@gmail.com`)
8. Eventuale gestione preordini stagionali con disponibilità massime per prodotto
9. ~~Rubrica clienti e storico/statistiche ordini~~ Fatto: sezione "Altro" con Rubrica clienti e Storico per mese

## Vincoli
- L'inserimento di un ordine da telefono deve restare sotto i 30 secondi, altrimenti lo staff torna al quaderno
- Interfaccia e testi in italiano
- Mantenere lo stile visivo del prototipo (font Archivo, palette nero/bianco con accento crema #E9C96E)
