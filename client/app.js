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

  let ws = null;
  let sessionId = null;
  let currentLang = 'tr-TR';
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
    hint: document.getElementById('hint'),
    langTabs: document.querySelectorAll('.lang-tab')
  };

  function setStatus(text, state = '') {
    elements.status.className = 'status ' + state;
    elements.statusText.textContent = text;
  }

  function connect() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => setStatus('Bağlı', 'connected');

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handleMessage(msg);
      } catch (err) {
        console.error('Parse error:', err);
      }
    };

    ws.onclose = () => {
      setStatus('Bağlantı koptu. Yeniden bağlanılıyor...', 'error');
      setTimeout(connect, 3000);
    };

    ws.onerror = () => setStatus('Bağlantı hatası', 'error');
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case 'connected':
        sessionId = msg.sessionId;
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
        break;
      case 'ai_chunk':
        streamedContent += msg.content;
        elements.streamingText.textContent = streamedContent;
        break;
      case 'ai_complete':
        elements.streamingText.textContent = '';
        elements.streamingText.classList.remove('active');
        appendAI(streamedContent || msg.content);
        if (!userInterrupted && (streamedContent || msg.content)) {
          const lang = msg.language || currentLang;
          speak(streamedContent || msg.content, lang);
        }
        userInterrupted = false;
        break;
      case 'interrupt_ack':
        userInterrupted = true;
        break;
      case 'error':
        appendAI('Hata: ' + (msg.message || 'Bilinmeyen hata'));
        setStatus('Hata', 'error');
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
    div.className = 'user-msg';
    div.textContent = 'Sen: ' + text;
    elements.transcript.appendChild(div);
    elements.transcript.scrollTop = elements.transcript.scrollHeight;
  }

  function appendAI(text) {
    const div = document.createElement('div');
    div.className = 'ai-msg';
    div.textContent = 'LeoHoca: ' + text;
    elements.transcript.appendChild(div);
    elements.transcript.scrollTop = elements.transcript.scrollHeight;
  }

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      elements.hint.textContent = 'Tarayıcınız ses tanıma desteklemiyor. Chrome kullanmayı deneyin.';
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
      elements.hint.textContent = 'Dinliyorum... Konuşun.';
    };

    recognition.onend = () => {
      isListening = false;
      elements.micBtn.classList.remove('listening');
      elements.visualizer.classList.remove('listening');
      elements.hint.textContent = 'Mikrofon butonuna basıp konuşun. Konuşurken AI duraklatılır.';
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
    const preferred = voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
    const fallback = voices.find((v) => v.lang.startsWith('tr')) || voices.find((v) => v.lang.startsWith('en'));
    return preferred || fallback || voices[0];
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

  elements.langTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      elements.langTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentLang = tab.dataset.lang;
      if (recognition && isListening) {
        recognition.stop();
        recognition.lang = currentLang;
        setTimeout(() => recognition.start(), 100);
      }
      elements.hint.textContent = currentLang === 'sq-AL' 
        ? 'Shtypni butonin e mikrofonit dhe folni. AI ndërpritet kur flisni.'
        : 'Mikrofon butonuna basıp konuşun. Konuşurken AI duraklatılır.';
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isListening) recognition?.stop();
  });

  synthesis.addEventListener('voiceschanged', () => synthesis.getVoices());

  const setupOverlay = document.getElementById('setupOverlay');
  const backendInput = document.getElementById('backendUrl');
  const saveBtn = document.getElementById('saveBackend');

  if (needsSetup() && setupOverlay) {
    setupOverlay.style.display = 'flex';
    saveBtn?.addEventListener('click', () => {
      const url = (backendInput?.value || '').trim().replace(/\/$/, '');
      if (!url || (!url.startsWith('https://') && !url.startsWith('http://'))) {
        alert('Geçerli bir URL girin (https:// ile başlamalı)');
        return;
      }
      localStorage.setItem('leohoca_backend', url);
      location.reload();
    });
  } else {
    connect();
    fetch(BACKEND + '/api/network')
    .then((r) => r.json())
    .then((d) => {
      if (d.phoneUrl && !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) {
        const el = document.getElementById('phoneUrl');
        if (el) {
          el.innerHTML = '📱 Telefon: <a href="' + d.phoneUrl + '" target="_blank">' + d.phoneUrl + '</a>';
        }
      }
    })
    .catch(() => {});
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();
