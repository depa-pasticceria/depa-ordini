// Promemoria push sugli ordini in arrivo.
// GET  (Vercel Cron, ogni mattina): per ogni dispositivo iscritto invia un avviso per ciascun ordine
//      di domani e/o dopodomani, in base agli "anticipi" scelti su quel dispositivo.
// POST (dall'app, utente loggato): invia una notifica di prova al dispositivo indicato.
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yqjiijsjqlaqkidhhzgd.supabase.co';
const GG = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const QUANDO = { 1: 'Domani', 2: 'Dopodomani' };

const romeToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
function plusDays(s, n) { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function dayLabel(s) { const d = new Date(s + 'T12:00:00Z'); return GG[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MESI[d.getUTCMonth()]; }

function db() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

function setupVapid() {
  webpush.setVapidDetails('mailto:depa.marketing0@gmail.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

// Un avviso per ordine; toccandolo l'app si apre sulla scheda di quell'ordine
export function message(n, o) {
  const righe = [`${o.qty} × ${o.prodotto}, ${o.modalita === 'consegna' ? 'consegna' : 'ritiro'} ${dayLabel(o.ritiro)}`];
  if (o.scritta) righe.push(`Scritta: "${o.scritta}"`);
  if (o.allergeni) righe.push(`Allergeni: ${o.allergeni}`);
  return {
    title: `${QUANDO[n]} alle ${o.ora}: ${o.cliente}`,
    body: righe.join('\n'),
    tag: `ordine-${o.id}-${n}`,
    url: '/?ordine=' + o.id
  };
}

// Invia e rimuove le iscrizioni scadute (il browser le ha revocate o l'app è stata disinstallata)
async function send(sb, sub, payload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 6 * 3600 }
    );
    return 'ok';
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      return 'expired';
    }
    console.error('push error', err.statusCode, err.body);
    return 'error';
  }
}

async function runDaily(sb) {
  const { data: subs, error: e1 } = await sb.from('push_subscriptions').select('*');
  if (e1) throw e1;
  const today = romeToday();
  const giorni = { 1: plusDays(today, 1), 2: plusDays(today, 2) };
  const { data: ordini, error: e2 } = await sb.from('ordini')
    .select('id, cliente, qty, prodotto, ora, modalita, ritiro, scritta, allergeni, stato')
    .in('ritiro', Object.values(giorni))
    .not('stato', 'in', '(ritirato,consegnato)')
    .order('ora');
  if (e2) throw e2;

  const messaggi = {};
  for (const n of [1, 2]) messaggi[n] = ordini.filter(o => o.ritiro === giorni[n]).map(o => message(n, o));

  const esiti = { ok: 0, expired: 0, error: 0 };
  await Promise.all(subs.map(async sub => {
    for (const n of sub.anticipi || [1]) {
      for (const m of messaggi[n] || []) {
        const esito = await send(sb, sub, m);
        esiti[esito]++;
        if (esito === 'expired') return;
      }
    }
  }));
  return { today, ordini: ordini.length, dispositivi: subs.length, ...esiti };
}

async function runTest(sb, req) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const { data: { user } = {}, error } = await sb.auth.getUser(token);
  if (error || !user) return [401, { error: 'non autorizzato' }];
  const endpoint = req.body && req.body.endpoint;
  const { data: sub } = await sb.from('push_subscriptions').select('*').eq('endpoint', endpoint || '').maybeSingle();
  if (!sub) return [404, { error: 'dispositivo non iscritto' }];
  const esito = await send(sb, sub, {
    title: 'DEPA Ordini',
    body: 'Notifiche attive. Riceverai qui i promemoria degli ordini in arrivo.',
    tag: 'prova',
    url: '/'
  });
  return [esito === 'ok' ? 200 : 502, { esito }];
}

export default async function handler(req, res) {
  // Configurazione incompleta: risponde con i nomi delle variabili mancanti (mai i valori)
  const mancanti = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'CRON_SECRET', 'SUPABASE_SECRET_KEY'].filter(k => !(process.env[k] || '').trim());
  if (mancanti.length) return res.status(500).json({ error: 'variabili d\'ambiente mancanti', mancanti });
  try {
    setupVapid();
    const sb = db();
    if (req.method === 'GET') {
      if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'non autorizzato' });
      }
      return res.status(200).json(await runDaily(sb));
    }
    if (req.method === 'POST') {
      const [status, body] = await runTest(sb, req);
      return res.status(status).json(body);
    }
    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
}
