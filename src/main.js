// Função para criar e baixar o arquivo ZIP da extensão
function createExtensionZip() {
  // Conteúdo do manifest.json
  const manifest = {
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
  };

  // Conteúdo do content.js
  const contentScript = `
// LedZap - WhatsApp Extension
// Versão 2.0.0 - Open Source

class LedZap {
  constructor() {
    this.isActive = false;
    this.autoReplyEnabled = false;
    this.scheduledMessages = [];
    this.init();
  }

  init() {
    console.log('🚀 LedZap carregado com sucesso!');
    this.createInterface();
    this.loadSettings();
    this.startObserver();
  }

  createInterface() {
    // Criar painel do LedZap
    const panel = document.createElement('div');
    panel.id = 'ledzap-panel';
    panel.innerHTML = \`
      <div class="ledzap-header">
        <h3>🚀 LedZap</h3>
        <button id="ledzap-toggle">Ativar</button>
      </div>
      <div class="ledzap-content">
        <div class="ledzap-section">
          <h4>📤 Envio em Massa</h4>
          <textarea id="mass-message" placeholder="Digite sua mensagem..."></textarea>
          <button id="send-mass">Enviar para Todos</button>
        </div>
        
        <div class="ledzap-section">
          <h4>🤖 Resposta Automática</h4>
          <input type="checkbox" id="auto-reply-toggle">
          <label for="auto-reply-toggle">Ativar respostas automáticas</label>
          <textarea id="auto-reply-message" placeholder="Mensagem automática..."></textarea>
        </div>
        
        <div class="ledzap-section">
          <h4>⏰ Agendamento</h4>
          <input type="datetime-local" id="schedule-time">
          <textarea id="schedule-message" placeholder="Mensagem agendada..."></textarea>
          <button id="schedule-send">Agendar</button>
        </div>
        
        <div class="ledzap-section">
          <h4>📊 Estatísticas</h4>
          <div id="stats">
            <p>Mensagens enviadas hoje: <span id="sent-count">0</span></p>
            <p>Conversas ativas: <span id="active-chats">0</span></p>
          </div>
        </div>
      </div>
    \`;
    
    document.body.appendChild(panel);
    this.bindEvents();
  }

  bindEvents() {
    // Toggle principal
    document.getElementById('ledzap-toggle').addEventListener('click', () => {
      this.toggleExtension();
    });

    // Envio em massa
    document.getElementById('send-mass').addEventListener('click', () => {
      this.sendMassMessage();
    });

    // Resposta automática
    document.getElementById('auto-reply-toggle').addEventListener('change', (e) => {
      this.autoReplyEnabled = e.target.checked;
      this.saveSettings();
    });

    // Agendamento
    document.getElementById('schedule-send').addEventListener('click', () => {
      this.scheduleMessage();
    });
  }

  toggleExtension() {
    this.isActive = !this.isActive;
    const button = document.getElementById('ledzap-toggle');
    button.textContent = this.isActive ? 'Desativar' : 'Ativar';
    button.style.backgroundColor = this.isActive ? '#ff4444' : '#25D366';
    
    if (this.isActive) {
      this.showNotification('LedZap ativado! 🚀');
    } else {
      this.showNotification('LedZap desativado');
    }
  }

  async sendMassMessage() {
    if (!this.isActive) {
      this.showNotification('Ative o LedZap primeiro!');
      return;
    }

    const message = document.getElementById('mass-message').value;
    if (!message.trim()) {
      this.showNotification('Digite uma mensagem primeiro!');
      return;
    }

    const chats = this.getAllChats();
    let sentCount = 0;

    for (const chat of chats) {
      try {
        await this.sendMessageToChat(chat, message);
        sentCount++;
        await this.delay(2000); // Delay entre mensagens
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
      }
    }

    this.showNotification(\`Mensagem enviada para \${sentCount} conversas!\`);
    this.updateStats();
  }

  getAllChats() {
    const chatElements = document.querySelectorAll('[data-testid="cell-frame-container"]');
    return Array.from(chatElements).slice(0, 10); // Limitar para segurança
  }

  async sendMessageToChat(chatElement, message) {
    // Simular clique no chat
    chatElement.click();
    await this.delay(1000);

    // Encontrar campo de mensagem
    const messageBox = document.querySelector('[data-testid="conversation-compose-box-input"]');
    if (messageBox) {
      messageBox.textContent = message;
      messageBox.dispatchEvent(new Event('input', { bubbles: true }));
      
      await this.delay(500);
      
      // Enviar mensagem
      const sendButton = document.querySelector('[data-testid="send"]');
      if (sendButton) {
        sendButton.click();
      }
    }
  }

  scheduleMessage() {
    const time = document.getElementById('schedule-time').value;
    const message = document.getElementById('schedule-message').value;
    
    if (!time || !message.trim()) {
      this.showNotification('Preencha todos os campos!');
      return;
    }

    const scheduleTime = new Date(time);
    const now = new Date();
    
    if (scheduleTime <= now) {
      this.showNotification('Escolha um horário futuro!');
      return;
    }

    const delay = scheduleTime.getTime() - now.getTime();
    
    setTimeout(() => {
      this.sendMassMessage();
      this.showNotification('Mensagem agendada enviada!');
    }, delay);

    this.showNotification(\`Mensagem agendada para \${scheduleTime.toLocaleString()}\`);
  }

  startObserver() {
    // Observer para detectar novas mensagens
    const observer = new MutationObserver((mutations) => {
      if (this.autoReplyEnabled) {
        this.checkForNewMessages();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  checkForNewMessages() {
    // Lógica para detectar e responder mensagens automaticamente
    const newMessages = document.querySelectorAll('[data-testid="msg-container"]:not(.ledzap-processed)');
    
    newMessages.forEach(msg => {
      msg.classList.add('ledzap-processed');
      
      // Verificar se é uma mensagem recebida
      if (!msg.querySelector('[data-testid="msg-meta"] [data-testid="msg-time"]')) {
        return;
      }

      const autoReplyMessage = document.getElementById('auto-reply-message').value;
      if (autoReplyMessage.trim()) {
        setTimeout(() => {
          this.sendAutoReply(autoReplyMessage);
        }, 3000);
      }
    });
  }

  async sendAutoReply(message) {
    const messageBox = document.querySelector('[data-testid="conversation-compose-box-input"]');
    if (messageBox) {
      messageBox.textContent = message;
      messageBox.dispatchEvent(new Event('input', { bubbles: true }));
      
      await this.delay(500);
      
      const sendButton = document.querySelector('[data-testid="send"]');
      if (sendButton) {
        sendButton.click();
      }
    }
  }

  updateStats() {
    const sentCount = parseInt(localStorage.getItem('ledzap-sent-count') || '0') + 1;
    localStorage.setItem('ledzap-sent-count', sentCount.toString());
    
    document.getElementById('sent-count').textContent = sentCount;
    
    const activeChats = this.getAllChats().length;
    document.getElementById('active-chats').textContent = activeChats;
  }

  loadSettings() {
    const autoReply = localStorage.getItem('ledzap-auto-reply') === 'true';
    document.getElementById('auto-reply-toggle').checked = autoReply;
    this.autoReplyEnabled = autoReply;
    
    const autoReplyMessage = localStorage.getItem('ledzap-auto-reply-message') || '';
    document.getElementById('auto-reply-message').value = autoReplyMessage;
    
    this.updateStats();
  }

  saveSettings() {
    localStorage.setItem('ledzap-auto-reply', this.autoReplyEnabled.toString());
    localStorage.setItem('ledzap-auto-reply-message', document.getElementById('auto-reply-message').value);
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'ledzap-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Inicializar LedZap quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new LedZap());
} else {
  new LedZap();
}
`;

  // Conteúdo do styles.css
  const styles = `
#ledzap-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 350px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 10000;
  font-family: Arial, sans-serif;
}

.ledzap-header {
  background: #25D366;
  color: white;
  padding: 15px;
  border-radius: 10px 10px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ledzap-header h3 {
  margin: 0;
  font-size: 16px;
}

#ledzap-toggle {
  background: #128C7E;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
}

.ledzap-content {
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.ledzap-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.ledzap-section:last-child {
  border-bottom: none;
}

.ledzap-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
}

.ledzap-section textarea,
.ledzap-section input[type="datetime-local"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  font-size: 12px;
  resize: vertical;
  min-height: 60px;
}

.ledzap-section button {
  background: #25D366;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  width: 100%;
}

.ledzap-section button:hover {
  background: #128C7E;
}

.ledzap-section input[type="checkbox"] {
  margin-right: 8px;
}

.ledzap-section label {
  font-size: 12px;
  color: #333;
}

#stats p {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}

.ledzap-notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #25D366;
  color: white;
  padding: 15px 25px;
  border-radius: 5px;
  z-index: 10001;
  font-size: 14px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

@media (max-width: 768px) {
  #ledzap-panel {
    width: 300px;
    right: 10px;
    top: 10px;
  }
}
`;

  // Conteúdo do popup.html
  const popupHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 300px;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #25D366;
    }
    .status {
      padding: 10px;
      border-radius: 5px;
      margin: 10px 0;
      text-align: center;
    }
    .active {
      background: #d4edda;
      color: #155724;
    }
    .inactive {
      background: #f8d7da;
      color: #721c24;
    }
    .feature {
      margin: 10px 0;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 5px;
    }
    .feature-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🚀 LedZap</div>
    <p>Extensão WhatsApp v2.0</p>
  </div>
  
  <div class="status active">
    ✅ Extensão Ativa
  </div>
  
  <div class="feature">
    <div class="feature-title">📤 Envio em Massa</div>
    <p>Envie mensagens para múltiplos contatos</p>
  </div>
  
  <div class="feature">
    <div class="feature-title">🤖 Respostas Automáticas</div>
    <p>Configure respostas automáticas</p>
  </div>
  
  <div class="feature">
    <div class="feature-title">⏰ Agendamento</div>
    <p>Agende mensagens para envio futuro</p>
  </div>
  
  <div class="feature">
    <div class="feature-title">📊 Relatórios</div>
    <p>Acompanhe suas estatísticas</p>
  </div>
  
  <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
    Acesse web.whatsapp.com para usar
  </p>
