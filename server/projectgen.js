/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LeoGPT — AI Project Generator
 * PDF → AI analizë → Proje i gatshëm → ZIP
 * ═══════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const pdfParse = require('pdf-parse');
const ai = require('./ai');

const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 50000; // ~50k chars for AI context

if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPdf(buffer) {
  const data = await pdfParse(buffer);
  return (data.text || '').trim().slice(0, MAX_TEXT_LENGTH);
}

/**
 * Non-streaming AI completion for project generation
 */
async function aiComplete(messages, maxTokens = 8192) {
  if (typeof ai.complete !== 'function') {
    throw new Error('AI complete nuk është i disponueshëm. Kontrolloni GROQ_API_KEY ose GEMINI_API_KEY.');
  }
  return ai.complete(messages, maxTokens);
}

/**
 * Generate project files from PDF spec using AI
 */
async function generateProjectFromSpec(pdfText) {
  const systemPrompt = `Ti je një gjenerator projektesh software. Përdoruesi të ka dhënë një specifikim (nga PDF).

DETYRË: Krijo një proje të plotë, të gatshme për përdorim, bazuar në specifikimin.

FORMAT I PËRGJIGJES — VETËM JSON (pa markdown, pa \`\`\`):
{
  "projectName": "emri-i-projektit",
  "files": [
    { "path": "package.json", "content": "..." },
    { "path": "README.md", "content": "..." },
    { "path": "index.html", "content": "..." },
    { "path": "Dockerfile", "content": "..." }
  ]
}

RREGULLA:
1. Krijo të paktën: package.json, README.md, index.html ose main.js (sipas llojit të projektit)
2. Përfshi Dockerfile për kontejnerizim
3. README.md: instalim, përdorim, strukturë
4. Kod i pastër, funksional, i gatshëm për kopjim
5. Për web: Bootstrap 5.3, HTML5 semantik
6. Për Node: Express, package.json me scripts
7. Emri i projektit: slug (me viza), p.sh. my-todo-app
8. content duhet të jetë string i vlefshëm (escape \\n, \\", \\\\ nëse nevojitet)
9. Kthe VETËM JSON valid, pa tekst para ose pas`;

  const userPrompt = `Specifikimi nga PDF:\n\n${pdfText}\n\nKrijo projekten dhe kthe JSON sipas formatit.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const raw = await aiComplete(messages, 8192);
  if (!raw || !raw.trim()) throw new Error('AI nuk ktheu përgjigje.');

  // Extract JSON (handle markdown code blocks if AI adds them)
  let jsonStr = raw.trim();
  const codeMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) jsonStr = codeMatch[1].trim();
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}') + 1;
  if (start >= 0 && end > start) jsonStr = jsonStr.slice(start, end);

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error('[ProjectGen] JSON parse error:', e.message);
    throw new Error('AI ktheu përgjigje të pavlefshme. Provoni përsëri.');
  }

  const files = parsed.files || [];
  const projectName = (parsed.projectName || 'project').replace(/[^a-zA-Z0-9-_]/g, '-');
  if (files.length === 0) throw new Error('AI nuk krijoi skedarë.');

  return { projectName, files };
}

/**
 * Create ZIP from project files, return path
 */
function createZip(projectName, files) {
  const zipName = `${projectName}-${Date.now()}.zip`;
  const zipPath = path.join(PROJECTS_DIR, zipName);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve({ zipPath, zipName }));
    archive.on('error', reject);

    archive.pipe(output);

    for (const f of files) {
      const p = f.path || 'file.txt';
      const content = typeof f.content === 'string' ? f.content : JSON.stringify(f.content);
      archive.append(content, { name: p });
    }

    archive.finalize();
  });
}

/**
 * Full flow: PDF path → extract → generate → ZIP
 */
async function processPdf(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  if (buffer.length > MAX_PDF_SIZE) {
    throw new Error(`PDF shumë i madh (max ${MAX_PDF_SIZE / 1024 / 1024}MB)`);
  }

  const text = await extractTextFromPdf(buffer);
  if (!text || text.length < 50) {
    throw new Error('PDF nuk përmban tekst të mjaftueshëm ose nuk lexohet.');
  }

  const { projectName, files } = await generateProjectFromSpec(text);
  const { zipPath, zipName } = await createZip(projectName, files);

  return { zipPath, zipName, projectName };
}

/**
 * Clean old project ZIPs (older than 1 hour)
 */
function cleanupOldProjects() {
  try {
    const files = fs.readdirSync(PROJECTS_DIR);
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    for (const f of files) {
      if (!f.endsWith('.zip')) continue;
      const fp = path.join(PROJECTS_DIR, f);
      const stat = fs.statSync(fp);
      if (now - stat.mtimeMs > maxAge) fs.unlinkSync(fp);
    }
  } catch (_) {}
}

module.exports = {
  extractTextFromPdf,
  generateProjectFromSpec,
  createZip,
  processPdf,
  cleanupOldProjects,
  PROJECTS_DIR
};
