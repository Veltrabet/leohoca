/**
 * LeoHoca - Real-time Voice AI Assistant
 * Client: WebSocket, Speech-to-Text, Text-to-Speech, Interruption
 */

(function () {
  'use strict';

  function getBackend() {
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
    'tr-TR': {
      statusConnecting: 'Bağlanıyor',
      statusConnected: 'Bağlı',
      statusReconnecting: 'Bağlantı koptu. Yeniden bağlanılıyor...',
      statusError: 'Bağlantı hatası',
      errorPrefix: 'Hata: ',
      listening: 'Dinliyorum... Konuşun.',
      hint: 'TR = Türkçe, SQ = Arnavutça — seçtiğin dilde konuşur',
      inputPlaceholder: 'Mesajını yaz...',
      hintInput: 'Yaz veya mikrofonla konuş — TR/SQ dil seç',
      emptyTitle: 'LeoGPT ile sohbet et',
      emptyDesc: 'Mesajını yazıp Gönder\'e bas veya mikrofonla konuş',
      tagline: 'Arkadaşın gibi burada',
      sendBtn: 'Gönder',
      micBtn: 'Mikrofon',
      wrongPassword: 'Yanlış şifre',
      connectionError: 'Bağlantı hatası',
      invalidUrl: 'Geçerli bir URL girin (https:// ile başlamalı)'
    },
    'sq-AL': {
      statusConnecting: 'Duke u lidhur',
      statusConnected: 'Lidhur',
      statusReconnecting: 'Lidhja u ndërpre. Duke u lidhur përsëri...',
      statusError: 'Gabim në lidhje',
      errorPrefix: 'Gabim: ',
      listening: 'Po dëgjoj... Fol.',
      hint: 'TR = Turqisht, SQ = Shqip — flet në gjuhën e zgjedhur',
      inputPlaceholder: 'Shkruani mesazhin tuaj...',
      hintInput: 'Shkruani ose folni me mikrofon — zgjidhni TR/SQ',
      emptyTitle: 'Bisedoni me LeoGPT',
      emptyDesc: 'Shkruani më poshtë dhe shtypni Dërgo ose folni me mikrofon',
      tagline: 'Si shoku juaj këtu',
      sendBtn: 'Dërgo',
      micBtn: 'Mikrofon',
      wrongPassword: 'Fjalëkalim i gabuar',
      connectionError: 'Gabim në lidhje',
      invalidUrl: 'Vendosni një URL të vlefshme (duhet të fillojë me https://)'
    }
  };

  function t(key) {
    return (UI[currentLang] || UI['tr-TR'])[key] || UI['tr-TR'][key];
  }

  function updateEmptyState() {
    const hasContent = elements.transcript?.children?.length > 0 || (elements.streamingText?.textContent || '').trim().length > 0;
    if (elements.emptyState) {
      elements.emptyState.classList.toggle('hidden', !!hasContent);
      const title = elements.emptyState.querySelector('.empty-title');
      const desc = elements.emptyState.querySelector('.empty-desc');
      if (title) title.textContent = t('emptyTitle');
      if (desc) desc.textContent = t('emptyDesc');
    }
  }

  function updateUI() {
    if (elements.hint) elements.hint.textContent = t('hintInput');
    if (elements.textInput) elements.textInput.placeholder = t('inputPlaceholder');
    updateEmptyState();
    const taglineEl = document.querySelector('.tagline');
    if (taglineEl) taglineEl.textContent = t('tagline');
    if (elements.sendBtn) {
      elements.sendBtn.setAttribute('aria-label', t('sendBtn'));
      elements.sendBtn.setAttribute('title', t('sendBtn'));
    }
    if (elements.micBtn) {
      elements.micBtn.setAttribute('aria-label', t('micBtn'));
      elements.micBtn.setAttribute('title', t('micBtn'));
    }
    if (elements.statusText) {
      if (elements.status?.classList?.contains('connected')) elements.statusText.textContent = t('statusConnected');
      else if (elements.status?.classList?.contains('error')) elements.statusText.textContent = t('statusError');
      else elements.statusText.textContent = t('statusConnecting');
    }
  }

  let ws = null;
  let sessionId = null;
  const savedLang = localStorage.getItem('leohoca_lang');
  let currentLang = (savedLang === 'sq-AL' || savedLang === 'tr-TR') ? savedLang : 'sq-AL';
  let recognition = null;
  let synthesis = window.speechSynthesis;
  synthesis.getVoices();
  let isListening = false;
  let isSpeaking = false;
  let currentUtterance = null;
  let streamedContent = '';
  let userInterrupted = false;

  const elements = {
    status: document.getElementById('status'),
    statusText: document.querySelector('.status-text'),
    transcript: document.getElementById('transcript'),
    streamingText: document.getElementById('streamingText'),
    visualizer: document.getElementById('visualizer'),
    micBtn: document.getElementById('micBtn'),
    sendBtn: document.getElementById('sendBtn'),
    textInput: document.getElementById('textInput'),
    hint: document.getElementById('hint'),
    langTabs: document.querySelectorAll('.lang-tab'),
    emptyState: document.getElementById('emptyState')
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
    elements.status.className = 'status ' + state;
    elements.statusText.textContent = text;
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
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'set_language', lang: currentLang }));
        }
        break;
      case 'greeting':
        if (msg.greeting) {
          appendAI(msg.greeting);
          speak(msg.greeting, currentLang);
        }
        break;
      case 'ai_start':
        userInterrupted = false;
        streamedContent = '';
        elements.streamingText.textContent = '';
        elements.streamingText.classList.add('active');
        stopSpeaking();
        updateEmptyState();
        break;
      case 'ai_chunk':
        streamedContent += msg.content || '';
        elements.streamingText.textContent = streamedContent;
        break;
      case 'ai_complete':
        elements.streamingText.textContent = '';
        elements.streamingText.classList.remove('active');
        const finalContent = streamedContent || msg.content || '';
        appendAI(finalContent, 'msg-' + Date.now());
        if (!userInterrupted && finalContent) {
          speak(finalContent, currentLang);
        }
        userInterrupted = false;
        break;
      case 'interrupt_ack':
        userInterrupted = true;
        break;
      case 'error':
        appendAI(t('errorPrefix') + (msg.message || (currentLang === 'sq-AL' ? 'Gabim i panjohur.' : 'Bilinmeyen hata')));
        setStatus(t('statusError'), 'error');
        break;
      default:
        break;
    }
  }

  function sendChat(text) {
    if (ws && ws.readyState === WebSocket.OPEN && text.trim()) {
      ws.send(JSON.stringify({ type: 'chat', text: text.trim() }));
    }
  }

  function sendInterrupt() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'interrupt' }));
    }
  }

  function appendUser(text) {
    const div = document.createElement('div');
    div.className = 'msg user';
    div.innerHTML = '<div class="msg-avatar">S</div><div class="msg-content">' + escapeHtml(text) + '</div>';
    elements.transcript.appendChild(div);
    elements.transcript.scrollTop = elements.transcript.scrollHeight;
    updateEmptyState();
  }

  function appendAI(text, messageId) {
    const div = document.createElement('div');
    div.className = 'msg ai';
    div.dataset.messageId = messageId || 'msg-' + Date.now();
    const feedbackHtml = '<div class="feedback-btns"><button class="feedback-btn" data-rating="1" title="' + (currentLang === 'sq-AL' ? 'Më pëlqen' : 'Beğendim') + '">👍</button><button class="feedback-btn" data-rating="-1" title="' + (currentLang === 'sq-AL' ? 'Nuk më pëlqen' : 'Beğenmedim') + '">👎</button></div>';
    div.innerHTML = '<div class="msg-avatar">L</div><div class="msg-body"><div class="msg-content">' + escapeHtml(text) + '</div>' + feedbackHtml + '</div>';
    elements.transcript.appendChild(div);
    div.querySelectorAll('.feedback-btn').forEach(btn => {
      btn.addEventListener('click', () => sendFeedback(div.dataset.messageId, parseInt(btn.dataset.rating), btn, div));
    });
    elements.transcript.scrollTop = elements.transcript.scrollHeight;
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

  function sendSetLanguage(lang) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'set_language', lang }));
    }
  }

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      elements.hint.textContent = currentLang === 'sq-AL' ? 'Shfletuesi juaj nuk mbështet njohjen e zërit. Provoni Chrome.' : 'Tarayıcınız ses tanıma desteklemiyor. Chrome kullanın.';
      return false;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentLang;

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
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0].transcript;
        if (r.isFinal) final += t;
        else interim += t;
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
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.error('Speech recognition error:', e.error);
      }
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
      recognition.lang = currentLang;
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

  function getVoiceForLang(lang) {
    const voices = synthesis.getVoices();
    const code = (lang || '').split('-')[0];
    const preferred = voices.find((v) => v.lang.startsWith(code));
    const fallbackCode = code === 'sq' ? 'en' : 'tr';
    const fallback = voices.find((v) => v.lang.startsWith(fallbackCode))
      || voices.find((v) => v.lang.startsWith('en'))
      || voices[0];
    return preferred || fallback;
  }

  function speak(text, lang) {
    if (!text || !text.trim()) return;

    stopSpeaking();
    const useLang = lang || currentLang;
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = useLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voice = getVoiceForLang(useLang);
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

  elements.langTabs?.forEach((tab) => {
    if (tab.dataset.lang === currentLang) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
    tab.addEventListener('click', () => {
      elements.langTabs?.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentLang = tab.dataset.lang;
      localStorage.setItem('leohoca_lang', currentLang);
      updateUI();
      sendSetLanguage(currentLang);
      if (recognition && isListening) {
        recognition.stop();
        recognition.lang = currentLang;
        setTimeout(() => recognition.start(), 100);
      }
    });
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

  const passwordOverlay = document.getElementById('passwordOverlay');
  const passwordInput = document.getElementById('passwordInput');
  const passwordSubmit = document.getElementById('passwordSubmit');
  const passwordError = document.getElementById('passwordError');
  const setupOverlay = document.getElementById('setupOverlay');
  const backendInput = document.getElementById('backendUrl');
  const saveBtn = document.getElementById('saveBackend');
  const userLink = document.getElementById('userLink');
  const userName = document.getElementById('userName');
  const logoutBtn = document.getElementById('logoutBtn');

  function updateUserUI() {
    const user = JSON.parse(localStorage.getItem('leogpt_user') || 'null');
    const adminLink = document.getElementById('adminLink');
    if (user && user.email) {
      if (userLink) userLink.style.display = 'none';
      if (userName) { userName.textContent = user.email; userName.style.display = 'inline'; }
      if (logoutBtn) logoutBtn.style.display = 'inline';
      if (adminLink) adminLink.style.display = user.is_admin ? 'inline' : 'none';
    } else {
      if (userLink) { userLink.style.display = 'inline'; userLink.textContent = currentLang === 'sq-AL' ? 'Hyr' : 'Giriş'; }
      if (userName) userName.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (adminLink) adminLink.style.display = 'none';
    }
  }
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('leogpt_token');
    localStorage.removeItem('leogpt_user');
    updateUserUI();
  });

  function showApp() {
    passwordOverlay.style.display = 'none';
    setupOverlay.style.display = 'none';
    updateUI();
    updateUserUI();
    if (needsSetup()) {
      setupOverlay.style.display = 'flex';
    } else {
      connect();
    }
  }

  function initApp() {
    if (sessionStorage.getItem('leohoca_auth') === '1') {
      showApp();
      return;
    }
    fetch(BACKEND + '/api/auth/required')
      .then((r) => r.json())
      .then((d) => {
        if (d.required) {
          passwordOverlay.style.display = 'flex';
          passwordSubmit?.addEventListener('click', () => {
            const pwd = passwordInput?.value || '';
            passwordError.textContent = '';
            fetch(BACKEND + '/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: pwd })
            })
              .then((r) => r.json())
              .then((data) => {
                if (data.ok) {
                  sessionStorage.setItem('leohoca_auth', '1');
                  showApp();
                } else {
                  passwordError.textContent = t('wrongPassword');
                }
              })
              .catch(() => { passwordError.textContent = t('connectionError'); });
          });
          passwordInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') passwordSubmit?.click();
          });
        } else {
          showApp();
        }
      })
      .catch(() => showApp());
  }

  if (needsSetup()) {
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
  } else {
    initApp();
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();
