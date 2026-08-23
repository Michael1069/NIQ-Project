/**
 * Temporary In-Memory Session Manager for NIQ HelpDeskAI
 */

class SessionStore {
  constructor() {
    this.resetSession();
  }

  resetSession() {
    this.session = {
      ticketId: `ORB-${Math.floor(10000 + Math.random() * 90000)}`,
      systemId: 'SYS-NO-001',
      startTime: new Date().toISOString(),
      activeSnapshot: null,
      visionTextAnalysis: null,
      detectedError: null,
      missingPackage: null,
      messages: [
        {
          id: 'msg-welcome',
          sender: 'agent',
          text: 'Hello! I am NIQ HelpDeskAI. I am monitoring your workspace. How can I assist you with troubleshooting today?',
          timestamp: new Date().toLocaleTimeString()
        }
      ]
    };
  }

  getSession() {
    return this.session;
  }

  addMessage(sender, text, extra = {}) {
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender, // 'user' | 'agent' | 'vision' | 'system'
      text,
      timestamp: new Date().toLocaleTimeString(),
      ...extra
    };
    this.session.messages.push(msg);
    return msg;
  }

  setSnapshot(snapshotData) {
    this.session.activeSnapshot = snapshotData;
  }

  setVisionAnalysis(textAnalysis, errorDetails = {}) {
    this.session.visionTextAnalysis = textAnalysis;
    if (errorDetails.detectedError) this.session.detectedError = errorDetails.detectedError;
    if (errorDetails.missingPackage) this.session.missingPackage = errorDetails.missingPackage;
  }
}

const sessionStore = new SessionStore();
module.exports = sessionStore;
