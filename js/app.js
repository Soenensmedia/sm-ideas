import { signIn, signUp, signOut, onAuthChange, getSession } from './auth.js';
import { state } from './state.js';
import { renderNotes } from './notes.js';
import { showToast } from './toast.js';

const loginView = document.getElementById('login-view');
const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const toggleLink = document.getElementById('login-toggle-link');
const toggleText = document.getElementById('login-toggle-text');
const submitBtn = document.getElementById('login-submit');

let mode = 'signin';

toggleLink.addEventListener('click', () => {
  mode = mode === 'signin' ? 'signup' : 'signin';
  submitBtn.textContent = mode === 'signin' ? 'Inloggen' : 'Account aanmaken';
  toggleText.textContent = mode === 'signin' ? 'Nog geen account?' : 'Al een account?';
  toggleLink.textContent = mode === 'signin' ? 'Account aanmaken' : 'Inloggen';
  loginError.textContent = '';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    if (mode === 'signin') {
      await signIn(email, password);
    } else {
      await signUp(email, password);
      loginError.textContent = 'Account aangemaakt — check je mail als bevestiging gevraagd wordt, en log dan in.';
    }
  } catch (err) {
    loginError.textContent = err.message;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await signOut();
});

async function showAppShell() {
  loginView.classList.add('hidden');
  appShell.classList.remove('hidden');
  try {
    await renderNotes();
  } catch (err) {
    showToast('Kon niet laden: ' + err.message, true);
  }
}

function showLoginView() {
  loginView.classList.remove('hidden');
  appShell.classList.add('hidden');
  state.user = null;
}

onAuthChange((session) => {
  if (session) showAppShell(); else showLoginView();
});

getSession().then((session) => {
  if (session) showAppShell(); else showLoginView();
});