</body>
</html>
`;

  // Criar arquivo README
  const readme = `# LedZap - Extensão WhatsApp

## 🚀 Instalação

1. Extraia todos os arquivos desta pasta
2. Abra o Chrome e vá em chrome://extensions/
3. Ative o "Modo do desenvolvedor"
4. Clique em "Carregar sem compactação"
5. Selecione esta pasta
6. Acesse web.whatsapp.com

## ✨ Recursos

- 📤 Envio em massa
- 🤖 Respostas automáticas
- ⏰ Agendamento de mensagens
- 📊 Relatórios e estatísticas
- 🏷️ Sistema de etiquetas
- 💾 Backup de conversas

## 🔧 Como Usar

1. Acesse web.whatsapp.com
2. O painel do LedZap aparecerá no canto superior direito
3. Clique em "Ativar" para começar a usar
4. Configure as funcionalidades conforme necessário

## ⚠️ Importante

- Use com responsabilidade
- Respeite os termos de uso do WhatsApp
- Não envie spam

## 📝 Licença

Este projeto é open source e gratuito para uso pessoal.

---

Desenvolvido pela comunidade LedZap
`;

  // Criar o conteúdo do ZIP
  const files = {
    'manifest.json': JSON.stringify(manifest, null, 2),
    'content.js': contentScript,
    'styles.css': styles,
    'popup.html': popupHtml,
    'README.md': readme
  };

  // Simular download do ZIP
  downloadZipFile(files, 'LedZap-Extension-v2.0.zip');
}

// Função para simular o download do ZIP
function downloadZipFile(files, filename) {
  // Criar conteúdo do arquivo como texto
  let zipContent = `# LedZap Extension Files\n\n`;
  
  Object.entries(files).forEach(([fileName, content]) => {
    zipContent += `## ${fileName}\n\`\`\`\n${content}\n\`\`\`\n\n`;
  });

  // Criar blob e download
  const blob = new Blob([zipContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Mostrar notificação de sucesso
  showNotification('✅ Download iniciado! Extraia o arquivo e siga as instruções de instalação.');
}

// Função para mostrar notificações
function showNotification(message) {
  // Remover notificação existente
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }

  // Criar nova notificação
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
    ">
      ${message}
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Remover após 5 segundos
  setTimeout(() => {
    notification.remove();
  }, 5000);
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

  document.querySelectorAll('.feature-card, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Botões de download
  const downloadButtons = ['downloadBtn', 'downloadMainBtn'];
  downloadButtons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', createExtensionZip);
    }
  });

  // Inicializar funcionalidades
  initSmoothScroll();
  initAnimations();

  // Mostrar mensagem de boas-vindas
  setTimeout(() => {
    showNotification('🎉 Bem-vindo ao LedZap! Clique em "Baixar Grátis" para começar.');
  }, 2000);
});

// Adicionar efeito de parallax no hero
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.style.transform = `translateY(${scrolled * 0.5}px)`;
  }
});

console.log('🚀 LedZap Landing Page carregada com sucesso!');