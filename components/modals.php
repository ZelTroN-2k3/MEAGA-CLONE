    <!-- Hidden file input -->
    <input type="file" id="file-input" multiple style="display: none;">

    <!-- Context Menu Mega Clone -->
    <div id="context-menu" class="context-menu-mega hidden">
        <div class="ctx-section">
            <div class="ctx-item" id="ctx-download">
                <i class="fa-solid fa-download"></i> <span data-i18n="ctx_download">Télécharger (Déchiffrer)</span>
            </div>
            <div class="ctx-item">
                <div
                    style="display:flex; justify-content:center; align-items:center; width:20px; height:20px; border-radius:50%; border:2px solid #aeb4c0; margin-right:15px; font-weight:bold; font-size:10px;">
                    M</div>
                <span data-i18n="ctx_download_mega">Télécharger avec l'appli MEGA pour ordinateur</span>
            </div>
        </div>

        <div class="ctx-section">
            <div class="ctx-item" id="ctx-share">
                <i class="fa-solid fa-share-nodes"></i> <span data-i18n="ctx_get_link">Obtenir le lien sécurisé</span>
            </div>
            <div class="ctx-item">
                <i class="fa-solid fa-cloud-arrow-up"></i> <span data-i18n="ctx_share_transfer">Partager avec Transfer.it</span> <span
                    class="badge-new" data-i18n="badge_new">Nouveaux</span>
            </div>
        </div>

        <div class="ctx-section">
            <div class="ctx-item" id="ctx-rename">
                <i class="fa-solid fa-pen"></i> <span data-i18n="ctx_rename">Renommer</span>
            </div>
            <div class="ctx-item" id="ctx-move">
                <i class="fa-solid fa-folder-tree"></i> <span data-i18n="ctx_move">Déplacer vers</span>
            </div>
            <div class="ctx-item">
                <i class="fa-regular fa-copy"></i> <span data-i18n="ctx_copy">Copier</span>
            </div>
        </div>

        <div class="ctx-section">
            <div class="ctx-label-title" data-i18n="ctx_label">Étiquette</div>
            <div class="ctx-labels">
                <div class="dot tag-color-btn" data-color="Rouge" style="background:#ef4444; cursor:pointer;"
                    data-i18n-title="color_red" title="Rouge"></div>
                <div class="dot tag-color-btn" data-color="Orange" style="background:#fb923c; cursor:pointer;"
                    data-i18n-title="color_orange" title="Orange"></div>
                <div class="dot tag-color-btn" data-color="Jaune" style="background:#eab308; cursor:pointer;"
                    data-i18n-title="color_yellow" title="Jaune"></div>
                <div class="dot tag-color-btn" data-color="Verte" style="background:#22c55e; cursor:pointer;"
                    data-i18n-title="color_green" title="Verte"></div>
                <div class="dot tag-color-btn" data-color="Bleue" style="background:#3b82f6; cursor:pointer;"
                    data-i18n-title="color_blue" title="Bleue"></div>
                <div class="dot tag-color-btn" data-color="Violette" style="background:#a855f7; cursor:pointer;"
                    data-i18n-title="color_purple" title="Violette"></div>
                <div class="dot tag-color-btn" data-color=""
                    style="background:#aeb4c0; cursor:pointer; display:flex; justify-content:center; align-items:center;"
                    data-i18n-title="color_none" title="Aucune étiquette"><i class="fa-solid fa-xmark" style="font-size:10px; color:white;"></i>
                </div>
            </div>
        </div>

        <div class="ctx-section">
            <div class="ctx-item" id="ctx-favorite">
                <i class="fa-regular fa-heart"></i> <span data-i18n="ctx_favorite">Favori</span>
            </div>
            <div class="ctx-item hidden" id="ctx-restore">
                <i class="fa-solid fa-clock-rotate-left"></i> <span data-i18n="ctx_restore">Restaurer</span>
            </div>
        </div>

        <div class="ctx-section" style="border-bottom:none;">
            <div class="ctx-item" id="ctx-delete">
                <i class="fa-regular fa-trash-can" style="color:#ff4d4d;"></i> <span
                    style="color:#ff4d4d;" data-i18n="ctx_delete">Supprimer</span>
            </div>
            <div class="ctx-item" id="ctx-hide">
                <i class="fa-regular fa-eye-slash"></i> <span data-i18n="ctx_hide">Cacher</span> <span class="badge-pro-ctx" data-i18n="badge_pro">Pro seulement</span>
            </div>
        </div>
    </div>

    <!-- Notification Container -->
    <div id="notification" class="notification">
        <i class="fa-solid fa-circle-info"></i>
        <span id="notif-message">Message</span>
    </div>

    <!-- ================= MODALS ================= -->

    <!-- New Folder Modal -->
    <div class="modal-overlay" id="modal-new-folder">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title" data-i18n="modal_new_folder">Nouveau Dossier</h3>
                <button class="modal-close" id="close-folder-modal"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="input-group">
                <label data-i18n="modal_folder_name">Nom du dossier</label>
                <input type="text" id="new-folder-name" class="input-control" data-i18n-placeholder="modal_folder_name" placeholder="Nouveau dossier">
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="cancel-folder" data-i18n="btn_cancel">Annuler</button>
                <button class="btn btn-primary" id="submit-folder" data-i18n="btn_create">Créer</button>
            </div>
        </div>
    </div>

    <!-- Share Link Modal -->
    <div class="modal-overlay" id="modal-share">
        <div class="modal share-modal-mega">

            <!-- MAIN VIEW -->
            <div id="share-main-view">
                <div class="modal-header" style="border: none; padding-bottom: 0;">
                    <h3 class="modal-title" data-i18n="modal_share_link">Partager un lien</h3>
                    <button class="modal-close" id="close-share-modal"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="share-modal-body">
                    <div class="share-file-info">
                        <div class="share-file-icon"><i class="fa-solid fa-folder" style="color: #ffcc00;"></i></div>
                        <div class="share-file-name" id="share-modal-filename">Nom du fichier</div>
                        <div class="share-file-meta" id="btn-open-share-settings"
                            style="cursor:pointer; color:var(--text-secondary);"><i class="fa-solid fa-gear"></i>
                            <span data-i18n="share_link_settings">Paramètres de lien</span></div>
                    </div>

                    <div
                        style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 15px;">
                        <div style="padding: 12px 15px; border-bottom: 1px solid var(--border);">
                            <label
                                style="font-size: 0.85rem; color: var(--text-primary); font-weight: bold; margin-bottom: 5px; display: block;" data-i18n="share_link_label">Lien</label>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <input type="text" id="share-link-input" readonly
                                    style="background: transparent; border: none; color: var(--text-secondary); width: 100%; outline: none; font-size: 0.9rem; padding: 0;">
                                <div style="display: flex; gap: 10px; color: var(--text-secondary);">
                                    <i class="fa-regular fa-copy" id="btn-copy-link-icon" style="cursor: pointer;"></i>
                                    <i class="fa-solid fa-qrcode" style="cursor: pointer;"></i>
                                </div>
                            </div>
                        </div>

                        <div id="main-view-key-container"
                            style="display: none; padding: 12px 15px; border-bottom: 1px solid var(--border);">
                            <label
                                style="font-size: 0.85rem; color: var(--text-primary); font-weight: bold; margin-bottom: 5px; display: block;" data-i18n="share_key_label">Clé
                                de déchiffrement</label>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <input type="text" id="main-share-key-input" readonly
                                    style="background: transparent; border: none; color: var(--text-secondary); width: 100%; outline: none; font-size: 0.9rem; padding: 0;">
                                <i class="fa-regular fa-copy" id="btn-copy-key-icon"
                                    style="cursor: pointer; color: var(--text-secondary);"></i>
                            </div>
                        </div>

                        <div
                            style="padding: 12px 15px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span
                                    style="font-size: 0.85rem; color: var(--text-primary); font-weight: bold;" data-i18n="share_activity">Activité
                                    du lien</span>
                                <span
                                    style="font-size: 0.75rem; border: 1px solid #d84b37; color: #d84b37; border-radius: 4px; padding: 2px 6px;" data-i18n="badge_pro">Pro
                                    seulement</span>
                            </div>
                            <div style="display: flex; gap: 15px; color: var(--text-secondary);">
                                <i class="fa-regular fa-eye"></i>
                                <i class="fa-solid fa-chart-simple"></i>
                            </div>
                        </div>
                    </div>

                    <p class="share-notice" style="margin-top: 15px; color: var(--accent); font-size: 0.9rem;" data-i18n="share_notice">Toute
                        personne disposant de ce lien peut consulter et télécharger votre contenu</p>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                        <button class="btn btn-secondary" id="btn-copy-key-main"
                            style="background: #2d313c; border-color: #2d313c; color: white; display: none;" data-i18n="btn_copy_key">Copier la
                            clé</button>
                        <button class="btn btn-copy-mega" id="btn-copy-link"
                            style="background: white; color: black;" data-i18n="btn_copy_link">Copier le lien</button>
                    </div>
                </div>

                <div class="share-promo-box">
                    <div class="promo-icon"><i class="fa-solid fa-chart-line"></i></div>
                    <div class="promo-text">
                        <strong data-i18n="share_promo_title">Débloquez l'activité du lien</strong>
                        <p data-i18n="share_promo_desc">Passez à Pro dès maintenant pour voir combien de personnes ont vu ce lien ou ont interagi
                            avec ce lien.</p>
                        <a href="#" data-i18n="share_learn_more">En apprendre davantage</a>
                    </div>
                    <button class="btn btn-upgrade-small" data-i18n="sidebar_btn_upgrade">Surclasser le compte</button>
                </div>
            </div>

            <!-- SETTINGS VIEW (Mega Clone style) -->
            <div id="share-settings-view" style="display: none;">
                <div class="modal-header"
                    style="border: none; padding-bottom: 10px; display: flex; align-items: center; gap: 15px;">
                    <i class="fa-solid fa-arrow-left" id="btn-back-share-settings"
                        style="cursor: pointer; color: var(--text-primary); font-size: 1.1rem;"></i>
                    <h3 class="modal-title" style="margin: 0;" data-i18n="share_link_settings">Paramètres de lien</h3>
                    <button class="modal-close" id="close-settings-modal" style="margin-left: auto;"><i
                            class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="share-modal-body" style="padding-top: 10px;">
                    <div class="form-group"
                        style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <div>
                            <label
                                style="font-size: 0.95rem; margin-bottom: 5px; color: var(--text-primary); display:block;"><span data-i18n="share_set_separate">Envoyer
                                la clé de déchiffrement séparément.</span> <a href="#"
                                    style="color: #d84b37; text-decoration: none;" data-i18n="share_learn_more">En apprendre davantage</a></label>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="enable-separate-key">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div id="separate-key-container"
                        style="display: none; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <label
                            style="font-size: 0.85rem; color: var(--text-secondary); display:block; margin-bottom: 5px;" data-i18n="share_key_label">Clé
                            de déchiffrement</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="share-key-input" readonly class="form-control"
                                style="width: 100%; font-size: 0.9rem; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white; border-radius: 6px;">
                            <button class="btn btn-secondary" id="btn-copy-share-key"
                                style="background: #2d313c; border-color: #2d313c; color: white; white-space: nowrap;" data-i18n="btn_copy_key">Copier
                                la clé</button>
                        </div>
                    </div>

                    <div class="form-group"
                        style="display: flex; align-items: center; justify-content: space-between; padding: 15px 0;">
                        <div>
                            <label
                                style="font-size: 0.95rem; margin-bottom: 5px; color: var(--text-primary); display:block;" data-i18n="share_set_expiry">Définir
                                une date d'expiration</label>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);" data-i18n="share_set_expiry_desc">Désactiver le lien à une date
                                précise</span>
                        </div>
                        <div id="expiry-pro-badge"
                            style="display: none; border: 1px solid #d84b37; color: #d84b37; border-radius: 4px; padding: 4px 8px; font-size: 0.8rem;" data-i18n="badge_pro">
                            Pro seulement</div>
                        <label class="toggle-switch" id="expiry-toggle-wrapper">
                            <input type="checkbox" id="enable-expiry">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div id="expiry-container" style="display: none; padding-bottom: 15px;">
                        <input type="datetime-local" id="share-expiry-input" class="form-control"
                            style="width: 100%; font-size: 0.9rem; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white; border-radius: 6px;">
                    </div>

                    <div class="form-group"
                        style="display: flex; align-items: center; justify-content: space-between; padding: 15px 0;">
                        <div>
                            <label
                                style="font-size: 0.95rem; margin-bottom: 5px; color: var(--text-primary); display:block;" data-i18n="share_set_password">Définir
                                un mot de passe</label>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);" data-i18n="share_set_password_desc">Limiter l'accès avec un mot
                                de passe</span>
                        </div>
                        <div id="password-pro-badge"
                            style="display: none; border: 1px solid #d84b37; color: #d84b37; border-radius: 4px; padding: 4px 8px; font-size: 0.8rem;" data-i18n="badge_pro">
                            Pro seulement</div>
                        <label class="toggle-switch" id="password-toggle-wrapper">
                            <input type="checkbox" id="enable-password">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div id="password-container" style="display: none; padding-bottom: 15px;">
                        <input type="text" id="share-password-input" class="form-control"
                            data-i18n-placeholder="share_password_placeholder" placeholder="Entrez un mot de passe"
                            style="width: 100%; font-size: 0.9rem; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white; border-radius: 6px;">
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 30px;">
                        <a href="#" style="color: #ff3333; text-decoration: none; font-size: 0.9rem;" data-i18n="btn_delete_link">Supprimer le
                            lien</a>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-secondary" id="btn-cancel-settings"
                                style="background: #2d313c; border-color: #2d313c; color: white;" data-i18n="btn_back">Précédent</button>
                            <button class="btn btn-primary" id="btn-save-share-settings"
                                style="background: white; color: black; border: none; font-weight: 500;" data-i18n="btn_save">Enregistrer les
                                changements</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <!-- User Menu Dropdown Mega Clone -->
    <div class="user-menu-dropdown hidden" id="modal-user-menu">
        <div class="user-menu-header">
            <div class="user-menu-avatar" id="dropdown-avatar"
                style="position: relative; overflow: hidden; cursor: pointer;">
                <span id="dropdown-avatar-text">U</span>
                <div class="avatar-overlay">
                    <i class="fa-solid fa-camera"></i>
                </div>
            </div>
            <input type="file" id="avatar-upload" accept="image/png, image/jpeg, image/gif, image/webp" hidden>
            <div class="user-menu-info">
                <div class="user-name" id="dropdown-username">Utilisateur</div>
                <div class="user-email" id="dropdown-email">utilisateur@megaclone.net</div>
                <a href="account.html"
                    style="display: inline-block; margin-top: 10px; background: rgba(255,255,255,0.1); padding: 6px 15px; border-radius: 10px; text-decoration: none; color: var(--text-primary); font-size: 0.85rem; transition: background 0.2s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.2)'"
                    onmouseout="this.style.background='rgba(255,255,255,0.1)'"><i class="fa-solid fa-user-gear"
                        style="margin-right: 5px;"></i> <span data-i18n="menu_manage_account">Gérer mon compte</span></a>
            </div>
        </div>

        <div class="user-menu-storage">
            <div class="storage-text-row">
                <span style="color: #33cc33; font-weight: bold;" id="plan-badge-modal" data-i18n="plan_free">FREE</span>
                <span id="storage-text">22,9 Go sur 50 Go utilisés</span>
            </div>
            <div class="storage-bar-bg">
                <div class="storage-bar-fill" id="storage-fill" style="width: 45%;"></div>
            </div>
            <a href="#" class="upgrade-link" id="btn-upgrade-menu"
                style="display: block; margin-top: 15px; background: linear-gradient(135deg, var(--accent) 0%, #ff4d4d 100%); padding: 8px 15px; border-radius: 10px; text-decoration: none; color: white; font-size: 0.9rem; text-align: center; font-weight: bold; transition: opacity 0.2s;"
                onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"><i class="fa-solid fa-rocket"
                    style="margin-right: 5px;"></i> <span data-i18n="sidebar_btn_upgrade">Surclasser le compte</span></a>
        </div>

        <div class="user-menu-section">
            <a href="admin.html" id="admin-panel-section" style="display: none; text-decoration: none; color: inherit;">
                <div class="user-menu-item"><i class="fa-solid fa-shield-halved"
                        style="margin-right: 10px; color: var(--accent);"></i>Panel Administrateur</div>
            </a>
            <div class="user-menu-item hidden" id="menu-toggle-hidden">
                <i class="fa-solid fa-eye-slash" style="margin-right: 10px; color: #aeb4c0;"></i><span data-i18n="menu_toggle_hidden">Afficher éléments cachés</span>
            </div>
            <div class="user-menu-item"><i class="fa-solid fa-key" style="margin-right: 10px; color: #ffcc00;"></i><span data-i18n="menu_recovery_key">Clé
                de récupération</span></div>
            <div class="user-menu-item" id="btn-show-settings"><i class="fa-solid fa-lock"
                    style="margin-right: 10px; color: #00ff15;"></i><span data-i18n="modal_password_title">Paramètres (Mot de passe)</span></div>
            <div class="user-menu-item"
                onclick="document.getElementById('modal-reload').classList.add('active'); document.getElementById('modal-user-menu').classList.add('hidden');">
                <i class="fa-solid fa-rotate-right" style="margin-right: 10px; color: #0066ff;"></i><span data-i18n="modal_reload_title">Recharger votre
                compte</span>
            </div>
            <div style="padding: 10px 15px;">
                <button class="btn-logout-mega" id="btn-logout" data-i18n="menu_logout">Me déconnecter</button>
            </div>
        </div>

        <div class="user-menu-footer">
            <div class="footer-item" style="display:flex; justify-content:space-between; align-items:center;">
                <span data-i18n="menu_language">Langue</span>
                <select class="lang-switcher-select" onchange="i18n.setLanguage(this.value)" style="background:transparent; color:inherit; border:1px solid rgba(255,255,255,0.2); border-radius:4px; padding:2px 5px; outline:none; cursor:pointer; font-size:0.8rem;">
                    <option value="fr" style="background:#1c1d22;">Français</option>
                    <option value="en" style="background:#1c1d22;">English</option>
                    <option value="es" style="background:#1c1d22;">Español</option>
                    <option value="de" style="background:#1c1d22;">Deutsch</option>
                </select>
            </div>
            <div class="footer-item"><span data-i18n="menu_support">Assistance</span> <i class="fa-solid fa-chevron-right"
                    style="margin-left:auto; font-size:0.7rem;"></i></div>
            <div class="footer-item"><span data-i18n="menu_legal">Juridique</span> <i class="fa-solid fa-chevron-right"
                    style="margin-left:auto; font-size:0.7rem;"></i></div>
            <div class="footer-item" style="margin-top: 10px; font-weight:bold;">V.1.0</div>
        </div>
    </div>

    <!-- Password Change Modal (Since we removed it from the dropdown) -->
    <div class="modal-overlay" id="modal-settings">
        <div class="modal" style="max-width: 400px; padding: 2rem;">
            <h3 data-i18n="modal_password_title">Changer le mot de passe</h3>
            <form id="form-password-change">
                <div class="input-group">
                    <label data-i18n="modal_old_password">Ancien mot de passe</label>
                    <input type="password" id="old-pass" class="input-control" required>
                </div>
                <div class="input-group">
                    <label data-i18n="modal_new_password">Nouveau mot de passe</label>
                    <input type="password" id="new-pass" class="input-control" required>
                </div>
                <button type="submit" class="btn btn-primary"
                    style="width: 100%; margin-top: 10px;" data-i18n="btn_save">Enregistrer</button>
                <button type="button" class="btn btn-secondary" id="close-settings-modal"
                    onclick="document.getElementById('modal-settings').classList.remove('active');"
                    style="width: 100%; margin-top: 10px;" data-i18n="btn_cancel">Annuler</button>
            </form>
        </div>
    </div>

    <!-- Reload Modal -->
    <div class="modal-overlay" id="modal-reload">
        <div class="modal" style="max-width: 450px; padding: 2rem; border-radius: 12px; background: #1c1d22;">
            <h3 style="margin-bottom: 20px; font-size: 1.2rem;" data-i18n="modal_reload_title">Recharger le compte</h3>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 30px; font-size: 0.95rem;" data-i18n="modal_reload_desc">
                Cela effacera toutes les données MEGA stockées dans le cache de votre navigateur et rechargera votre
                compte à partir de nos serveurs. Cela peut prendre quelques minutes.
            </p>
            <div style="display: flex; justify-content: flex-end; gap: 15px;">
                <button type="button" class="btn btn-secondary"
                    onclick="document.getElementById('modal-reload').classList.remove('active')"
                    style="background: #2d313c; border: none; padding: 10px 20px; color: white;" data-i18n="btn_cancel">Annuler</button>
                <button type="button" class="btn btn-primary" onclick="window.location.reload()"
                    style="background: white; color: black; border: none; padding: 10px 20px; font-weight: bold;" data-i18n="modal_reload_title">Recharger
                    le compte</button>
            </div>
        </div>
    </div>

    <!-- Move Modal -->
    <div class="modal-overlay" id="modal-move">
        <div class="modal" style="max-width: 400px; padding: 2rem;">
            <h3 data-i18n="modal_move_title">Déplacer vers...</h3>
            <div class="input-group" style="margin-top: 20px;">
                <label data-i18n="modal_move_dest">Dossier de destination</label>
                <select id="move-folder-select" class="input-control">
                    <!-- Populated via JS -->
                </select>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button class="btn btn-secondary" id="cancel-move" style="flex: 1;" data-i18n="btn_cancel">Annuler</button>
                <button class="btn btn-primary" id="submit-move" style="flex: 1;" data-i18n="ctx_move">Déplacer</button>
            </div>
        </div>
    </div>

    <!-- ZIP Progress Modal -->
    <div class="modal-overlay" id="modal-zip-progress">
        <div class="modal" style="max-width: 400px; padding: 2rem; text-align: center;">
            <h3 style="margin-bottom: 1rem;" data-i18n="modal_zip_title">Préparation de l'archive</h3>
            <p id="zip-status-text" style="color: var(--text-secondary); margin-bottom: 1.5rem;" data-i18n="modal_zip_desc">Téléchargement et
                déchiffrement en cours...</p>
            <div class="transfer-progress-bar"
                style="background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; height: 10px; margin-bottom: 1rem;">
                <div class="transfer-progress-fill" id="zip-progress-fill"
                    style="width: 0%; background: var(--accent); height: 100%; transition: width 0.3s;"></div>
            </div>
        </div>
    </div>

    <!-- Drag and Drop Overlay -->
    <div id="drag-overlay"
        style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(217, 43, 47, 0.9); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; pointer-events: none; opacity: 0; transition: opacity 0.3s;">
        <i class="fa-solid fa-cloud-arrow-up" style="font-size: 5rem; margin-bottom: 20px;"></i>
        <h2 style="font-size: 2rem; margin-bottom: 10px;" data-i18n="drag_drop_title">Relâchez pour envoyer</h2>
        <p data-i18n="drag_drop_desc">Vos fichiers seront chiffrés et sauvegardés automatiquement.</p>
    </div>

    <!-- Media Viewer Modal -->
    <div class="modal-overlay" id="modal-media-viewer"
        style="z-index: 3000; background: rgba(0,0,0,0.95); flex-direction: column;">
        <div style="position: absolute; top: 20px; right: 30px; display: flex; gap: 20px;">
            <a id="media-viewer-download" href="#" style="color: white; font-size: 1.5rem; text-decoration: none;"
                title="Télécharger"><i class="fa-solid fa-download"></i></a>
            <i class="fa-solid fa-xmark" id="close-media-viewer" style="color: white; font-size: 2rem; cursor: pointer;"
                title="Fermer"></i>
        </div>
        <div class="media-header" id="media-viewer-title"
            style="position: absolute; top: 20px; left: 30px; color: white; font-size: 1.2rem; font-weight: bold;">
        </div>
        <div id="media-viewer-content"
            style="max-width: 90vw; max-height: 85vh; display: flex; align-items: center; justify-content: center;">
            <!-- Media will be injected here -->
        </div>
        <div id="media-viewer-loader" class="hidden"
            style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 3rem; color: var(--accent);"></i>
            <span data-i18n="media_viewer_loader">Déchiffrement en cours...</span>
        </div>
    </div>

    <!-- Upgrade Modal -->
    <div class="modal-overlay" id="modal-upgrade">
        <div class="modal" style="max-width: 900px; max-height: 90vh; overflow-y: auto; padding: 2rem;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <h2 style="font-size: 1.8rem; margin-bottom: 10px;" data-i18n="upgrade_title">Surclassez votre compte</h2>
                <p style="color: var(--text-secondary);" data-i18n="upgrade_desc">Accédez à plus de stockage et de fonctionnalités avec nos
                    forfaits PRO.</p>
            </div>

            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <!-- Pro I -->
                <div
                    style="flex: 1; border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: center; background: rgba(255,255,255,0.02);">
                    <h3 style="color: #4ade80; font-size: 1.5rem; margin-bottom: 10px;">PRO I</h3>
                    <div style="font-size: 2rem; font-weight: bold; margin-bottom: 15px;">2 To</div>
                    <ul
                        style="list-style: none; padding: 0; margin-bottom: 20px; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.8;">
                        <li data-i18n="upgrade_pro1_desc1">Stockage sécurisé</li>
                        <li data-i18n="upgrade_pro1_desc2">Partage avancé</li>
                    </ul>
                    <div id="paypal-button-container-pro1" style="margin-top: 15px;"></div>
                </div>

                <!-- Pro II -->
                <div
                    style="flex: 1; border: 1px solid var(--accent); border-radius: 12px; padding: 20px; text-align: center; background: rgba(217, 0, 0, 0.05); position: relative;">
                    <div
                        style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: white; padding: 2px 10px; border-radius: 10px; font-size: 0.7rem; font-weight: bold;">
                        <span data-i18n="upgrade_popular">POPULAIRE</span></div>
                    <h3 style="color: var(--accent); font-size: 1.5rem; margin-bottom: 10px;">PRO II</h3>
                    <div style="font-size: 2rem; font-weight: bold; margin-bottom: 15px;">8 To</div>
                    <ul
                        style="list-style: none; padding: 0; margin-bottom: 20px; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.8;">
                        <li data-i18n="upgrade_pro2_desc1">Stockage sécurisé massif</li>
                        <li data-i18n="upgrade_pro2_desc2">Priorité bande passante</li>
                    </ul>
                    <div id="paypal-button-container-pro2" style="margin-top: 15px;"></div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 2rem;">
                <button class="btn btn-secondary" id="close-upgrade-modal" data-i18n="upgrade_later">Plus tard</button>
            </div>
        </div>
    </div>

    <!-- Transfer Manager (Uploader) -->
    <div class="transfer-manager" id="transfer-manager">
        <div class="transfer-header">
            <span data-i18n="transfer_manager_title">Gestionnaire de transfert</span>
            <div class="transfer-header-icons">
                <i class="fa-solid fa-minus" id="tm-minimize"></i>
                <i class="fa-solid fa-xmark" id="tm-close"></i>
            </div>
        </div>
        <div class="transfer-body">
            <div class="transfer-file-name" id="tm-filename">nom_du_fichier.ext</div>
            <div class="transfer-stats">
                <span id="tm-percentage">0%</span>
                <span id="tm-speed">-- KB/s</span>
            </div>
            <div class="transfer-progress-bar">
                <div class="transfer-progress-fill" id="tm-fill"></div>
            </div>
        </div>
    </div>

    <!-- Confirm Modal -->
    <div class="modal-overlay" id="modal-confirm">
        <div class="modal" style="max-width: 400px; text-align: center; padding: 30px;">
            <div id="confirm-modal-icon" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 id="confirm-modal-title" style="margin-bottom: 15px;">Confirmation</h3>
            <p id="confirm-modal-desc" style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 25px;">
                Êtes-vous sûr de vouloir effectuer cette action ?
            </p>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-secondary" id="btn-confirm-cancel" style="flex: 1;" data-i18n="cancel">Annuler</button>
                <button class="btn btn-primary" id="btn-confirm-submit" style="flex: 1; background: #ef4444; color: white;" data-i18n="confirm">Confirmer</button>
            </div>
        </div>
    </div>

    <!-- Hide Upsell Modal -->
    <div class="modal-overlay" id="modal-hide-upsell">
        <div class="modal" style="max-width: 500px; padding: 30px; background: #1c1d22; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; justify-content: flex-end; margin-bottom: -30px; position: relative; z-index: 10;">
                <button class="modal-close" onclick="document.getElementById('modal-hide-upsell').classList.remove('active')" style="color: white; background: transparent; border: none; font-size: 1.5rem; cursor: pointer; padding: 0;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            
            <div style="text-align: center; margin-bottom: 20px; margin-top: 20px;">
                <i class="fa-solid fa-lock" style="font-size: 4rem; color: #aeb4c0; background: linear-gradient(135deg, #f59e0b, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>
            </div>
            
            <h2 style="font-size: 1.4rem; font-weight: bold; margin-bottom: 30px; color: white;" data-i18n="hide_modal_title">Fichiers et dossiers cachés</h2>
            
            <div style="display: flex; gap: 20px; margin-bottom: 25px;">
                <div style="width: 24px; text-align: center; margin-top: 5px;">
                    <i class="fa-solid fa-eye-slash" style="font-size: 1.2rem; color: white;"></i>
                </div>
                <div>
                    <h4 style="font-size: 1.05rem; font-weight: bold; margin-bottom: 5px; color: white;" data-i18n="hide_modal_item1_title">Cacher les fichiers et dossiers importants</h4>
                    <p style="color: #aeb4c0; font-size: 0.95rem; line-height: 1.5;" data-i18n="hide_modal_item1_desc">Vous pouvez masquer des fichiers et des dossiers sensibles pour protéger votre vie privée. Vous seul pouvez les révéler, soit individuellement, soit en affichant temporairement les éléments masqués dans le menu.</p>
                </div>
            </div>
            
            <div style="display: flex; gap: 20px; margin-bottom: 25px;">
                <div style="width: 24px; text-align: center; margin-top: 5px; position: relative;">
                    <i class="fa-regular fa-image" style="font-size: 1.2rem; color: white;"></i><i class="fa-solid fa-slash" style="position: absolute; left: 0; top: 0; font-size: 1.2rem; color: white;"></i>
                </div>
                <div>
                    <h4 style="font-size: 1.05rem; font-weight: bold; margin-bottom: 5px; color: white;" data-i18n="hide_modal_item2_title">Exclure de la Timeline</h4>
                    <p style="color: #aeb4c0; font-size: 0.95rem; line-height: 1.5;" data-i18n="hide_modal_item2_desc">Les éléments masqués ne sont accessibles que via le disque cloud et n'apparaîtront pas dans vos Photos, Albums ou Récents.</p>
                </div>
            </div>
            
            <div style="display: flex; gap: 20px; margin-bottom: 35px;">
                <div style="width: 24px; text-align: center; margin-top: 5px;">
                    <i class="fa-solid fa-eye" style="font-size: 1.2rem; color: white;"></i>
                </div>
                <div>
                    <h4 style="font-size: 1.05rem; font-weight: bold; margin-bottom: 5px; color: white;" data-i18n="hide_modal_item3_title">À l'abri des regards</h4>
                    <p style="color: #aeb4c0; font-size: 0.95rem; line-height: 1.5;" data-i18n="hide_modal_item3_desc">Vous décidez quand les fichiers cachés sont visibles. Ceci est un nouveau réglage pour afficher temporairement les éléments cachés.</p>
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 15px;">
                <button class="btn" style="background: white; color: black; font-weight: bold; padding: 10px 20px; border-radius: 8px; border: none; font-size: 0.95rem; cursor: pointer;" onclick="document.getElementById('modal-hide-upsell').classList.remove('active'); document.getElementById('modal-upgrade').classList.add('active');" data-i18n="btn_upgrade_account">Surclasser le compte</button>
                <button class="btn" style="background: rgba(255,255,255,0.1); color: white; font-weight: bold; padding: 10px 20px; border-radius: 8px; border: none; font-size: 0.95rem; cursor: pointer;" onclick="document.getElementById('modal-hide-upsell').classList.remove('active')" data-i18n="btn_cancel">Annuler</button>
            </div>
        </div>
    </div>
