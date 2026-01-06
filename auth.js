// auth.js
// Logika za registraciju i prijavu korisnika

import { supabase } from './supabase.js';

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageDiv = document.getElementById('message');
const signupBtn = document.getElementById('signup');
const signinBtn = document.getElementById('signin');

// Registracija korisnika
if (signupBtn) {
  signupBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    signupBtn.disabled = true;
    messageDiv.textContent = 'Registracija u toku...';
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
      });

      if (error) {
        messageDiv.textContent = error.message;
      } else {
        messageDiv.textContent = 'Registracija uspešna! Proveri e-mail za potvrdu.';
      }
    } catch (err) {
      messageDiv.textContent = 'Greška pri registraciji.';
      console.error(err);
    } finally {
      signupBtn.disabled = false;
    }
  });
}

// Prijava korisnika
if (signinBtn) {
  signinBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    signinBtn.disabled = true;
    messageDiv.textContent = 'Prijava u toku...';
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        messageDiv.textContent = error.message;
      } else {
        messageDiv.textContent = 'Prijava uspešna!';
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      messageDiv.textContent = 'Greška pri prijavi.';
      console.error(err);
    } finally {
      signinBtn.disabled = false;
    }
  });
}
