# DEPA Ordini: gestionale ordini su misura

## Contesto
DEPA (De Pa Pastry Shop) è una pasticceria artigianale a Casali-San Potito, Roccapiemonte (SA), Via Calvanese 104. Chiusa il lunedì.
Oggi gli ordini su misura (torte, cerimonie, ordini aziendali, preordini stagionali) arrivano al telefono o su WhatsApp e vengono scritti a mano su un quaderno.
Obiettivo: un gestionale ordini usabile sia dal PC del negozio sia dallo smartphone, con dati condivisi tra i dispositivi.

## Stato attuale
`depa-ordini.html` è un prototipo funzionante in un singolo file (HTML/CSS/JS vanilla), mobile-first, stile dark/industrial coerente con il brand.
Limite principale: i dati sono salvati in `localStorage`, quindi restano sul singolo dispositivo.

Funzioni già presenti:
- Agenda ordini raggruppata per giorno di ritiro, filtro "da consegnare / tutti", importo da incassare in evidenza
- Stati: confermato → in produzione → pronto → ritirato
- Vista Produzione: quantità aggregate per prodotto per giorno + indicazioni per il laboratorio (scritte, allergeni, note)
- Inserimento rapido da telefono (giorni a tocco, lunedì disabilitato, prodotti suggeriti)
- Scheda ordine con chiamata e messaggio WhatsApp precompilato (wa.me), testo diverso quando l'ordine è pronto
- Comande stampabili A4 per giorno o per settimana (un giorno per foglio), ottimizzate per stampa in bianco e nero, da appendere in bacheca produzione

Modello dati di un ordine:
`id, cliente, tel, tipo (Su misura | Cerimonia | Aziendale | Stagionale), prodotto, qty, ritiro (YYYY-MM-DD), ora (HH:MM), scritta, allergeni, totale, acconto, note, stato`

## Prossimi passi proposti (da confermare con Mauro)
1. Backend condiviso con sincronizzazione tra PC e telefono (es. Supabase: Postgres + auth + realtime)
2. Accesso protetto per lo staff e Row Level Security: i dati contengono nomi e numeri dei clienti (GDPR)
3. PWA installabile (manifest + service worker), con funzionamento offline di base
4. Export CSV e backup periodici
5. Deploy su hosting statico (es. Vercel o Netlify)
6. Eventuale gestione preordini stagionali con disponibilità massime per prodotto

## Vincoli
- L'inserimento di un ordine da telefono deve restare sotto i 30 secondi, altrimenti lo staff torna al quaderno
- Interfaccia e testi in italiano
- Mantenere lo stile visivo del prototipo (font Archivo, palette nero/bianco con accento crema #E9C96E)
