# ☁️ MEGA CLONE - Zero-Knowledge Cloud Storage

Une plateforme de stockage en ligne sécurisée développée en PHP natif et JavaScript Vanilla. Ce projet reproduit les fonctionnalités clés des géants du cloud (comme MEGA) en mettant un point d'honneur sur la sécurité et la vie privée grâce à une architecture "Zero-Knowledge" (Zéro Connaissance).

## 🚀 Fonctionnalités Principales

*   **🔐 Chiffrement de bout en bout (Client-Side Encryption) :** Vos fichiers sont chiffrés directement dans le navigateur avant l'upload. Le serveur n'a jamais accès à la clé de déchiffrement.
*   **📁 Gestionnaire de Fichiers Avancé :** Navigation fluide, arborescence de dossiers, renommage, déplacement, corbeille et vues multiples (liste, grille, compacte).
*   **🔗 Partage Sécurisé :** Génération de liens de partage chiffrés. Options avancées pour les comptes PRO (protection par mot de passe, date d'expiration et gestion des clés séparées).
*   **📦 Compression à la volée :** Possibilité de télécharger plusieurs fichiers ou dossiers sous forme d'archive ZIP déchiffrée et générée directement côté client.
*   **✉️ Système d'E-mails Hybride :** Envoi automatisé de notifications transactionnelles (bienvenue, alertes de sécurité) avec interception locale pour le développement (Laragon) et utilisation de la fonction native `mail()` en production (o2switch).
*   **🗑️ Maintenance Autonome :** Nettoyage automatisé de la corbeille via une tâche Cron configurée pour purger les éléments supprimés de plus de 30 jours et libérer l'espace serveur.
*   **🛠️ Panneau d'Administration Complet :** Gestion des utilisateurs, attribution des quotas, surveillance de la santé du serveur (infos PHP/MySQL/Disque), statistiques en temps réel, graphiques (Chart.js), logs d'activité et personnalisation du footer.
*   **🌐 Internationalisation (i18n) :** Support multilingue intégré (Français, Anglais, Espagnol, Allemand).

## 🛠️ Stack Technique

Ce projet a été développé sans framework lourd afin de garantir des performances optimales et une maîtrise totale du code.

**Frontend :**
*   HTML5 / CSS3 (Variables CSS, Responsive Design)
*   JavaScript Vanilla (ESM, API Fetch, Web Crypto API)
*   Bibliothèques : JSZip (Génération d'archives), Chart.js (Graphiques admin), Font Awesome (Icônes).

**Backend :**
*   PHP (Natif, architecture MVC légère via un Router personnalisé).
*   PDO (PHP Data Objects) pour des requêtes SQL sécurisées.

**Base de données & Infrastructure :**
*   MySQL (Structure relationnelle avec gestion des clés partagées, des statuts utilisateurs et des fichiers orphelins).
*   Automatisation serveur via des tâches Cron.

## 🔒 Cryptographie & Sécurité

L'architecture de sécurité repose sur la **Web Crypto API** intégrée aux navigateurs modernes :
*   **Master Key :** Dérivée du mot de passe utilisateur via l'algorithme **PBKDF2** (SHA-256, 100 000 itérations).
*   **Chiffrement des fichiers :** Algorithme **AES-GCM** (256 bits) avec un vecteur d'initialisation (IV) unique de 12 octets généré pour chaque fichier (et pour chaque miniature).
*   **Key Wrapping :** Les clés de fichiers sont elles-mêmes chiffrées avec la Master Key avant d'être stockées sur le serveur.
*   **Clé de Récupération (`MEGA_RECOVERY_KEY.txt`) :** Exportable à tout moment depuis le profil ou le menu déroulant du tableau de bord pour garantir la récupération du compte en cas d'oubli du mot de passe.

## 💻 Installation en local

1. Clonez ce dépôt dans le répertoire web de votre serveur local (ex: www ou htdocs) :
   `git clone https://github.com/ZelTroN-2k3/MEAGA-CLONE.git`
2. Assurez-vous que vos services Apache/Nginx et MySQL sont démarrés.
3. Accédez au projet via votre navigateur (ex: `http://localhost/ton-projet/install.php`).
4. Remplissez le formulaire avec vos identifiants MySQL. Le script `install.php` se chargera de créer la base de données, les tables et le premier compte Administrateur.
5. ⚠️ **Sécurité :** Supprimez le fichier `install.php` une fois l'installation terminée.

## 🌍 Déploiement en production (ex: o2switch, cPanel)

1. Transférez les fichiers du projet dans le dossier racine de votre hébergement (ex: `public_html`).
2. Créez une nouvelle base de données MySQL via votre panel de contrôle.
3. Lancez le script d'installation `https://votredomaine.com/install.php`.
4. Renseignez les accès à votre nouvelle base de données.
5. ⚠️ **Supprimez immédiatement `install.php`** pour éviter toute réinstallation non autorisée.
6. **Configuration de la Tâche Cron :** Programmez l'exécution quotidienne du script de nettoyage de la corbeille via l'interface cPanel :
   ```bash
   wget -q -O /dev/null "[https://votredomaine.com/cron_cleanup.php?token=nettoyage_mega_2026](https://votredomaine.com/cron_cleanup.php?token=nettoyage_mega_2026)"

---
Créé avec ❤️ par ZelTroN-2k3
