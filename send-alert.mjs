import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const { GMAIL_USER, GMAIL_APP_PASSWORD, DEST_EMAIL, THEIRSTACK_API_KEY } = process.env;

const SEARCH_TERMS = [
  'quality engineer',
  'supplier quality engineer',
  'supplier quality',
  'qa engineer',
  'quality manager',
  'process quality',
  'quality assurance',
  'qa',
  'quality specialist',
  'quality coordinator'
];

const THEIRSTACK_URL = 'https://api.theirstack.com/v1/jobs/search';

const EUROPE_COUNTRIES = ['DE', 'AT', 'CH', 'NL', 'BE', 'FR', 'DK', 'SE', 'NO', 'FI', 'IE', 'PT', 'ES', 'IT', 'PL', 'CZ', 'HU'];

const SENT_JOBS_FILE = 'sent-jobs.json';

function loadSentJobs() {
  if (!existsSync(SENT_JOBS_FILE)) {
    return { sent: [], created: new Date().toISOString().slice(0, 10) };
  }
  return JSON.parse(readFileSync(SENT_JOBS_FILE, 'utf-8'));
}

function saveSentJobs(data) {
  const maxHistory = 200;
  if (data.sent.length > maxHistory) {
    data.sent = data.sent.slice(-maxHistory);
  }
  writeFileSync(SENT_JOBS_FILE, JSON.stringify(data, null, 2));
}

async function fetchJobs() {
  const allJobs = [];

  if (!THEIRSTACK_API_KEY) {
    console.error('THEIRSTACK_API_KEY is not set. Exiting.');
    return allJobs;
  }

  for (const term of SEARCH_TERMS) {
    try {
      const res = await fetch(THEIRSTACK_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${THEIRSTACK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_title_or: [term],
          job_country_code_or: EUROPE_COUNTRIES,
          posted_at_max_age_days: 30,
          limit: 5
        })
      });

      if (!res.ok) {
        console.error(`HTTP ${res.status} for "${term}"`);
        const text = await res.text();
        console.error(text);
        continue;
      }

      const json = await res.json();
      const jobs = json.data || [];

      for (const job of jobs) {
        allJobs.push({
          id: job.id,
          title: job.job_title,
          company: job.company,
          country: job.locations?.[0]?.country_name || 'Europe',
          posted: job.date_posted,
          link: job.linkedin_url || job.source_url || `https://theirstack.com/jobs/${job.id}`,
          description: job.description || '',
          searchTerm: term
        });
      }
    } catch (err) {
      console.error(`Error fetching for "${term}":`, err.message);
    }
  }

  return allJobs;
}

function formatJobList(jobs) {
  if (jobs.length === 0) return 'Nenhuma nova vaga encontrada.';
  return jobs.map((job, i) => {
    return `
<b>#${i + 1} ${job.title}</b>
<b>Empresa:</b> ${job.company}
<b>País:</b> ${job.country}
<b>Publicada:</b> ${job.posted}
<b>Busca:</b> ${job.searchTerm}
<a href="${job.link}">Ver vaga</a>
`;
  }).join('');
}

async function sendAlert(jobs) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !DEST_EMAIL) {
    console.error('Email credentials not set');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD
    }
  });

  const jobHtml = formatJobList(jobs);

  await transporter.sendMail({
    from: GMAIL_USER,
    to: DEST_EMAIL,
    subject: `Job Alert - ${jobs.length} nova(s) vaga(s) de Quality`,
    html: `
      <h2>Job Alert - Quality Engineering</h2>
      <p>Foram encontradas ${jobs.length} vaga(s) nova(s):</p>
      ${jobHtml}
      <p><small>Envio automático via GitHub Actions</small></p>
    `
  });

  console.log(`Email sent with ${jobs.length} jobs`);
}

async function main() {
  const sentData = loadSentJobs();
  const sent = new Set(sentData.sent);

  const allJobs = await fetchJobs();
  console.log(`Fetched ${allJobs.length} jobs from API`);

  const newJobs = allJobs.filter(job => !sent.has(String(job.id)));
  console.log(`Found ${newJobs.length} new jobs`);

  if (newJobs.length > 0) {
    for (const job of newJobs) {
      sentData.sent.push(String(job.id));
    }
    saveSentJobs(sentData);
    await sendAlert(newJobs);
  } else {
    console.log('No new jobs to send');
  }
}

main().catch(console.error);
