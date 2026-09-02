            <!-- Topbar (Search + Profile) -->
            <header class="topbar-mega">
                <div class="search-container">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" placeholder="Recherche Disque Cloud" data-i18n-placeholder="topbar_search_placeholder">
                    <i class="fa-solid fa-xmark clear-search"></i>
                </div>
                <div class="topbar-right">
                    <i class="fa-solid fa-grip view-icon"></i>
                    <i class="fa-solid fa-user-group"></i>

                    <!-- Notifications -->
                    <div class="notification-bell-container" id="btn-notifications">
                        <i class="fa-regular fa-bell"></i>
                        <div class="notification-badge" id="notif-badge">0</div>

                        <div class="notifications-dropdown" id="notif-dropdown">
                            <div class="notifications-header">
                                <div class="notif-title-container" id="notif-filter-toggle">
                                    <span id="notif-current-filter" data-i18n="topbar_notif_all">Toutes les notifications</span>
                                    <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem; margin-left: 5px;"></i>
                                </div>
                                <i class="fa-solid fa-gear" id="notif-settings-btn" title="Paramètres des notifications" style="cursor: pointer; color: var(--text-secondary); transition: color 0.2s;"></i>
                                
                                <!-- Filter Dropdown Menu (Hidden by default) -->
                                <div class="notif-filter-menu" id="notif-filter-menu" style="display: none;">
                                    <div class="notif-filter-item active" data-filter="all" data-i18n="topbar_notif_all">Toutes les notifications</div>
                                    <div class="notif-filter-item" data-filter="cloud" data-i18n="topbar_notif_cloud">Disque Cloud</div>
                                    <div class="notif-filter-item" data-filter="chat" data-i18n="topbar_notif_chat">Chat et réunions</div>
                                    <div class="notif-filter-item" data-filter="contacts" data-i18n="topbar_notif_contacts">Contacts</div>
                                    <div class="notif-filter-item" data-filter="account" data-i18n="topbar_notif_account">Compte</div>
                                </div>
                            </div>
                            
                            <div class="notifications-list" id="notif-list">
                                <!-- JS injected -->
                            </div>
                            
                            <div class="notifications-empty" id="notif-empty" style="display: none; padding: 40px 20px; text-align: center;">
                            <div class="notif-empty-icon">
                                <i class="fa-solid fa-inbox" style="font-size: 3.5rem; color: #a1a1aa; margin-bottom: 20px;"></i>
                            </div>
                            <h4 style="margin: 0 0 10px 0; color: white; font-size: 1.1rem;" data-i18n="notif_empty_title">Rien de neuf</h4>
                                <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;" data-i18n="notif_empty_desc">Vous n'avez pas de nouvelles notifications pour le moment</p>
                            </div>
                            
                            <div style="padding: 10px 15px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; display: none;" id="notif-mark-all-container">
                                <div class="notifications-mark-read" id="notif-mark-all" data-i18n="topbar_notif_mark_read">Tout marquer comme lu</div>
                            </div>
                        </div>
                    </div>

                    <div class="user-avatar-small" id="user-menu-btn">U</div>
                </div>
            </header>
