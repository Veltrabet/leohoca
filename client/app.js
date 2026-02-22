/**
 * LeoHoca - Real-time Voice AI Assistant
 * Client: WebSocket, Speech-to-Text, Text-to-Speech, Interruption
 */

(function () {
  'use strict';

  function getBackend() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return location.origin;
    }
    const fromConfig = (typeof LEOHOCA_BACKEND !== 'undefined' && LEOHOCA_BACKEND && String(LEOHOCA_BACKEND).trim())
      ? String(LEOHOCA_BACKEND).replace(/\/$/, '') : '';
    const fromStorage = localStorage.getItem('leohoca_backend') || '';
    return (fromConfig || fromStorage || location.origin);
  }

  function needsSetup() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return false;
    if (location.hostname.includes('railway.app')) return false;
    const stored = localStorage.getItem('leohoca_backend') || (typeof LEOHOCA_BACKEND !== 'undefined' && LEOHOCA_BACKEND && String(LEOHOCA_BACKEND).trim());
    return !stored;
  }

  const BACKEND = getBackend();
  const WS_URL = (BACKEND.startsWith('https') ? 'wss:' : 'ws:') + '//' + BACKEND.replace(/^https?:\/\//, '');
  const LANGUAGES = { 'tr-TR': 'tr-TR', 'sq-AL': 'sq-AL' };

  const UI = {
    'en': {
      statusConnecting: 'Connecting',
      statusConnected: 'Connected',
      statusReconnecting: 'Reconnecting...',
      statusError: 'Connection error',
      errorPrefix: 'Error: ',
      listening: 'Listening... Speak now.',
      hint: 'Write in any language — I\'ll respond in the same language',
      inputPlaceholder: 'Type your message in any language...',
      hintInput: 'Write in any language — I\'ll respond in the same language',
      emptyTitle: 'Chat with LeoGPT',
      emptyDesc: 'Write in any language — I\'ll respond in the same language',
      typingText: 'LeoGPT is typing...',
      newChat: 'New chat',
      searchChats: 'Search chats',
      searchPlaceholder: 'Search in messages...',
      searchNoResults: 'No results found',
      images: 'Images',
      applications: 'Applications',
      saveProject: 'Save this chat',
      projects: 'Projects',
      sendBtn: 'Send',
      micBtn: 'Microphone',
      imgBtn: 'Add image',
      copyBtn: 'Copy',
      copied: 'Copied!',
      listen: 'Listen',
      wrongPassword: 'Wrong password',
      connectionError: 'Connection error',
      invalidUrl: 'Enter a valid URL (must start with https://)',
      speechNotSupported: 'Speech recognition not supported. Try Chrome.',
      voiceSpeed: 'Voice speed',
      voiceType: 'Voice type',
      voiceFemale: 'Female',
      voiceMale: 'Male',
      voiceAuto: 'Auto',
      voiceSelect: 'Select voice'
    },
    'tr-TR': {
      statusConnecting: 'Bağlanıyor',
      statusConnected: 'Bağlı',
      statusReconnecting: 'Bağlantı koptu. Yeniden bağlanılıyor...',
      statusError: 'Bağlantı hatası',
      errorPrefix: 'Hata: ',
      listening: 'Dinliyorum... Konuşun.',
      hint: 'Herhangi bir dilde yaz — aynı dilde cevap veririm',
      inputPlaceholder: 'Mesajını yaz...',
      hintInput: 'Herhangi bir dilde yaz — aynı dilde cevap veririm',
      emptyTitle: 'LeoGPT ile sohbet et',
      emptyDesc: 'Mesajını yazıp Gönder\'e bas veya mikrofonla konuş',
      typingText: 'LeoGPT yazıyor...',
      tagline: 'Arkadaşın gibi burada',
      newChat: 'Yeni sohbet',
      searchChats: 'Sohbetleri ara',
      searchPlaceholder: 'Mesajlarda ara...',
      searchNoResults: 'Sonuç bulunamadı',
      images: 'Görseller',
      applications: 'Uygulamalar',
      saveProject: 'Bu sohbeti kaydet',
      projects: 'Projeler',
      sendBtn: 'Gönder',
      micBtn: 'Mikrofon',
      wrongPassword: 'Yanlış şifre',
      connectionError: 'Bağlantı hatası',
      invalidUrl: 'Geçerli bir URL girin (https:// ile başlamalı)',
      imgBtn: 'Resim ekle',
      copyBtn: 'Kopyala',
      copied: 'Kopyalandı!',
      listen: 'Dinle',
      speechNotSupported: 'Ses tanıma desteklenmiyor. Chrome kullanın.',
      voiceSpeed: 'Ses hızı',
      voiceType: 'Ses tipi',
      voiceFemale: 'Kadın',
      voiceMale: 'Erkek',
      voiceAuto: 'Otomatik',
      voiceSelect: 'Ses seç'
    },
    'sq-AL': {
      statusConnecting: 'Duke u lidhur',
      statusConnected: 'Lidhur',
      statusReconnecting: 'Lidhja u ndërpre. Duke u lidhur përsëri...',
      statusError: 'Gabim në lidhje',
      errorPrefix: 'Gabim: ',
      listening: 'Po dëgjoj... Fol.',
      hint: 'Shkruani në çdo gjuhë — përgjigjem në të njëjtën gjuhë',
      inputPlaceholder: 'Shkruani mesazhin tuaj...',
      hintInput: 'Shkruani në çdo gjuhë — përgjigjem në të njëjtën gjuhë',
      emptyTitle: 'Bisedoni me LeoGPT',
      emptyDesc: 'Shkruani më poshtë dhe shtypni Dërgo ose folni me mikrofon',
      typingText: 'LeoGPT po shkruan...',
      tagline: 'Asistenti juaj AI profesional — 100% Shqip',
      newChat: 'Bisedë e re',
      searchChats: 'Kërko bisedat',
      searchPlaceholder: 'Kërko në mesazhe...',
      searchNoResults: 'Nuk u gjet asgjë',
      images: 'Imazhet',
      applications: 'Aplikacionet',
      saveProject: 'Ruaj këtë bisedë',
      projects: 'Projektet',
      sendBtn: 'Dërgo',
      micBtn: 'Mikrofon',
      imgBtn: 'Ngjitni imazh',
      wrongPassword: 'Fjalëkalim i gabuar',
      connectionError: 'Gabim në lidhje',
      invalidUrl: 'Vendosni një URL të vlefshme (duhet të fillojë me https://)',
      copyBtn: 'Kopjo',
      copied: 'U kopjua!',
      listen: 'Dëgjoni',
      speechNotSupported: 'Njohja e zërit nuk mbështetet. Provoni Chrome.',
      voiceSpeed: 'Shpejtësia e zërit',
      voiceType: 'Lloji i zërit',
      voiceFemale: 'Femër',
      voiceMale: 'Mashkull',
      voiceAuto: 'Automatik',
      voiceSelect: 'Zgjidhni zërin'
    }
  };

  function getUILang() {
    const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    if (nav.startsWith('tr')) return 'tr-TR';
    if (nav.startsWith('sq')) return 'sq-AL';
    return 'en';
  }

  const uiLang = getUILang();

  function t(key) {
    return (UI[uiLang] || UI['en'])[key] || UI['en'][key];
  }

  const SUGGESTIONS = [
    'Hello! How can you help me?',
    'Explain quantum computing simply',
    'Write a short poem',
    'What can you do?'
  ];

  const APPS = [
    { id: 'summarize', tr: 'Özetle', sq: 'Përmblidh', en: 'Summarize', prompt: { tr: 'Özetle: ', sq: 'Përmblidh: ', en: 'Summarize: ' } },
    { id: 'translate', tr: 'Çevir', sq: 'Përkthe', en: 'Translate', prompt: { tr: 'Türkçeye çevir: ', sq: 'Përkthe në shqip: ', en: 'Translate to my language: ' } },
    { id: 'explain', tr: 'Açıkla', sq: 'Shpjego', en: 'Explain', prompt: { tr: 'Açıkla: ', sq: 'Shpjego: ', en: 'Explain: ' } },
    { id: 'expand', tr: 'Genişlet', sq: 'Zgjeroh', en: 'Expand', prompt: { tr: 'Genişlet: ', sq: 'Zgjeroh: ', en: 'Expand: ' } },
    { id: 'simplify', tr: 'Basitleştir', sq: 'Thjeshteso', en: 'Simplify', prompt: { tr: 'Basitleştir: ', sq: 'Thjeshteso: ', en: 'Simplify: ' } }
  ];

  const CODEX_PROMPT = { tr: 'Şu konuda kod yaz: ', sq: 'Shkruaj kod për: ', en: 'Write code for: ' };

  function updateEmptyState() {
    const hasTranscript = elements.transcript?.children?.length > 0;
    const hasStreaming = (elements.streamingText?.textContent || '').trim().length > 0;
    const hasTyping = elements.typingIndicator?.style?.display !== 'none';
    const hasContent = hasTranscript || hasStreaming || hasTyping;
    if (elements.emptyState) {
      elements.emptyState.classList.toggle('hidden', !!hasContent);
      const title = elements.emptyState?.querySelector('.empty-title');
      const desc = elements.emptyState?.querySelector('.empty-desc');
      if (title) title.textContent = t('emptyTitle');
      if (desc) desc.textContent = t('emptyDesc');
      const suggestionsEl = document.getElementById('suggestions');
      if (suggestionsEl && !hasContent) {
        suggestionsEl.innerHTML = SUGGESTIONS.map(s => '<button class="suggestion-chip">' + escapeHtml(s) + '</button>').join('');
        suggestionsEl.querySelectorAll('.suggestion-chip').forEach((btn, i) => {
          btn.addEventListener('click', () => {
            elements.textInput.value = SUGGESTIONS[i];
            elements.textInput.focus();
          });
        });
      }
    }
  }

  function updateUI() {
    if (elements.hint) elements.hint.textContent = t('hintInput');
    if (elements.textInput) elements.textInput.placeholder = t('inputPlaceholder');
    const typingEl = document.getElementById('typingText');
    if (typingEl) typingEl.textContent = t('typingText');
    updateEmptyState();
    if (elements.sendBtn) {
      elements.sendBtn.setAttribute('aria-label', t('sendBtn'));
      elements.sendBtn.setAttribute('title', t('sendBtn'));
    }
    if (elements.micBtn) {
      elements.micBtn.setAttribute('aria-label', t('micBtn'));
      elements.micBtn.setAttribute('title', t('micBtn'));
    }
    if (elements.imgBtn) {
      elements.imgBtn.setAttribute('aria-label', t('imgBtn'));
      elements.imgBtn.setAttribute('title', t('imgBtn'));
    }
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (key && t(key)) el.textContent = t(key);
    });
    if (elements.statusText) {
      if (elements.status?.classList?.contains('connected')) elements.statusText.textContent = t('statusConnected');
      else if (elements.status?.classList?.contains('error')) elements.statusText.textContent = t('statusError');
      else elements.statusText.textContent = t('statusConnecting');
    }
  }

  let ws = null;
  let sessionId = null;
  let lastDetectedLang = 'en-US';
  let recognition = null;
  let synthesis = window.speechSynthesis;
  synthesis.getVoices();
  let isListening = false;
  let isSpeaking = false;
  let currentUtterance = null;
  let streamedContent = '';
  let userInterrupted = false;
  let autoSpeak = localStorage.getItem('leohoca_autospeak') === '1';

  const elements = {
    status: document.getElementById('status'),
    statusText: document.querySelector('.status-text'),
    transcript: document.getElementById('transcript'),
    streamingText: document.getElementById('streamingText'),
    streamingMsg: document.getElementById('streamingMsg'),
    typingIndicator: document.getElementById('typingIndicator'),
    visualizer: document.getElementById('visualizer'),
    micBtn: document.getElementById('micBtn'),
    sendBtn: document.getElementById('sendBtn'),
    imgBtn: document.getElementById('imgBtn'),
    imageInput: document.getElementById('imageInput'),
    textInput: document.getElementById('textInput'),
    hint: document.getElementById('hint'),
    emptyState: document.getElementById('emptyState'),
    voiceToggle: document.getElementById('voiceToggle'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    themeToggle: document.getElementById('themeToggle'),
    newChatBtn: document.getElementById('newChatBtn'),
    searchChatsBtn: document.getElementById('searchChatsBtn'),
    imagesBtn: document.getElementById('imagesBtn'),
    applicationsBtn: document.getElementById('applicationsBtn'),
    codexBtn: document.getElementById('codexBtn'),
    projectsBtn: document.getElementById('projectsBtn')
  };

  function doSend() {
    const text = elements.textInput?.value?.trim();
    if (text) {
      sendInterrupt();
      stopSpeaking();
      appendUser(text);
      sendChat(text);
      elements.textInput.value = '';
    }
  }

  function setStatus(text, state = '') {
    if (elements.status) elements.status.className = 'status ' + state;
    if (elements.statusText) elements.statusText.textContent = text;
  }

  function connect() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => setStatus(t('statusConnected'), 'connected');

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handleMessage(msg);
      } catch (err) {
        console.error('Parse error:', err);
      }
    };

    ws.onclose = () => {
      setStatus(t('statusReconnecting'), 'error');
      setTimeout(connect, 3000);
    };

    ws.onerror = () => setStatus(t('statusError'), 'error');
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case 'connected':
        sessionId = msg.sessionId;
        break;
      case 'greeting':
        if (msg.greeting) {
          appendAI(msg.greeting);
          if (autoSpeak) speak(msg.greeting, 'en-US');
        }
        break;
      case 'ai_start':
        userInterrupted = false;
        streamedContent = '';
        elements.streamingText.textContent = '';
        elements.streamingText.classList.add('active');
        if (elements.typingIndicator) elements.typingIndicator.style.display = 'flex';
        if (elements.streamingMsg) elements.streamingMsg.style.display = 'none';
        stopSpeaking();
        updateEmptyState();
        break;
      case 'ai_chunk':
        if (elements.typingIndicator) elements.typingIndicator.style.display = 'none';
        if (elements.streamingMsg) elements.streamingMsg.style.display = 'flex';
        streamedContent += msg.content || '';
        elements.streamingText.textContent = streamedContent;
        scrollChatToBottom();
        break;
      case 'ai_complete':
        if (elements.typingIndicator) elements.typingIndicator.style.display = 'none';
        if (elements.streamingMsg) elements.streamingMsg.style.display = 'none';
        elements.streamingText.textContent = '';
        elements.streamingText.classList.remove('active');
        const finalContent = streamedContent || msg.content || '';
        lastDetectedLang = msg.language || lastDetectedLang;
        appendAI(finalContent, 'msg-' + Date.now());
        if (autoSpeak && !userInterrupted && finalContent) speak(finalContent, lastDetectedLang);
        userInterrupted = false;
        break;
      case 'interrupt_ack':
        userInterrupted = true;
        break;
      case 'error':
        appendAI(t('errorPrefix') + (msg.message || 'Unknown error'));
        setStatus(t('statusError'), 'error');
        break;
      default:
        break;
    }
  }

  function sendChat(text, imageBase64, imageMime) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const hasText = text && text.trim();
    const hasImage = imageBase64 && imageMime;
    if (!hasText && !hasImage) return;
    const msg = { type: 'chat', text: (text || '').trim() };
    if (hasImage) { msg.image = imageBase64; msg.imageMime = imageMime; }
    ws.send(JSON.stringify(msg));
  }

  function sendInterrupt() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'interrupt' }));
    }
  }

  function appendUser(text, imageDataUrl) {
    const div = document.createElement('div');
    div.className = 'msg user';
    let content = '';
    if (imageDataUrl) content += '<div class="msg-image"><img src="' + imageDataUrl + '" alt="Imazh" /></div>';
    if (text) content += '<div class="msg-content">' + escapeHtml(text) + '</div>';
    div.innerHTML = '<div class="msg-avatar">S</div><div class="msg-body">' + (content || '<div class="msg-content">—</div>') + '</div>';
    elements.transcript.appendChild(div);
    scrollChatToBottom();
    updateEmptyState();
  }

  function scrollChatToBottom() {
    const container = elements.transcript?.closest('.chat-container');
    if (container) container.scrollTop = container.scrollHeight;
    const sb = document.getElementById('scrollToBottom');
    if (sb) sb.style.display = 'none';
  }

  function simpleMarkdown(text) {
    let s = escapeHtml(text);
    s = s.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/\n/g, '<br>');
    return s;
  }

  function appendAI(text, messageId) {
    const div = document.createElement('div');
    div.className = 'msg ai';
    div.dataset.messageId = messageId || 'msg-' + Date.now();
    const playTitle = t('listen');
    const copyTitle = t('copyBtn');
    const feedbackHtml = '<div class="feedback-btns"><button class="feedback-btn copy-btn" title="' + copyTitle + '" aria-label="' + copyTitle + '">📋</button><button class="feedback-btn play-btn" title="' + playTitle + '" aria-label="' + playTitle + '">🔊</button><button class="feedback-btn" data-rating="1" title="👍">👍</button><button class="feedback-btn" data-rating="-1" title="👎">👎</button></div>';
    div.innerHTML = '<div class="msg-avatar">L</div><div class="msg-body"><div class="msg-content">' + simpleMarkdown(text) + '</div>' + feedbackHtml + '</div>';
    elements.transcript.appendChild(div);
    div.querySelector('.copy-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        const btn = div.querySelector('.copy-btn');
        const orig = btn.textContent;
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      }).catch(() => {});
    });
    div.querySelector('.play-btn')?.addEventListener('click', () => speak(text, lastDetectedLang));
    div.querySelectorAll('.feedback-btn[data-rating]').forEach(btn => {
      btn.addEventListener('click', () => sendFeedback(div.dataset.messageId, parseInt(btn.dataset.rating), btn, div));
    });
    scrollChatToBottom();
    updateEmptyState();
  }

  function sendFeedback(messageId, rating, btn, container) {
    if (container.dataset.feedbackSent === '1') return;
    const token = localStorage.getItem('leogpt_token');
    fetch(BACKEND + '/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({ rating, messageId, sessionId })
    }).then(r => r.json()).then(d => {
      if (d.ok) {
        container.dataset.feedbackSent = '1';
        container.querySelectorAll('.feedback-btn').forEach(b => b.classList.remove('liked', 'disliked', 'voted'));
        btn.classList.add('voted', rating === 1 ? 'liked' : 'disliked');
      }
    }).catch(() => {});
  }

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  let speechFallbackLang = null;

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (elements.hint) elements.hint.textContent = t('speechNotSupported');
      return false;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechFallbackLang || (navigator.language || 'en-US');

    recognition.onstart = () => {
      isListening = true;
      elements.micBtn.classList.add('listening');
      elements.visualizer.classList.add('listening');
      elements.hint.textContent = t('listening');
    };

    recognition.onend = () => {
      isListening = false;
      elements.micBtn.classList.remove('listening');
      elements.visualizer.classList.remove('listening');
      elements.hint.textContent = t('hint');
    };

    recognition.onresult = (e) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const txt = r[0].transcript;
        if (r.isFinal) final += txt;
      }
      if (final) {
        userInterrupted = true;
        sendInterrupt();
        stopSpeaking();
        appendUser(final);
        sendChat(final);
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'not-allowed') {
        elements.hint.textContent = 'Allow microphone in browser settings.';
        return;
      }
      if ((e.error === 'language-not-supported' || e.error === 'network') && !speechFallbackLang) {
        speechFallbackLang = 'en-US';
        elements.hint.textContent = 'Speak in any language. Click mic again.';
        return;
      }
      console.error('Speech recognition error:', e.error);
    };

    return true;
  }

  function toggleMic() {
    if (!recognition) {
      if (!initSpeechRecognition()) return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.lang = speechFallbackLang || (navigator.language || 'en-US');
      recognition.start();
    }
  }

  function stopSpeaking() {
    if (synthesis.speaking) {
      synthesis.cancel();
      isSpeaking = false;
      currentUtterance = null;
    }
  }

  const FEMALE_VOICE_NAMES = /samantha|karen|moira|fiona|victoria|emma|melina|milena|yelda|zira|aylin|filiz|zeina|amazon|female|woman|kadın|kadin|femëror|google.*female|female.*english|susan|anna|helen|kate|sarah|lucy|emily|sabina|maria|elena/i;
  const MALE_VOICE_NAMES = /alex|daniel|david|tom|mark|ralph|fred|paul|george|microsoft\s*david|male|man|erkek|mashkull|google.*male|male.*english|james|nick|harry|oliver|peter|steve|william|adam|brian/i;

  function voiceGender(n) {
    const name = (n || '').toLowerCase();
    if (FEMALE_VOICE_NAMES.test(name)) return 'female';
    if (MALE_VOICE_NAMES.test(name)) return 'male';
    return null;
  }

  function scoreVoice(v, langCode, preferGender) {
    const n = (v.name || '').toLowerCase();
    const l = (v.lang || '').toLowerCase();
    let score = 0;
    if (l.startsWith(langCode)) score += 100;
    if (v.localService) score += 50;
    if (/enhanced|premium|natural|neural|wave/i.test(n)) score += 40;
    if (/google|microsoft|samantha|alex|karen|daniel|moira|fiona|yelda|melina|milena/i.test(n)) score += 30;
    if (/compact|basic|system\s/i.test(n)) score -= 30;
    if (preferGender) {
      const g = voiceGender(n);
      if (g === preferGender) score += 60;
      else if (g && g !== preferGender) score -= 40;
    }
    return score;
  }

  function getVoiceForLang(lang) {
    const voices = synthesis.getVoices();
    const code = (lang || '').split('-')[0];
    const langTag = (lang || '').toLowerCase();
    const saved = localStorage.getItem('leohoca_voice_gender');
    const preferGender = saved === 'auto' ? null : (saved === 'male' ? 'male' : 'female');
    const albanian = voices.find((v) => v.lang.toLowerCase().startsWith('sq') || v.lang === 'sq-AL' || v.name.toLowerCase().includes('albanian'));
    if (albanian) return albanian;
    const matching = voices.filter((v) => v.lang.startsWith(code) || v.lang === langTag);
    const sorted = matching.length ? matching : voices.filter((v) => v.lang.startsWith('en') || v.lang.startsWith('tr'));
    const best = [...sorted].sort((a, b) => scoreVoice(b, code, preferGender) - scoreVoice(a, code, preferGender))[0];
    return best || voices.find((v) => v.lang.startsWith('en')) || voices[0];
  }

  function speak(text, lang) {
    if (!text || !text.trim()) return;

    stopSpeaking();
    const useLang = lang || lastDetectedLang;
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = useLang.startsWith('sq') ? 'sq-AL' : useLang;
    const savedRate = parseFloat(localStorage.getItem('leohoca_voice_rate'));
    utterance.rate = (savedRate >= 0.5 && savedRate <= 1.5) ? savedRate : 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const forcedVoice = localStorage.getItem('leohoca_voice_name');
    let voice = null;
    if (forcedVoice) {
      const voices = synthesis.getVoices();
      voice = voices.find((v) => v.name === forcedVoice);
    }
    if (!voice) voice = getVoiceForLang(useLang);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => { isSpeaking = true; };
    utterance.onend = () => { isSpeaking = false; };
    utterance.onerror = () => { isSpeaking = false; };

    currentUtterance = utterance;
    synthesis.speak(utterance);
  }

  elements.micBtn.addEventListener('click', () => {
    if (isListening) {
      sendInterrupt();
      stopSpeaking();
    }
    toggleMic();
  });

  elements.voiceToggle?.addEventListener('click', () => {
    autoSpeak = !autoSpeak;
    localStorage.setItem('leohoca_autospeak', autoSpeak ? '1' : '0');
    elements.voiceToggle.textContent = autoSpeak ? '🔊' : '🔇';
    elements.voiceToggle.title = autoSpeak ? 'Voice on' : 'Click 🔊 on message to listen';
  });
  if (elements.voiceToggle) elements.voiceToggle.textContent = autoSpeak ? '🔊' : '🔇';

  const voiceSettingsBtn = document.getElementById('voiceSettingsBtn');
  const voiceSettingsPopover = document.getElementById('voiceSettingsPopover');
  const voiceRateSlider = document.getElementById('voiceRateSlider');
  const voiceRateValue = document.getElementById('voiceRateValue');
  const voiceGenderSelect = document.getElementById('voiceGenderSelect');
  const voiceSelect = document.getElementById('voiceSelect');
  function populateVoiceSelect() {
    if (!voiceSelect) return;
    const voices = synthesis.getVoices();
    const current = voiceSelect.value;
    voiceSelect.innerHTML = '<option value="">— ' + t('voiceAuto') + ' —</option>';
    const trEn = voices.filter((v) => /^(tr|en)/i.test(v.lang));
    (trEn.length ? trEn : voices).forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = v.name + ' (' + v.lang + ')';
      voiceSelect.appendChild(opt);
    });
    if (current) voiceSelect.value = current;
  }
  if (voiceSettingsBtn && voiceSettingsPopover && voiceRateSlider) {
    synthesis.addEventListener('voiceschanged', populateVoiceSelect);
    if (synthesis.getVoices().length) populateVoiceSelect();
    const savedRate = parseFloat(localStorage.getItem('leohoca_voice_rate'));
    if (savedRate >= 0.5 && savedRate <= 1.5) {
      voiceRateSlider.value = savedRate;
      if (voiceRateValue) voiceRateValue.textContent = savedRate.toFixed(2);
    }
    const savedGender = localStorage.getItem('leohoca_voice_gender') || 'female';
    if (voiceGenderSelect) {
      voiceGenderSelect.value = savedGender;
      voiceGenderSelect.addEventListener('change', () => {
        localStorage.setItem('leohoca_voice_gender', voiceGenderSelect.value);
      });
    }
    const savedVoice = localStorage.getItem('leohoca_voice_name');
    if (voiceSelect) {
      if (savedVoice) voiceSelect.value = savedVoice;
      voiceSelect.addEventListener('change', () => {
        localStorage.setItem('leohoca_voice_name', voiceSelect.value || '');
      });
    }
    voiceSettingsBtn.addEventListener('click', () => {
      const visible = voiceSettingsPopover.style.display === 'flex';
      voiceSettingsPopover.style.display = visible ? 'none' : 'flex';
      if (!visible) populateVoiceSelect();
    });
    voiceRateSlider.addEventListener('input', () => {
      const v = parseFloat(voiceRateSlider.value);
      localStorage.setItem('leohoca_voice_rate', String(v));
      if (voiceRateValue) voiceRateValue.textContent = v.toFixed(2);
    });
    document.addEventListener('click', (e) => {
      if (voiceSettingsPopover.style.display === 'flex' && !voiceSettingsPopover.contains(e.target) && e.target !== voiceSettingsBtn) {
        voiceSettingsPopover.style.display = 'none';
      }
    });
  }

  elements.imgBtn?.addEventListener('click', () => elements.imageInput?.click());
  elements.imageInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      const mime = file.type;
      const text = elements.textInput?.value?.trim() || 'What do you see in this image?';
      sendInterrupt();
      stopSpeaking();
      appendUser(text, dataUrl);
      sendChat(text, base64, mime);
      elements.textInput.value = '';
    };
    reader.readAsDataURL(file);
  });

  elements.sendBtn?.addEventListener('click', doSend);
  elements.textInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isListening) recognition?.stop();
  });

  synthesis.addEventListener('voiceschanged', () => synthesis.getVoices());

  const authOverlay = document.getElementById('authOverlay');
  const mainApp = document.getElementById('mainApp');
  const passwordOverlay = document.getElementById('passwordOverlay');
  const passwordInput = document.getElementById('passwordInput');
  const passwordSubmit = document.getElementById('passwordSubmit');
  const passwordError = document.getElementById('passwordError');
  const setupOverlay = document.getElementById('setupOverlay');
  const backendInput = document.getElementById('backendUrl');
  const saveBtn = document.getElementById('saveBackend');
  const userBadge = document.getElementById('userBadge');
  const logoutBtn = document.getElementById('logoutBtn');

  function updateUserUI() {
    const user = JSON.parse(localStorage.getItem('leogpt_user') || 'null');
    const adminLink = document.getElementById('adminLink');
    if (user && user.email) {
      if (userBadge) { userBadge.textContent = user.email; userBadge.style.display = 'inline'; }
      if (logoutBtn) logoutBtn.style.display = 'inline';
      if (adminLink) adminLink.style.display = user.is_admin ? 'inline' : 'none';
    } else {
      if (userBadge) userBadge.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (adminLink) adminLink.style.display = 'none';
    }
  }

  function showMainApp() {
    authOverlay?.style && (authOverlay.style.display = 'none');
    passwordOverlay.style.display = 'none';
    setupOverlay.style.display = 'none';
    mainApp.style.display = 'flex';
    updateUI();
    updateUserUI();
    connect();
  }

  logoutBtn?.addEventListener('click', () => {
    if (ws) { ws.close(); ws = null; }
    localStorage.removeItem('leogpt_token');
    localStorage.removeItem('leogpt_user');
    updateUserUI();
  });

  function initApp() {
    if (needsSetup()) {
      authOverlay?.style && (authOverlay.style.display = 'none');
      setupOverlay.style.display = 'flex';
      saveBtn?.addEventListener('click', () => {
        const url = (backendInput?.value || '').trim().replace(/\/$/, '');
        if (!url || (!url.startsWith('https://') && !url.startsWith('http://'))) {
          alert(t('invalidUrl'));
          return;
        }
        localStorage.setItem('leohoca_backend', url);
        location.reload();
      });
      return;
    }
    fetch(BACKEND + '/api/config/public').then(r => r.json()).catch(() => ({})).then(config => {
      const logoUrl = config.logoUrl || config.content?.find(c => c.key === 'logo_url')?.value || '';
      const img = document.getElementById('appLogo');
      const fallback = document.getElementById('logoFallback');
      if (logoUrl && img) {
        img.src = logoUrl.startsWith('http') ? logoUrl : BACKEND + logoUrl;
      }
      if (img) img.onerror = () => { img.style.display = 'none'; if (fallback) fallback.style.display = 'flex'; };
    });
    fetch(BACKEND + '/api/auth/required').then(r => r.json()).then(d => {
      if (d.required) {
        authOverlay?.style && (authOverlay.style.display = 'none');
        passwordOverlay.style.display = 'flex';
        passwordSubmit?.addEventListener('click', () => {
          const pwd = passwordInput?.value || '';
          passwordError.textContent = '';
          fetch(BACKEND + '/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pwd }) })
            .then(r => r.json()).then(data => {
              if (data.ok) { sessionStorage.setItem('leohoca_auth', '1'); showMainApp(); }
              else passwordError.textContent = t('wrongPassword');
            }).catch(() => { passwordError.textContent = t('connectionError'); });
        });
        passwordInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') passwordSubmit?.click(); });
      } else showMainApp();
    }).catch(() => showMainApp());
  }

  initApp();

  /* Sidebar toggle (mobile) */
  function openSidebar() {
    elements.sidebar?.classList.add('open');
    elements.sidebarOverlay?.classList.add('visible');
  }
  function closeSidebar() {
    elements.sidebar?.classList.remove('open');
    elements.sidebarOverlay?.classList.remove('visible');
  }
  elements.sidebarToggle?.addEventListener('click', () => openSidebar());
  elements.sidebarOverlay?.addEventListener('click', () => closeSidebar());

  /* New chat */
  elements.newChatBtn?.addEventListener('click', () => {
    if (elements.transcript) elements.transcript.innerHTML = '';
    if (elements.streamingText) { elements.streamingText.textContent = ''; elements.streamingText.classList.remove('active'); }
    if (elements.streamingMsg) elements.streamingMsg.style.display = 'none';
    if (elements.typingIndicator) elements.typingIndicator.style.display = 'none';
    streamedContent = '';
    updateEmptyState();
    closeSidebar();
  });

  /* Search chats */
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const searchClose = document.getElementById('searchClose');

  function openSearch() {
    closeSidebar();
    searchOverlay?.classList.add('visible');
    if (searchInput) {
      searchInput.placeholder = t('searchPlaceholder');
      searchInput.value = '';
      searchInput.focus();
    }
    runSearch('');
  }

  function closeSearch() {
    searchOverlay?.classList.remove('visible');
    clearSearchHighlight();
  }

  function clearSearchHighlight() {
    elements.transcript?.querySelectorAll('.search-highlight').forEach(el => el.classList.remove('search-highlight'));
  }

  function runSearch(q) {
    clearSearchHighlight();
    if (!searchResults) return;
    searchResults.innerHTML = '';
    const term = (q || '').trim().toLowerCase();
    if (!term) return;

    const msgs = elements.transcript?.querySelectorAll('.msg');
    if (!msgs?.length) { searchResults.innerHTML = '<p class="search-empty">' + t('searchNoResults') + '</p>'; return; }

    const matches = [];
    msgs.forEach((msg, i) => {
      const content = msg.querySelector('.msg-content');
      if (!content) return;
      const text = content.textContent || '';
      if (text.toLowerCase().includes(term)) {
        const idx = text.toLowerCase().indexOf(term);
        matches.push({ msg, el: content, text, idx });
      }
    });

    if (matches.length === 0) {
      searchResults.innerHTML = '<p class="search-empty">' + t('searchNoResults') + '</p>';
      return;
    }

    matches.forEach((m, i) => {
      const div = document.createElement('button');
      div.className = 'search-result-item';
      const snippet = m.text.length > 80 ? m.text.substring(0, 80) + '…' : m.text;
      div.textContent = snippet;
      div.addEventListener('click', () => {
        m.msg.classList.add('search-highlight');
        m.msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        closeSearch();
      });
      searchResults.appendChild(div);
    });
  }

  elements.searchChatsBtn?.addEventListener('click', openSearch);
  searchClose?.addEventListener('click', closeSearch);
  searchInput?.addEventListener('input', (e) => runSearch(e.target.value));
  searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); });
  searchOverlay?.addEventListener('click', (e) => { if (e.target === searchOverlay) closeSearch(); });

  /* Images - trigger image upload */
  elements.imagesBtn?.addEventListener('click', () => {
    elements.imageInput?.click();
    closeSidebar();
  });

  /* Applications panel */
  const applicationsOverlay = document.getElementById('applicationsOverlay');
  const appsGrid = document.getElementById('appsGrid');
  const applicationsClose = document.getElementById('applicationsClose');

  function openApplications() {
    closeSidebar();
    applicationsOverlay?.classList.add('visible');
    appsGrid.innerHTML = '';
    APPS.forEach(app => {
      const btn = document.createElement('button');
      btn.className = 'app-btn';
      btn.textContent = app[uiLang === 'sq-AL' ? 'sq' : (uiLang === 'tr-TR' ? 'tr' : 'en')] || app.tr;
      btn.addEventListener('click', () => {
        const prompt = app.prompt[uiLang === 'sq-AL' ? 'sq' : (uiLang === 'tr-TR' ? 'tr' : 'en')] || app.prompt.tr;
        elements.textInput.value = prompt + (elements.textInput.value || '');
        elements.textInput.focus();
        applicationsOverlay?.classList.remove('visible');
      });
      appsGrid.appendChild(btn);
    });
  }

  elements.applicationsBtn?.addEventListener('click', openApplications);
  applicationsClose?.addEventListener('click', () => applicationsOverlay?.classList.remove('visible'));
  applicationsOverlay?.addEventListener('click', (e) => { if (e.target === applicationsOverlay) applicationsOverlay.classList.remove('visible'); });

  /* Codex - insert code prompt */
  elements.codexBtn?.addEventListener('click', () => {
    closeSidebar();
    const prompt = CODEX_PROMPT[uiLang === 'sq-AL' ? 'sq' : (uiLang === 'tr-TR' ? 'tr' : 'en')] || CODEX_PROMPT.en;
    elements.textInput.value = prompt + (elements.textInput.value || '');
    elements.textInput.focus();
  });

  /* Projects panel */
  const projectsOverlay = document.getElementById('projectsOverlay');
  const projectsList = document.getElementById('projectsList');
  const saveProjectBtn = document.getElementById('saveProjectBtn');
  const projectsClose = document.getElementById('projectsClose');
  const PROJECTS_KEY = 'leogpt_projects';

  function getProjects() {
    try {
      return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
    } catch { return []; }
  }

  function saveProjects(projects) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }

  function getTranscriptData() {
    const msgs = [];
    elements.transcript?.querySelectorAll('.msg').forEach((msg) => {
      const content = msg.querySelector('.msg-content');
      if (!content) return;
      const role = msg.classList.contains('user') ? 'user' : 'ai';
      const text = content.textContent || '';
      if (text) msgs.push({ role, content: text });
    });
    return msgs;
  }

  function loadTranscript(msgs) {
    if (!elements.transcript) return;
    elements.transcript.innerHTML = '';
    if (elements.streamingText) { elements.streamingText.textContent = ''; elements.streamingText.classList.remove('active'); }
    if (elements.streamingMsg) elements.streamingMsg.style.display = 'none';
    if (elements.typingIndicator) elements.typingIndicator.style.display = 'none';
    streamedContent = '';
    msgs.forEach((m) => {
      if (m.role === 'user') appendUser(m.content);
      else appendAI(m.content);
    });
    updateEmptyState();
  }

  function renderProjectsList() {
    projectsList.innerHTML = '';
    const projects = getProjects();
    if (projects.length === 0) {
      projectsList.innerHTML = '<p class="projects-empty">' + (uiLang === 'sq-AL' ? 'Nuk ka projekte' : (uiLang === 'tr-TR' ? 'Proje yok' : 'No projects')) + '</p>';
      return;
    }
    projects.reverse().forEach((proj) => {
      const div = document.createElement('div');
      div.className = 'project-item';
      const openLabel = uiLang === 'sq-AL' ? 'Hap' : (uiLang === 'tr-TR' ? 'Aç' : 'Open');
      div.innerHTML = '<span class="project-title">' + escapeHtml(proj.title || 'Chat') + '</span><div class="project-actions"><button class="project-load" data-id="' + proj.id + '">' + openLabel + '</button><button class="project-delete" data-id="' + proj.id + '">×</button></div>';
      div.querySelector('.project-load')?.addEventListener('click', () => {
        const p = getProjects().find(x => x.id === proj.id);
        if (p?.messages) loadTranscript(p.messages);
        projectsOverlay?.classList.remove('visible');
      });
      div.querySelector('.project-delete')?.addEventListener('click', () => {
        const next = getProjects().filter(x => x.id !== proj.id);
        saveProjects(next);
        renderProjectsList();
      });
      projectsList.appendChild(div);
    });
  }

  function openProjects() {
    closeSidebar();
    projectsOverlay?.classList.add('visible');
    saveProjectBtn.textContent = t('saveProject');
    renderProjectsList();
  }

  saveProjectBtn?.addEventListener('click', () => {
    const msgs = getTranscriptData();
    if (msgs.length === 0) return;
    const firstUser = msgs.find(m => m.role === 'user');
    const title = (firstUser?.content || 'Bisedë').substring(0, 40) + (firstUser?.content?.length > 40 ? '…' : '');
    const projects = getProjects();
    const proj = { id: 'p-' + Date.now(), title, messages: msgs, createdAt: Date.now() };
    projects.push(proj);
    saveProjects(projects);
    renderProjectsList();
  });

  elements.projectsBtn?.addEventListener('click', openProjects);
  projectsClose?.addEventListener('click', () => projectsOverlay?.classList.remove('visible'));
  projectsOverlay?.addEventListener('click', (e) => { if (e.target === projectsOverlay) projectsOverlay.classList.remove('visible'); });

  /* Theme toggle */
  const savedTheme = localStorage.getItem('leohoca_theme') || 'light';
  document.body.classList.toggle('theme-dark', savedTheme === 'dark');
  document.body.classList.toggle('theme-light', savedTheme === 'light');
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

  elements.themeToggle?.addEventListener('click', () => {
    const isDark = document.body.classList.contains('theme-dark');
    const next = isDark ? 'light' : 'dark';
    document.body.classList.toggle('theme-dark', next === 'dark');
    document.body.classList.toggle('theme-light', next === 'light');
    localStorage.setItem('leohoca_theme', next);
    if (themeIcon) themeIcon.textContent = next === 'dark' ? '🌙' : '☀️';
  });

  /* Scroll to bottom button */
  const chatContainer = document.getElementById('chatContainer');
  const scrollToBottom = document.getElementById('scrollToBottom');
  if (chatContainer && scrollToBottom) {
    chatContainer.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      scrollToBottom.style.display = scrollHeight - scrollTop - clientHeight > 100 ? 'flex' : 'none';
    });
    scrollToBottom.addEventListener('click', () => {
      chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    });
  }

  /* Keyboard shortcuts - only when main app is visible */
  document.addEventListener('keydown', (e) => {
    if (mainApp?.style?.display !== 'flex') return;
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Enter') { e.preventDefault(); doSend(); }
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();
