<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disque - Mega Clone</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://www.paypal.com/sdk/js?client-id=test&currency=EUR"></script>
</head>

<body>

    <div class="dashboard mega-layout">
        <!-- Sidebar -->
        <?php include 'components/sidebar.php'; ?>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Topbar (Search + Profile) -->
            <?php include 'components/topbar.php'; ?>

            <!-- Action Bar -->
            <div class="action-bar-mega" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem;">
                <div class="action-buttons" id="action-buttons-default">
                    <button class="btn btn-upload-mega" id="btn-upload">
                        <i class="fa-solid fa-arrow-up-from-bracket"></i> <span data-i18n="dash_btn_upload">Téléverser</span>
                    </button>
                    <button class="btn btn-new-folder-mega" id="btn-new-folder">
                        <i class="fa-solid fa-folder-plus"></i> <span data-i18n="dash_btn_new_folder">Nouveau dossier</span>
                    </button>
                </div>
                <div class="action-buttons hidden" id="action-buttons-trash">
                    <button class="btn" id="btn-empty-trash" style="background:#ff4d4d; color:white;">
                        <i class="fa-solid fa-trash"></i> <span data-i18n="dash_btn_empty_trash">Vider la corbeille</span>
                    </button>
                </div>
                
                <!-- View Controls -->
                <div class="view-controls" id="view-controls" style="display: flex; margin-left: auto;">
                    <button class="btn-icon active" id="btn-view-list" title="Vue Liste"><i class="fa-solid fa-list"></i></button>
                    <button class="btn-icon" id="btn-view-compact" title="Vue Compacte"><i class="fa-solid fa-list-ul"></i></button>
                    <button class="btn-icon" id="btn-view-grid" title="Vue Grille"><i class="fa-solid fa-border-all"></i></button>
                </div>
            </div>

            <!-- Breadcrumbs -->
            <div class="breadcrumbs-mega">
                <h2 class="breadcrumb-current" id="breadcrumbs" data-i18n="dash_breadcrumbs_drive">Disque Cloud</h2>
            </div>

            <!-- ... -->
            <!-- We need to skip to context menu ... -->

            <!-- Selection Action Bar (Hidden by default) -->
            <div class="selection-bar hidden" id="selection-bar">
                <div class="selection-count" id="selection-count">1 sélectionné • 59,2 Mo</div>
                <div class="selection-actions">
                    <i class="fa-solid fa-circle-down action-icon" id="sel-download" title="Télécharger"></i>
                    <i class="fa-solid fa-link action-icon" id="sel-share" title="Obtenir le lien"></i>
                    <i class="fa-solid fa-folder-tree action-icon" id="sel-move" title="Déplacer vers"></i>
                    <i class="fa-solid fa-pen action-icon" id="sel-rename" title="Renommer"></i>
                    <i class="fa-regular fa-trash-can action-icon" id="sel-delete" title="Supprimer"></i>
                    <i class="fa-solid fa-ellipsis-vertical action-icon" id="sel-more" title="Plus d'actions"></i>
                </div>
                <i class="fa-solid fa-xmark close-selection" id="close-selection"></i>
            </div>

            <!-- File List Table -->
            <div class="file-manager" id="file-manager">
                <!-- Drop zone overlay -->
                <div class="drop-zone" id="drop-zone">
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                    <p data-i18n="dash_dropzone">Déposez les fichiers ici pour les téléverser</p>
                </div>

                <div class="file-list-container">
                    <table class="file-table">
                        <thead>
                            <tr>
                                <th class="col-checkbox"><input type="checkbox" id="check-all"></th>
                                <th class="col-name" data-sort="name" style="cursor:pointer;"><span data-i18n="col_name">Nom</span> <i class="fa-solid fa-arrow-up sort-icon"></i></th>
                                <th class="col-fav" style="width: 40px; text-align: center;"><i
                                        class="fa-solid fa-heart" style="color:var(--text-secondary);"></i></th>
                                <th class="col-tag" data-i18n="col_tag">Étiquette</th>
                                <th class="col-date" data-sort="date" style="cursor:pointer;"><span data-i18n="col_date">Date d'ajout</span> <i class="fa-solid fa-sort sort-icon" style="opacity:0.3;"></i></th>
                                <th class="col-mod" data-i18n="col_mod">Dernière modification</th>
                                <th class="col-type" data-i18n="col_type">Type</th>
                                <th class="col-size" data-sort="size" style="cursor:pointer;"><span data-i18n="col_size">Taille</span> <i class="fa-solid fa-sort sort-icon" style="opacity:0.3;"></i></th>
                                <th class="col-version" data-i18n="col_version">Versions</th>
                                <th class="col-duration" data-i18n="col_duration">Durée</th>
                                <th class="col-location" data-i18n="col_location">Emplacement</th>
                                <th class="col-actions" style="cursor: pointer; position: relative;"
                                    id="btn-toggle-columns">
                                    <i class="fa-solid fa-table-columns"></i>
                                    <!-- Column Toggle Dropdown -->
                                    <div class="dropdown-menu dropdown-menu-columns hidden" id="dropdown-columns">
                                        <div class="dropdown-columns-header" data-i18n="col_title">Colonnes</div>
                                        <label class="dropdown-columns-label">
                                            <span data-i18n="col_tag">Étiquette</span>
                                            <input type="checkbox" id="chk-col-tag" checked class="dropdown-columns-checkbox">
                                        </label>
                                        <label class="dropdown-columns-label">
                                            <span data-i18n="col_date">Date d'ajout</span>
                                            <input type="checkbox" id="chk-col-date" checked class="dropdown-columns-checkbox">
                                        </label>
                                        <label class="dropdown-columns-label">
                                            <span data-i18n="col_mod">Dernière modification</span>
                                            <input type="checkbox" id="chk-col-mod" checked class="dropdown-columns-checkbox">
                                        </label>
                                        <label class="dropdown-columns-label">
                                            <span data-i18n="col_type">Type</span>
                                            <input type="checkbox" id="chk-col-type" checked class="dropdown-columns-checkbox">
                                        </label>
                                        <label class="dropdown-columns-label">
                                            <span data-i18n="col_size">Taille</span>
                                            <input type="checkbox" id="chk-col-size" checked class="dropdown-columns-checkbox">
                                        </label>
                                        <label class="dropdown-columns-label">
                                            <span data-i18n="col_version">Versions</span>
                                            <input type="checkbox" id="chk-col-version" checked class="dropdown-columns-checkbox">
                                        </label>
                                        <label class="dropdown-columns-label">
                                            <span data-i18n="col_duration">Durée</span>
                                            <input type="checkbox" id="chk-col-duration" checked class="dropdown-columns-checkbox">
                                        </label>
                                        <label class="dropdown-columns-label">
                                            <span data-i18n="col_location">Emplacement</span>
                                            <input type="checkbox" id="chk-col-location" checked class="dropdown-columns-checkbox">
                                        </label>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody id="item-list">
                            <!-- Items injected via JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <?php include 'views/devices.php'; ?>
            <?php include 'views/shared.php'; ?>
            <?php include 'views/object.php'; ?>
    </div>

    <?php include 'components/modals.php'; ?>
    <!-- Crypto functions -->
    <script src="assets/js/crypto.js"></script>
    <script src="assets/js/i18n.js"></script>
    <script src="assets/js/app.js?v=2"></script>
    <script src="assets/js/notifications.js"></script>
</body>

</html>
