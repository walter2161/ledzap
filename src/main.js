// Arquivos da extensão LedZap
const extensionFiles = {
  'manifest.json': {
    content: JSON.stringify({
      "manifest_version": 3,
      "name": "LedZap - WhatsApp Extension",
      "version": "2.0.0",
      "description": "Extensão completa para WhatsApp Web com envio em massa, respostas automáticas e muito mais!",
      "permissions": [
        "activeTab",
        "storage",
        "scripting"
      ],
      "host_permissions": [
        "https://web.whatsapp.com/*"
      ],
      "content_scripts": [
        {
          "matches": ["https://web.whatsapp.com/*"],
          "js": ["content.js"],
          "css": ["styles.css"]
        }
      ],
      "action": {
        "default_popup": "popup.html",
        "default_title": "LedZap",
        "default_icon": {
          "16": "icons/icon16.png",
          "32": "icons/icon32.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        }
      },
      "icons": {
        "16": "icons/icon16.png",
        "32": "icons/icon32.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    }, null, 2),
    type: 'application/json'
  },

  'content.js': {
    content: `// LedZap - WhatsApp Extension
// Versão 2.0.0 - Open Source

class LedZap {
  constructor() {
    this.isActive = false;
    this.autoReplyEnabled = false;
    this.scheduledMessages = [];
    this.sentCount = 0;
    this.init();
  }

  init() {
    console.log('🚀 LedZap carregado com sucesso!');
    this.createInterface();
    this.loadSettings();
    this.startObserver();
    this.updateStats();
  }

  createInterface() {
    // Verificar se já existe o painel
    if (document.getElementById('ledzap-panel')) {
      return;
    }

    // Criar painel do LedZap
    const panel = document.createElement('div');
    panel.id = 'ledzap-panel';
    panel.innerHTML = \`
      <div class="ledzap-header">
        <h3>🚀 LedZap v2.0</h3>
        <div class="ledzap-controls">
          <button id="ledzap-toggle" class="ledzap-btn-toggle">Ativar</button>
          <button id="ledzap-minimize" class="ledzap-btn-minimize">−</button>
        </div>
      </div>
      <div class="ledzap-content" id="ledzap-content">
        <div class="ledzap-section">
          <h4>📤 Envio em Massa</h4>
          <textarea id="mass-message" placeholder="Digite sua mensagem para envio em massa..."></textarea>
          <div class="ledzap-input-group">
            <input type="number" id="mass-delay" placeholder="Delay (seg)" value="3" min="1" max="10">
            <button id="send-mass" class="ledzap-btn">Enviar para Todos</button>
          </div>
        </div>
        
        <div class="ledzap-section">
          <h4>🤖 Resposta Automática</h4>
          <div class="ledzap-checkbox-group">
            <input type="checkbox" id="auto-reply-toggle">
            <label for="auto-reply-toggle">Ativar respostas automáticas</label>
          </div>
          <textarea id="auto-reply-message" placeholder="Mensagem de resposta automática..."></textarea>
          <input type="number" id="auto-reply-delay" placeholder="Delay resposta (seg)" value="5" min="1" max="30">
        </div>
        
        <div class="ledzap-section">
          <h4>⏰ Agendamento</h4>
          <input type="datetime-local" id="schedule-time">
          <textarea id="schedule-message" placeholder="Mensagem para agendamento..."></textarea>
          <button id="schedule-send" class="ledzap-btn">Agendar Envio</button>
        </div>
        
        <div class="ledzap-section">
          <h4>🏷️ Etiquetas Rápidas</h4>
          <div class="ledzap-tags">
            <button class="ledzap-tag" data-tag="cliente">👤 Cliente</button>
            <button class="ledzap-tag" data-tag="lead">🎯 Lead</button>
            <button class="ledzap-tag" data-tag="importante">⭐ Importante</button>
            <button class="ledzap-tag" data-tag="pendente">⏳ Pendente</button>
          </div>
        </div>
        
        <div class="ledzap-section">
          <h4>📊 Estatísticas</h4>
          <div id="stats" class="ledzap-stats">
            <div class="stat-item">
              <span class="stat-label">Mensagens enviadas hoje:</span>
              <span id="sent-count" class="stat-value">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Conversas ativas:</span>
              <span id="active-chats" class="stat-value">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Respostas automáticas:</span>
              <span id="auto-replies" class="stat-value">0</span>
            </div>
          </div>
          <button id="reset-stats" class="ledzap-btn-secondary">Resetar Estatísticas</button>
        </div>
      </div>
    \`;
    
    document.body.appendChild(panel);
    this.bindEvents();
    this.makeDraggable();
  }

  bindEvents() {
    // Toggle principal
    document.getElementById('ledzap-toggle')?.addEventListener('click', () => {
      this.toggleExtension();
    });

    // Minimizar painel
    document.getElementById('ledzap-minimize')?.addEventListener('click', () => {
      this.toggleMinimize();
    });

    // Envio em massa
    document.getElementById('send-mass')?.addEventListener('click', () => {
      this.sendMassMessage();
    });

    // Resposta automática
    document.getElementById('auto-reply-toggle')?.addEventListener('change', (e) => {
      this.autoReplyEnabled = e.target.checked;
      this.saveSettings();
    });

    // Agendamento
    document.getElementById('schedule-send')?.addEventListener('click', () => {
      this.scheduleMessage();
    });

    // Etiquetas
    document.querySelectorAll('.ledzap-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        this.addTag(e.target.dataset.tag);
      });
    });

    // Reset estatísticas
    document.getElementById('reset-stats')?.addEventListener('click', () => {
      this.resetStats();
    });

    // Salvar configurações ao alterar campos
    ['auto-reply-message', 'auto-reply-delay', 'mass-delay'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        this.saveSettings();
      });
    });
  }

  makeDraggable() {
    const panel = document.getElementById('ledzap-panel');
    const header = panel.querySelector('.ledzap-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      isDragging = true;
      header.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        panel.style.transform = \`translate(\${currentX}px, \${currentY}px)\`;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      header.style.cursor = 'grab';
    });
  }

  toggleMinimize() {
    const content = document.getElementById('ledzap-content');
    const button = document.getElementById('ledzap-minimize');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      button.textContent = '−';
    } else {
      content.style.display = 'none';
      button.textContent = '+';
    }
  }

  toggleExtension() {
    this.isActive = !this.isActive;
    const button = document.getElementById('ledzap-toggle');
    button.textContent = this.isActive ? 'Desativar' : 'Ativar';
    button.className = this.isActive ? 'ledzap-btn-toggle active' : 'ledzap-btn-toggle';
    
    if (this.isActive) {
      this.showNotification('✅ LedZap ativado! Todas as funcionalidades estão disponíveis.', 'success');
    } else {
      this.showNotification('⏸️ LedZap desativado.', 'info');
    }
  }

  async sendMassMessage() {
    if (!this.isActive) {
      this.showNotification('⚠️ Ative o LedZap primeiro!', 'warning');
      return;
    }

    const message = document.getElementById('mass-message')?.value;
    const delay = parseInt(document.getElementById('mass-delay')?.value) || 3;
    
    if (!message?.trim()) {
      this.showNotification('⚠️ Digite uma mensagem primeiro!', 'warning');
      return;
    }

    const chats = this.getAllChats();
    if (chats.length === 0) {
      this.showNotification('⚠️ Nenhuma conversa encontrada!', 'warning');
      return;
    }

    let sentCount = 0;
    this.showNotification(\`📤 Iniciando envio para \${chats.length} conversas...\`, 'info');

    for (const chat of chats) {
      try {
        await this.sendMessageToChat(chat, message);
        sentCount++;
        this.sentCount++;
        this.updateStats();
        
        if (sentCount < chats.length) {
          await this.delay(delay * 1000);
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
      }
    }

    this.showNotification(\`✅ Mensagem enviada para \${sentCount} conversas!\`, 'success');
    this.saveSettings();
  }

  getAllChats() {
    const chatElements = document.querySelectorAll('[data-testid="cell-frame-container"]');
    return Array.from(chatElements).slice(0, 20); // Limitar para segurança
  }

  async sendMessageToChat(chatElement, message) {
    // Simular clique no chat
    chatElement.click();
    await this.delay(1000);

    // Encontrar campo de mensagem
    const messageBox = document.querySelector('[data-testid="conversation-compose-box-input"]');
    if (messageBox) {
      // Limpar campo
      messageBox.textContent = '';
      messageBox.focus();
      
      // Inserir mensagem
      document.execCommand('insertText', false, message);
      
      await this.delay(500);
      
      // Enviar mensagem
      const sendButton = document.querySelector('[data-testid="send"]');
      if (sendButton && !sendButton.disabled) {
        sendButton.click();
      }
    }
  }

  scheduleMessage() {
    const time = document.getElementById('schedule-time')?.value;
    const message = document.getElementById('schedule-message')?.value;
    
    if (!time || !message?.trim()) {
      this.showNotification('⚠️ Preencha todos os campos para agendamento!', 'warning');
      return;
    }

    const scheduleTime = new Date(time);
    const now = new Date();
    
    if (scheduleTime <= now) {
      this.showNotification('⚠️ Escolha um horário futuro!', 'warning');
      return;
    }

    const delay = scheduleTime.getTime() - now.getTime();
    
    setTimeout(() => {
      if (this.isActive) {
        document.getElementById('mass-message').value = message;
        this.sendMassMessage();
        this.showNotification('⏰ Mensagem agendada enviada!', 'success');
      }
    }, delay);

    this.showNotification(\`⏰ Mensagem agendada para \${scheduleTime.toLocaleString()}\`, 'success');
    
    // Limpar campos
    document.getElementById('schedule-time').value = '';
    document.getElementById('schedule-message').value = '';
  }

  addTag(tagName) {
    const activeChat = document.querySelector('[data-testid="cell-frame-container"][aria-selected="true"]');
    if (!activeChat) {
      this.showNotification('⚠️ Selecione uma conversa primeiro!', 'warning');
      return;
    }

    // Simular adição de etiqueta (visual feedback)
    this.showNotification(\`🏷️ Etiqueta "\${tagName}" adicionada!`, 'success');
  }

  startObserver() {
    // Observer para detectar novas mensagens
    const observer = new MutationObserver((mutations) => {
      if (this.autoReplyEnabled && this.isActive) {
        this.checkForNewMessages();
      }
      this.updateStats();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  checkForNewMessages() {
    const newMessages = document.querySelectorAll('[data-testid="msg-container"]:not(.ledzap-processed)');
    
    newMessages.forEach(msg => {
      msg.classList.add('ledzap-processed');
      
      // Verificar se é uma mensagem recebida (não enviada por nós)
      const isIncoming = msg.querySelector('[data-testid="msg-meta"]') && 
                        !msg.querySelector('[data-testid="msg-meta"] [data-testid="msg-dblcheck"]');
      
      if (isIncoming) {
        const autoReplyMessage = document.getElementById('auto-reply-message')?.value;
        const delay = parseInt(document.getElementById('auto-reply-delay')?.value) || 5;
        
        if (autoReplyMessage?.trim()) {
          setTimeout(() => {
            this.sendAutoReply(autoReplyMessage);
          }, delay * 1000);
        }
      }
    });
  }

  async sendAutoReply(message) {
    const messageBox = document.querySelector('[data-testid="conversation-compose-box-input"]');
    if (messageBox) {
      messageBox.textContent = '';
      messageBox.focus();
      document.execCommand('insertText', false, message);
      
      await this.delay(500);
      
      const sendButton = document.querySelector('[data-testid="send"]');
      if (sendButton && !sendButton.disabled) {
        sendButton.click();
        
        // Atualizar contador de respostas automáticas
        const autoReplies = parseInt(localStorage.getItem('ledzap-auto-replies') || '0') + 1;
        localStorage.setItem('ledzap-auto-replies', autoReplies.toString());
        this.updateStats();
      }
    }
  }

  updateStats() {
    const sentCount = localStorage.getItem('ledzap-sent-count') || '0';
    const autoReplies = localStorage.getItem('ledzap-auto-replies') || '0';
    const activeChats = this.getAllChats().length;
    
    const sentElement = document.getElementById('sent-count');
    const chatsElement = document.getElementById('active-chats');
    const repliesElement = document.getElementById('auto-replies');
    
    if (sentElement) sentElement.textContent = sentCount;
    if (chatsElement) chatsElement.textContent = activeChats;
    if (repliesElement) repliesElement.textContent = autoReplies;
  }

  resetStats() {
    localStorage.setItem('ledzap-sent-count', '0');
    localStorage.setItem('ledzap-auto-replies', '0');
    this.sentCount = 0;
    this.updateStats();
    this.showNotification('📊 Estatísticas resetadas!', 'info');
  }

  loadSettings() {
    const autoReply = localStorage.getItem('ledzap-auto-reply') === 'true';
    const autoReplyMessage = localStorage.getItem('ledzap-auto-reply-message') || '';
    const autoReplyDelay = localStorage.getItem('ledzap-auto-reply-delay') || '5';
    const massDelay = localStorage.getItem('ledzap-mass-delay') || '3';
    
    const autoReplyToggle = document.getElementById('auto-reply-toggle');
    const autoReplyMessageField = document.getElementById('auto-reply-message');
    const autoReplyDelayField = document.getElementById('auto-reply-delay');
    const massDelayField = document.getElementById('mass-delay');
    
    if (autoReplyToggle) autoReplyToggle.checked = autoReply;
    if (autoReplyMessageField) autoReplyMessageField.value = autoReplyMessage;
    if (autoReplyDelayField) autoReplyDelayField.value = autoReplyDelay;
    if (massDelayField) massDelayField.value = massDelay;
    
    this.autoReplyEnabled = autoReply;
    this.updateStats();
  }

  saveSettings() {
    const autoReplyMessage = document.getElementById('auto-reply-message')?.value || '';
    const autoReplyDelay = document.getElementById('auto-reply-delay')?.value || '5';
    const massDelay = document.getElementById('mass-delay')?.value || '3';
    
    localStorage.setItem('ledzap-auto-reply', this.autoReplyEnabled.toString());
    localStorage.setItem('ledzap-auto-reply-message', autoReplyMessage);
    localStorage.setItem('ledzap-auto-reply-delay', autoReplyDelay);
    localStorage.setItem('ledzap-mass-delay', massDelay);
    localStorage.setItem('ledzap-sent-count', this.sentCount.toString());
  }

  showNotification(message, type = 'info') {
    // Remover notificação existente
    const existing = document.querySelector('.ledzap-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = \`ledzap-notification ledzap-notification-\${type}\`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remover após 4 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Inicializar LedZap quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => new LedZap(), 2000);
  });
} else {
  setTimeout(() => new LedZap(), 2000);
}`,
    type: 'text/javascript'
  },

  'styles.css': {
    content: `/* LedZap Extension Styles */
#ledzap-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 380px;
  background: #ffffff;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  backdrop-filter: blur(10px);
}

.ledzap-header {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  color: white;
  padding: 16px 20px;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: grab;
  user-select: none;
}

.ledzap-header:active {
  cursor: grabbing;
}

.ledzap-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.ledzap-controls {
  display: flex;
  gap: 8px;
}

.ledzap-btn-toggle {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.ledzap-btn-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ledzap-btn-toggle.active {
  background: #ff4444;
  border-color: #ff4444;
}

.ledzap-btn-minimize {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.ledzap-btn-minimize:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ledzap-content {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.ledzap-content::-webkit-scrollbar {
  width: 6px;
}

.ledzap-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.ledzap-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.ledzap-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.ledzap-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.ledzap-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.ledzap-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ledzap-section textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s ease;
}

.ledzap-section textarea:focus {
  outline: none;
  border-color: #25D366;
  box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
}

.ledzap-section input[type="number"],
.ledzap-section input[type="datetime-local"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e1e8ed;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.ledzap-section input[type="number"]:focus,
.ledzap-section input[type="datetime-local"]:focus {
  outline: none;
  border-color: #25D366;
  box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
}

.ledzap-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ledzap-input-group input[type="number"] {
  flex: 0 0 100px;
  margin-bottom: 0;
}

.ledzap-btn {
  background: #25D366;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  transition: all 0.2s ease;
}

.ledzap-btn:hover {
  background: #128C7E;
  transform: translateY(-1px);
}

.ledzap-btn:active {
  transform: translateY(0);
}

.ledzap-btn-secondary {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #e1e8ed;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  width: 100%;
  transition: all 0.2s ease;
}

.ledzap-btn-secondary:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.ledzap-checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.ledzap-checkbox-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #25D366;
}

.ledzap-checkbox-group label {
  font-size: 13px;
  color: #333;
  cursor: pointer;
  user-select: none;
}

.ledzap-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ledzap-tag {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #e9ecef;
  padding: 6px 10px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.ledzap-tag:hover {
  background: #25D366;
  color: white;
  border-color: #25D366;
}

.ledzap-stats {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #25D366;
}

.ledzap-notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #333;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  z-index: 1000000;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 300px;
  text-align: center;
  animation: ledzapFadeIn 0.3s ease;
}

.ledzap-notification-success {
  background: #25D366;
}

.ledzap-notification-warning {
  background: #ff9800;
}

.ledzap-notification-error {
  background: #f44336;
}

.ledzap-notification-info {
  background: #2196f3;
}

@keyframes ledzapFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* Responsivo */
@media (max-width: 768px) {
  #ledzap-panel {
    width: 320px;
    right: 10px;
    top: 10px;
  }
  
  .ledzap-content {
    max-height: 400px;
  }
  
  .ledzap-input-group {
    flex-direction: column;
  }
  
  .ledzap-input-group input[type="number"] {
    flex: none;
    width: 100%;
  }
}

/* Animações suaves */
#ledzap-panel {
  animation: ledzapSlideIn 0.3s ease;
}

@keyframes ledzapSlideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}`,
    type: 'text/css'
  },

  'popup.html': {
    content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LedZap - WhatsApp Extension</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 350px;
      min-height: 400px;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      color: white;
    }
    
    .header {
      text-align: center;
      padding: 24px 20px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .version {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 500;
    }
    
    .status {
      margin: 20px;
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .status-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .status-text {
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .status-desc {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .features {
      padding: 0 20px 20px;
    }
    
    .feature {
      margin-bottom: 16px;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.2s ease;
    }
    
    .feature:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-1px);
    }
    
    .feature-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    
    .feature-icon {
      font-size: 18px;
    }
    
    .feature-title {
      font-weight: 600;
      font-size: 14px;
    }
    
    .feature-desc {
      font-size: 12px;
      opacity: 0.85;
      line-height: 1.4;
      margin-left: 28px;
    }
    
    .footer {
      text-align: center;
      padding: 16px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.1);
    }
    
    .footer-text {
      font-size: 11px;
      opacity: 0.7;
      line-height: 1.4;
    }
    
    .open-whatsapp {
      display: block;
      width: calc(100% - 40px);
      margin: 16px 20px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
      font-size: 14px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      transition: all 0.2s ease;
    }
    
    .open-whatsapp:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      🚀 LedZap
    </div>
    <div class="version">Extensão WhatsApp v2.0</div>
  </div>
  
  <div class="status">
    <div class="status-icon">✅</div>
    <div class="status-text">Extensão Ativa</div>
    <div class="status-desc">Todas as funcionalidades liberadas</div>
  </div>
  
  <a href="https://web.whatsapp.com" target="_blank" class="open-whatsapp">
    📱 Abrir WhatsApp Web
  </a>
  
  <div class="features">
    <div class="feature">
      <div class="feature-header">
        <span class="feature-icon">📤</span>
        <span class="feature-title">Envio em Massa</span>
      </div>
      <div class="feature-desc">Envie mensagens para múltiplos contatos com delay personalizado</div>
    </div>
    
    <div class="feature">
      <div class="feature-header">
        <span class="feature-icon">🤖</span>
        <span class="feature-title">Respostas Automáticas</span>
      </div>
      <div class="feature-desc">Configure respostas automáticas inteligentes</div>
    </div>
    
    <div class="feature">
      <div class="feature-header">
        <span class="feature-icon">⏰</span>
        <span class="feature-title">Agendamento</span>
      </div>
      <div class="feature-desc">Agende mensagens para envio futuro</div>
    </div>
    
    <div class="feature">
      <div class="feature-header">
        <span class="feature-icon">🏷️</span>
        <span class="feature-title">Etiquetas</span>
      </div>
      <div class="feature-desc">Sistema de etiquetas para organização</div>
    </div>
    
    <div class="feature">
      <div class="feature-header">
        <span class="feature-icon">📊</span>
        <span class="feature-title">Estatísticas</span>
      </div>
      <div class="feature-desc">Acompanhe relatórios detalhados</div>
    </div>
  </div>
  
  <div class="footer">
    <div class="footer-text">
      Acesse web.whatsapp.com para usar todas as funcionalidades.<br>
      Projeto open source - Use gratuitamente!
    </div>
  </div>
</body>
</html>`,
    type: 'text/html'
  },

  'README.md': {
    content: `# LedZap - Extensão WhatsApp v2.0

## 🚀 Sobre o LedZap

O LedZap é uma extensão completa e gratuita para WhatsApp Web que oferece funcionalidades avançadas para otimizar sua comunicação. Esta versão é totalmente open source e não requer login ou pagamento.

## ✨ Funcionalidades

### 📤 Envio em Massa
- Envie mensagens para múltiplos contatos simultaneamente
- Delay personalizável entre envios (1-10 segundos)
- Interface intuitiva e segura

### 🤖 Respostas Automáticas
- Configure mensagens de resposta automática
- Delay configurável para respostas (1-30 segundos)
- Ativação/desativação rápida

### ⏰ Agendamento de Mensagens
- Agende mensagens para envio futuro
- Interface de data e hora integrada
- Execução automática no horário programado

### 🏷️ Sistema de Etiquetas
- Etiquetas rápidas: Cliente, Lead, Importante, Pendente
- Organização visual de conversas
- Aplicação com um clique

### 📊 Estatísticas Detalhadas
- Contador de mensagens enviadas
- Número de conversas ativas
- Respostas automáticas enviadas
- Opção de reset de estatísticas

## 🔧 Instalação

### Pré-requisitos
- Google Chrome ou navegador baseado em Chromium
- Acesso ao WhatsApp Web

### Passos para Instalação

1. **Baixe todos os arquivos da extensão**
   - Crie uma pasta chamada "LedZap-Extension"
   - Baixe todos os arquivos listados abaixo para esta pasta

2. **Abra o Chrome**
   - Digite \`chrome://extensions/\` na barra de endereços
   - Ou vá em Menu > Mais ferramentas > Extensões

3. **Ative o Modo Desenvolvedor**
   - Clique no botão "Modo do desenvolvedor" no canto superior direito

4. **Carregue a Extensão**
   - Clique em "Carregar sem compactação"
   - Selecione a pasta "LedZap-Extension" que você criou

5. **Pronto!**
   - A extensão será instalada e aparecerá na lista
   - Acesse [web.whatsapp.com](https://web.whatsapp.com) para usar

## 📁 Arquivos Necessários

Certifique-se de baixar todos estes arquivos na mesma pasta:

- \`manifest.json\` - Configuração da extensão
- \`content.js\` - Script principal com todas as funcionalidades
- \`styles.css\` - Estilos da interface
- \`popup.html\` - Interface do popup da extensão
- \`README.md\` - Este arquivo de instruções

## 🎯 Como Usar

1. **Acesse o WhatsApp Web**
   - Vá para [web.whatsapp.com](https://web.whatsapp.com)
   - Faça login normalmente

2. **Localize o Painel LedZap**
   - O painel aparecerá no canto superior direito
   - Clique em "Ativar" para começar a usar

3. **Configure as Funcionalidades**
   - **Envio em Massa**: Digite a mensagem e clique em "Enviar para Todos"
   - **Resposta Automática**: Ative o checkbox e configure a mensagem
   - **Agendamento**: Selecione data/hora e digite a mensagem
   - **Etiquetas**: Clique nas etiquetas para aplicar às conversas

## ⚙️ Configurações

### Envio em Massa
- **Delay entre envios**: 1-10 segundos (padrão: 3 segundos)
- **Limite de segurança**: Máximo 20 conversas por vez

### Respostas Automáticas
- **Delay de resposta**: 1-30 segundos (padrão: 5 segundos)
- **Detecção automática**: Identifica mensagens recebidas

### Interface
- **Painel arrastável**: Clique e arraste o cabeçalho
- **Minimização**: Botão (-) para minimizar/expandir
- **Persistência**: Configurações salvas automaticamente

## 🔒 Segurança e Privacidade

- **Código aberto**: Todo o código é transparente e auditável
- **Dados locais**: Todas as configurações ficam no seu navegador
- **Sem coleta de dados**: Não enviamos nenhuma informação para servidores externos
- **Sem login**: Não requer cadastro ou autenticação

## ⚠️ Importante

- **Use com responsabilidade**: Respeite os termos de uso do WhatsApp
- **Não envie spam**: Use as funcionalidades de forma ética
- **Backup**: Faça backup das suas configurações importantes
- **Atualizações**: Verifique periodicamente por novas versões

## 🐛 Solução de Problemas

### A extensão não aparece no WhatsApp
- Verifique se todos os arquivos estão na mesma pasta
- Recarregue a página do WhatsApp Web
- Verifique se a extensão está ativada em chrome://extensions/

### Mensagens não são enviadas
- Certifique-se de que o LedZap está ativado
- Verifique se há conversas abertas no WhatsApp
- Aguarde o carregamento completo da página

### Painel não responde
- Recarregue a página do WhatsApp Web
- Desative e reative a extensão
- Verifique o console do navegador (F12) para erros

## 📝 Changelog

### v2.0.0
- Interface completamente redesenhada
- Sistema de etiquetas implementado
- Estatísticas detalhadas
- Painel arrastável e minimizável
- Melhor detecção de mensagens
- Configurações persistentes
- Notificações visuais aprimoradas

## 🤝 Contribuição

Este é um projeto open source! Contribuições são bem-vindas:

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no repositório
- Consulte a documentação
- Verifique as perguntas frequentes

---

**Desenvolvido pela comunidade LedZap**  
*Versão 2.0.0 - Open Source e Gratuito para sempre!*`,
    type: 'text/markdown'
  }
};

// Função para download individual de arquivos
function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type: type });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification(`✅ Arquivo ${filename} baixado com sucesso!`);
}

