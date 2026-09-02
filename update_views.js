const fs = require('fs');

const sharedPHP = `            <!-- Shared Items View (Hidden by default) -->
            <div id="view-shared" class="hidden"
                style="flex: 1; height: 100%; display: flex; flex-direction: column; background: #111111; color: white; overflow: hidden;">

                <div class="shared-tabs-header">
                    <div class="shared-tab" data-target="shared-incoming" data-i18n="shared_tab_incoming">Partages entrants</div>
                    <div class="shared-tab" data-target="shared-outgoing" data-i18n="shared_tab_outgoing">Partages sortants</div>
                    <div class="shared-tab active" data-target="shared-links" data-i18n="shared_tab_links">Liens</div>
                    <div class="shared-tab" data-target="shared-requests" data-i18n="shared_tab_requests">Demandes de fichiers</div>
                </div>

                <!-- 1. Partages entrants -->
                <div id="shared-incoming" class="shared-content-panel">
                    <div class="shared-empty-state">
                        <div class="shared-empty-icon">
                            <i class="fa-solid fa-folder" style="color: #d1d5db; position: static; transform: none; display: block; font-size: 6rem;"></i>
                            <i class="fa-solid fa-arrow-left" style="position: absolute; top: 55%; left: 50%; transform: translate(-50%, -50%); color: #111; font-size: 2.5rem; font-weight: 900;"></i>
                        </div>
                        <h2 style="font-size: 1.5rem; font-weight: 500;" data-i18n="shared_no_incoming">Aucun partage entrant</h2>
                    </div>
                </div>

                <!-- 2. Partages sortants -->
                <div id="shared-outgoing" class="shared-content-panel">
                    <div style="padding: 15px 20px; display: flex; align-items: center; border-bottom: 1px solid var(--border);">
                        <button class="btn" style="background: white; color: black; border-radius: 6px; padding: 6px 15px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-folder-plus"></i> <span data-i18n="shared_new_folder">Nouveau dossier partagé</span>
                        </button>
                    </div>
                    <div class="shared-empty-state">
                        <div class="shared-empty-icon">
                            <i class="fa-solid fa-folder" style="color: #d1d5db; position: static; transform: none; display: block; font-size: 6rem;"></i>
                            <i class="fa-solid fa-arrow-right" style="position: absolute; top: 55%; left: 50%; transform: translate(-50%, -50%); color: #111; font-size: 2.5rem; font-weight: 900;"></i>
                        </div>
                        <h2 style="font-size: 1.5rem; font-weight: 500;" data-i18n="shared_no_outgoing">Aucun partage sortant</h2>
                    </div>
                </div>

                <!-- 3. Liens -->
                <div id="shared-links" class="shared-content-panel active">
                    <div style="padding: 15px 20px; display: flex; flex-direction: column; gap: 15px; border-bottom: 1px solid var(--border);">
                        <button class="btn" style="background: white; color: black; border-radius: 6px; padding: 6px 15px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; width: fit-content;">
                            <i class="fa-solid fa-plus"></i> <span data-i18n="shared_new_link">Créer un nouveau lien</span>
                        </button>
                        <div style="display: flex; gap: 10px;">
                            <span style="background: #222; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; color: #ccc; cursor: pointer;"><span data-i18n="shared_filter_type">Type</span> <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem; margin-left: 5px;"></i></span>
                            <span style="background: #222; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; color: #ccc; cursor: pointer;"><span data-i18n="shared_filter_mod">Dernière modification</span> <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem; margin-left: 5px;"></i></span>
                            <span style="background: #222; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; color: #ccc; cursor: pointer;"><span data-i18n="shared_filter_date">Date d'ajout</span> <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem; margin-left: 5px;"></i></span>
                        </div>
                    </div>
                    <div style="overflow-y: auto; flex: 1;">
                        <table class="file-table" style="width: 100%; font-size: 0.9rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border); color: #888;">
                                    <th style="padding: 10px; width: 30px;"><input type="checkbox"></th>
                                    <th style="padding: 10px; text-align: left;" data-i18n="col_name">Nom</th>
                                    <th style="padding: 10px; text-align: center;"><i class="fa-solid fa-heart"></i></th>
                                    <th style="padding: 10px; text-align: left;" data-i18n="col_tag">Étiquette</th>
                                    <th style="padding: 10px; text-align: left;" data-i18n="col_date">Date d'ajout</th>
                                    <th style="padding: 10px; text-align: left;" data-i18n="col_mod">Dernière modification</th>
                                    <th style="padding: 10px; text-align: left;" data-i18n="col_type">Type</th>
                                    <th style="padding: 10px; text-align: left;" data-i18n="col_size">Taille</th>
                                    <th style="padding: 10px; text-align: left;" data-i18n="col_location">Emplacement</th>
                                    <th style="padding: 10px; text-align: right;"><i class="fa-solid fa-list"></i></th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Items injected via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 4. Demandes de fichiers -->
                <div id="shared-requests" class="shared-content-panel">
                    <div style="padding: 15px 20px; display: flex; align-items: center; border-bottom: 1px solid var(--border);">
                        <button class="btn" style="background: white; color: black; border-radius: 6px; padding: 6px 15px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> <span data-i18n="shared_new_request">Créer une demande de fichiers</span>
                        </button>
                    </div>
                    <div class="shared-empty-state">
                        <div class="shared-empty-icon">
                            <i class="fa-solid fa-folder" style="color: #d1d5db; position: static; transform: none; display: block; font-size: 6rem;"></i>
                            <i class="fa-solid fa-arrow-up-right-from-square" style="position: absolute; top: 55%; left: 50%; transform: translate(-50%, -50%); color: #111; font-size: 2.5rem; font-weight: 900;"></i>
                        </div>
                        <h2 style="font-size: 1.5rem; font-weight: 500; margin-bottom: 15px;" data-i18n="shared_no_requests">Il n'y a aucune demande</h2>
                        <p style="color: #aeb4c0; max-width: 500px; margin-bottom: 30px; line-height: 1.5; font-size: 0.9rem;" data-i18n="shared_requests_desc">
                            Invitez n'importe qui à téléverser des fichiers dans un dossier précis de votre compte, même s'ils ne sont pas utilisateurs de MEGA. C'est une excellente façon de recueillir des photos, des rapports ou des attributions de tâches.
                        </p>
                        <button class="btn" style="background: #4ade80; color: #111; border-radius: 6px; padding: 10px 20px; font-weight: 600; font-size: 0.95rem;" data-i18n="shared_new_request">
                            Créer une demande de fichiers
                        </button>
                    </div>
                </div>
            </div>`;

