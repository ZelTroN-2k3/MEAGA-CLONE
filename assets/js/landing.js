// assets/js/landing.js

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('api/public.php?action=footer');
        const data = await res.json();
        
        if (data.status === 'success') {
            const settings = data.data;
            
            // Textes simples
            if (document.getElementById('pub-footer-desc')) document.getElementById('pub-footer-desc').textContent = settings.footer_desc;
            if (document.getElementById('pub-footer-copyright')) document.getElementById('pub-footer-copyright').innerHTML = settings.footer_copyright;
            
            // Réseaux sociaux
            if (document.getElementById('pub-footer-twitter')) document.getElementById('pub-footer-twitter').href = settings.footer_twitter;
            if (document.getElementById('pub-footer-facebook')) document.getElementById('pub-footer-facebook').href = settings.footer_facebook;
            if (document.getElementById('pub-footer-github')) document.getElementById('pub-footer-github').href = settings.footer_github;
            if (document.getElementById('pub-footer-instagram')) document.getElementById('pub-footer-instagram').href = settings.footer_instagram;
            
            // Colonnes dynamiques
            const renderLinks = (containerId, linksString) => {
                const container = document.getElementById(containerId);
                if (!container) return;
                
                try {
                    const links = JSON.parse(linksString);
                    container.innerHTML = '';
                    links.forEach(link => {
                        const li = document.createElement('li');
                        li.style.marginBottom = '10px';
                        li.innerHTML = `<a href="${link.url}" class="footer-link">${link.text}</a>`;
                        container.appendChild(li);
                    });
                } catch(e) {
                    console.error('Erreur parsing JSON pour ' + containerId, e);
                }
            };
            
            renderLinks('pub-footer-legal', settings.footer_col_legal);
            renderLinks('pub-footer-support', settings.footer_col_support);
        }
    } catch(err) {
        console.error('Erreur chargement footer', err);
    }
});
