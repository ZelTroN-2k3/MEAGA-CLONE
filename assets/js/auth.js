// assets/js/auth.js

function showNotification(message, type = 'info') {
    const notif = document.getElementById('notification');
    const msg = document.getElementById('notif-message');
    msg.textContent = message;
    
    if (type === 'error') notif.style.borderLeftColor = '#ff3333';
    else if (type === 'success') notif.style.borderLeftColor = '#33cc33';
    else notif.style.borderLeftColor = 'var(--accent)';

    notif.classList.add('show');
    setTimeout(() => { notif.classList.remove('show'); }, 3000);
}

// Check auth status
async function checkAuth() {
    try {
        const res = await fetch('api/auth.php?action=check');
        const data = await res.json();
        if (data.status === 'success') {
            window.location.href = 'dashboard.php';
        }
    } catch (e) {
        console.error('Error checking auth', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Elements
    const authOverlay = document.getElementById('auth-modal-overlay');
    const closeAuthBtn = document.getElementById('close-auth-modal');
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const modalTitle = document.getElementById('auth-modal-title');
    
    const showRegisterLinks = document.querySelectorAll('#show-register, #btn-register-modal, #hero-cta, .btn-pricing-register');
    const showLoginLinks = document.querySelectorAll('#show-login, #btn-login-modal, #footer-login');

    // Functions
    function openModal() {
        authOverlay.classList.add('active');
    }

    function closeModal() {
        authOverlay.classList.remove('active');
    }

    function showLogin() {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        modalTitle.textContent = i18n.t('login', 'Connexion');
        openModal();
    }

    function showRegister() {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        modalTitle.textContent = i18n.t('create_account', 'Créer un compte');
        openModal();
    }

    // Event Listeners
    closeAuthBtn.addEventListener('click', closeModal);
    authOverlay.addEventListener('click', (e) => {
        if (e.target === authOverlay) closeModal();
    });

    showLoginLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showLogin();
        });
    });

    showRegisterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showRegister();
        });
    });

    // Login logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('api/auth.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.status === 'success') {
                // Derive and store Master Key
                const masterKeyHex = await deriveMasterKey(password);
                sessionStorage.setItem('master_key', masterKeyHex);
                
                showNotification(i18n.t('login_success', 'Connexion réussie!'), 'success');
                setTimeout(() => { window.location.href = 'dashboard.php'; }, 1000);
            } else {
                if (data.message.toLowerCase().includes('suspendu')) {
                    document.getElementById('login-form').classList.add('hidden');
                    document.getElementById('suspended-alert').classList.remove('hidden');
                    modalTitle.textContent = i18n.t('access_denied', 'Accès Refusé');
                } else {
                    showNotification(data.message, 'error');
                }
            }
        } catch (error) {
            showNotification(i18n.t('error_network', 'Erreur réseau'), 'error');
        }
    });

    document.getElementById('btn-back-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('suspended-alert').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
        modalTitle.textContent = i18n.t('login', 'Connexion');
        document.getElementById('login-password').value = '';
    });

    // Register logic
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const res = await fetch('api/auth.php?action=register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();

            if (data.status === 'success') {
                // Derive and store Master Key
                const masterKeyHex = await deriveMasterKey(password);
                sessionStorage.setItem('master_key', masterKeyHex);
                
                showNotification(i18n.t('register_success', 'Inscription réussie!'), 'success');
                setTimeout(() => { window.location.href = 'dashboard.php'; }, 1000);
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification(i18n.t('error_network', 'Erreur réseau'), 'error');
        }
    });
});
