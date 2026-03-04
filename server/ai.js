/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LeoGPT — AI Integration (Premium)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * INDEX:
 * ─────────────────────────────────────────────────────────────────────────
 * 1. INIT           — initAI, provider selection (Groq/Gemini/OpenAI/Ollama)
 * 2. BUILD          — buildMessages, persona, instagramContext, lang rules
 * 3. DETECT         — detectLanguage
 * 4. STREAM         — streamWithGroq, streamWithGemini, streamWithOllama, streamWithOpenAI
 * 5. CHAT           — streamChat
 * 6. GREETING       — getGreeting
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Re: Groq (falas) | Gemini (falas) | OpenAI (me pagesë) | Ollama (lokale)
 */

const { getConversationHistory, addMessage, setDetectedLanguage, getDetectedLanguage, getPreferredLanguage, setPreferredLanguage } = require('./memory');
const persona = require('./config/persona.json');

let aiProvider = null; // 'groq' | 'gemini' | 'openai' | 'ollama'
let groqClient = null;
let openaiClient = null;
let geminiClient = null;

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function initAI() {
  if (process.env.GROQ_API_KEY) {
    const Groq = require('groq-sdk');
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    aiProvider = 'groq';
    console.log('AI: Groq po përdoret (falas, re) -', GROQ_MODEL);
    return true;
  }
  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      aiProvider = 'gemini';
      console.log('AI: Google Gemini po përdoret (falas, re)');
      return true;
    } catch (e) {
      console.warn('Paketi Gemini nuk është, përdorni Groq: npm install @google/generative-ai');
    }
  }
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    aiProvider = 'openai';
    console.log('AI: OpenAI po përdoret');
    return true;
  }
  aiProvider = 'ollama';
  console.log('AI: Ollama po përdoret (lokale) -', OLLAMA_MODEL);
  return true;
}

function buildMessages(sessionId, userMessage, imageData, instagramContext) {
  const history = getConversationHistory(sessionId);
  let featureOverrides = '';
  try {
    const settings = require('./settings');
    const flags = settings.getFeatureFlags();
    if (!flags.visual) featureOverrides += '\n- Veçoritë vizuale MBYLLUR: mos ndihmo për imazhe, logo, dizajn UI.';
    if (!flags.tech) featureOverrides += '\n- Mbështetje teknikore MBYLLUR: mos ndihmo për kod, PHP, Node.js, database.';
    if (!flags.business) featureOverrides += '\n- Biznes/enterprise MBYLLUR: mos ndihmo për plan biznesi, marketing, markë.';
    if (featureOverrides) featureOverrides = '\n\nVEÇORITË TË MBYLLURA (mos ndihmo për këto):' + featureOverrides;
  } catch (_) {}
  
  let igBlock = '';
  if (instagramContext && instagramContext.length) {
    igBlock = '\n\nTË DHËNAT REALE INSTAGRAM (nga Meta API — përdor VETËM këto shifra, KURR mos trillosh):\n' + instagramContext.map(d => {
      const s = d.stats;
      const f = s.formatted || {};
      let line = `@${d.username}:\n`;
      line += `- Ndjekës: ${s.followers_count} (${f.followers || s.followers_count})\n`;
      line += `- Media: ${s.media_count} post\n`;
      line += `- Arritje ditore (reach): ${s.reach} (${f.reach || s.reach})\n`;
      line += `- Pamje ditore: ${s.impressions} (${f.impressions || s.impressions})\n`;
      line += `- Arritje javore: ${s.reach_week ?? '-'} (${f.reach_week || '-'})\n`;
      line += `- Pamje javore: ${s.impressions_week ?? '-'} (${f.impressions_week || '-'})\n`;
      line += `- Pamje profili (ditore): ${s.profile_views ?? 0}\n`;
      if (s.engagement_hint) line += `- Raport engagement: ${s.engagement_hint}\n`;
      if (s.issues && s.issues.length) {
        const issueMap = { reach_sifir: 'Reach 0 (përmbajtja nuk shihet)', dusuk_goruntulenme: 'Pamje të ulëta', dusuk_erisim_orani: 'Raport arritjeje i ulët', profil_goruntulenme_yok: 'Nuk ka pamje profili' };
        line += `- PROBLEME: ${s.issues.map(i => issueMap[i] || i).join('; ')} → analizo, jep këshilla konkrete\n`;
      }
      return line;
    }).join('\n') + '\n\nDETYRË: 1) Listo shifrat (Ndjekës, Arritje, Pamje...). 2) Bëj ANALIZË: Cilat janë pikat e forta? Çfarë të përmirësohet? 3) Jep 3-5 KËSHILLA konkrete (ora e përmbajtjes, strategji hashtag, frekuencë postimesh, cilësi vizuale). 4) Përgjigju plotësisht pyetjes së klientit — je asistenti i mediave sociale të biznesit. 5) Në fund: "Të dhënat nga Meta API — mund të vonojnë deri në 48 orë."';
  } else if (userMessage && /\b(istatistik|statistik|instagram|prestigex|meta|reach|ndjekës|si po shkon)\b/i.test(userMessage)) {
    igBlock = '\n\nPARALAJMËRIM: Të dhënat e Instagramit nuk u morën (gabim API ose llogaria nuk përputhet). Thuaj përdoruesit "Të dhënat nuk u morën në këtë moment". KURR mos trillosh shifra.';
  }
  
  const hasUiIntent = userMessage && /\b(index|arayüz|arayuz|dashboard|faqe|faqja|ndërfaqe|interface|ui|html|bootstrap|sayfa|panel|admin|kryefaqe|krye)\b/i.test(userMessage);
  const uiBlock = hasUiIntent ? `
KOD UI — NIVELI MË I LARTË (përdoruesi kërkon arayüz/faqe):
- Bootstrap 5.3.3: <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"> dhe <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"><\/script>
- HTML5 semantik: <header>, <main>, <nav>, <section>, <footer>
- Responsive: container-fluid, row, col-*, g-xl-*
- Komponente: navbar, card, btn btn-primary, form-control, table
- Pa gabime, kod i pastër, i gatshëm për kopjim
- Aksesueshmëri: aria-label ku nevojitet` : '';

  const systemPrompt = persona.systemPrompt + 
    `\n\nGJUHA E PËRGJIGJES: GJITHMONË VETËM Shqip. Turqisht JO.\n\nRREGULLA TË RËNDËSISHME:
1. GJUHA: Përgjigju GJITHMONË vetëm në Shqip.
2. PËRGJIGJE: Përgjigju drejtpërdrejt pyetjes. Mos dil nga tema. Jini të shkurtër dhe të qartë. Mos u zgjatni kot.
3. SHQIP: Gjuha letrare, ë ç dh th zh saktë. Gramatikë perfekte.
4. KURR: Mos jepni përgjigje të rastit, të parelevante ose të çuditshme. Nëse nuk kuptove thuaj "A mund ta shpjegoni më mirë?"
5. KOD UI: Kur kërkohet index/arayüz/dashboard — jep Bootstrap 5.3, kod premium, sorunsuz, responsive.` + featureOverrides + igBlock + uiBlock;
  
  const messages = [
    { role: 'system', content: systemPrompt }
  ];
  
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }
  
  messages.push({ role: 'user', content: userMessage, image: imageData });
  
  return messages;
}