const devicesPHP = `            <!-- Devices View (Hidden by default) -->
            <div id="view-devices" class="hidden" style="height: 100%; display: flex; flex-direction: column; background: #111111; color: white;">
                <div style="padding: 20px 30px; font-weight: bold; font-size: 1.1rem; border-bottom: 1px solid var(--border);" data-i18n="devices_title">Centre des appareils</div>
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <div style="position: relative; width: 120px; height: 120px; background: rgba(255,255,255,0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 30px;">
                        <i class="fa-solid fa-desktop" style="font-size: 4rem; color: #aeb4c0;"></i>
                        <div style="position: absolute; top: 40px; background: #111; border-radius: 50%; padding: 4px; display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid fa-arrows-rotate" style="font-size: 1.5rem; color: #3b82f6;"></i>
                        </div>
                        <div style="position: absolute; top: 10px; right: 20px; font-size: 0.5rem; color: #3b82f6;">✦</div>
                        <div style="position: absolute; bottom: 20px; left: 20px; font-size: 0.5rem; color: #3b82f6;">✦</div>
                    </div>
                    <h2 style="font-size: 1.8rem; margin-bottom: 15px; font-weight: 500;" data-i18n="devices_ready">Prêt quand vous l'êtes</h2>
                    <p style="color: #aeb4c0; max-width: 450px; margin-bottom: 40px; line-height: 1.6; font-size: 0.95rem;">
                        <span data-i18n="devices_desc">Créez votre première synchronisation ou sauvegarde pour connecter et protéger vos données.</span> <a href="#" style="color: #3b82f6; text-decoration: underline;" data-i18n="devices_learn_more">En apprendre davantage</a>
                    </p>
                    <div style="display: flex; gap: 30px;">
                        <a href="#" style="color: white; text-decoration: none; display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.95rem;">
                            <i class="fa-solid fa-database" style="color: #22c55e; font-size: 1.2rem;"></i> <span data-i18n="devices_add_backup">Ajouter une sauvegarde</span>
                        </a>
                        <a href="#" style="color: white; text-decoration: none; display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.95rem;">
                            <i class="fa-solid fa-arrows-rotate" style="color: #3b82f6; font-size: 1.2rem;"></i> <span data-i18n="devices_add_sync">Ajouter une synchronisation</span>
                        </a>
                    </div>
                </div>
            </div>`;

