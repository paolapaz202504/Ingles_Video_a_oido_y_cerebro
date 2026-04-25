import { showApiKeyModal } from "./components/apiKeyModal.js";

export function setupAuth() {
  let currentUser = null;
  try {
    const storedUser = localStorage.getItem('viooido_user');
    if (storedUser) currentUser = JSON.parse(storedUser);
  } catch (e) {}

  const googleBtnContainer = document.getElementById('google-btn-container');
  const userProfile = document.getElementById('user-profile');

  function renderApiKeyButton() {
    let btn = document.getElementById('btn-api-key');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'btn-api-key';
      btn.textContent = '🔑 API Key';
      btn.className = 'ui-btn';
      btn.onclick = () => {
        showApiKeyModal();
      };
      const container = document.getElementById('api-key-container');
      if (container) container.appendChild(btn);
    }
    return btn;
  }

  function updateUI() {
    const apiKeyBtn = renderApiKeyButton();

    if (currentUser) {
      googleBtnContainer.style.display = 'none';
      userProfile.style.display = 'flex';
      document.getElementById('user-avatar').src = currentUser.picture;
      document.getElementById('user-name').textContent = currentUser.given_name || currentUser.name;
    } else {
      googleBtnContainer.style.display = 'block';
      userProfile.style.display = 'none';

      const initGoogleBtn = () => {
        if (window.google) {
          window.google.accounts.id.disableAutoSelect();
          
          let signinDiv = document.querySelector('.g_id_signin');
          if (!signinDiv) {
            signinDiv = document.createElement('div');
            signinDiv.className = 'g_id_signin';
            googleBtnContainer.appendChild(signinDiv);
          }

          // Forzar el renderizado manual del botón para evitar el bloqueo por contenedor oculto
          const onloadDiv = document.getElementById('g_id_onload');
          
          // Usar getAttribute es más seguro que dataset para evitar problemas de camelCase en JavaScript
          const clientId = onloadDiv ? onloadDiv.getAttribute('data-client_id') : null;
          
          if (signinDiv && clientId) {
            window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredentialResponse });
            window.google.accounts.id.renderButton(signinDiv, { theme: "outline", size: "large" });
          } else if (!clientId) {
            console.error("❌ No se encontró el atributo data-client_id en el HTML para cargar Google Sign-In.");
          }
        }
      };

      if (window.google) {
        initGoogleBtn();
      } else {
        // Inyectamos el script oficial si por algún motivo no se cargó en el HTML
        if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
          const script = document.createElement('script');
          script.src = "https://accounts.google.com/gsi/client";
          document.head.appendChild(script);
        }
        const checkGoogle = setInterval(() => { if (window.google) { clearInterval(checkGoogle); initGoogleBtn(); } }, 100);
      }
    }
  }

  window.handleCredentialResponse = (response) => {
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
      currentUser = JSON.parse(decodeURIComponent(atob(paddedBase64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
      localStorage.setItem('viooido_user', JSON.stringify(currentUser));
      updateUI();
    } catch (error) { console.error("Error en login:", error); }
  };

  document.getElementById('btn-logout').addEventListener('click', () => { 
    const userEmail = currentUser?.email;
    currentUser = null; 
    localStorage.removeItem('viooido_user'); 
    if (window.google && userEmail) {
      window.google.accounts.id.revoke(userEmail, () => { window.location.reload(); });
    } else {
    window.location.reload(); 
    }
  });
  updateUI();

  return { getCurrentUser: () => currentUser, getApiKey: () => localStorage.getItem('gemini_api_key') };
}