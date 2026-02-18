/**
 * LeoHoca - AI integration
 * Bulut: Groq (ücretsiz) | Gemini (ücretsiz) | OpenAI (ücretli)
 * Yerel: Ollama (ücretsiz, sınırsız)
 */

const { getConversationHistory, addMessage, setDetectedLanguage, getDetectedLanguage } = require('./memory');
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

function buildMessages(sessionId, userMessage) {
  const history = getConversationHistory(sessionId);
  const detectedLang = getDetectedLanguage(sessionId);
  
  const systemPrompt = persona.systemPrompt + 
    (detectedLang ? `\n\nCurrent language context: User prefers ${detectedLang}. Respond in that language.` : '');
  
  const messages = [
    { role: 'system', content: systemPrompt }
  ];
  
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }
  
  messages.push({ role: 'user', content: userMessage });
  
  return messages;
}

function detectLanguage(text) {
  const turkishIndicators = /[ğüşıöçĞÜŞİÖÇ]|merhaba|teşekkür|nasıl|var mı|yok mu|evet|hayır|için|ile|bunu|şu|bunlar|türkçe/i;
  const albanianIndicators = /[ëç]|përshëndetje|faleminderit|si|po|jo|për|me|ky|kjo|shqip|shqiptar/i;
  
  if (albanianIndicators.test(text) && !turkishIndicators.test(text)) {
    return 'sq-AL';
  }
  return 'tr-TR';
}

async function streamWithGroq(messages, onChunk, onComplete) {
  try {
    const stream = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      stream: true,
      max_tokens: 500,
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

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMsg.content);
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
    const stream = await openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      stream: true,
      max_tokens: 500,
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

async function streamChat(sessionId, userMessage, onChunk, onComplete) {
  const detectedLang = detectLanguage(userMessage);
  setDetectedLanguage(sessionId, detectedLang);
  addMessage(sessionId, 'user', userMessage);

  const messages = buildMessages(sessionId, userMessage);

  const done = (full) => {
    addMessage(sessionId, 'assistant', full);
    onComplete(full);
  };

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
