if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register(
        "./service-worker.js"
      );
      console.log("Service Worker registrado!");
    } catch (error) {
      console.error(
        "Erro ao registrar Service Worker:",
        error
      );
    }
  });
}

let installPrompt = null;

const installBtn = document.getElementById("installBtn");
const installMessage = document.getElementById("installMessage");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;

  if (installBtn) {
    installBtn.hidden = false;
  }
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!installPrompt) {
      if (installMessage) {
        installMessage.textContent =
          "Use o menu do navegador para instalar o site.";
      }
      return;
    }

    installPrompt.prompt();

    const choice = await installPrompt.userChoice;

    if (installMessage) {
      installMessage.textContent =
        choice.outcome === "accepted"
          ? "Instalação aceita!"
          : "Instalação cancelada.";
    }

    installPrompt = null;
    installBtn.hidden = true;
  });
}

window.addEventListener("appinstalled", () => {
  if (installBtn) installBtn.hidden = true;

  if (installMessage) {
    installMessage.textContent =
      "Aplicativo instalado com sucesso!";
  }
});

// Botões Padrão
const defaultWords = [
  ['Feliz', '😊'], ['Triste', '😢'], ['Bravo', '😠'], ['Medo', '😨'],
  ['Cansado', '🥱'], ['Animado', '🤩'], ['Brincar', '🧸'], ['Comer', '🍎'],
  ['Beber', '🥤'], ['Abraço', '🤗'], ['Música', '🎵'], ['Pausa', '⏸️'],
  ['Mamãe', '👩'], ['Papai', '👨'], ['Professora', '👩‍🏫'], ['Amigo', '🧒'],
  ['Casa', '🏠'], ['Escola', '🏫'], ['Parque', '🛝'], ['Banheiro', '🚻'],
  ['Ler', '📚'], ['Jogar', '⚽'], ['Descansar', '🛋️'], ['Pintar', '🖍️']
];

const storageKey = 'comunicaa-kids-words';
const legacyStorageKey = 'comunicaa-kids-words';
const urlKey = 'itens';

function isValidWords(value) {
  return Array.isArray(value) && value.every((entry) =>
    Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'string'
  );
}

let words;
let urlWords;

try {
  urlWords = new URLSearchParams(window.location.search).get(urlKey);
} catch {
  urlWords = null;
}

if (urlWords !== null) {
  try {
    const wordsFromUrl = JSON.parse(urlWords);
    words = isValidWords(wordsFromUrl) ? wordsFromUrl : null;
  } catch {
    words = null;
  }
}

if (!words) {
  let wordsFromStorage = null;
  for (const key of [storageKey, legacyStorageKey]) {
    try {
      const storedValue = JSON.parse(localStorage.getItem(key));
      if (isValidWords(storedValue)) {
        wordsFromStorage = storedValue;
        break;
      }
    } catch {
      // Tenta a chave anterior caso o valor salvo esteja inválido.
    }
  }
  words = wordsFromStorage || defaultWords.map((entry) => [...entry]);
  if (urlWords === null && wordsFromStorage) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(urlKey, JSON.stringify(wordsFromStorage));
      window.history.replaceState(null, '', url);
    } catch {
      // O armazenamento local continua disponível mesmo se a URL não puder ser alterada.
    }
  }
}

const buttons = document.querySelector('.buttons');
const voiceLoading = document.querySelector('#voice-loading');
const editToggle = document.querySelector('#edit-toggle');
const editor = document.querySelector('#word-editor');
const form = document.querySelector('#word-form');
const wordInput = document.querySelector('#word');
const emojiInput = document.querySelector('#emoji');
const formTitle = document.querySelector('#form-title');
const cancelEdit = document.querySelector('#cancel-edit');
const addWordButton = document.querySelector('#add-word');
const addHint = document.querySelector('#add-hint');
const copyLinkButton = document.querySelector('#copy-link');
const resetBoardButton = document.querySelector('#reset-board');
const linkStatus = document.querySelector('#link-status');
const headerActions = document.querySelector('#header-actions');
const adminLock = document.querySelector('#admin-lock');
const headerTitle = document.querySelector('#header-title');
const unlockZone = document.querySelector('#unlock-zone');

let editingIndex = null;
let editMode = false;
let statusTimeout;
let unlockTimeout;
let lockRevealTimeout;
let toolsUnlocked = false;
let draggedIndex = null;

function showStatus(message) {
  window.clearTimeout(statusTimeout);
  linkStatus.textContent = message;
  statusTimeout = window.setTimeout(() => {
    linkStatus.textContent = '';
  }, 1000);
}

