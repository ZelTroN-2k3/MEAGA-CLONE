async function fetchNotifications() {
    try {
        const res = await fetch('api/notifications.php?action=list');
        const data = await res.json();
        
        if (data.status === 'success') {
            const badge = document.getElementById('notif-badge');
            const list = document.getElementById('notif-list');
            
            if (badge) {
                if (data.unread_count > 0) {
                    badge.style.display = 'block';
                    badge.textContent = data.unread_count;
                } else {
                    badge.style.display = 'none';
                }
            }
            
            if (list) {
                list.innerHTML = '';
                const emptyState = document.getElementById('notif-empty');
                const markAll = document.getElementById('notif-mark-all-container');
                
                if (data.notifications.length === 0) {
                    list.style.display = 'none';
                    if (emptyState) emptyState.style.display = 'block';
                    if (markAll) markAll.style.display = 'none';
                } else {
                    list.style.display = 'block';
                    if (emptyState) emptyState.style.display = 'none';
                    if (markAll) markAll.style.display = data.unread_count > 0 ? 'block' : 'none';
                    
                    data.notifications.forEach(n => {
                        const div = document.createElement('div');
                        div.className = `notification-item ${n.is_read == 0 ? 'unread' : ''}`;
                        div.innerHTML = `
                            <div class="notification-title">${n.title}</div>
                            <div class="notification-message">${n.message}</div>
                            <div class="notification-date">${new Date(n.created_at).toLocaleString()}</div>
                        `;
                        div.onclick = async () => {
                            if (n.is_read == 0) {
                                await fetch('api/notifications.php?action=mark_read', {
                                    method: 'POST',
                                    headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({ id: n.id })
                                });
                                fetchNotifications();
                            }
                        };
                        list.appendChild(div);
                    });
                }
            }
        }
    } catch(e) {
        console.error("Error fetching notifications", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-notifications');
    const dropdown = document.getElementById('notif-dropdown');
    const markAll = document.getElementById('notif-mark-all');
    
    // UI elements for the new filter
    const filterToggle = document.getElementById('notif-filter-toggle');
    const filterMenu = document.getElementById('notif-filter-menu');
    const filterItems = document.querySelectorAll('.notif-filter-item');
    const currentFilterTxt = document.getElementById('notif-current-filter');
    const settingsBtn = document.getElementById('notif-settings-btn');
    
    if (btn && dropdown) {
        btn.addEventListener('click', (e) => {
            // Check if clicking inside filter or settings to not toggle main dropdown
            if (e.target.closest('#notif-filter-toggle') || e.target.closest('#notif-filter-menu') || e.target.closest('#notif-settings-btn')) {
                return;
            }
            e.stopPropagation();
            dropdown.classList.toggle('active');
            if (dropdown.classList.contains('active')) {
                fetchNotifications();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }
    
    // Filter toggling
    if (filterToggle && filterMenu) {
        filterToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            filterMenu.style.display = filterMenu.style.display === 'none' ? 'block' : 'none';
        });
        
        filterItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                filterItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                if (currentFilterTxt) {
                    currentFilterTxt.textContent = item.textContent;
                }
                filterMenu.style.display = 'none';
                // Note: filtering logic not fully implemented backend yet, purely UI
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!filterToggle.contains(e.target) && !filterMenu.contains(e.target)) {
                filterMenu.style.display = 'none';
            }
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = 'account.html#notifications';
            if (window.location.pathname.endsWith('account.html')) {
                // If already on account page, just switch tab
                if (typeof switchTab === 'function') switchTab('notifications');
                dropdown.classList.remove('active');
            }
        });
    }
    
    if (markAll) {
        markAll.addEventListener('click', async (e) => {
            e.stopPropagation();
            await fetch('api/notifications.php?action=mark_read', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({})
            });
            fetchNotifications();
        });
    }
    
    // Initial fetch to show badge if needed
    fetchNotifications();
});