const objectPHP = `            <!-- Object Storage View (Hidden by default) -->
            <div id="view-object" class="hidden" style="flex: 1; height: 100%; overflow-y: auto; background: #111111; color: white; padding: 40px; display: flex; flex-direction: column; align-items: center;">

                <div class="s4-banner">
                    <div class="s4-banner-content">
                        <div class="s4-banner-title" data-i18n="s4_banner_title">Démarrer avec stockage objet MEGA CLONE S4</div>
                        <h1 data-i18n="s4_title">MEGA CLONE S4 est un stockage cloud compatible S3 et fonctionne avec les outils que vous utilisez déjà.</h1>
                        <p data-i18n="s4_desc">Que vous sauvegardiez un NAS, que vous gériez une bibliothèque multimédia ou que vous développiez une application, vous bénéficiez de coûts de stockage prévisibles sans frais cachés.</p>

                        <div style="display: flex; align-items: flex-start;">
                            <div class="s4-banner-buttons">
                                <button class="btn-white" data-i18n="s4_btn_upgrade">Surclasser le compte</button>
                                <button class="btn-outline-white" data-i18n="s4_btn_learn">Découvrir plus</button>
                            </div>
                            <div class="s4-banner-notes" data-i18n="s4_notes">
                                MEGA CLONE S4 est disponible sur certains abonnements, tous avec 5x plus de trafic sortant gratuit :<br>Pro Lite et Pro I sont idéaux pour des besoins de stockage plus modestes.<br>Pro Flexi et MEGA Entreprise offrent un stockage illimité.
                            </div>
                        </div>
                    </div>
                    <div class="s4-illustration">
                        <div class="cylinder">
                            <div class="shape-triangle"></div>
                            <div class="shape-circle"></div>
                            <div class="shape-square"></div>
                        </div>
                    </div>
                </div>

                <div class="guides-section">
                    <div class="guides-title" data-i18n="s4_guides_title">Parcourez ci-dessous certains de nos guides d'installation les plus populaires :</div>
                    <div class="guides-grid">
                        <!-- Column 1 -->
                        <div class="guide-column">
                            <div class="guide-header">
                                <i class="fa-solid fa-cloud-arrow-up" style="color: #f87171;"></i> <span data-i18n="s4_guide_backup">Sauvegarder mes données</span>
                            </div>
                            <a href="#" class="guide-link"><div class="guide-link-logo"><i class="fa-solid fa-arrows-rotate" style="color: #60a5fa;"></i> Rclone</div><i class="fa-solid fa-chevron-right"></i></a>
                            <a href="#" class="guide-link"><div class="guide-link-logo"><i class="fa-solid fa-server" style="color: #9ca3af;"></i> Synology</div><i class="fa-solid fa-chevron-right"></i></a>
                            <a href="#" class="guide-link"><div class="guide-link-logo"><i class="fa-solid fa-network-wired" style="color: #3b82f6;"></i> TrueNAS</div><i class="fa-solid fa-chevron-right"></i></a>
                            <a href="#" class="guide-link"><div class="guide-link-logo"><i class="fa-solid fa-xmarks-lines" style="color: #f97316;"></i> Proxmox</div><i class="fa-solid fa-chevron-right"></i></a>
                        </div>
                        <!-- Column 2 -->
                        <div class="guide-column">
                            <div class="guide-header">
                                <i class="fa-solid fa-folder-open" style="color: #ef4444;"></i> <span data-i18n="s4_guide_store">Stocker et gérer des fichiers</span>
                            </div>
                            <a href="#" class="guide-link"><div class="guide-link-logo"><i class="fa-solid fa-dove" style="color: #fbbf24;"></i> Cyberduck</div><i class="fa-solid fa-chevron-right"></i></a>
                            <a href="#" class="guide-link"><div class="guide-link-logo"><i class="fa-solid fa-cube" style="color: #60a5fa;"></i> S3 Browser</div><i class="fa-solid fa-chevron-right"></i></a>
                            <a href="#" class="guide-link"><div class="guide-link-logo"><i class="fa-solid fa-hdd" style="color: #818cf8;"></i> QNAP</div><i class="fa-solid fa-chevron-right"></i></a>
                            <a href="#" class="guide-link"><div class="guide-link-logo"><i class="fa-solid fa-anchor" style="color: #a78bfa;"></i> Anchorpoint</div><i class="fa-solid fa-chevron-right"></i></a>
                        </div>
                        <!-- Column 3 -->
                        <div class="guide-column">
                            <div class="guide-header">
                                <i class="fa-solid fa-layer-group" style="color: #fca5a5;"></i> <span data-i18n="s4_guide_dev">Concevoir ou développer</span>
                            </div>
                            <a href="#" class="guide-link"><div class="guide-link-logo"><i class="fa-brands fa-aws" style="color: #fb923c;"></i> AWS CLI</div><i class="fa-solid fa-chevron-right"></i></a>
                            <a href="#" class="guide-link"><div class="guide-link-logo"><i class="fa-solid fa-cubes" style="color: #f43f5e;"></i> MinIO</div><i class="fa-solid fa-chevron-right"></i></a>
                            <a href="#" class="guide-link"><div class="guide-link-logo"><i class="fa-solid fa-code" style="color: #8b5cf6;"></i> Terraform</div><i class="fa-solid fa-chevron-right"></i></a>
                            <a href="#" class="guide-link"><div class="guide-link-logo"><i class="fa-solid fa-bolt" style="color: #f97316;"></i> Bunny CDN</div><i class="fa-solid fa-chevron-right"></i></a>
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <a href="#" style="color: #60a5fa; text-decoration: underline; font-size: 0.9rem;" data-i18n="s4_more_guides">Voir plus de guides</a>
                    </div>
                </div>
            </div>`;

