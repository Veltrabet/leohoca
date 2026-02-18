/**
 * Simple session-based memory for LeoHoca
 * Stores conversation history per session for context-aware responses
 */

const sessions = new Map();
const MAX_SESSION_MESSAGES = 20;
const SESSION_TTL = 60 * 60 * 1000; // 1 hour

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  
  // Check if session expired
  if (Date.now() - session.lastActivity > SESSION_TTL) {
    sessions.delete(sessionId);
    return null;
  }
  
  return session;
}

function getOrCreateSession(sessionId) {
  let session = getSession(sessionId);
  if (!session) {
    session = {
      id: sessionId,
      messages: [],
      lastActivity: Date.now(),
      detectedLanguage: null
    };
    sessions.set(sessionId, session);
  }
  return session;
}

function addMessage(sessionId, role, content) {
  const session = getOrCreateSession(sessionId);
  session.lastActivity = Date.now();
  
  session.messages.push({ role, content });
  
  // Keep only last N messages to avoid token overflow
  if (session.messages.length > MAX_SESSION_MESSAGES) {
    session.messages = session.messages.slice(-MAX_SESSION_MESSAGES);
  }
  
  return session;
}

function getConversationHistory(sessionId) {
  const session = getSession(sessionId);
  if (!session) return [];
  return session.messages;
}

function setDetectedLanguage(sessionId, lang) {
  const session = getOrCreateSession(sessionId);
  session.detectedLanguage = lang;
  return session;
}

function getDetectedLanguage(sessionId) {
  const session = getSession(sessionId);
  return session?.detectedLanguage || null;
}

function clearSession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  getSession,
  getOrCreateSession,
  addMessage,
  getConversationHistory,
  setDetectedLanguage,
  getDetectedLanguage,
  clearSession
};
