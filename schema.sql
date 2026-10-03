-- DEPA Ordini — schema Supabase
-- Da eseguire una volta sola nel SQL Editor del progetto Supabase.

create table if not exists ordini (
  id uuid primary key default gen_random_uuid(),
  cliente text not null,
  tel text not null,
  tipo text not null,
  prodotto text not null,
  qty integer not null default 1,
  ritiro date not null,
  ora text not null,
  scritta text not null default '',
  allergeni text not null default '',
  totale numeric not null default 0,
  acconto numeric not null default 0,
  note text not null default '',
  stato text not null default 'confermato',
  created_at timestamptz not null default now()
);

alter table ordini enable row level security;

-- Solo utenti autenticati (staff) possono leggere/scrivere.
-- Nessuna policy per il ruolo "anon": senza login, zero accesso ai dati.
create policy "ordini_select_staff" on ordini
  for select to authenticated using (true);

create policy "ordini_insert_staff" on ordini
  for insert to authenticated with check (true);

create policy "ordini_update_staff" on ordini
  for update to authenticated using (true) with check (true);

create policy "ordini_delete_staff" on ordini
  for delete to authenticated using (true);

grant select, insert, update, delete on ordini to authenticated;

-- Abilita gli aggiornamenti realtime sulla tabella (sync tra dispositivi)
alter publication supabase_realtime add table ordini;

-- Migrazione 2026-09-22: modalità ritiro/consegna scelta alla creazione dell'ordine
-- Da eseguire una volta sola nel SQL Editor, sugli ordini esistenti imposta 'ritiro' di default.
alter table ordini add column if not exists modalita text not null default 'ritiro';

-- Migrazione 2026-10-03: promemoria push sugli ordini in arrivo (anche ad app chiusa)
-- Ogni riga è un dispositivo che ha attivato le notifiche. "anticipi" = con quanti giorni
-- di anticipo avvisare (1 = il giorno prima, 2 = due giorni prima).
-- L'invio lo fa la funzione Vercel /api/promemoria con la chiave segreta, che ignora RLS.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  anticipi integer[] not null default '{1}',
  user_id uuid default auth.uid(),
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "push_select_staff" on push_subscriptions
  for select to authenticated using (true);

create policy "push_insert_staff" on push_subscriptions
  for insert to authenticated with check (true);

create policy "push_update_staff" on push_subscriptions
  for update to authenticated using (true) with check (true);

create policy "push_delete_staff" on push_subscriptions
  for delete to authenticated using (true);

grant select, insert, update, delete on push_subscriptions to authenticated;
