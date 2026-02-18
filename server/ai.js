/**
 * LeoHoca - AI integration
 * Bulut: Groq (ücretsiz) | Gemini (ücretsiz) | OpenAI (ücretli)
 * Yerel: Ollama (ücretsiz, sınırsız)
 */

const { getConversationHistory, addMessage, setDetectedLanguage, getDetectedLanguage, getPreferredLanguage } = require('./memory');
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
    console.log('AI: Groq kullanılıyor (ücretsiz, bulut) -', GROQ_MODEL);
    return true;
  }
  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      aiProvider = 'gemini';
      console.log('AI: Google Gemini kullanılıyor (ücretsiz, bulut)');
      return true;
    } catch (e) {
      console.warn('Gemini paketi yok, Groq kullanın: npm install @google/generative-ai');
    }
  }
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    aiProvider = 'openai';
    console.log('AI: OpenAI kullanılıyor');
    return true;
  }
  aiProvider = 'ollama';
  console.log('AI: Ollama kullanılıyor (yerel) -', OLLAMA_MODEL);
  return true;
}

function buildMessages(sessionId, userMessage, imageData) {
  const history = getConversationHistory(sessionId);
  const preferredLang = getPreferredLanguage(sessionId);
  let featureOverrides = '';
  try {
    const settings = require('./settings');
    const flags = settings.getFeatureFlags();
    if (!flags.visual) featureOverrides += '\n- Görsel özellikler KAPALI: Resim, logo, UI tasarım konularında yardımcı olma.';
    if (!flags.tech) featureOverrides += '\n- Teknik destek KAPALI: Kod, PHP, Node.js, database konularında yardımcı olma.';
    if (!flags.business) featureOverrides += '\n- İş/girişim KAPALI: İş planı, pazarlama, marka konularında yardımcı olma.';
    if (featureOverrides) featureOverrides = '\n\nKAPALI ÖZELLİKLER (bunlarda yardım etme):' + featureOverrides;
  } catch (_) {}
  
  const systemPrompt = persona.systemPrompt + 
    `\n\nÖNEMLİ: Kullanıcı ${preferredLang === 'sq-AL' ? 'Arnavutça' : 'Türkçe'} seçti. SADECE ${preferredLang === 'sq-AL' ? 'Arnavutça' : 'Türkçe'} cevap ver.${preferredLang === 'sq-AL' ? ' Arnavutça gramer, yazım ve ifade kusursuz olsun.' : ''}` + featureOverrides;
  
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
  if (!text || !text.trim()) return 'tr-TR';
  const t = text.trim();
  const turkishIndicators = /[ğüşıöçĞÜŞİÖÇ]|merhaba|teşekkür|nasıl|var mı|yok mu|evet|hayır|için|ile|bunu|şu|bunlar|türkçe|neden|ne zaman|nerede|kim|hangi|bana|yardım|lütfen|olur mu|olabilir mi|yapabilir|bilir misin|söyler misin|açıklar mısın/i;
  const albanianIndicators = /[ë]|përshëndetje|faleminderit|si jeni|si je|po|jo|për|me|ky|kjo|ato|shqip|shqiptar|pse|kur|ku|kush|cila|më ndihmo|ju lutem|mund të|a mund|a dini|a më thoni|a më shpjegoni|mirëmëngjes|mirëdita|natën e mirë|leogpt|shkruani|bisedoni|dërgo|zgjidhni/i;
  const albanianScore = (t.match(albanianIndicators) || []).length;
  const turkishScore = (t.match(turkishIndicators) || []).length;
  if (albanianScore > turkishScore) return 'sq-AL';
  return 'tr-TR';
}

async function streamWithGroq(messages, onChunk, onComplete) {
  try {
    const stream = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      stream: true,
      max_tokens: 1000,
      temperature: 0.8
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
    onChunk(error.message || 'Groq hatası. API key kontrol edin.');
    onComplete('');
  }
}

async function streamWithGemini(messages, onChunk, onComplete) {
  try {
    const model = geminiClient.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: messages.find((m) => m.role === 'system')?.content
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
    onChunk(error.message || 'Gemini hatası.');
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
      throw new Error(`Ollama hatası: ${res.status}. Ollama yüklü mü?`);
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
    onChunk(error.message || 'Ollama bağlanamadı.');
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
      max_tokens: 1000,
      temperature: 0.8
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
    onChunk(error.message || 'Bir hata oluştu.');
    onComplete('');
  }
}

async function streamChat(sessionId, userMessage, imageData, onChunk, onComplete) {
  const detectedLang = detectLanguage(userMessage);
  setDetectedLanguage(sessionId, detectedLang);
  addMessage(sessionId, 'user', userMessage + (imageData ? ' [imazh]' : ''));

  const messages = buildMessages(sessionId, userMessage, imageData);

  const done = (full) => {
    addMessage(sessionId, 'assistant', full);
    onComplete(full);
  };

  if (imageData && aiProvider !== 'gemini' && aiProvider !== 'openai') {
    onChunk(currentLang === 'sq-AL' ? 'Imazhet kërkojnë GEMINI_API_KEY.' : 'Resim için GEMINI_API_KEY gerekli.');
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
    onChunk('AI yapılandırılmamış. GROQ_API_KEY veya GEMINI_API_KEY ekleyin.');
    onComplete('');
  }
}

function getGreeting(lang = 'tr-TR') {
  return persona.greeting[lang] || persona.greeting['tr-TR'];
}

module.exports = {
  initAI,
  streamChat,
  getGreeting,
  detectLanguage
};
