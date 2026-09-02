// assets/js/admin.js

let allUsers = [];
let chartPlansInstance = null;
let chartStorageInstance = null;

function formatSize(bytes) {
    bytes = parseInt(bytes, 10);
    if (isNaN(bytes) || bytes <= 0) return '0 o';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
    const notif = document.getElementById('notification');
    const msg = document.getElementById('notif-message');
    msg.textContent = message;
    notif.className = 'notification active';
    if (type === 'error') notif.style.background = '#ef4444';
    else if (type === 'success') notif.style.background = '#4ade80';
    else notif.style.background = '#374151';

    setTimeout(() => { notif.classList.remove('active'); }, 3000);
}

// Navigation Tabs
document.querySelectorAll('#admin-nav .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        if (!item.dataset.target) return;
        e.preventDefault();
        
        // Update active nav
        document.querySelectorAll('#admin-nav .nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        // Update active view
        document.querySelectorAll('.admin-view').forEach(v => v.style.display = 'none');
        document.getElementById(item.dataset.target).style.display = 'block';
    });
});

async function loadDashboardData() {
    try {
        const resStats = await fetch('api/admin.php?action=stats');
        const dataStats = await resStats.json();
        
        if (dataStats.status === 'success') {
            document.getElementById('stat-users').textContent = dataStats.users.total_users || '0';
            document.getElementById('stat-files').textContent = dataStats.files.total_files || '0';
            document.getElementById('stat-storage').textContent = formatSize(dataStats.users.total_used);
            
            initCharts(dataStats);
        } else {
            showNotification(dataStats.message, 'error');
            if (dataStats.message.includes('Forbidden') || dataStats.message.includes('Unauthorized')) {
                window.location.href = 'dashboard.php';
            }
        }
    } catch(e) {
        console.error(e);
    }
}