function setToolsUnlocked(unlocked) {
  toolsUnlocked = unlocked;
  headerActions.hidden = !unlocked;
  headerTitle.hidden = !unlocked;
  adminLock.hidden = !unlocked;
  unlockZone.hidden = unlocked;
  window.clearTimeout(lockRevealTimeout);
  adminLock.textContent = unlocked ? '🔓' : '🔒';
  adminLock.setAttribute('aria-pressed', String(unlocked));
  adminLock.setAttribute('aria-label', unlocked ? 'Controles desbloqueados' : 'Segure para desbloquear os controles');
  adminLock.title = unlocked ? 'Controles desbloqueados' : 'Segure para desbloquear os controles';
}

function revealUnlockButton() {
  if (toolsUnlocked) return;
  adminLock.hidden = false;
  window.clearTimeout(lockRevealTimeout);
  lockRevealTimeout = window.setTimeout(() => {
    if (!toolsUnlocked) adminLock.hidden = true;
  }, 4000);
}

unlockZone.addEventListener('click', revealUnlockButton);

adminLock.addEventListener('click', () => {
  if (!toolsUnlocked) {
    setToolsUnlocked(true);
    // showStatus('Controles desbloqueados.');
  } else if (!editMode) {
    setToolsUnlocked(false);
    // showStatus('Controles bloqueados.');
  }
});

for (const eventName of ['pointerup', 'pointerleave', 'pointercancel']) {
  adminLock.addEventListener(eventName, () => window.clearTimeout(unlockTimeout));
}

adminLock.addEventListener('click', (event) => {
  // Permite que usuários de teclado desbloqueiem com Enter ou Espaço.
  if (event.detail === 0 && !toolsUnlocked) {
    setToolsUnlocked(true);
    //showStatus('Controles desbloqueados.');
  }
});

function saveWords() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(words));
  } catch {
    // O link ainda é atualizado se o navegador bloquear o armazenamento local.
  }
  const url = new URL(window.location.href);
  url.searchParams.set(urlKey, JSON.stringify(words));
  window.history.replaceState(null, '', url);
}

function renderWords() {
  buttons.replaceChildren();

  words.forEach(([word, emoji], index) => {
    const card = document.createElement('div');
    card.className = 'word-card';

    if (editMode) {
      const dragHandle = document.createElement('span');
      dragHandle.className = 'drag-handle';
      dragHandle.textContent = '⠿ Arraste para mover';
      dragHandle.setAttribute('aria-hidden', 'true');
      dragHandle.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        draggedIndex = index;
        card.classList.add('is-dragging');
        dragHandle.setPointerCapture(event.pointerId);
      });
      dragHandle.addEventListener('pointermove', (event) => {
        if (draggedIndex === null) return;
        const targetCard = document.elementFromPoint(event.clientX, event.clientY)?.closest('.word-card');
        buttons.querySelectorAll('.drop-target').forEach((item) => item.classList.remove('drop-target'));
        if (targetCard && targetCard !== card) targetCard.classList.add('drop-target');
      });
      const finishPointerDrag = (event) => {
        if (draggedIndex === null) return;
        const fromIndex = draggedIndex;
        const targetCard = document.elementFromPoint(event.clientX, event.clientY)?.closest('.word-card');
        const targetIndex = targetCard ? [...buttons.children].indexOf(targetCard) : -1;
        draggedIndex = null;
        buttons.querySelectorAll('.is-dragging, .drop-target').forEach((item) => item.classList.remove('is-dragging', 'drop-target'));
        if (targetIndex < 0 || fromIndex === targetIndex) return;
        const [movedWord] = words.splice(fromIndex, 1);
        words.splice(targetIndex, 0, movedWord);
        saveWords();
        renderWords();
      };
      dragHandle.addEventListener('pointerup', finishPointerDrag);
      dragHandle.addEventListener('pointercancel', finishPointerDrag);
      card.append(dragHandle);
    }

    const speakButton = document.createElement('button');
    speakButton.type = 'button';
    speakButton.className = 'speak-button';
    speakButton.dataset.word = word;
    speakButton.setAttribute('aria-label', `Falar ${word}`);
    
    const symbol = document.createElement('span');
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = emoji;
    speakButton.append(symbol, document.createTextNode(word));
    card.append(speakButton);

    if (editMode) {
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'small-button';
      editButton.textContent = 'Editar';
      editButton.setAttribute('aria-label', `Editar ${word}`);
      editButton.addEventListener('click', () => openEditor(index));
      
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'small-button remove-button';
      removeButton.textContent = 'Excluir';
      removeButton.setAttribute('aria-label', `Excluir ${word}`);
      removeButton.addEventListener('click', () => {
        words.splice(index, 1);
        saveWords();
        renderWords();
      });
      actions.append(editButton, removeButton);
      card.append(actions);

      card.draggable = false;
      card.setAttribute('aria-label', `${word}, posição ${index + 1} de ${words.length}. Arraste para reordenar.`);
      card.addEventListener('dragstart', (event) => {
        draggedIndex = index;
        card.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
      });
      card.addEventListener('dragend', () => {
        draggedIndex = null;
        card.classList.remove('is-dragging');
        buttons.querySelectorAll('.drop-target').forEach((item) => item.classList.remove('drop-target'));
      });
      card.addEventListener('dragover', (event) => {
        if (draggedIndex === null || draggedIndex === index) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        card.classList.add('drop-target');
      });
      card.addEventListener('dragleave', (event) => {
        if (!card.contains(event.relatedTarget)) card.classList.remove('drop-target');
      });
      card.addEventListener('drop', (event) => {
        event.preventDefault();
        card.classList.remove('drop-target');
        const fromIndex = draggedIndex;
        if (fromIndex === null || fromIndex === index) return;
        const [movedWord] = words.splice(fromIndex, 1);
        words.splice(index, 0, movedWord);
        saveWords();
        renderWords();
      });
    }

    buttons.append(card);
  });
}