fs.writeFileSync('views/shared.php', sharedPHP);
fs.writeFileSync('views/devices.php', devicesPHP);
fs.writeFileSync('views/object.php', objectPHP);

const frKeys = {
    "shared_tab_incoming": "Partages entrants",
    "shared_tab_outgoing": "Partages sortants",
    "shared_tab_links": "Liens",
    "shared_tab_requests": "Demandes de fichiers",
    "shared_no_incoming": "Aucun partage entrant",
    "shared_new_folder": "Nouveau dossier partagé",
    "shared_no_outgoing": "Aucun partage sortant",
    "shared_new_link": "Créer un nouveau lien",
    "shared_filter_type": "Type",
    "shared_filter_mod": "Dernière modification",
    "shared_filter_date": "Date d'ajout",
    "shared_new_request": "Créer une demande de fichiers",
    "shared_no_requests": "Il n'y a aucune demande",
    "shared_requests_desc": "Invitez n'importe qui à téléverser des fichiers dans un dossier précis de votre compte, même s'ils ne sont pas utilisateurs de MEGA. C'est une excellente façon de recueillir des photos, des rapports ou des attributions de tâches.",
    "no_shared_links": "Vous n'avez créé aucun lien de partage pour l'instant.",
    "devices_title": "Centre des appareils",
    "devices_ready": "Prêt quand vous l'êtes",
    "devices_desc": "Créez votre première synchronisation ou sauvegarde pour connecter et protéger vos données.",
    "devices_learn_more": "En apprendre davantage",
    "devices_add_backup": "Ajouter une sauvegarde",
    "devices_add_sync": "Ajouter une synchronisation",
    "s4_banner_title": "Démarrer avec stockage objet MEGA CLONE S4",
    "s4_title": "MEGA CLONE S4 est un stockage cloud compatible S3 et fonctionne avec les outils que vous utilisez déjà.",
    "s4_desc": "Que vous sauvegardiez un NAS, que vous gériez une bibliothèque multimédia ou que vous développiez une application, vous bénéficiez de coûts de stockage prévisibles sans frais cachés.",
    "s4_btn_upgrade": "Surclasser le compte",
    "s4_btn_learn": "Découvrir plus",
    "s4_notes": "MEGA CLONE S4 est disponible sur certains abonnements, tous avec 5x plus de trafic sortant gratuit :<br>Pro Lite et Pro I sont idéaux pour des besoins de stockage plus modestes.<br>Pro Flexi et MEGA Entreprise offrent un stockage illimité.",
    "s4_guides_title": "Parcourez ci-dessous certains de nos guides d'installation les plus populaires :",
    "s4_guide_backup": "Sauvegarder mes données",
    "s4_guide_store": "Stocker et gérer des fichiers",
    "s4_guide_dev": "Concevoir ou développer",
    "s4_more_guides": "Voir plus de guides"
};

