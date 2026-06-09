import nodemailer from 'nodemailer';

const { GMAIL_USER, GMAIL_APP_PASSWORD, DEST_EMAIL } = process.env;

const SEARCH_TERMS = [
  'quality engineer', 'supplier quality engineer', 'supplier quality',
  'qa engineer', 'quality manager', 'process quality', 'quality assurance',
  'qa', 'quality specialist', 'quality coordinator'
];

const VISA_URL = 'https://www.arbeitnow.com/api/job-board-api?visa_sponsorship=false';

async function fetchJobs() {
  const allJobs = [];
  const seen = new Set();

  for (const term of SEARCH_TERMS) {
    const url = `${VISA_URL}&query=${encodeURIComponent(term)}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        for (const job of json.data.slice(0, 5)) {
          if (job && job.title && job.company && !seen.has(job.slug)) {
            seen.add(job.slug);
            allJobs.push(job);
          }
        }
      }
    } catch (e) {
      console.error(`Error fetching ${term}:`, e.message);
    }
  }
  return allJobs;
}

async function loadSentJobs() {
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/thaisbtanaka-commits/alex-jobs-europe/main/sent-jobs.json',
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      return new Set(data.sent || []);
    }
  } catch {}
  return new Set();
}

function formatJob(j) {
  const loc = j.location || 'Remoto';
  const remote = j.remote ? ' [REMOTO]' : '';
  return `${j.title} - ${j.company} (${loc}${remote})
${j.url ? j.url : ''}`;
}

async function main() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !DEST_EMAIL) {
    console.error('Missing env vars. Exiting.');
    return;
  }

  console.log('Fetching jobs...');
  const jobs = await fetchJobs();
  console.log(`Found ${jobs.length} jobs.`);

  const sent = await loadSentJobs();
  const newJobs = jobs.filter(j => !sent.has(j.slug));
  console.log(`${newJobs.length} new jobs.`);

  if (newJobs.length === 0) {
    console.log('No new jobs. Exiting.');
    return;
  }

  const body = newJobs.map(formatJob).join('\n\n---\n\n');
  const htmlBody = newJobs.map(j => {
    const loc = j.location || 'Remoto';
    const remote = j.remote ? ' [REMOTO]' : '';
    return `<p><strong>${j.title}</strong><br/>${j.company} - ${loc}${remote}<br/><a href="${j.url}">${j.url}</a></p>`;
  }).join('<hr/>');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD
    }
  });

  const date = new Date().toLocaleString('pt-BR', { timeZone: 'Europe/Vienna' });

  await transporter.sendMail({
    from: GMAIL_USER,
    to: DEST_EMAIL,
    subject: `Novas Vagas Encontradas - ${date}`,
    text: `Novas vagas encontradas - ${date}\n========================================\n\n${body}\n\nTotal: ${newJobs.length} vaga(s) nova(s)`,
    html: `<h2>Novas vagas encontradas - ${date}</h2>${htmlBody}<p><strong>Total: ${newJobs.length} vaga(s) nova(s)</strong></p>`
  });

  console.log('Email sent!');

  const updated = [...sent, ...newJobs.map(j => j.slug)];
  console.log(JSON.stringify({ sent: updated.slice(-200) }));
}

main().catch(console.error);
