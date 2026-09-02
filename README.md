# ☁️ MEAGA-CLONE

Une application web reproduisant les fonctionnalités principales du célèbre service de stockage en ligne. Ce projet personnel a été développé pour mettre en pratique la gestion de fichiers, l'authentification et la création d'interfaces utilisateur modernes.

## 🚀 Fonctionnalités

*   **Authentification :** Inscription, connexion et déconnexion sécurisées.
*   **Gestion de fichiers :** Upload (téléversement), téléchargement et suppression de documents.
*   **Organisation :** Création de dossiers et navigation fluide dans l'arborescence.
*   **Interface UI/UX :** Design moderne, réactif et adapté aux appareils mobiles (Responsive Design).

## 🛠️ Technologies Utilisées

*   **Frontend :** HTML5, CSS3, JavaScript (Vanilla), Font Awesome (Icônes), Chart.js (Graphiques), JSZip.
*   **Backend :** PHP (Natif / PDO).
*   **Base de données :** MySQL.
*   **Paiement :** PayPal SDK (Intégration).

## 💻 Installation en local

Pour faire tourner ce projet sur votre machine, vous aurez besoin d'un environnement serveur local (Apache/Nginx, PHP, MySQL).

1. Clonez ce dépôt dans le répertoire web de votre serveur local (par exemple, le dossier `www` de Laragon ou `htdocs` pour XAMPP) : 
   `git clone https://github.com/ZelTroN-2k3/MEAGA-CLONE.git`
2. Assurez-vous que vos services Apache/Nginx et MySQL sont démarrés.
3. Accédez au projet via votre navigateur (par exemple : `http://localhost/MEAGA-CLONE/install.php`).
4. Remplissez le formulaire d'installation avec vos identifiants de base de données locale pour générer automatiquement les tables et le compte administrateur.
5. ⚠️ **Important :** Supprimez le fichier `install.php` une fois l'installation terminée.

## 🌍 Déploiement en ligne

Ce projet est conçu pour être facilement déployé sur un hébergement mutualisé standard (comme o2switch, Hostinger, OVH, etc.).

1. Transférez l'ensemble des fichiers du dépôt dans le répertoire racine de votre site (généralement `public_html` ou `www`) via FTP ou votre gestionnaire de fichiers cPanel.
2. Depuis votre panneau de contrôle (cPanel), créez une nouvelle base de données MySQL ainsi qu'un utilisateur rattaché à celle-ci.
3. Rendez-vous sur `https://votredomaine.com/install.php`.
4. Renseignez les informations de la base de données nouvellement créée pour finaliser la configuration.
5. ⚠️ **Sécurité :** Supprimez impérativement le fichier `install.php` de votre serveur pour éviter toute réinstallation malveillante.

## 📸 Captures d'écran

*(Ajoutez ici une image de l'interface de votre site. Vous pouvez simplement glisser-déposer une image dans l'éditeur GitHub pour générer le lien !)*

---
Créé avec ❤️ par [ZelTroN-2k3](https://github.com/ZelTroN-2k3)