function detectLanguage(text) {
  if (!text || !text.trim()) return 'sq-AL';
  const t = text.trim().toLowerCase();
  const albanianIndicators = /[ë]|përshëndetje|faleminderit|si jeni|si je|po |jo |për |me |ky |kjo |ato |shqip|shqiptar|pse |kur |ku |kush |cila |më ndihmo|ju lutem|mund të|a mund|a dini|a më thoni|a më shpjegoni|mirëmëngjes|mirëdita|natën e mirë|leogpt|shkruani|bisedoni|dërgo|zgjidhni/i;
  const englishIndicators = /\b(the|and|is|are|was|were|have|has|had|will|would|could|should|what|when|where|who|why|how|hello|thanks|please|help|can you|would you)\b/i;
  const albanianScore = (t.match(albanianIndicators) || []).length;
  const englishScore = (t.match(englishIndicators) || []).length;
  if (albanianScore >= englishScore) return 'sq-AL';
  if (englishScore > 0 || /^[a-z\s.,!?']+$/i.test(t.substring(0, 80))) return 'en-US';
  return 'sq-AL';
}

async function streamWithGroq(messages, onChunk, onComplete) {
  try {
    const groqMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    const stream = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages: groqMessages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.4
    });
    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        onChunk(content);
      }
    }
    onComplete(fullResponse);
  } catch (error) {
    console.error('Groq Error:', error);
    onChunk(error.message || 'Gabim Groq. Kontrolloni API key.');
    onComplete('');
  }
}

async function streamWithGemini(messages, onChunk, onComplete) {
  try {
    const model = geminiClient.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: messages.find((m) => m.role === 'system')?.content,
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
    });
    const chatHistory = messages.filter((m) => m.role !== 'system');
    const lastMsg = chatHistory.pop();
    const history = chatHistory.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    let lastParts;
    if (lastMsg.image) {
      lastParts = [
        { text: lastMsg.content || 'Çfarë shihni në këtë imazh?' },
        { inlineData: { mimeType: lastMsg.image.mimeType || 'image/jpeg', data: lastMsg.image.base64 } }
      ];
    } else {
      lastParts = [{ text: lastMsg.content }];
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastParts);
    let fullResponse = '';
    for await (const chunk of result.stream) {
      const text = chunk.text && chunk.text();
      if (text) {
        fullResponse += text;
        onChunk(text);
      }
    }
    onComplete(fullResponse);
  } catch (error) {
    console.error('Gemini Error:', error);
    onChunk(error.message || 'Gabim Gemini.');
    onComplete('');
  }
}

