(() => {
  let conversationState = null;
  let handling = false;

  function input() { return document.querySelector('#messageInput'); }
  function scrollMessages() { const box = document.querySelector('#messages')?.parentElement; if (box) box.scrollTop = box.scrollHeight; }
  function addAssistant(text) {
    if (typeof addMessage === 'function') addMessage(text);
    else {
      const messages = document.querySelector('#messages');
      if (!messages) return;
      messages.classList.remove('hidden');
      const item = document.createElement('article');
      item.className = 'message assistant';
      const icon = document.createElement('div'); icon.className = 'message-icon'; icon.textContent = 'K';
      const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = text;
      item.append(icon, bubble); messages.append(item); scrollMessages();
    }
  }
  function say(text) { if (typeof speak === 'function') speak(text); }
  function openPlatform(platform) {
    if (!platform?.url) return;
    window.kritamDesktop?.openUrl?.(platform.url).catch?.((error) => {
      if (typeof toast === 'function') toast(error.message || 'I could not open that platform.');
    });
  }
  function renderSearchOptions(result) {
    const messages = document.querySelector('#messages');
    if (!messages) return;
    const card = document.createElement('article');
    card.className = 'action-card conversation-results';
    const title = document.createElement('strong'); title.textContent = `I found ${result.platforms.length} places to compare`;
    const query = document.createElement('p'); query.textContent = `Searching for “${result.searchQuery}”`; card.append(title, query);
    const list = document.createElement('div'); list.className = 'target-choices';
    result.platforms.forEach((platform) => {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = `Open ${platform.name}`; button.onclick = () => openPlatform(platform); list.append(button);
    });
    const all = document.createElement('button');
    all.type = 'button'; all.textContent = 'Open all';
    all.onclick = () => result.platforms.forEach((platform, index) => setTimeout(() => openPlatform(platform), index * 180));
    list.append(all); card.append(list); messages.append(card); scrollMessages();
  }
  async function handleConversation(text) {
    if (handling || !window.kritamDesktop?.planConversation) return false;
    handling = true;
    try {
      const result = await window.kritamDesktop.planConversation(text, conversationState);
      if (!result?.matched) return false;
      conversationState = result.state || conversationState;
      addAssistant(result.response);
      say(result.response);
      if (!result.needsDetails && result.platforms?.length) renderSearchOptions(result);
      return true;
    } catch (error) {
      console.warn('Conversation planner failed:', error);
      return false;
    } finally { handling = false; }
  }
  function clearConversationState() { conversationState = null; }

  window.addEventListener('DOMContentLoaded', () => {
    const composer = document.querySelector('#composer');
    const newChat = document.querySelector('#newChat');
    if (!composer) return;

    composer.addEventListener('submit', async (event) => {
      const text = input()?.value?.trim();
      if (!text) return;
      const handled = await handleConversation(text);
      if (handled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (input()) input().value = '';
        const sendButton = document.querySelector('#sendButton');
        if (sendButton) sendButton.disabled = true;
      }
    }, true);

    input()?.addEventListener('keydown', async (event) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      const text = input()?.value?.trim();
      if (!text) return;
      const handled = await handleConversation(text);
      if (handled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        input().value = '';
        const sendButton = document.querySelector('#sendButton');
        if (sendButton) sendButton.disabled = true;
      }
    }, true);

    newChat?.addEventListener('click', clearConversationState, true);
  });

  window.kritamConversation = { handle: handleConversation, clear: clearConversationState };
})();