function openEditor(index = null) {
  editingIndex = index;
  form.reset();
  formTitle.textContent = index === null ? 'Adicionar botão' : 'Editar botão';
  if (index !== null) {
    wordInput.value = words[index][0];
    emojiInput.value = words[index][1];
  }
  editor.hidden = false;
  wordInput.focus();
}

function closeEditor() {
  editor.hidden = true;
  editingIndex = null;
  form.reset();
}

editToggle.addEventListener('click', () => {
  editMode = !editMode;
  if (!editMode) {
    saveWords();
    // showStatus('Edição salva neste navegador e no link da prancha.');
    setToolsUnlocked(false);
  }
  editToggle.textContent = editMode ? 'Concluir edição' : 'Editar botões';
  editToggle.setAttribute('aria-pressed', String(editMode));
  editor.hidden = true;
  addWordButton.hidden = !editMode;
  addHint.hidden = !editMode;
  renderWords();
});

addWordButton.addEventListener('click', () => openEditor());
cancelEdit.addEventListener('click', closeEditor);
copyLinkButton.addEventListener('click', async () => {
  let currentWords = words;
  try {
    const storedWords = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(storedWords) && storedWords.every((entry) =>
      Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'string'
    )) currentWords = storedWords;
  } catch {
    // Se o armazenamento estiver indisponível ou inválido, usa a prancha em memória.
  }

  const url = new URL(window.location.href);
  url.searchParams.set(urlKey, JSON.stringify(currentWords));
  window.history.replaceState(null, '', url);
  try {
    await navigator.clipboard.writeText(url.href);
    showStatus('Link copiado!');
  } catch {
    showStatus('Copie o link direto da barra de endereço.');
  }
});

resetBoardButton.addEventListener('click', () => {
  const confirmed = window.confirm('Tem certeza de que deseja voltar ao padrão? Suas palavras e emojis personalizados serão substituídos.');
  if (!confirmed) return;

  words = defaultWords.map((entry) => [...entry]);
  saveWords();
  renderWords();
  window.confirm('Prancha padrão restaurada.');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const entry = [wordInput.value.trim(), emojiInput.value.trim() || '💬'];
  if (editingIndex === null) words.push(entry);
  else words[editingIndex] = entry;
  saveWords();
  closeEditor();
  renderWords();
});

buttons.addEventListener('click', (event) => {
  const button = event.target.closest('[data-word]');
  if (!button || editMode || !('speechSynthesis' in window)) return;

  speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(button.dataset.word);
  speech.lang = 'pt-BR';
  speech.rate = 0.8;
  if (portugueseVoice) speech.voice = portugueseVoice;
  speechSynthesis.speak(speech);
});

let portugueseVoice = null;

function prepareVoice() {
  if (!('speechSynthesis' in window)) {
    voiceLoading.hidden = true;
    return;
  }

  const synth = window.speechSynthesis;
  let finished = false;

  function finishLoading() {
    if (finished) return;
    finished = true;
    synth.removeEventListener('voiceschanged', loadVoices);
    voiceLoading.hidden = true;
  }

  function loadVoices() {
    const voices = synth.getVoices();
    portugueseVoice = voices.find((voice) => voice.lang.toLowerCase() === 'pt-br')
      || voices.find((voice) => voice.lang.toLowerCase().startsWith('pt-'))
      || null;
    if (voices.length > 0) finishLoading();
  }

  synth.addEventListener('voiceschanged', loadVoices);
  loadVoices();
  // Alguns navegadores não disparam voiceschanged se nenhuma voz estiver instalada.
  window.setTimeout(finishLoading, 3000);
}

renderWords();
prepareVoice();
