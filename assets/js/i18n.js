class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('mega_clone_lang') || 'fr';
        this.translations = {};
        this.supportedLangs = ['fr', 'en', 'es', 'de'];
    }

    async init() {
        if (!this.supportedLangs.includes(this.currentLang)) {
            this.currentLang = 'fr';
        }
        await this.loadTranslations(this.currentLang);
        this.translatePage();
        
        // Notify backend of language choice via cookie so PHP API can use it
        document.cookie = `mega_clone_lang=${this.currentLang}; path=/; max-age=31536000`;
    }

    async loadTranslations(lang) {
        try {
            // Determine base path based on current location (in case of subfolders)
            let basePath = '';
            if (window.location.pathname.includes('/components/')) {
                basePath = '../';
            }
            
            const response = await fetch(`${basePath}locales/${lang}.json`);
            if (response.ok) {
                this.translations = await response.json();
            } else {
                console.error(`Failed to load translations for ${lang}`);
            }
        } catch (e) {
            console.error('Error loading translations:', e);
        }
    }

    translatePage() {
        // Translate text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.translations[key]) {
                // If it contains HTML, use innerHTML, else textContent
                // We'll use innerHTML to allow <span> or <b> tags in translations
                el.innerHTML = this.translations[key];
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (this.translations[key]) {
                el.setAttribute('placeholder', this.translations[key]);
            }
        });

        // Translate titles/tooltips
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (this.translations[key]) {
                el.setAttribute('title', this.translations[key]);
            }
        });

        // Update any active language switchers
        document.querySelectorAll('.lang-switcher-select').forEach(select => {
            select.value = this.currentLang;
        });
    }

    async setLanguage(lang) {
        if (!this.supportedLangs.includes(lang)) return;
        
        this.currentLang = lang;
        localStorage.setItem('mega_clone_lang', lang);
        document.cookie = `mega_clone_lang=${lang}; path=/; max-age=31536000`;
        
        await this.loadTranslations(lang);
        this.translatePage();
        
        // Dispatch custom event for other scripts to react if needed
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    // Helper for JS-based dynamic strings
    t(key, fallback = null) {
        return this.translations[key] || fallback || key;
    }
}

const i18n = new I18n();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
});
