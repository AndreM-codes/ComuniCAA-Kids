const defaultWords = [
  ['Feliz', '😊'], ['Triste', '😢'], ['Bravo', '😠'], ['Medo', '😨'],
  ['Cansado', '🥱'], ['Animado', '🤩'], ['Brincar', '🧸'], ['Comer', '🍎'],
  ['Beber', '🥤'], ['Abraço', '🤗'], ['Música', '🎵'], ['Pausa', '⏸️'],
  ['Mamãe', '👩'], ['Papai', '👨'], ['Professora', '👩‍🏫'], ['Amigo', '🧒'],
  ['Casa', '🏠'], ['Escola', '🏫'], ['Parque', '🛝'], ['Banheiro', '🚻'],
  ['Ler', '📚'], ['Jogar', '⚽'], ['Descansar', '🛋️'], ['Pintar', '🖍️']
];

const storageKey = 'comunicaa-kids-words';
const legacyStorageKey = 'comunica-kids-words';
const urlKey = 'prancha';

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
let editingIndex = null;
let editMode = false;
let statusTimeout;

function showStatus(message) {
  window.clearTimeout(statusTimeout);
  linkStatus.textContent = message;
  statusTimeout = window.setTimeout(() => {
    linkStatus.textContent = '';
  }, 3000);
}

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
    showStatus('Edição salva neste navegador e no link da prancha.');
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
  speechSynthesis.speak(speech);
});

renderWords();
