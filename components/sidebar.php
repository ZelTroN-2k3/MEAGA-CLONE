        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-brand">
                <div class="user-avatar-small sidebar-avatar" id="sidebar-avatar" style="display: none;">U</div>
                <div class="mega-logo">M</div> <span class="brand-text" data-i18n="sidebar_brand">Disque</span>
                <i class="fa-solid fa-angles-right collapse-icon" id="btn-collapse"
                    style="cursor:pointer; margin-left:auto; transform: rotate(180deg);"></i>
            </div>

            <nav class="sidebar-nav">
                <a href="#" class="nav-item active" id="nav-drive">
                    <i class="fa-solid fa-cloud"></i> <span data-i18n="sidebar_nav_drive">Disque Cloud</span>
                </a>

                <div class="nav-divider"></div>

                <a href="#" class="nav-item" id="nav-media">
                    <i class="fa-regular fa-image"></i> <span data-i18n="sidebar_nav_media">Médias</span>
                </a>
                <a href="#" class="nav-item" id="nav-shared">
                    <span class="fa-stack"
                        style="font-size: 0.6em; vertical-align: middle; width: 2em; height: 2em; line-height: 2em;">
                        <i class="fa-solid fa-folder fa-stack-2x"></i>
                        <i class="fa-solid fa-user-group fa-stack-1x fa-inverse"
                            style="font-size: 0.9em; transform: translateY(2px); color: #111;"></i>
                    </span> <span data-i18n="sidebar_nav_shared">Éléments partagés</span>
                </a>
                <a href="#" class="nav-item" id="nav-devices">
                    <i class="fa-solid fa-laptop"></i> <span data-i18n="sidebar_nav_devices">Centre des appareils</span>
                </a>
                <a href="#" class="nav-item" id="nav-object">
                    <i class="fa-solid fa-database"></i> <span data-i18n="sidebar_nav_object">Stockage objet</span>
                </a>

                <div class="nav-divider"></div>

                <a href="#" class="nav-item" id="nav-recent">
                    <i class="fa-regular fa-clock"></i> <span data-i18n="sidebar_nav_recent">Récents</span>
                </a>
                <a href="#" class="nav-item" id="nav-favorites">
                    <i class="fa-regular fa-heart"></i> <span data-i18n="sidebar_nav_favorites">Favoris</span>
                </a>
                <a href="#" class="nav-item" id="nav-trash">
                    <i class="fa-regular fa-trash-can"></i> <span data-i18n="sidebar_nav_trash">Corbeille</span>
                </a>
            </nav>

            <div class="sidebar-footer">
                <div class="storage-info">
                    <div class="storage-text">
                        <span style="color: #33cc33; font-weight: bold;" id="plan-badge-sidebar" data-i18n="plan_free">FREE</span>
                        <span id="storage-used-text">0 Go sur 50 Go utilisés</span>
                    </div>
                    <div class="storage-bar-container">
                        <div id="storage-bar-fill" class="storage-bar-fill"></div>
                    </div>
                </div>
                <button class="btn-upgrade" id="btn-upgrade-sidebar">
                    <span class="btn-text" data-i18n="sidebar_btn_upgrade">Surclasser le compte</span>
                    <i class="fa-solid fa-crown btn-icon" style="display:none;"></i>
                </button>
            </div>
        </aside>