const enKeys = {
    "shared_tab_incoming": "Incoming shares",
    "shared_tab_outgoing": "Outgoing shares",
    "shared_tab_links": "Links",
    "shared_tab_requests": "File requests",
    "shared_no_incoming": "No incoming shares",
    "shared_new_folder": "New shared folder",
    "shared_no_outgoing": "No outgoing shares",
    "shared_new_link": "Create new link",
    "shared_filter_type": "Type",
    "shared_filter_mod": "Last modified",
    "shared_filter_date": "Date added",
    "shared_new_request": "Create a file request",
    "shared_no_requests": "There are no requests",
    "shared_requests_desc": "Invite anyone to upload files to a specific folder in your account, even if they aren't MEGA users. It's a great way to collect photos, reports, or task assignments.",
    "no_shared_links": "You have not created any shared links yet.",
    "devices_title": "Devices Center",
    "devices_ready": "Ready when you are",
    "devices_desc": "Create your first sync or backup to connect and protect your data.",
    "devices_learn_more": "Learn more",
    "devices_add_backup": "Add a backup",
    "devices_add_sync": "Add a sync",
    "s4_banner_title": "Get started with MEGA CLONE S4 object storage",
    "s4_title": "MEGA CLONE S4 is S3-compatible cloud storage that works with the tools you already use.",
    "s4_desc": "Whether you're backing up a NAS, managing a media library, or developing an app, you get predictable storage costs with no hidden fees.",
    "s4_btn_upgrade": "Upgrade account",
    "s4_btn_learn": "Learn more",
    "s4_notes": "MEGA CLONE S4 is available on select plans, all with 5x more free outbound traffic:<br>Pro Lite and Pro I are ideal for smaller storage needs.<br>Pro Flexi and MEGA Business offer unlimited storage.",
    "s4_guides_title": "Browse some of our most popular setup guides below:",
    "s4_guide_backup": "Backup my data",
    "s4_guide_store": "Store and manage files",
    "s4_guide_dev": "Design or develop",
    "s4_more_guides": "See more guides"
};

['fr', 'en'].forEach(lang => {
    const file = `locales/${lang}.json`;
    if (fs.existsSync(file)) {
        let current = JSON.parse(fs.readFileSync(file, 'utf8'));
        const newKeys = lang === 'fr' ? frKeys : enKeys;
        current = { ...current, ...newKeys };
        fs.writeFileSync(file, JSON.stringify(current, null, 4));
        console.log(`Updated ${file}`);
    }
});
