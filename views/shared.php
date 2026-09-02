            <!-- Shared Items View (Hidden by default) -->
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
            </div>