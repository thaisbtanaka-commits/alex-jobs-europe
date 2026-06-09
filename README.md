# Alex Jobs - Quality Europe Pro

Buscador automatizado de vagas de emprego na Europa para profissionais de qualidade (Supplier Quality, QA, Quality Engineer, etc.).

## Acesso

- **Site (GitHub Pages):** https://thaisbtanaka-commits.github.io/alex-jobs-europe

## Como funciona

O sistema tem duas partes:

### 1. Busca manual (site)
Acesse o site, digite o cargo, selecione o pais e clique em "Buscar vagas". Os resultados aparecem com link direto para a vaga.

### 2. Alertas automaticos por e-mail (GitHub Actions)
O script `send-alert.mjs` busca vagas automaticamente a cada 4 horas na API da Arbeitnow e envia e-mail com as novas vagas encontradas.

## Configuracao dos Segredos (GitHub Secrets)

Para ativar os alertas por e-mail, adicione estes 3 segredos em **Settings > Secrets and variables > Actions**:

| Nome | Descricao | Exemplo |
|---|---|---|
| `GMAIL_USER` | E-mail que vai enviar os alertas | alex.jobs@gmail.com |
| `GMAIL_APP_PASSWORD` | Senha de app de 16 caracteres do Gmail | abcdefghijklmnop |
| `DEST_EMAIL` | E-mail que vai receber os alertas | alex.jobs@gmail.com |

### Como gerar a App Password do Gmail
1. Acesse https://myaccount.google.com > Seguranca
2. Ative a verificacao em duas etapas (se ainda nao estiver)
3. Clique em "Senhas de app" > crie uma com nome "alex-jobs-europe"
4. Copie o codigo de 16 caracteres e cole no segredo `GMAIL_APP_PASSWORD`

## Arquivos

| Arquivo | Descricao |
|---|---|
| `index.html` | Site de busca na GitHub Pages |
| `send-alert.mjs` | Script de automacao de alertas |
| `sent-jobs.json` | Histórico de vagas ja enviadas |
| `package.json` | Dependencias Node.js |
| `.github/workflows/job-alert.yml` | Workflow do GitHub Actions (cron 4h) |

## Fontes de dados

- Arbeitnow API (principal)
- Links diretos para: EURES, Eurojobs, LinkedIn, Indeed, StepStone

## Tecnologias

- HTML, CSS, JavaScript (ES modules)
- Node.js + Nodemailer
- GitHub Actions (cron schedule)
- GitHub Pages
- Zero custo, zero backend, dados locais no navegador