async function streamWithOllama(messages, onChunk, onComplete) {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: true
      })
    });

    if (!res.ok) {
      throw new Error(`Gabim Ollama: ${res.status}. A është ngarkuar Ollama?`);
    }

    const reader = res.body;
    const decoder = new TextDecoder();
    let fullResponse = '';

    for await (const chunk of reader) {
      const lines = decoder.decode(chunk).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          const content = data.message?.content || '';
          if (content) {
            fullResponse += content;
            onChunk(content);
          }
          if (data.done) break;
        } catch (_) {}
      }
    }
    onComplete(fullResponse);
  } catch (error) {
    console.error('Ollama Error:', error);
    onChunk(error.message || 'Ollama nuk mund të lidhet.');
    onComplete('');
  }
}

async function streamWithOpenAI(messages, onChunk, onComplete) {
  try {
    const openAIMessages = messages.map((m) => {
      if (m.role === 'user' && m.image) {
        const parts = [{ type: 'text', text: m.content || 'What is in this image?' }];
        parts.push({ type: 'image_url', image_url: { url: `data:${m.image.mimeType};base64,${m.image.base64}` } });
        return { role: 'user', content: parts };
      }
      return { role: m.role, content: m.content };
    });
    const stream = await openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: openAIMessages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.4
    });
    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        onChunk(content);
      }
    }
    onComplete(fullResponse);
  } catch (error) {
    console.error('OpenAI Error:', error);
    onChunk(error.message || 'Ndodhi një gabim.');
    onComplete('');
  }
}

async function streamChat(sessionId, userMessage, imageData, onChunk, onComplete, instagramContext) {
  const t = (userMessage || '').toLowerCase();
  if (/\b(shqip|arnavutça|arnavutca)\s*(fol|përgjigju|shkruaj)/i.test(t) || /\b(fol\s*shqip|përgjigju\s*në\s*shqip)/i.test(t)) {
    setPreferredLanguage(sessionId, 'sq-AL');
  }
  const preferred = getPreferredLanguage(sessionId);
  setDetectedLanguage(sessionId, preferred);
  addMessage(sessionId, 'user', userMessage + (imageData ? ' [imazh]' : ''));

  const messages = buildMessages(sessionId, userMessage, imageData, instagramContext);

  const done = (full) => {
    addMessage(sessionId, 'assistant', full);
    onComplete(full);
  };

  if (imageData && aiProvider !== 'gemini' && aiProvider !== 'openai') {
    onChunk('Images require GEMINI_API_KEY or OPENAI_API_KEY.');
    onComplete('');
    return;
  }

  if (aiProvider === 'groq') {
    await streamWithGroq(messages, onChunk, done);
  } else if (aiProvider === 'gemini') {
    await streamWithGemini(messages, onChunk, done);
  } else if (aiProvider === 'openai') {
    await streamWithOpenAI(messages, onChunk, done);
  } else if (aiProvider === 'ollama') {
    await streamWithOllama(messages, onChunk, done);
  } else {
    onChunk('AI nuk është konfiguruar. Shtoni GROQ_API_KEY ose GEMINI_API_KEY.');
    onComplete('');
  }
}

function getGreeting(lang) {
  const g = persona.greeting;
  return (g && g['sq-AL']) ? g['sq-AL'] : 'Përshëndetje! Unë jam LeoGPT. Shkruaj ose fol — përgjigjem në shqip. Si mund të ndihmoj?';
}

// Non-streaming completion (për Project Generator etj.)
async function complete(messages, maxTokens = 8192) {
  const simpleMessages = messages.map((m) => ({ role: m.role, content: m.content }));

  if (aiProvider === 'groq' && groqClient) {
    const res = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages: simpleMessages,
      stream: false,
      max_tokens: maxTokens,
      temperature: 0.3
    });
    return res.choices?.[0]?.message?.content || '';
  }
  if (aiProvider === 'gemini' && geminiClient) {
    const model = geminiClient.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: messages.find((m) => m.role === 'system')?.content,
      generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens }
    });
    const lastUser = messages.filter((m) => m.role === 'user').pop();
    const result = await model.generateContent(lastUser?.content || '');
    const response = result.response;
    return response?.text?.() || '';
  }
  if (aiProvider === 'openai' && openaiClient) {
    const res = await openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: simpleMessages,
      stream: false,
      max_tokens: maxTokens,
      temperature: 0.3
    });
    return res.choices?.[0]?.message?.content || '';
  }
  if (aiProvider === 'ollama') {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages: simpleMessages, stream: false })
    });
    if (!res.ok) throw new Error(`Ollama: ${res.status}`);
    const data = await res.json();
    return data.message?.content || '';
  }
  throw new Error('AI nuk është konfiguruar.');
}

module.exports = {
  initAI,
  streamChat,
  complete,
  getGreeting,
  detectLanguage
};