function initCharts(data) {
    // Plans Chart
    const plansCtx = document.getElementById('chart-plans').getContext('2d');
    const labels = [];
    const counts = [];
    
    data.plans.forEach(p => {
        labels.push(p.plan_type.toUpperCase());
        counts.push(p.count);
    });
    
    if (chartPlansInstance) chartPlansInstance.destroy();
    chartPlansInstance = new Chart(plansCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: ['#6b7280', '#4ade80', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });
    
    // Storage Chart
    const storageCtx = document.getElementById('chart-storage').getContext('2d');
    const totalUsed = data.users.total_used || 0;
    const totalQuota = data.users.total_quota || 1;
    const free = totalQuota - totalUsed;
    
    if (chartStorageInstance) chartStorageInstance.destroy();
    chartStorageInstance = new Chart(storageCtx, {
        type: 'doughnut',
        data: {
            labels: [i18n.t('used', 'Utilisé'), i18n.t('free_quota', 'Libre (Quota total alloué)')],
            datasets: [{
                data: [totalUsed, free],
                backgroundColor: ['#60a5fa', '#374151'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });
}

async function loadUsersData() {
    try {
        const resUsers = await fetch('api/admin.php?action=users');
        const dataUsers = await resUsers.json();
        
        if (dataUsers.status === 'success') {
            allUsers = dataUsers.users;
            renderUsers(allUsers);
        }
    } catch(e) { console.error(e); }
}

function renderUsers(users) {
    const tbody = document.getElementById('admin-users-list');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.className = 'item-row';
        
        let planBadge = `<span style="background: #374151; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">${i18n.t('plan_free', 'Gratuit')}</span>`;
        if (user.plan_type === 'pro1') planBadge = '<span style="background: #4ade80; color: #000; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">PRO I</span>';
        if (user.plan_type === 'pro2') planBadge = '<span style="background: var(--accent); color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">PRO II</span>';
        
        if (user.is_admin == 1) {
            planBadge += ' <span style="background: #ef4444; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-left:5px;">ADMIN</span>';
        }
        
        let statusBadge = `<span style="color: #4ade80;"><i class="fa-solid fa-circle-check"></i> ${i18n.t('status_active', 'Actif')}</span>`;
        
        let disabledAttr = user.is_admin == 1 ? 'disabled' : '';
        let disabledStyle = user.is_admin == 1 ? 'opacity: 0.3; cursor: not-allowed;' : '';
        
        let suspendBtn = `<button class="btn btn-suspend-user" data-id="${user.id}" data-name="${user.username}" ${disabledAttr} style="padding: 5px 10px; font-size: 0.8rem; background: #eab308; border:none; margin-left: 5px; ${disabledStyle}" title="${i18n.t('suspend', 'Suspendre')}"><i class="fa-solid fa-ban"></i></button>`;
        
        if (user.status === 'suspended') {
            statusBadge = `<span style="color: #ef4444;"><i class="fa-solid fa-circle-xmark"></i> ${i18n.t('status_suspended', 'Suspendu')}</span>`;
            suspendBtn = `<button class="btn btn-activate-user" data-id="${user.id}" data-name="${user.username}" ${disabledAttr} style="padding: 5px 10px; font-size: 0.8rem; background: #4ade80; border:none; margin-left: 5px; ${disabledStyle}" title="${i18n.t('reactivate', 'Réactiver')}"><i class="fa-solid fa-check"></i></button>`;
        }

        let deleteBtn = `<button class="btn btn-delete-user" data-id="${user.id}" data-name="${user.username}" ${disabledAttr} style="padding: 5px 10px; font-size: 0.8rem; background: #ef4444; border:none; margin-left: 5px; ${disabledStyle}" title="${i18n.t('delete_permanently', 'Supprimer définitivement')}"><i class="fa-solid fa-trash"></i></button>`;

        tr.innerHTML = `
            <td>#${user.id}</td>
            <td style="font-weight: bold;">${user.username}</td>
            <td>${user.email}</td>
            <td>${planBadge}</td>
            <td>${statusBadge}</td>
            <td>${formatSize(user.used_storage)} / ${formatSize(user.total_storage)}</td>
            <td>${new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
            <td style="text-align: right;">
                <button class="btn btn-info btn-user-details" data-id="${user.id}" style="padding: 5px 10px; font-size: 0.8rem; background: #3b82f6; border:none;" title="${i18n.t('details', 'Détails')}"><i class="fa-solid fa-eye"></i></button>
                <button class="btn btn-secondary btn-upgrade-user" data-id="${user.id}" data-name="${user.username}" data-plan="${user.plan_type}" style="padding: 5px 10px; font-size: 0.8rem; margin-left: 5px;" title="${i18n.t('upgrade', 'Surclasser')}"><i class="fa-solid fa-arrow-up"></i></button>
                ${suspendBtn}
                ${deleteBtn}
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attach Events
    document.querySelectorAll('.btn-user-details').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.id;
            const user = allUsers.find(u => u.id == userId);
            if (user) showUserDetails(user);
        });
    });

    document.querySelectorAll('.btn-upgrade-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.getElementById('upgrade-user-id').value = btn.dataset.id;
            document.getElementById('upgrade-username-target').textContent = btn.dataset.name;
            document.getElementById('upgrade-plan-select').value = btn.dataset.plan || 'free';
            document.getElementById('modal-admin-upgrade').classList.add('active');
        });
    });
    
    document.querySelectorAll('.btn-suspend-user').forEach(btn => {
        btn.addEventListener('click', () => userAction('suspend_user', btn.dataset.id, btn.dataset.name, 'suspendre'));
    });
    
    document.querySelectorAll('.btn-activate-user').forEach(btn => {
        btn.addEventListener('click', () => userAction('activate_user', btn.dataset.id, btn.dataset.name, 'réactiver'));
    });
    
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm(`${i18n.t('confirm_delete_user', "Voulez-vous vraiment supprimer définitivement l'utilisateur")} ${btn.dataset.name} ${i18n.t('and_all_data', 'et toutes ses données ?')}`)) {
                userAction('delete_user', btn.dataset.id, btn.dataset.name, 'supprimer');
            }
        });
    });
}

function filterUsers() {
    const q = document.getElementById('admin-search-users').value.toLowerCase();
    const status = document.getElementById('admin-filter-status').value;
    const plan = document.getElementById('admin-filter-plan').value;

    const filtered = allUsers.filter(u => {
        const matchesQ = u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchesStatus = (status === 'all') || (u.status === status) || (status === 'active' && !u.status);
        const matchesPlan = (plan === 'all') || (u.plan_type === plan);
        return matchesQ && matchesStatus && matchesPlan;
    });
    renderUsers(filtered);
}

document.getElementById('admin-search-users').addEventListener('input', filterUsers);
document.getElementById('admin-filter-status').addEventListener('change', filterUsers);
document.getElementById('admin-filter-plan').addEventListener('change', filterUsers);

async function userAction(action, id, name, actionName) {
    try {
        const res = await fetch(`api/admin.php?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await res.json();
        if (result.status === 'success') {
            showNotification(result.message, 'success');
            loadUsersData();
            loadDashboardData();
        } else {
            showNotification(result.message, 'error');
        }
    } catch(err) {
        showNotification(i18n.t('error_network', "Erreur réseau"), "error");
    }
}

async function loadLogsData() {
    try {
        const res = await fetch('api/admin.php?action=logs');
        const data = await res.json();
        
        if (data.status === 'success') {
            const tbody = document.getElementById('admin-logs-list');
            tbody.innerHTML = '';
            
            data.logs.forEach(log => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(log.created_at).toLocaleString('fr-FR')}</td>
                    <td style="font-weight:bold;">${log.username || i18n.t('unknown', 'Inconnu') + ' (#'+log.user_id+')'}</td>
                    <td><span style="background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 4px;">${log.action}</span></td>
                    <td>${log.ip_address}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch(e) { console.error(e); }
}

document.getElementById('btn-clear-logs').addEventListener('click', async () => {
    if (confirm(i18n.t('confirm_clear_logs', 'Voulez-vous vraiment vider tous les logs d\'activité ?'))) {
        try {
            const res = await fetch('api/admin.php?action=clear_logs', { method: 'POST' });
            const result = await res.json();
            if (result.status === 'success') {
                showNotification(result.message, 'success');
                loadLogsData();
            } else {
                showNotification(result.message, 'error');
            }
        } catch(err) {
            showNotification(i18n.t('error_network', 'Erreur réseau'), 'error');
        }
    }
});

async function loadSettingsData() {
    try {
        const res = await fetch('api/admin.php?action=settings');
        const data = await res.json();
        
        if (data.status === 'success') {
            const settings = data.settings;
            document.getElementById('setting-allow-registration').checked = (settings['allow_registration'] == '1');
            document.getElementById('setting-default-quota').value = Math.floor((settings['default_quota'] || 53687091200) / (1024*1024*1024));

            // Footer Settings
            document.getElementById('footer-desc').value = settings['footer_desc'] || 'La plateforme de stockage en ligne la plus sécurisée. Vos données sont chiffrées de bout en bout et vous seul y avez accès.';
            document.getElementById('footer-copyright').value = settings['footer_copyright'] || '&copy; 2026 Mega Clone. Tous droits réservés.';
            document.getElementById('footer-twitter').value = settings['footer_twitter'] || '#';
            document.getElementById('footer-facebook').value = settings['footer_facebook'] || '#';
            document.getElementById('footer-github').value = settings['footer_github'] || '#';
            document.getElementById('footer-instagram').value = settings['footer_instagram'] || '#';

            const legalLinks = JSON.parse(settings['footer_col_legal'] || '[{"text":"Conditions générales","url":"#"},{"text":"Politique de confidentialité","url":"#"},{"text":"Politique de retrait (Takedown)","url":"#"},{"text":"Mentions légales","url":"#"}]');
            const supportLinks = JSON.parse(settings['footer_col_support'] || '[{"text":"Centre d\'aide","url":"#"},{"text":"Nous contacter","url":"#"},{"text":"Signaler un bug","url":"#"},{"text":"Administration","url":"admin.html"}]');

            renderLinkList('footer-legal-container', legalLinks);
            renderLinkList('footer-support-container', supportLinks);
        }
    } catch(e) { console.error(e); }
}

function renderLinkList(containerId, links) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    links.forEach((link, idx) => {
        const row = document.createElement('div');
        row.style = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';
        row.innerHTML = `
            <input type="text" class="input-control link-text" placeholder="Texte" value="${link.text}" style="flex: 1;">
            <input type="text" class="input-control link-url" placeholder="URL" value="${link.url}" style="flex: 1;">
            <button class="btn btn-delete-link" style="background: #ef4444; border:none; padding: 10px;"><i class="fa-solid fa-trash"></i></button>
        `;
        row.querySelector('.btn-delete-link').addEventListener('click', () => row.remove());
        container.appendChild(row);
    });
}

function getLinksFromContainer(containerId) {
    const links = [];
    document.querySelectorAll(`#${containerId} > div`).forEach(row => {
        const text = row.querySelector('.link-text').value;
        const url = row.querySelector('.link-url').value;
        if (text) links.push({text, url});
    });
    return links;
}

document.getElementById('btn-add-legal').addEventListener('click', () => {
    const container = document.getElementById('footer-legal-container');
    renderLinkList('footer-legal-container', [...getLinksFromContainer('footer-legal-container'), {text: '', url: ''}]);
});

document.getElementById('btn-add-support').addEventListener('click', () => {
    const container = document.getElementById('footer-support-container');
    renderLinkList('footer-support-container', [...getLinksFromContainer('footer-support-container'), {text: '', url: ''}]);
});

document.getElementById('btn-save-footer').addEventListener('click', async () => {
    const settings = {
        'footer_desc': document.getElementById('footer-desc').value,
        'footer_copyright': document.getElementById('footer-copyright').value,
        'footer_twitter': document.getElementById('footer-twitter').value,
        'footer_facebook': document.getElementById('footer-facebook').value,
        'footer_github': document.getElementById('footer-github').value,
        'footer_instagram': document.getElementById('footer-instagram').value,
        'footer_col_legal': JSON.stringify(getLinksFromContainer('footer-legal-container')),
        'footer_col_support': JSON.stringify(getLinksFromContainer('footer-support-container'))
    };

    try {
        const res = await fetch('api/admin.php?action=save_settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings })
        });
        const result = await res.json();
        if (result.status === 'success') showNotification(i18n.t('footer_updated', "Footer mis à jour avec succès"), 'success');
        else showNotification(result.message, 'error');
    } catch(err) {
        showNotification(i18n.t('error_network', "Erreur réseau"), "error");
    }
});

document.getElementById('btn-save-settings').addEventListener('click', async () => {
    const allowReg = document.getElementById('setting-allow-registration').checked ? '1' : '0';
    const quotaGB = document.getElementById('setting-default-quota').value;
    const quotaBytes = parseInt(quotaGB) * 1024 * 1024 * 1024;
    
    try {
        const res = await fetch('api/admin.php?action=save_settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: {
                'allow_registration': allowReg,
                'default_quota': quotaBytes.toString()
            }})
        });
        const result = await res.json();
        if (result.status === 'success') {
            showNotification(result.message, 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch(err) {
        showNotification(i18n.t('error_network', "Erreur réseau"), "error");
    }
});

async function loadMaintenanceData() {
    try {
        const res = await fetch('api/admin.php?action=health_stats');
        const data = await res.json();
        if (data.status === 'success') {
            document.getElementById('maint-os').textContent = data.stats.os;
            document.getElementById('maint-software').textContent = data.stats.server_software;
            document.getElementById('maint-mysql').textContent = data.stats.mysql_version;
            document.getElementById('maint-php-version').textContent = data.stats.php_version;
            document.getElementById('maint-mem-limit').textContent = data.stats.memory_limit;
            document.getElementById('maint-upload-max').textContent = data.stats.upload_max + ' / ' + data.stats.post_max;
            document.getElementById('maint-db-size').textContent = data.stats.db_size + ' Mo';
            document.getElementById('maint-disk-free').textContent = formatSize(data.stats.disk_free);
        }
    } catch(e) { console.error(e); }
}

document.getElementById('btn-clean-orphans').addEventListener('click', async () => {
    if (confirm(i18n.t('confirm_clean_orphans', 'Voulez-vous vraiment scanner et supprimer les fichiers orphelins (Cette action est irréversible) ?'))) {
        try {
            const res = await fetch('api/admin.php?action=clean_orphans', { method: 'POST' });
            const result = await res.json();
            if (result.status === 'success') {
                showNotification(result.message, 'success');
                loadMaintenanceData();
            } else {
                showNotification(result.message, 'error');
            }
        } catch(e) {
            showNotification('Erreur réseau', 'error');
        }
    }
});

function initAdmin() {
    loadDashboardData();
    loadUsersData();
    loadLogsData();
    loadSettingsData();
    loadMaintenanceData();
}

document.addEventListener('DOMContentLoaded', initAdmin);

document.getElementById('cancel-upgrade-modal').addEventListener('click', () => {
    document.getElementById('modal-admin-upgrade').classList.remove('active');
});

document.getElementById('submit-upgrade').addEventListener('click', async () => {
    const userId = document.getElementById('upgrade-user-id').value;
    const plan = document.getElementById('upgrade-plan-select').value;
    
    try {
        const res = await fetch('api/admin.php?action=upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, plan: plan })
        });
        const result = await res.json();
        if (result.status === 'success') {
            showNotification(result.message, 'success');
            document.getElementById('modal-admin-upgrade').classList.remove('active');
            loadUsersData();
            loadDashboardData();
        } else {
            showNotification(result.message, 'error');
        }
    } catch(err) {
        showNotification(i18n.t('error_network', "Erreur réseau"), "error");
    }
});

function showUserDetails(user) {
    document.getElementById('btn-details-close').dataset.currentUserId = user.id;
    document.getElementById('details-username').textContent = user.username;
    document.getElementById('details-email').textContent = user.email;
    
    const avatarEl = document.getElementById('details-avatar');
    if (user.avatar) {
        avatarEl.style.backgroundImage = `url(${user.avatar})`;
        avatarEl.textContent = '';
    } else {
        avatarEl.style.backgroundImage = 'none';
        avatarEl.textContent = user.username.charAt(0).toUpperCase();
        avatarEl.style.display = 'flex';
        avatarEl.style.alignItems = 'center';
        avatarEl.style.justifyContent = 'center';
        avatarEl.style.fontSize = '1.5rem';
        avatarEl.style.fontWeight = 'bold';
    }

    let planName = 'Gratuit (50 Go)';
    if (user.plan_type === 'pro1') planName = 'PRO I (2 To)';
    if (user.plan_type === 'pro2') planName = 'PRO II (8 To)';

    const tbody = document.getElementById('details-table');
    tbody.innerHTML = `
        <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); width: 40%;">${i18n.t('col_status', 'Statut')} :</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${user.status === 'suspended' ? '<span style="color:#ef4444">Suspendu</span>' : '<span style="color:#4ade80">Actif</span>'}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${i18n.t('col_current_plan', 'Plan Actuel')} :</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${planName}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${i18n.t('col_storage', 'Stockage')} :</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${formatSize(user.used_storage)} / ${formatSize(user.total_storage)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${i18n.t('col_signup', 'Inscription')} :</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${new Date(user.created_at).toLocaleString('fr-FR')}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${i18n.t('first_name', 'Prénom')} :</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${user.first_name || '-'}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${i18n.t('last_name', 'Nom')} :</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${user.last_name || '-'}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${i18n.t('birth_date', 'Date de naissance')} :</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${user.birth_date ? new Date(user.birth_date).toLocaleDateString('fr-FR') : '-'}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${i18n.t('country', 'Pays')} :</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${user.country || '-'}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${i18n.t('subscription_date', "Date d'abonnement")} :</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${user.subscription_date ? new Date(user.subscription_date).toLocaleString('fr-FR') : '-'}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${i18n.t('billing_info', 'Infos facturation')} :</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">${user.billing_info || '-'}</td></tr>
    `;

    document.getElementById('modal-admin-user-details').classList.add('active');
}

document.getElementById('btn-save-quota').addEventListener('click', async () => {
    const userId = document.getElementById('btn-details-close').dataset.currentUserId;
    const quotaGb = document.getElementById('details-custom-quota').value;
    if (!quotaGb) return;
    
    try {
        const res = await fetch('api/admin.php?action=update_user_quota', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, quota_gb: quotaGb })
        });
        const result = await res.json();
        if (result.status === 'success') {
            showNotification(result.message, 'success');
            loadUsersData();
        } else {
            showNotification(result.message, 'error');
        }
    } catch(err) {
        showNotification(i18n.t('error_network', "Erreur réseau"), "error");
    }
});

document.getElementById('btn-save-password').addEventListener('click', async () => {
    const userId = document.getElementById('btn-details-close').dataset.currentUserId;
    const newPassword = document.getElementById('details-new-password').value;
    if (!newPassword) return;
    
    try {
        const res = await fetch('api/admin.php?action=change_user_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, new_password: newPassword })
        });
        const result = await res.json();
        if (result.status === 'success') {
            showNotification(result.message, 'success');
            document.getElementById('details-new-password').value = '';
        } else {
            showNotification(result.message, 'error');
        }
    } catch(err) {
        showNotification(i18n.t('error_network', "Erreur réseau"), "error");
    }
});

document.getElementById('close-user-details').addEventListener('click', () => {
    document.getElementById('modal-admin-user-details').classList.remove('active');
});

document.getElementById('btn-details-close').addEventListener('click', () => {
    document.getElementById('modal-admin-user-details').classList.remove('active');
});
