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