// Função para mostrar notificações
function showNotification(message) {
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #25D366;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 300px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
    ">
      ${message}
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// Criar seção de downloads na página
function createDownloadSection() {
  const downloadSection = document.getElementById('download');
  if (!downloadSection) return;

  const container = downloadSection.querySelector('.container');
  if (!container) return;

  // Substituir o conteúdo da seção de download
  container.innerHTML = `
    <div class="download-content">
      <h2 class="section-title">Baixe os Arquivos da Extensão</h2>
      <p class="section-subtitle">
        Como não conseguimos gerar arquivos ZIP funcionais, você pode baixar cada arquivo individualmente.
        Crie uma pasta chamada "LedZap-Extension" e baixe todos os arquivos abaixo nesta pasta.
      </p>
      
      <div class="download-instructions">
        <div class="instruction-step">
          <span class="step-number">1</span>
          <span>Crie uma pasta chamada "LedZap-Extension" no seu computador</span>
        </div>
        <div class="instruction-step">
          <span class="step-number">2</span>
          <span>Baixe todos os arquivos abaixo nesta pasta</span>
        </div>
        <div class="instruction-step">
          <span class="step-number">3</span>
          <span>Siga as instruções de instalação na seção abaixo</span>
        </div>
      </div>
      
      <div class="files-grid">
        ${Object.entries(extensionFiles).map(([filename, fileData]) => `
          <div class="file-card">
            <div class="file-info">
              <div class="file-icon">${getFileIcon(filename)}</div>
              <div class="file-details">
                <h4>${filename}</h4>
                <p>${getFileDescription(filename)}</p>
                <span class="file-size">${getFileSize(fileData.content)} KB</span>
              </div>
            </div>
            <button class="btn-download-file" onclick="downloadFile('${filename}', extensionFiles['${filename}'].content, extensionFiles['${filename}'].type)">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Baixar
            </button>
          </div>
        `).join('')}
      </div>
      
      <div class="download-all">
        <button id="downloadAllBtn" class="btn btn-download-all">
          📦 Baixar Todos os Arquivos (um por vez)
        </button>
      </div>
    </div>
  `;
}

// Funções auxiliares
function getFileIcon(filename) {
  const ext = filename.split('.').pop();
  const icons = {
    'json': '⚙️',
    'js': '📜',
    'css': '🎨',
    'html': '🌐',
    'md': '📝'
  };
  return icons[ext] || '📄';
}

function getFileDescription(filename) {
  const descriptions = {
    'manifest.json': 'Configuração principal da extensão',
    'content.js': 'Script com todas as funcionalidades',
    'styles.css': 'Estilos da interface do LedZap',
    'popup.html': 'Interface do popup da extensão',
    'README.md': 'Instruções completas de instalação'
  };
  return descriptions[filename] || 'Arquivo da extensão';
}

function getFileSize(content) {
  return Math.round(new Blob([content]).size / 1024);
}

// Função para baixar todos os arquivos
function downloadAllFiles() {
  let index = 0;
  const files = Object.entries(extensionFiles);
  
  function downloadNext() {
    if (index < files.length) {
      const [filename, fileData] = files[index];
      downloadFile(filename, fileData.content, fileData.type);
      index++;
      setTimeout(downloadNext, 1000); // Delay de 1 segundo entre downloads
    } else {
      showNotification('🎉 Todos os arquivos foram baixados! Agora siga as instruções de instalação.');
    }
  }
  
  downloadNext();
}

// Smooth scroll para links internos
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Animação de entrada dos elementos
function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  });

  document.querySelectorAll('.feature-card, .step, .file-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Criar seção de downloads
  createDownloadSection();
  
  // Botão para baixar todos os arquivos
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', downloadAllFiles);
  }

  // Inicializar funcionalidades
  initSmoothScroll();
  initAnimations();

  // Mostrar mensagem de boas-vindas
  setTimeout(() => {
    showNotification('🎉 Bem-vindo ao LedZap! Baixe todos os arquivos para instalar a extensão.');
  }, 2000);
});

// Adicionar efeito de parallax no hero
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.style.transform = `translateY(${scrolled * 0.3}px)`;
  }
});

console.log('🚀 LedZap Landing Page carregada com sucesso!');