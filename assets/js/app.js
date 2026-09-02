// assets/js/app.js

let currentFolderId = null;
let currentView = 'drive';
let breadcrumbPath = [{ id: null, name: i18n.t('breadcrumb_cloud_drive', 'Disque Cloud') }];
let showHiddenFiles = false;

// Sort & View State
let currentSortBy = 'name'; // name, size, date
let currentSortOrder = 'asc'; // asc, desc
let currentViewMode = localStorage.getItem('mega_view_mode') || 'list'; // list, compact, grid

// Utilities
function formatSize(bytes) {
    bytes = parseInt(bytes, 10);
    if (isNaN(bytes) || bytes <= 0) return '0 o';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(filename) {
    if (!filename || !filename.includes('.')) return '<i class="fa-solid fa-file icon-file"></i>';
    const ext = filename.split('.').pop().toLowerCase();
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
        return '<i class="fa-regular fa-file-image icon-file" style="color: #4ade80;"></i>'; // Light green
    }
    // Videos
    else if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) {
        return '<i class="fa-regular fa-file-video icon-file" style="color: #f87171;"></i>'; // Light red
    }
    // Audio
    else if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
        return '<i class="fa-regular fa-file-audio icon-file" style="color: #c084fc;"></i>'; // Light purple
    }
    // Documents
    else if (['pdf'].includes(ext)) {
        return '<i class="fa-regular fa-file-pdf icon-file" style="color: #ef4444;"></i>'; // Red
    }
    else if (['doc', 'docx'].includes(ext)) {
        return '<i class="fa-regular fa-file-word icon-file" style="color: #60a5fa;"></i>'; // Blue
    }
    else if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return '<i class="fa-regular fa-file-excel icon-file" style="color: #4ade80;"></i>'; // Green
    }
    else if (['ppt', 'pptx'].includes(ext)) {
        return '<i class="fa-regular fa-file-powerpoint icon-file" style="color: #fb923c;"></i>'; // Orange
    }
    // Archives
    else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return '<i class="fa-regular fa-file-zipper icon-file" style="color: #a8a29e;"></i>'; // Warm gray
    }
    // Code / Text
    else if (['txt', 'md', 'rtf'].includes(ext)) {
        return '<i class="fa-regular fa-file-lines icon-file" style="color: #9ca3af;"></i>'; // Cool gray
    }
    else if (['html', 'css', 'js', 'php', 'json', 'xml'].includes(ext)) {
        return '<i class="fa-regular fa-file-code icon-file" style="color: #22d3ee;"></i>'; // Cyan
    }
    
    // Default
    return '<i class="fa-solid fa-file icon-file"></i>';
}

function getFileThumbnailOrIcon(file) {
    if (!file.name || !file.name.includes('.')) return getFileIcon(file.name);
    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    
    // Si c'est une image non chiffrée, on peut l'afficher directement
    if (isImage && (!file.encrypted_key || file.encrypted_key === 'null' || file.encrypted_key === 'undefined' || file.encrypted_key === '')) {
        const fallbackIcon = getFileIcon(file.name).replace(/"/g, '&quot;');
        return `<img src="api/files.php?action=download&id=${file.id}" class="file-thumbnail" onerror="this.outerHTML='${fallbackIcon}'">`;
    } else if (isImage && file.has_thumbnail == 1) {
        // Thumbnail chiffrée
        const fallbackIcon = getFileIcon(file.name).replace(/"/g, '&quot;');
        return `<div class="lazy-thumbnail file-thumbnail" data-id="${file.id}" data-key="${file.encrypted_key}" data-fallback="${fallbackIcon}"></div>`;
    }
    
    return getFileIcon(file.name);
}

// Intersection Observer for Lazy Encrypted Thumbnails
const thumbnailObserver = new IntersectionObserver(async (entries, observer) => {
    const masterKeyHex = sessionStorage.getItem('master_key');
    if (!masterKeyHex) return;
    
    for (const entry of entries) {
        if (entry.isIntersecting) {
            const el = entry.target;
            observer.unobserve(el);
            el.classList.add('loading');
            
            try {
                const id = el.dataset.id;
                const encKey = el.dataset.key;
                const keys = await decryptKeyData(encKey, masterKeyHex);
                
                const response = await fetch(`api/files.php?action=thumbnail&id=${id}`);
                if (!response.ok) throw new Error('Thumbnail not found');
                
                const blob = await response.blob();
                const buffer = await blob.arrayBuffer();
                
                // The first 12 bytes are the IV, the rest is the ciphertext
                if (buffer.byteLength < 12) throw new Error('Invalid thumbnail format');
                
                const iv = new Uint8Array(buffer, 0, 12);
                const ciphertextBlob = new Blob([buffer.slice(12)]);
                
                const decryptedBlob = await decryptFile(ciphertextBlob, keys.fileKeyBytes, iv);
                const url = URL.createObjectURL(decryptedBlob);
                
                el.outerHTML = `<img src="${url}" class="file-thumbnail">`;
            } catch (e) {
                console.error('Thumbnail decryption failed', e);
                el.outerHTML = el.dataset.fallback;
            }
        }
    }
}, { root: null, rootMargin: '100px', threshold: 0.1 });

function getReadableType(filename) {
    if (!filename || !filename.includes('.')) return i18n.t('type_file', 'Fichier');
    const ext = filename.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return i18n.t('type_image', 'Image') + ' ' + ext.toUpperCase();
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return i18n.t('type_video', 'Vidéo');
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return i18n.t('type_audio', 'Audio');
    if (['pdf'].includes(ext)) return i18n.t('type_pdf', 'Document PDF');
    if (['doc', 'docx'].includes(ext)) return i18n.t('type_word', 'Document Word');
    if (['xls', 'xlsx', 'csv'].includes(ext)) return i18n.t('type_excel', 'Tableur Excel');
    if (['ppt', 'pptx'].includes(ext)) return i18n.t('type_presentation', 'Présentation');
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return i18n.t('type_archive', 'Archive compressée');
    if (['txt', 'md', 'rtf'].includes(ext)) return i18n.t('type_text', 'Fichier texte');
    if (['html', 'css', 'js', 'php', 'json', 'xml'].includes(ext)) return i18n.t('type_code', 'Code source');
    return i18n.t('type_file', 'Fichier') + ' ' + ext.toUpperCase();
}


function showNotification(message, type = 'info') {
    const notif = document.getElementById('notification');
    const msg = document.getElementById('notif-message');
    msg.textContent = message;
    
    if (type === 'error') notif.style.borderLeftColor = '#ff3333';
    else if (type === 'success') notif.style.borderLeftColor = '#33cc33';
    else notif.style.borderLeftColor = 'var(--accent)';

    notif.classList.add('show');
    setTimeout(() => { notif.classList.remove('show'); }, 3000);
}

function showConfirmModal(title, text) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirm');
        if (!modal) {
            resolve(confirm(title + "\n" + text));
            return;
        }
        
        const titleEl = document.getElementById('confirm-modal-title');
        const textEl = document.getElementById('confirm-modal-desc');
        const btnCancel = document.getElementById('btn-confirm-cancel');
        const btnSubmit = document.getElementById('btn-confirm-submit');
        
        if (title) titleEl.textContent = title;
        if (text) textEl.textContent = text;
        
        modal.classList.add('active');
        
        const cleanup = () => {
            modal.classList.remove('active');
            btnCancel.removeEventListener('click', onCancel);
            btnSubmit.removeEventListener('click', onSubmit);
        };
        
        const onCancel = () => { cleanup(); resolve(false); };
        const onSubmit = () => { cleanup(); resolve(true); };
        
        btnCancel.addEventListener('click', onCancel);
        btnSubmit.addEventListener('click', onSubmit);
    });
}

// Authentication
async function initAuth() {
    try {
        const res = await fetch('api/auth.php?action=check');
        const data = await res.json();
        if (data.status === 'success') {
            const username = data.user.username || i18n.t('default_user', 'Utilisateur');
            const userAvatarBtn = document.getElementById('user-menu-btn');
            const dropdownAvatar = document.getElementById('dropdown-avatar');
            const dropdownAvatarText = document.getElementById('dropdown-avatar-text');
            
            const setAvatar = (element, avatarUrl, initial) => {
                if (!element) return;
                if (avatarUrl) {
                    element.style.backgroundImage = `url(${avatarUrl}?t=${new Date().getTime()})`;
                    element.style.backgroundSize = 'cover';
                    element.style.backgroundPosition = 'center';
                    element.style.backgroundColor = 'transparent';
                    if (element.id === 'user-menu-btn' || element.id === 'sidebar-avatar') element.textContent = '';
                    if (element.id === 'dropdown-avatar' && dropdownAvatarText) dropdownAvatarText.style.display = 'none';
                } else {
                    if (element.id === 'user-menu-btn' || element.id === 'sidebar-avatar') element.textContent = initial;
                    if (element.id === 'dropdown-avatar' && dropdownAvatarText) dropdownAvatarText.textContent = initial;
                    element.style.backgroundImage = 'none';
                    element.style.backgroundColor = '';
                }
            };

            const sidebarAvatar = document.getElementById('sidebar-avatar');
            setAvatar(userAvatarBtn, data.user.avatar, username.charAt(0).toUpperCase());
            setAvatar(dropdownAvatar, data.user.avatar, username.charAt(0).toUpperCase());
            if (sidebarAvatar) setAvatar(sidebarAvatar, data.user.avatar, username.charAt(0).toUpperCase());

            if (userAvatarBtn) userAvatarBtn.title = username;
            
            const displayName = (data.user.first_name || data.user.last_name) ? `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim() : username;
            
            const dropdownUsername = document.getElementById('dropdown-username');
            if (dropdownUsername) dropdownUsername.textContent = displayName;
            
            const dropdownEmail = document.getElementById('dropdown-email');
            if (dropdownEmail) dropdownEmail.textContent = data.user.email || '';
            
            // Admin Panel
            if (data.user.is_admin == 1) {
                const adminPanelSection = document.getElementById('admin-panel-section');
                if (adminPanelSection) adminPanelSection.style.display = 'block';
            }
            
            // Plan Type UI
            window.userPlanType = data.user.plan_type || 'free';
            if (data.user.plan_type && data.user.plan_type !== 'free') {
                const planName = data.user.plan_type === 'pro1' ? 'PRO I' : 'PRO II';
                const labels = document.querySelectorAll('.storage-text-row span:first-child, .storage-info .storage-text span:first-child');
                labels.forEach(l => {
                    l.removeAttribute('data-i18n');
                    l.textContent = planName;
                    l.style.color = 'var(--accent)';
                    l.style.fontWeight = 'bold';
                });
                
                // Hide promo boxes for PRO users
                const promoBox = document.querySelector('.share-promo-box');
                const badgesPro = document.querySelectorAll('.badge-pro, .badge-pro-ctx');
                if (promoBox) promoBox.style.display = 'none';
                badgesPro.forEach(b => b.style.display = 'none');

                // Show hidden files toggle in dropdown
                const toggleHiddenMenu = document.getElementById('menu-toggle-hidden');
                if (toggleHiddenMenu) toggleHiddenMenu.classList.remove('hidden');
            }
            
            loadItems();
            updateStorageUI();
        } else {
            window.location.href = 'index.html';
        }
    } catch (e) {
        console.error('Error checking auth', e);
        window.location.href = 'index.html';
    }
}

function sortDataArray(arr) {
    return arr.sort((a, b) => {
        let valA, valB;
        if (currentSortBy === 'name') {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        } else if (currentSortBy === 'size') {
            valA = parseInt(a.size || 0);
            valB = parseInt(b.size || 0);
        } else if (currentSortBy === 'date') {
            valA = new Date(a.created_at || 0).getTime();
            valB = new Date(b.created_at || 0).getTime();
        }
        
        if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
        return 0;
    });
}

// Load Files and Folders
async function loadItems() {
    try {
        let url = `api/folders.php?action=list&view=${currentView}${currentFolderId !== null ? '&parent_id=' + currentFolderId : ''}`;
        if (showHiddenFiles) url += '&show_hidden=1';
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.status === 'success') {
            const sortedFolders = sortDataArray(data.folders || []);
            const sortedFiles = sortDataArray(data.files || []);
            renderItems(sortedFolders, sortedFiles);
            updateBreadcrumbs();
            applyViewMode();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification(i18n.t('error_network', 'Erreur réseau'), 'error');
    }
}

function renderItems(folders, files) {
    const tbody = document.getElementById('item-list');
    tbody.innerHTML = '';
    
    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
    };
    
    // Load column preferences
    const cols = JSON.parse(localStorage.getItem('mega_cols')) || { tag: true, date: true, mod: true, type: true, size: true, version: true, duration: true, location: true };
    const classTag = cols.tag ? '' : 'hidden-col';
    const classDate = cols.date ? '' : 'hidden-col';
    const classMod = cols.mod ? '' : 'hidden-col';
    const classType = cols.type ? '' : 'hidden-col';
    const classSize = cols.size ? '' : 'hidden-col';
    const classVersion = cols.version ? '' : 'hidden-col';
    const classDuration = cols.duration ? '' : 'hidden-col';
    const classLocation = cols.location ? '' : 'hidden-col';

    if (folders.length === 0 && files.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 40px; color: var(--text-secondary);">${i18n.t('folder_empty', 'Ce dossier est vide.')}</td></tr>`;
        return;
    }

    // Render Folders
    folders.forEach(folder => {
        const tr = document.createElement('tr');
        tr.className = 'item-row';
        tr.dataset.id = folder.id;
        tr.dataset.name = folder.name;
        tr.dataset.type = 'folder';
        tr.dataset.isHidden = folder.is_hidden;
        
        tr.innerHTML = `
            <td class="col-checkbox"><input type="checkbox" class="row-checkbox"></td>
            <td class="col-name folder-name-clickable" style="cursor: pointer;">
                <i class="fa-solid fa-folder icon-folder"></i> 
                <span class="item-name-text">
                    <span class="folder-text" style="text-decoration: underline; text-underline-offset: 3px;">${folder.name}</span>
                    ${folder.is_hidden == 1 ? '<i class="fa-solid fa-eye-slash" style="margin-left: 8px; color: #ff9900; font-size: 0.8rem;" title="Caché"></i>' : ''}
                </span>
            </td>
            <td class="col-fav" style="text-align: center;"><i class="fa-solid fa-heart" style="color: ${folder.is_favorite == 1 ? '#d92b2f' : 'var(--text-secondary)'};"></i></td>
            <td class="col-tag ${classTag}">${folder.color_tag ? `<span class="color-tag tag-${folder.color_tag}"></span>${folder.color_tag}` : ''}</td>
            <td class="col-date ${classDate}">${formatDate(folder.created_at)}</td>
            <td class="col-mod ${classMod}">${formatDate(folder.updated_at || folder.created_at)}</td>
            <td class="col-type ${classType}">${i18n.t('type_folder', 'Dossier')}</td>
            <td class="col-size ${classSize}">-</td>
            <td class="col-version ${classVersion}"></td>
            <td class="col-duration ${classDuration}"></td>
            <td class="col-location ${classLocation}"><a href="#" style="color: #3b82f6; text-decoration: underline;">${i18n.t('cloud_drive', 'Disque Cloud')}</a></td>
            <td class="col-actions"><i class="fa-solid fa-ellipsis row-action-btn"></i></td>
        `;
        
        // Click on name to open folder
        const nameCell = tr.querySelector('.folder-name-clickable');
        nameCell.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent row selection
            navigateToFolder(folder.id, folder.name);
        });
        
        // Double click to open folder
        tr.addEventListener('dblclick', () => navigateToFolder(folder.id, folder.name));
        tr.addEventListener('contextmenu', (e) => showContextMenu(e, folder.id, folder.name, 'folder', folder.is_hidden));
        
        tbody.appendChild(tr);
    });

    // Render Files
    files.forEach(file => {
        const tr = document.createElement('tr');
        tr.className = 'item-row';
        tr.dataset.id = file.id;
        tr.dataset.name = file.name;
        tr.dataset.type = 'file';
        tr.dataset.encrypted_key = file.encrypted_key;
        tr.dataset.isHidden = file.is_hidden;
        
        tr.innerHTML = `
            <td class="col-checkbox"><input type="checkbox" class="row-checkbox"></td>
            <td class="col-name">
                ${getFileThumbnailOrIcon(file)}
                <span class="item-name-text">
                    ${file.name}
                    ${file.is_hidden == 1 ? '<i class="fa-solid fa-eye-slash" style="margin-left: 8px; color: #ff9900; font-size: 0.8rem;" title="Caché"></i>' : ''}
                </span>
            </td>
            <td class="col-fav" style="text-align: center;"><i class="fa-solid fa-heart" style="color: ${file.is_favorite == 1 ? '#d92b2f' : 'var(--text-secondary)'};"></i></td>
            <td class="col-tag ${classTag}">${file.color_tag ? `<span class="color-tag tag-${file.color_tag}"></span>${file.color_tag}` : ''}</td>
            <td class="col-date ${classDate}">${formatDate(file.created_at)}</td>
            <td class="col-mod ${classMod}">${formatDate(file.updated_at || file.created_at)}</td>
            <td class="col-type ${classType}">${getReadableType(file.name)}</td>
            <td class="col-size ${classSize}">${formatSize(file.size)}</td>
            <td class="col-version ${classVersion}"></td>
            <td class="col-duration ${classDuration}"></td>
            <td class="col-location ${classLocation}"><a href="#" style="color: #3b82f6; text-decoration: underline;">${i18n.t('cloud_drive', 'Disque Cloud')}</a></td>
            <td class="col-actions"><i class="fa-solid fa-ellipsis row-action-btn"></i></td>
        `;
        
        tr.addEventListener('dblclick', async () => {
            const ext = file.name.split('.').pop().toLowerCase();
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
            const isVideo = ['mp4', 'webm', 'mov'].includes(ext);
            const isMedia = isImage || isVideo;
            
            if (!file.encrypted_key || file.encrypted_key === 'null' || file.encrypted_key === 'undefined' || file.encrypted_key === '') {
                if (isMedia) {
                    showMediaViewer(file.name, `api/files.php?action=download&id=${file.id}`, isVideo);
                } else {
                    window.open(`api/files.php?action=download&id=${file.id}`, '_blank');
                }
                return;
            }
            
            if (isMedia) {
                document.getElementById('modal-media-viewer').classList.add('active');
                document.getElementById('media-viewer-title').textContent = file.name;
                document.getElementById('media-viewer-content').innerHTML = '';
                document.getElementById('media-viewer-loader').classList.remove('hidden');
                document.getElementById('media-viewer-download').href = '#';
            } else {
                showNotification(i18n.t('decrypting', 'Déchiffrement en cours...'), 'info');
            }
            try {
                const masterKeyHex = sessionStorage.getItem('master_key');
                const keys = await decryptKeyData(file.encrypted_key, masterKeyHex);
                const response = await fetch(`api/files.php?action=download&id=${file.id}`);
                const encryptedBlob = await response.blob();
                const decryptedBlob = await decryptFile(encryptedBlob, keys.fileKeyBytes, keys.ivBytes);
                
                const url = window.URL.createObjectURL(decryptedBlob);
                
                if (isMedia) {
                    document.getElementById('media-viewer-loader').classList.add('hidden');
                    showMediaViewer(file.name, url, isVideo, true);
                } else {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    showNotification(i18n.t('file_downloaded', 'Fichier téléchargé'), 'success');
                }
            } catch (e) {
                console.error(e);
                if (isMedia) {
                    document.getElementById('modal-media-viewer').classList.remove('active');
                }
                showNotification(i18n.t('error_decrypt', 'Erreur de déchiffrement'), 'error');
            }
        });
        
        tr.addEventListener('contextmenu', (e) => showContextMenu(e, file.id, file.name, 'file', file.is_hidden));
        tbody.appendChild(tr);
    });
    
    // Attach selection logic
    attachSelectionLogic();
    
    // Observe thumbnails
    document.querySelectorAll('.lazy-thumbnail').forEach(el => thumbnailObserver.observe(el));
}

function navigateToFolder(id, name) {
    currentFolderId = id;
    breadcrumbPath.push({ id, name });
    loadItems();
}

function navigateToBreadcrumb(index) {
    if (index === breadcrumbPath.length - 1) return; // already here
    breadcrumbPath = breadcrumbPath.slice(0, index + 1);
    currentFolderId = breadcrumbPath[breadcrumbPath.length - 1].id;
    loadItems();
}

function updateBreadcrumbs() {
    const breadcrumbs = document.getElementById('breadcrumbs');
    breadcrumbs.innerHTML = '';
    
    breadcrumbPath.forEach((item, index) => {
        const span = document.createElement('span');
        if (index === 0) {
            span.innerHTML = '<i class="fa-solid fa-house"></i> ' + item.name;
        } else {
            span.textContent = item.name;
        }
        
        if (index === breadcrumbPath.length - 1) {
            span.classList.add('current');
        } else {
            span.addEventListener('click', () => navigateToBreadcrumb(index));
        }

        breadcrumbs.appendChild(span);
        
        if (index < breadcrumbPath.length - 1) {
            const separator = document.createElement('span');
            separator.textContent = ' > ';
            separator.style.margin = '0 5px';
            separator.style.pointerEvents = 'none';
            breadcrumbs.appendChild(separator);
        }
    });
}

// New Folder Modal
const newFolderModal = document.getElementById('modal-new-folder');
document.getElementById('btn-new-folder').addEventListener('click', () => {
    newFolderModal.classList.add('active');
    document.getElementById('new-folder-name').focus();
});

document.getElementById('close-folder-modal').addEventListener('click', () => newFolderModal.classList.remove('active'));
document.getElementById('cancel-folder').addEventListener('click', () => newFolderModal.classList.remove('active'));

document.getElementById('submit-folder').addEventListener('click', async () => {
    const name = document.getElementById('new-folder-name').value;
    if (!name) return;

    try {
        const res = await fetch('api/folders.php?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, parent_id: currentFolderId })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            showNotification(i18n.t('folder_created', 'Dossier créé'), 'success');
            newFolderModal.classList.remove('active');
            document.getElementById('new-folder-name').value = '';
            loadItems();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (e) {
        showNotification(i18n.t('error_creation', 'Erreur de création'), 'error');
    }
});

// Upload
const fileInput = document.getElementById('file-input');
document.getElementById('btn-upload').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;
    uploadFiles(files);
});

// Drag and drop global
const dragOverlay = document.getElementById('drag-overlay');

window.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
        dragOverlay.style.opacity = '1';
    }
});

window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (e.relatedTarget === null || e.relatedTarget === document.documentElement) {
        dragOverlay.style.opacity = '0';
    }
});

window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragOverlay.style.opacity = '0';
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files);
    }
});

// Transfer Manager UI
const tmModal = document.getElementById('transfer-manager');
const tmFilename = document.getElementById('tm-filename');
const tmPercentage = document.getElementById('tm-percentage');
const tmSpeed = document.getElementById('tm-speed');
const tmFill = document.getElementById('tm-fill');

document.getElementById('tm-close')?.addEventListener('click', () => tmModal.classList.remove('active'));
document.getElementById('tm-minimize')?.addEventListener('click', () => tmModal.classList.remove('active'));

// Function to generate a small thumbnail from an image file
function createThumbnailBlob(file, maxSize = 256) {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
            return resolve(null);
        }
        
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            let width = img.width;
            let height = img.height;
            
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                } else {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                resolve(blob || null);
            }, 'image/jpeg', 0.8);
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        
        img.src = url;
    });
}

async function uploadFiles(files) {
    const masterKeyHex = sessionStorage.getItem('master_key');
    if (!masterKeyHex) {
        showNotification(i18n.t('error_session', 'Erreur de session. Veuillez vous reconnecter.'), "error");
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            tmFilename.textContent = file.name;
            tmPercentage.textContent = '0%';
            tmSpeed.textContent = i18n.t('encrypting', 'Chiffrement...');
            tmFill.style.width = '0%';
            tmModal.classList.add('active');
            
            // Client-Side Encryption
            const { fileKey, iv } = generateFileKeyAndIV();
            const encryptedBlob = await encryptFile(file, fileKey, iv);
            const encryptedKeyData = await encryptKeyData(fileKey, iv, masterKeyHex);

            const formData = new FormData();
            formData.append('file', new File([encryptedBlob], file.name, { type: file.type }));
            formData.append('encrypted_key', encryptedKeyData);
            
            // Thumbnail generation and encryption
            const thumbBlob = await createThumbnailBlob(file);
            if (thumbBlob) {
                const thumbIv = crypto.getRandomValues(new Uint8Array(12));
                const encryptedThumb = await encryptFile(thumbBlob, fileKey, thumbIv);
                // Prepend the 12-byte IV to the encrypted thumbnail
                const finalThumbBlob = new Blob([thumbIv, encryptedThumb], { type: 'application/octet-stream' });
                formData.append('thumbnail', finalThumbBlob, 'thumb.enc');
            }
            
            if (currentFolderId !== null) {
                formData.append('folder_id', currentFolderId);
            }

            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', 'api/files.php?action=upload', true);
                
                let startTime = Date.now();
                let lastLoaded = 0;
                
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        tmPercentage.textContent = `${percentComplete}%`;
                        tmFill.style.width = `${percentComplete}%`;
                        
                        const now = Date.now();
                        const timeDiff = (now - startTime) / 1000;
                        if (timeDiff > 0.5) {
                            const speed = (e.loaded - lastLoaded) / timeDiff;
                            tmSpeed.textContent = formatSize(speed) + '/s';
                            startTime = now;
                            lastLoaded = e.loaded;
                        }
                    }
                };
                
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            if (data.status === 'success') {
                                showNotification(i18n.t('file_uploaded', 'Fichier chiffré et uploadé').replace('%s', file.name) || `Fichier ${file.name} chiffré et uploadé`, 'success');
                                resolve(data);
                            } else {
                                reject(new Error(data.message));
                            }
                        } catch (err) {
                            reject(new Error("Invalid response"));
                        }
                    } else {
                        reject(new Error(`HTTP Error ${xhr.status}`));
                    }
                };
                
                xhr.onerror = () => reject(new Error("Network Error"));
                xhr.send(formData);
            });
            
            setTimeout(() => {
                tmModal.classList.remove('active');
            }, 2000);
            
        } catch (e) {
            console.error(e);
            showNotification(i18n.t('error_local', 'Erreur locale pour') + ` ${file.name}: ${e.message}`, 'error');
            tmModal.classList.remove('active');
        }
    }
    loadItems();
    fileInput.value = '';
}

// User Menu
const userMenuBtn = document.getElementById('user-menu-btn');
const userMenuModal = document.getElementById('modal-user-menu');

userMenuBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    userMenuModal.classList.toggle('hidden');
    
    if (!userMenuModal.classList.contains('hidden')) {
        // Fetch stats
        updateStorageUI();
    }
});

async function updateStorageUI() {
    try {
        const res = await fetch('api/user.php?action=stats');
        const data = await res.json();
        if (data.status === 'success') {
            const used = data.stats.used_storage;
            const total = data.stats.total_storage;
            const percentage = Math.min((used / total) * 100, 100);
            
            const storageTextDropdown = document.getElementById('storage-text');
            const storageFillDropdown = document.getElementById('storage-fill');
            const storageUsedTextSidebar = document.getElementById('storage-used-text');
            const storageBarFillSidebar = document.getElementById('storage-bar-fill');
            
            const textContent = `${formatSize(used)} ${i18n.t('storage_out_of', 'sur')} ${formatSize(total)} ${i18n.t('storage_used', 'utilisés')}`;
            
            if (storageTextDropdown) storageTextDropdown.textContent = textContent;
            if (storageFillDropdown) storageFillDropdown.style.width = `${percentage}%`;
            
            if (storageUsedTextSidebar) storageUsedTextSidebar.textContent = textContent;
            if (storageBarFillSidebar) storageBarFillSidebar.style.width = `${percentage}%`;
        }
    } catch(e) {
        console.error("Erreur stats storage", e);
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!userMenuBtn.contains(e.target) && !userMenuModal.contains(e.target)) {
        userMenuModal.classList.add('hidden');
    }
});

// Avatar Upload Logic
const dropdownAvatarBtn = document.getElementById('dropdown-avatar');
const avatarUploadInput = document.getElementById('avatar-upload');

if (dropdownAvatarBtn && avatarUploadInput) {
    dropdownAvatarBtn.addEventListener('click', () => {
        avatarUploadInput.click();
    });

    avatarUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        showNotification(i18n.t('uploading_image', "Envoi de l'image..."), 'info');
        try {
            const res = await fetch('api/upload_avatar.php', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                showNotification(data.message, 'success');
                initAuth(); // Reload avatar
            } else {
                showNotification(data.message, 'error');
            }
        } catch(err) {
            showNotification(i18n.t('error_upload_network', "Erreur réseau lors de l'upload."), 'error');
        }
        
        // Reset input
        avatarUploadInput.value = '';
    });
}

// Settings Modal
const settingsModal = document.getElementById('modal-settings');
document.getElementById('btn-show-settings').addEventListener('click', () => {
    userMenuModal.classList.add('hidden');
    settingsModal.classList.add('active');
});
document.getElementById('close-settings-modal').addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

document.getElementById('form-password-change').addEventListener('submit', async (e) => {
    e.preventDefault();
    const old_password = document.getElementById('old-pass').value;
    const new_password = document.getElementById('new-pass').value;
    
    try {
        const res = await fetch('api/user.php?action=change_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_password, new_password })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            showNotification(i18n.t('password_updated', 'Mot de passe mis à jour.'), 'success');
            document.getElementById('form-password-change').reset();
            
            // Re-derive master key so we don't break encryption
            const newMasterKey = await deriveMasterKey(new_password);
            sessionStorage.setItem('master_key', newMasterKey);
        } else {
            showNotification(data.message, 'error');
        }
    } catch (e) {
        showNotification('Erreur réseau', 'error');
    }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    sessionStorage.removeItem('master_key');
    await fetch('api/auth.php?action=logout');
    window.location.href = 'index.html';
});

// Context Menu Logic
const contextMenu = document.getElementById('context-menu');
let ctxTarget = null;

function showContextMenu(e, id, name, type, isHidden = 0) {
    e.preventDefault();
    ctxTarget = { id, name, type, isHidden };
    
    // Position menu
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.classList.remove('hidden');
    
    // Toggle options based on type and view
    const btnDownload = document.getElementById('ctx-download');
    const btnShare = document.getElementById('ctx-share');
    const btnRename = document.getElementById('ctx-rename');
    const btnFav = document.getElementById('ctx-favorite');
    const btnDel = document.getElementById('ctx-delete');
    const btnRestore = document.getElementById('ctx-restore');
    
    if (currentView === 'trash') {
        btnDownload.style.display = 'none';
        btnShare.style.display = 'none';
        btnRename.style.display = 'none';
        btnFav.style.display = 'none';
        btnDel.style.display = 'none';
        if(btnRestore) btnRestore.classList.remove('hidden');
    } else {
        btnDownload.style.display = type === 'folder' ? 'none' : 'flex';
        btnShare.style.display = 'flex';
        btnRename.style.display = 'flex';
        btnFav.style.display = 'flex';
        btnDel.style.display = 'flex';
        if(btnRestore) btnRestore.classList.add('hidden');
    }

    const btnHide = document.getElementById('ctx-hide');
    if (btnHide) {
        const icon = btnHide.querySelector('i');
        const text = btnHide.querySelector('span[data-i18n="ctx_hide"]');
        if (isHidden == 1) {
            if(icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
            if(text) text.textContent = i18n.t('ctx_unhide', 'Afficher');
        } else {
            if(icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
            if(text) text.textContent = i18n.t('ctx_hide', 'Cacher');
        }
    }
}

document.addEventListener('click', (e) => {
    // If we click a tag color dot inside the context menu
    if (e.target.closest('.tag-color-btn')) {
        const color = e.target.closest('.tag-color-btn').dataset.color;
        if (ctxTarget) {
            const targets = getTargetsToProcess();
            if (targets.length === 0) return;
            fetch(`api/actions.php?action=set_color_tag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targets, color_tag: color })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    showNotification(data.message, 'success');
                    loadItems(); // reload to show new tag
                } else {
                    showNotification(data.message, 'error');
                }
            });
        }
    }
    
    contextMenu.classList.add('hidden');
});

document.getElementById('ctx-download').addEventListener('click', async () => {
    if (ctxTarget && ctxTarget.type === 'file') {
        const card = document.querySelector(`.item-row[data-type="${ctxTarget.type}"][data-id="${ctxTarget.id}"]`);
        const encryptedKey = card ? card.dataset.encrypted_key : null;
        
        if (!encryptedKey || encryptedKey === 'null' || encryptedKey === 'undefined' || encryptedKey === '') {
            window.open(`api/files.php?action=download&id=${ctxTarget.id}`, '_blank');
            return;
        }
        
        showNotification('Déchiffrement en cours...', 'info');
        try {
            const masterKeyHex = sessionStorage.getItem('master_key');
            const keys = await decryptKeyData(encryptedKey, masterKeyHex);
            const response = await fetch(`api/files.php?action=download&id=${ctxTarget.id}`);
            const encryptedBlob = await response.blob();
            const decryptedBlob = await decryptFile(encryptedBlob, keys.fileKeyBytes, keys.ivBytes);
            
            const url = window.URL.createObjectURL(decryptedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = ctxTarget.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showNotification('Fichier téléchargé', 'success');
        } catch (e) {
            console.error(e);
            showNotification('Erreur de déchiffrement', 'error');
        }
    }
});

document.getElementById('ctx-rename').addEventListener('click', async () => {
    if (!ctxTarget) return;
    const newName = prompt(i18n.t('prompt_rename', 'Renommer "%s" en :').replace('%s', ctxTarget.name), ctxTarget.name);
    if (!newName || newName === ctxTarget.name) return;
    
    const endpoint = ctxTarget.type === 'file' ? 'api/files.php?action=rename' : 'api/folders.php?action=rename';
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: ctxTarget.id, new_name: newName })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showNotification(i18n.t('rename_success', 'Renommé avec succès'), 'success');
            loadItems();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (e) {
        showNotification(i18n.t('error_network', 'Erreur réseau'), 'error');
    }
});


document.getElementById('ctx-share').addEventListener('click', async () => {
    if (!ctxTarget) return;
    
    try {
        const masterKeyHex = sessionStorage.getItem('master_key');
        if (!masterKeyHex) throw new Error("No master key");
        
        let shareUrl = '';
        
        if (ctxTarget.type === 'file') {
            const card = document.querySelector(`.item-row[data-type="file"][data-id="${ctxTarget.id}"]`);
            const encryptedKey = card ? card.dataset.encrypted_key : null;
            
            if (!encryptedKey || encryptedKey === 'null' || encryptedKey === 'undefined' || encryptedKey === '') {
                showNotification(i18n.t('error_file_unencrypted', "Ce fichier a été envoyé avant la mise à jour (non chiffré)."), "error");
                return;
            }
            
            const keys = await decryptKeyData(encryptedKey, masterKeyHex);
            const hashPayload = bufferToHex(keys.fileKeyBytes) + ':' + bufferToHex(keys.ivBytes);
            
            const res = await fetch('api/files.php?action=share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: ctxTarget.id })
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                const _basePath1 = window.location.pathname.replace(/\/[^\/]*$/, '');
                shareUrl = `${window.location.origin}${_basePath1}/share.html?token=${data.token}#${hashPayload}`;
            } else {
                throw new Error(data.message);
            }
            
        } else if (ctxTarget.type === 'folder') {
            showNotification(i18n.t('share_prep_folder', "Préparation du partage de dossier..."), "info");
            
            // 1. Get all files in this folder recursively
            const resFiles = await fetch(`api/folders.php?action=get_all_files&folder_id=${ctxTarget.id}`, { method: 'POST' });
            const dataFiles = await resFiles.json();
            
            if (dataFiles.status !== 'success') throw new Error(i18n.t('error_fetch_files', "Erreur récupération fichiers"));
            
            // 2. Generate Folder Share Key (32 bytes)
            const folderShareKey = crypto.getRandomValues(new Uint8Array(32));
            const folderShareKeyHex = bufferToHex(folderShareKey);
            
            // 3. Rewrap keys
            const rewrappedKeys = {};
            for (let f of dataFiles.files) {
                if (!f.encrypted_key || f.encrypted_key === 'null') continue;
                
                // Decrypt with master key
                const fileKeys = await decryptKeyData(f.encrypted_key, masterKeyHex);
                
                // Encrypt with folder share key
                const fileKeyDataBytes = new Uint8Array(fileKeys.fileKeyBytes.length + fileKeys.ivBytes.length);
                fileKeyDataBytes.set(fileKeys.fileKeyBytes, 0);
                fileKeyDataBytes.set(fileKeys.ivBytes, fileKeys.fileKeyBytes.length);
                
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const keyObj = await crypto.subtle.importKey(
                    'raw', folderShareKey, { name: 'AES-GCM' }, false, ['encrypt']
                );
                
                const encryptedData = await crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv: iv }, keyObj, fileKeyDataBytes
                );
                
                rewrappedKeys[f.id] = bufferToHex(iv) + ':' + bufferToHex(new Uint8Array(encryptedData));
            }
            
            // 4. Send to server
            const resShare = await fetch('api/folders.php?action=share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: ctxTarget.id, keys: rewrappedKeys })
            });
            const dataShare = await resShare.json();
            
            if (dataShare.status === 'success') {
                const _basePath2 = window.location.pathname.replace(/\/[^\/]*$/, '');
                shareUrl = `${window.location.origin}${_basePath2}/share.html?token=${dataShare.token}#${folderShareKeyHex}`;
            } else {
                throw new Error(dataShare.message);
            }
        }
        
        // Show Mega Modal
        if (shareUrl) {
            document.getElementById('share-modal-filename').textContent = ctxTarget.name;
            document.getElementById('share-link-input').value = shareUrl;
            
            // Reset Views
            document.getElementById('share-main-view').style.display = 'block';
            document.getElementById('share-settings-view').style.display = 'none';
            
            // Init advanced settings
            document.getElementById('enable-separate-key').checked = false;
            document.getElementById('main-view-key-container').style.display = 'none';
            document.getElementById('btn-copy-key-main').style.display = 'none';
            document.getElementById('main-share-key-input').value = shareUrl.split('#')[1] || '';
            
            document.getElementById('enable-password').checked = false;
            document.getElementById('password-container').style.display = 'none';
            document.getElementById('share-password-input').value = '';
            
            document.getElementById('enable-expiry').checked = false;
            document.getElementById('expiry-container').style.display = 'none';
            document.getElementById('share-expiry-input').value = '';
            
            // Check Pro status for advanced settings
            if (window.userPlanType === 'free') {
                document.getElementById('expiry-toggle-wrapper').style.display = 'none';
                document.getElementById('expiry-pro-badge').style.display = 'block';
                
                document.getElementById('password-toggle-wrapper').style.display = 'none';
                document.getElementById('password-pro-badge').style.display = 'block';
            } else {
                document.getElementById('expiry-toggle-wrapper').style.display = 'inline-block';
                document.getElementById('expiry-pro-badge').style.display = 'none';
                
                document.getElementById('password-toggle-wrapper').style.display = 'inline-block';
                document.getElementById('password-pro-badge').style.display = 'none';
            }
            
            document.getElementById('modal-share').classList.add('active');
            
            document.getElementById('btn-copy-link').onclick = async () => {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    showNotification(i18n.t('link_copied', "Lien copié !"), "success");
                } catch(e) {}
            };
            document.getElementById('btn-copy-link-icon').onclick = document.getElementById('btn-copy-link').onclick;
        }
        
    } catch (e) {
        console.error(e);
        showNotification(e.message || i18n.t('error_share_gen', "Erreur lors de la génération du partage"), "error");
    }
});

document.getElementById('close-share-modal').addEventListener('click', () => {
    document.getElementById('modal-share').classList.remove('active');
});
document.getElementById('close-settings-modal').addEventListener('click', () => {
    document.getElementById('modal-share').classList.remove('active');
});

// View Transitions
document.getElementById('btn-open-share-settings').addEventListener('click', () => {
    document.getElementById('share-main-view').style.display = 'none';
    document.getElementById('share-settings-view').style.display = 'block';
});
const closeSettingsView = () => {
    document.getElementById('share-settings-view').style.display = 'none';
    document.getElementById('share-main-view').style.display = 'block';
};
document.getElementById('btn-back-share-settings').addEventListener('click', closeSettingsView);
document.getElementById('btn-cancel-settings').addEventListener('click', closeSettingsView);

// Advanced Share Settings Listeners
document.getElementById('enable-separate-key').addEventListener('change', (e) => {
    const isSeparate = e.target.checked;
    
    document.getElementById('main-view-key-container').style.display = isSeparate ? 'block' : 'none';
    document.getElementById('btn-copy-key-main').style.display = isSeparate ? 'inline-block' : 'none';
    
    const linkInput = document.getElementById('share-link-input');
    const currentUrl = linkInput.value;
    
    if (isSeparate) {
        if (currentUrl.includes('#')) {
            linkInput.value = currentUrl.split('#')[0];
        }
    } else {
        const key = document.getElementById('main-share-key-input').value;
        if (!currentUrl.includes('#') && key) {
            linkInput.value = currentUrl + '#' + key;
        }
    }
});

document.getElementById('btn-copy-key-icon').addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(document.getElementById('main-share-key-input').value);
        showNotification(i18n.t('key_copied', "Clé copiée !"), "success");
    } catch(e) {}
});

document.getElementById('btn-copy-key-main').addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(document.getElementById('main-share-key-input').value);
        showNotification(i18n.t('key_copied', "Clé copiée !"), "success");
    } catch(e) {}
});

document.getElementById('enable-password').addEventListener('change', (e) => {
    document.getElementById('password-container').style.display = e.target.checked ? 'block' : 'none';
    document.getElementById('btn-save-share-settings').style.display = 'inline-block';
});
document.getElementById('enable-expiry').addEventListener('change', (e) => {
    document.getElementById('expiry-container').style.display = e.target.checked ? 'block' : 'none';
    document.getElementById('btn-save-share-settings').style.display = 'inline-block';
});
document.getElementById('share-password-input').addEventListener('input', () => {
    document.getElementById('btn-save-share-settings').style.display = 'inline-block';
});
document.getElementById('share-expiry-input').addEventListener('input', () => {
    document.getElementById('btn-save-share-settings').style.display = 'inline-block';
});

document.getElementById('btn-save-share-settings').addEventListener('click', async () => {
    if (!ctxTarget) return;
    const btn = document.getElementById('btn-save-share-settings');
    const pwd = document.getElementById('enable-password').checked ? document.getElementById('share-password-input').value : '';
    const exp = document.getElementById('enable-expiry').checked ? document.getElementById('share-expiry-input').value : '';
    
    const endpoint = ctxTarget.type === 'file' ? 'api/files.php?action=share' : 'api/folders.php?action=share';
    btn.textContent = i18n.t('saving', 'Enregistrement...');
    
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: ctxTarget.id, update_settings: true, password: pwd, expires_at: exp })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showNotification(i18n.t('settings_applied', 'Paramètres appliqués avec succès'), 'success');
            closeSettingsView();
        } else {
            showNotification(data.message || i18n.t('error_saving', 'Erreur lors de la sauvegarde'), 'error');
        }
    } catch(e) {
        showNotification('Erreur réseau', 'error');
    } finally {
        btn.textContent = i18n.t('apply', 'Appliquer');
    }
});

// Selection Logic
let selectedItems = new Set(); // store DOM elements

function attachSelectionLogic() {
    const rows = document.querySelectorAll('.item-row');
    const checkAll = document.getElementById('check-all');
    const selectionBar = document.getElementById('selection-bar');
    const selectionCount = document.getElementById('selection-count');
    
    selectedItems.clear();
    
    const selDownload = document.getElementById('sel-download');
    const selShare = document.getElementById('sel-share');
    const selMove = document.getElementById('sel-move');
    const selRename = document.getElementById('sel-rename');
    const selDelete = document.getElementById('sel-delete');
    const selMore = document.getElementById('sel-more');
    const selFavorite = document.getElementById('sel-favorite'); // If it exists

    const updateSelectionUI = () => {
        if (selectedItems.size > 0) {
            selectionBar.classList.remove('hidden');
            selectionCount.textContent = `${selectedItems.size} ${i18n.t('selected_items', 'sélectionné(s)')}`;
            checkAll.checked = selectedItems.size === rows.length && rows.length > 0;
            
            if (selectedItems.size > 1) {
                if(selShare) selShare.style.display = 'inline-block';
                if(selRename) selRename.style.display = 'none';
            } else {
                if(selShare) selShare.style.display = 'inline-block';
                if(selRename) selRename.style.display = 'inline-block';
            }
        } else {
            selectionBar.classList.add('hidden');
            checkAll.checked = false;
        }
    };

    rows.forEach(row => {
        const checkbox = row.querySelector('.row-checkbox');
        
        // Clicking checkbox toggles selection
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                row.classList.add('selected');
                selectedItems.add(row);
            } else {
                row.classList.remove('selected');
                selectedItems.delete(row);
            }
            updateSelectionUI();
        });

        // Clicking row (but not action buttons) toggles selection
        row.addEventListener('click', (e) => {
            if (e.target.tagName.toLowerCase() === 'input' || e.target.classList.contains('row-action-btn')) return;
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });
        
        // Three dots button opens context menu
        const btn = row.querySelector('.row-action-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showContextMenu(e, row.dataset.id, row.dataset.name, row.dataset.type, row.dataset.isHidden);
            });
        }
    });

    checkAll.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        rows.forEach(row => {
            const cb = row.querySelector('.row-checkbox');
            cb.checked = isChecked;
            if (isChecked) {
                row.classList.add('selected');
                selectedItems.add(row);
            } else {
                row.classList.remove('selected');
                selectedItems.delete(row);
            }
        });
        updateSelectionUI();
    });

    document.getElementById('close-selection').addEventListener('click', () => {
        checkAll.checked = false;
        checkAll.dispatchEvent(new Event('change'));
    });
    
    // Wire selection action buttons for Single Actions
    const triggerSingleAction = (ctxId) => {
        if (selectedItems.size !== 1) return;
        const row = Array.from(selectedItems)[0];
        ctxTarget = { id: row.dataset.id, name: row.dataset.name, type: row.dataset.type };
        document.getElementById(ctxId).click();
    };
    
    if (selShare) {
        const newSelShare = selShare.cloneNode(true);
        selShare.parentNode.replaceChild(newSelShare, selShare);
        newSelShare.addEventListener('click', () => {
            if (selectedItems.size === 1) {
                triggerSingleAction('ctx-share');
            } else if (selectedItems.size > 1) {
                createAndShareZip();
            }
        });
    }
    
    if (selRename) {
        const newSelRename = selRename.cloneNode(true);
        selRename.parentNode.replaceChild(newSelRename, selRename);
        newSelRename.addEventListener('click', () => triggerSingleAction('ctx-rename'));
    }
    
    if (selMove) {
        const newSelMove = selMove.cloneNode(true);
        selMove.parentNode.replaceChild(newSelMove, selMove);
        newSelMove.addEventListener('click', () => {
            if (selectedItems.size === 1) {
                triggerSingleAction('ctx-move');
            } else if (selectedItems.size > 1) {
                openMoveModal(null); // Multi-select move
            }
        });
    }

    if (selMore) {
        const newSelMore = selMore.cloneNode(true);
        selMore.parentNode.replaceChild(newSelMore, selMore);
        newSelMore.addEventListener('click', (e) => {
            if (selectedItems.size === 0) return;
            const row = Array.from(selectedItems)[0];
            e.stopPropagation();
            showContextMenu(e, row.dataset.id, row.dataset.name, row.dataset.type, row.dataset.isHidden);
        });
    }

    // Bulk Delete
    if (selDelete) {
        const newSelDelete = selDelete.cloneNode(true);
        selDelete.parentNode.replaceChild(newSelDelete, selDelete);
        newSelDelete.addEventListener('click', async () => {
            if (selectedItems.size === 0) return;
            if (currentView === 'trash') {
                showNotification(i18n.t('use_empty_trash', "Utilisez le bouton 'Vider la corbeille' pour supprimer définitivement."), "info");
                return;
            }
            const confirmed = await showConfirmModal(i18n.t('confirm_delete_title', 'Confirmation de suppression'), `${i18n.t('confirm_delete_multi', 'Voulez-vous vraiment supprimer ces')} ${selectedItems.size} ${i18n.t('items_question', 'élément(s) ?')}`);
            if (!confirmed) return;
            
            showNotification(i18n.t('deleting', 'Suppression en cours...'), 'info');
            let successCount = 0;
            for (let row of selectedItems) {
                try {
                    const res = await fetch(`api/actions.php?action=trash`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: row.dataset.id, type: row.dataset.type })
                    });
                    const data = await res.json();
                    if (data.status === 'success') successCount++;
                } catch(e) {}
            }
            showNotification(`${successCount} ${i18n.t('items_deleted', 'élément(s) supprimé(s).')}`, 'success');
            loadItems();
        });
    }

    // Bulk Download
    if (selDownload) {
        const newSelDownload = selDownload.cloneNode(true);
        selDownload.parentNode.replaceChild(newSelDownload, selDownload);
        newSelDownload.addEventListener('click', async () => {
            if (selectedItems.size === 0) return;
            // Iterate and trigger individual download logic
            for (let row of selectedItems) {
                ctxTarget = { id: row.dataset.id, name: row.dataset.name, type: row.dataset.type };
                document.getElementById('ctx-download').click();
                // Adding a slight delay to prevent browser from blocking multiple popups
                await new Promise(r => setTimeout(r, 1000)); 
            }
        });
    }
}

// Sidebar Navigation
const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        if (item.style.cursor === 'not-allowed') {
            e.preventDefault();
            return;
        }
        
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        const id = item.id;
        if (id === 'nav-drive') currentView = 'drive';
        else if (id === 'nav-media') currentView = 'media';
        else if (id === 'nav-shared') currentView = 'shared';
        else if (id === 'nav-recent') currentView = 'recent';
        else if (id === 'nav-favorites') currentView = 'favorites';
        else if (id === 'nav-trash') currentView = 'trash';
        
        // Update Title
        document.getElementById('breadcrumbs').textContent = item.textContent.trim();
        breadcrumbPath = [{ id: null, name: item.textContent.trim() }];
        currentFolderId = null;
        
        // Toggle action buttons
        if (currentView === 'trash') {
            document.getElementById('action-buttons-default').classList.add('hidden');
            document.getElementById('action-buttons-trash').classList.remove('hidden');
        } else {
            document.getElementById('action-buttons-default').classList.remove('hidden');
            document.getElementById('action-buttons-trash').classList.add('hidden');
        }
        
        loadItems();
    });
});

// New Actions: Favorite, Restore, Trash, Empty Trash
document.getElementById('ctx-favorite')?.addEventListener('click', async () => {
    if (!ctxTarget) return;
    const targets = getTargetsToProcess();
    if (targets.length === 0) return;
    try {
        const res = await fetch(`api/actions.php?action=toggle_favorite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targets })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showNotification(data.message, 'success');
            loadItems();
        } else showNotification(data.message, 'error');
    } catch(e) { showNotification(i18n.t('error', 'Erreur'), 'error'); }
});

document.getElementById('ctx-restore')?.addEventListener('click', async () => {
    if (!ctxTarget) return;
    const targets = getTargetsToProcess();
    if (targets.length === 0) return;
    try {
        const res = await fetch(`api/actions.php?action=restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targets })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showNotification(data.message, 'success');
            loadItems();
        } else showNotification(data.message, 'error');
    } catch(e) { showNotification(i18n.t('error', 'Erreur'), 'error'); }
});

document.getElementById('btn-empty-trash')?.addEventListener('click', async () => {
    const confirmed = await showConfirmModal(i18n.t('confirm_empty_trash_title', 'Vider la corbeille'), i18n.t('confirm_empty_trash', 'Voulez-vous vraiment vider la corbeille ? Cette action est irréversible.'));
    if (!confirmed) return;
    try {
        const res = await fetch(`api/actions.php?action=empty_trash`, { method: 'POST' });
        const data = await res.json();
        if (data.status === 'success') {
            showNotification(data.message, 'success');
            loadItems();
        } else showNotification(data.message, 'error');
    } catch(e) { showNotification(i18n.t('error', 'Erreur'), 'error'); }
});

// Override Delete Context Menu to use Soft Delete (Trash)
document.getElementById('ctx-delete')?.addEventListener('click', async () => {
    if (!ctxTarget) return;
    
    // Only allow trashing from non-trash views (in trash, use empty trash)
    if (currentView === 'trash') return; 
    
    const targets = getTargetsToProcess();
    if (targets.length === 0) return;
    
    const confirmMsg = targets.length > 1 ? i18n.t('confirm_delete_multi', 'Voulez-vous vraiment supprimer ces éléments ?') : i18n.t('confirm_delete_single', 'Voulez-vous vraiment supprimer cet élément ?');
    const confirmed = await showConfirmModal(i18n.t('confirm_delete_title', 'Confirmation de suppression'), confirmMsg);
    if (!confirmed) return;
    
    try {
        const res = await fetch(`api/actions.php?action=trash`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targets })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showNotification(data.message, 'success');
            loadItems();
        } else showNotification(data.message, 'error');
    } catch(e) { showNotification(i18n.t('error', 'Erreur'), 'error'); }
});

// Hide context menu item (Pro Upsell or Toggle Hidden)
document.getElementById('ctx-hide')?.addEventListener('click', async () => {
    document.getElementById('context-menu').classList.add('hidden');
    if (window.userPlanType === 'free') {
        document.getElementById('modal-hide-upsell').classList.add('active');
    } else {
        if (!ctxTarget) return;
        const targets = getTargetsToProcess();
        if (targets.length === 0) return;
        try {
            const res = await fetch(`api/actions.php?action=toggle_hidden`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targets })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showNotification(data.message, 'success');
                loadItems();
            } else showNotification(data.message, 'error');
        } catch(e) { showNotification(i18n.t('error', 'Erreur'), 'error'); }
    }
});

// Sidebar Collapse Toggle
document.getElementById('btn-collapse')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('collapsed');
});

// Init
document.addEventListener('DOMContentLoaded', initAuth);

// Client-Side ZIP Generation for sharing multiple items
async function createAndShareZip() {
    if (typeof JSZip === 'undefined') {
        showNotification(i18n.t('error_zip_lib', "La librairie de compression n'est pas chargée."), "error");
        return;
    }

    const modal = document.getElementById('modal-zip-progress');
    const fill = document.getElementById('zip-progress-fill');
    const status = document.getElementById('zip-status-text');
    
    modal.classList.add('active');
    fill.style.width = '0%';
    
    try {
        const zip = new JSZip();
        const masterKeyHex = sessionStorage.getItem('master_key');
        
        if (!masterKeyHex) throw new Error(i18n.t('error_no_key', "Clé de chiffrement introuvable"));

        let processed = 0;
        const total = selectedItems.size;
        
        status.textContent = i18n.t('zip_decrypting', "Déchiffrement et compression en cours...");
        
        for (let row of selectedItems) {
            if (row.dataset.type !== 'file') {
                processed++;
                continue;
            }
            
            const fileId = row.dataset.id;
            const fileName = row.dataset.name;
            const encryptedKey = row.dataset.encrypted_key;
            
            if (encryptedKey && encryptedKey !== 'null' && encryptedKey !== 'undefined') {
                try {
                    const keys = await decryptKeyData(encryptedKey, masterKeyHex);
                    const response = await fetch(`api/files.php?action=download&id=${fileId}`);
                    if (!response.ok) {
                        console.warn(`Fichier ignoré (introuvable): ${fileName}`);
                        processed++;
                        continue;
                    }
                    const encryptedBlob = await response.blob();
                    const decryptedBlob = await decryptFile(encryptedBlob, keys.fileKeyBytes, keys.ivBytes);
                    zip.file(fileName, decryptedBlob);
                } catch(err) {
                    console.warn(`Fichier ignoré (erreur de déchiffrement): ${fileName}`, err);
                }
            } else {
                try {
                    const response = await fetch(`api/files.php?action=download&id=${fileId}`);
                    if (response.ok) {
                        const blob = await response.blob();
                        zip.file(fileName, blob);
                    }
                } catch(err) {
                    console.warn(`Fichier ignoré (erreur réseau): ${fileName}`, err);
                }
            }
            
            processed++;
            fill.style.width = `${(processed / total) * 50}%`; 
        }

        status.textContent = i18n.t('zip_generating', "Génération de l'archive...");
        const zipBlob = await zip.generateAsync({type:"blob", compression: "STORE"}); 
        
        status.textContent = i18n.t('zip_encrypting', "Chiffrement de l'archive...");
        const { fileKey, iv } = generateFileKeyAndIV();
        const encryptedZipBlob = await encryptFile(zipBlob, fileKey, iv);
        const encryptedKeyData = await encryptKeyData(fileKey, iv, masterKeyHex);
        
        status.textContent = i18n.t('zip_searching_folder', "Recherche du dossier d'archives...");
        
        let archiveFolderId = null;
        try {
            const fRes = await fetch('api/folders.php?action=list&view=drive');
            const fData = await fRes.json();
            if (fData.status === 'success') {
                const archiveFolder = fData.folders.find(f => f.name === 'Archives Partagées');
                if (archiveFolder) {
                    archiveFolderId = archiveFolder.id;
                } else {
                    const cRes = await fetch('api/folders.php?action=create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: 'Archives Partagées', parent_id: null })
                    });
                    const cData = await cRes.json();
                    if (cData.status === 'success') archiveFolderId = cData.folder.id;
                }
            }
        } catch(e) {
            console.warn(i18n.t('error_check_folder', "Erreur lors de la vérification du dossier"), e);
        }
        
        status.textContent = i18n.t('zip_uploading', "Téléversement de l'archive...");
        
        const formData = new FormData();
        const zipFileName = `Archive_Partage_${Date.now()}.zip`;
        const fileForUpload = new File([encryptedZipBlob], zipFileName, { type: 'application/zip' });
        
        formData.append('file', fileForUpload);
        formData.append('encrypted_key', encryptedKeyData);
        if (archiveFolderId) formData.append('folder_id', archiveFolderId);
        
        const uploadRes = await fetch('api/files.php?action=upload', {
            method: 'POST',
            body: formData
        });
        
        const uploadData = await uploadRes.json();
        if (uploadData.status !== 'success') throw new Error(uploadData.message);
        
        fill.style.width = '100%';
        modal.classList.remove('active');
        
        // Clear selection
        document.getElementById('close-selection').click();
        
        // Share the new zip file
        const hashPayload = bufferToHex(fileKey) + ':' + bufferToHex(iv);
        
        const shareRes = await fetch('api/files.php?action=share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: uploadData.file.id })
        });
        const shareData = await shareRes.json();
        
        if (shareData.status === 'success') {
            const _basePath3 = window.location.pathname.replace(/\/[^\/]*$/, '');
            const shareUrl = `${window.location.origin}${_basePath3}/share.html?token=${shareData.token}#${hashPayload}`;
            
            document.getElementById('share-modal-filename').textContent = zipFileName;
            document.getElementById('share-link-input').value = shareUrl;
            document.getElementById('modal-share').classList.add('active');
            
            document.getElementById('btn-copy-link').onclick = async () => {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    showNotification("Lien copié !", "success");
                } catch(e) {}
            };
            document.getElementById('btn-copy-link-icon').onclick = document.getElementById('btn-copy-link').onclick;
            
            loadItems();
        } else {
            showNotification(shareData.message, 'error');
        }
        
    } catch (e) {
        console.error(e);
        modal.classList.remove('active');
        showNotification(e.message || i18n.t('error_zip_create', "Erreur lors de la création de l'archive ZIP"), "error");
    }
}

// Move functionality
const modalMove = document.getElementById('modal-move');
const moveFolderSelect = document.getElementById('move-folder-select');

async function openMoveModal(target) {
    if (target) {
        ctxTarget = target; // From context menu (single item)
    }
    
    // Fetch all folders
    try {
        const res = await fetch('api/folders.php?action=list_all');
        const data = await res.json();
        
        if (data.status === 'success') {
            moveFolderSelect.innerHTML = `<option value="null">${i18n.t('cloud_drive_root', "Disque Cloud (Racine)")}</option>`;
            
            // Build simple flat representation of tree
            const buildTreeOptions = (folders, parentId = null, level = 0) => {
                const children = folders.filter(f => f.parent_id === parentId);
                children.forEach(child => {
                    const option = document.createElement('option');
                    option.value = child.id;
                    option.innerHTML = '&nbsp;'.repeat(level * 4) + '└ ' + child.name;
                    moveFolderSelect.appendChild(option);
                    buildTreeOptions(folders, child.id, level + 1);
                });
            };
            
            buildTreeOptions(data.folders);
            modalMove.classList.add('active');
        } else {
            showNotification(i18n.t('error_fetch_folders', "Erreur de récupération des dossiers"), "error");
        }
    } catch(e) {
        showNotification(i18n.t('error_network', "Erreur réseau"), "error");
    }
}

document.getElementById('cancel-move').addEventListener('click', () => {
    modalMove.classList.remove('active');
});

document.getElementById('submit-move').addEventListener('click', async () => {
    const targetFolderId = moveFolderSelect.value;
    const itemsToMove = [];
    
    if (selectedItems.size > 1) {
        for (let row of selectedItems) {
            itemsToMove.push({ id: row.dataset.id, type: row.dataset.type });
        }
    } else if (ctxTarget) {
        itemsToMove.push({ id: ctxTarget.id, type: ctxTarget.type });
    }
    
    if (itemsToMove.length === 0) return;
    
    let successCount = 0;
    
    for (let item of itemsToMove) {
        const endpoint = item.type === 'file' ? 'api/files.php?action=move' : 'api/folders.php?action=move';
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, folder_id: targetFolderId, parent_id: targetFolderId })
            });
            const data = await res.json();
            if (data.status === 'success') {
                successCount++;
            } else {
                console.warn(data.message);
            }
        } catch(e) {
            console.error(e);
        }
    }
    
    modalMove.classList.remove('active');
    
    if (successCount > 0) {
        showNotification(`${successCount} ${i18n.t('items_moved', 'élément(s) déplacé(s)')}`, "success");
        if (selectedItems.size > 0) document.getElementById('close-selection').click();
        loadItems();
    } else {
        showNotification(i18n.t('error_no_item_moved', "Aucun élément déplacé. Vérifiez que la destination est valide."), "error");
    }
});

// Bind Move to Context Menu
document.getElementById('ctx-move')?.addEventListener('click', () => {
    if (!ctxTarget) return;
    openMoveModal(ctxTarget);
});

function setupPayPal(planType, containerId, amount) {
    if (typeof paypal !== 'undefined' && document.getElementById(containerId)) {
        document.getElementById(containerId).innerHTML = ''; // Clear if exists
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: amount
                        },
                        description: `${i18n.t('subscription', 'Abonnement')} ${planType.toUpperCase()}`
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(async function(details) {
                    showNotification(i18n.t('payment_approved', 'Paiement approuvé ! Mise à jour de votre compte...'), 'info');
                    
                    try {
                        const res = await fetch('api/upgrade.php', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                orderID: data.orderID,
                                planType: planType
                            })
                        });
                        const result = await res.json();
                        
                        if (result.status === 'success') {
                            showNotification(i18n.t('upgrade_success', 'Compte surclassé avec succès ! Bienvenue en PRO.'), 'success');
                            document.getElementById('modal-upgrade').classList.remove('active');
                            initAuth(); // Reload user stats and badges
                        } else {
                            showNotification(result.message || i18n.t('error_update', 'Erreur lors de la mise à jour.'), 'error');
                        }
                    } catch (err) {
                        showNotification(i18n.t('error_payment_network', 'Erreur réseau lors de la validation du paiement.'), 'error');
                    }
                });
            },
            onError: function(err) {
                showNotification(i18n.t('error_paypal', 'Erreur lors du paiement PayPal.'), 'error');
                console.error(err);
            }
        }).render('#' + containerId);
    }
}

let paypalInitialized = false;

document.getElementById('btn-upgrade-sidebar')?.addEventListener('click', () => {
    document.getElementById('modal-upgrade').classList.add('active');
    if (!paypalInitialized) {
        setupPayPal('pro1', 'paypal-button-container-pro1', '4.99');
        setupPayPal('pro2', 'paypal-button-container-pro2', '9.99');
        paypalInitialized = true;
    }
});
document.getElementById('btn-upgrade-menu')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('modal-upgrade').classList.add('active');
    document.getElementById('modal-user-menu').classList.add('hidden');
    if (!paypalInitialized) {
        setupPayPal('pro1', 'paypal-button-container-pro1', '4.99');
        setupPayPal('pro2', 'paypal-button-container-pro2', '9.99');
        paypalInitialized = true;
    }
});
document.getElementById('close-upgrade-modal')?.addEventListener('click', () => {
    document.getElementById('modal-upgrade').classList.remove('active');
});

// Columns Toggle Events
const btnToggleCols = document.getElementById('btn-toggle-columns');
const dropdownCols = document.getElementById('dropdown-columns');
if (btnToggleCols && dropdownCols) {
    btnToggleCols.addEventListener('click', (e) => {
        // Toggle if click is on the th or icon, not inside the dropdown itself
        if (e.target.closest('#dropdown-columns')) return;
        
        const isHidden = dropdownCols.classList.contains('hidden');
        if (isHidden) {
            dropdownCols.classList.remove('hidden');
            const rect = btnToggleCols.getBoundingClientRect();
            dropdownCols.style.top = (rect.bottom + 5) + 'px';
            dropdownCols.style.left = (rect.right - dropdownCols.offsetWidth) + 'px';
        } else {
            dropdownCols.classList.add('hidden');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!btnToggleCols.contains(e.target)) {
            dropdownCols.classList.add('hidden');
        }
    });
    
    // Checkboxes
    const updateCols = () => {
        const cols = {
            tag: document.getElementById('chk-col-tag').checked,
            date: document.getElementById('chk-col-date').checked,
            mod: document.getElementById('chk-col-mod').checked,
            type: document.getElementById('chk-col-type').checked,
            size: document.getElementById('chk-col-size').checked,
            version: document.getElementById('chk-col-version').checked,
            duration: document.getElementById('chk-col-duration').checked,
            location: document.getElementById('chk-col-location').checked
        };
        localStorage.setItem('mega_cols', JSON.stringify(cols));
        
        // Toggle on TH
        document.querySelector('th.col-tag')?.classList.toggle('hidden-col', !cols.tag);
        document.querySelector('th.col-date')?.classList.toggle('hidden-col', !cols.date);
        document.querySelector('th.col-mod')?.classList.toggle('hidden-col', !cols.mod);
        document.querySelector('th.col-type')?.classList.toggle('hidden-col', !cols.type);
        document.querySelector('th.col-size')?.classList.toggle('hidden-col', !cols.size);
        document.querySelector('th.col-version')?.classList.toggle('hidden-col', !cols.version);
        document.querySelector('th.col-duration')?.classList.toggle('hidden-col', !cols.duration);
        document.querySelector('th.col-location')?.classList.toggle('hidden-col', !cols.location);
        
        // Toggle on TD
        document.querySelectorAll('td.col-tag').forEach(td => td.classList.toggle('hidden-col', !cols.tag));
        document.querySelectorAll('td.col-date').forEach(td => td.classList.toggle('hidden-col', !cols.date));
        document.querySelectorAll('td.col-mod').forEach(td => td.classList.toggle('hidden-col', !cols.mod));
        document.querySelectorAll('td.col-type').forEach(td => td.classList.toggle('hidden-col', !cols.type));
        document.querySelectorAll('td.col-size').forEach(td => td.classList.toggle('hidden-col', !cols.size));
        document.querySelectorAll('td.col-version').forEach(td => td.classList.toggle('hidden-col', !cols.version));
        document.querySelectorAll('td.col-duration').forEach(td => td.classList.toggle('hidden-col', !cols.duration));
        document.querySelectorAll('td.col-location').forEach(td => td.classList.toggle('hidden-col', !cols.location));
    };
    
    ['tag', 'date', 'mod', 'type', 'size', 'version', 'duration', 'location'].forEach(c => {
        document.getElementById(`chk-col-${c}`)?.addEventListener('change', updateCols);
    });
    
    // Init state from localstorage
    const savedCols = JSON.parse(localStorage.getItem('mega_cols')) || { tag: true, date: true, mod: true, type: true, size: true, version: true, duration: true, location: true };
    
    ['tag', 'date', 'mod', 'type', 'size', 'version', 'duration', 'location'].forEach(c => {
        const chk = document.getElementById(`chk-col-${c}`);
        if (chk) chk.checked = !!savedCols[c];
        document.querySelector(`th.col-${c}`)?.classList.toggle('hidden-col', !savedCols[c]);
    });
}

// Media Viewer Logic
let currentMediaUrl = null;
let currentIsBlob = false;

function showMediaViewer(title, url, isVideo, isBlob = false) {
    document.getElementById('modal-media-viewer').classList.add('active');
    document.getElementById('media-viewer-title').textContent = title;
    
    const content = document.getElementById('media-viewer-content');
    content.innerHTML = '';
    
    if (isVideo) {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.autoplay = true;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '85vh';
        video.style.outline = 'none';
        content.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '85vh';
        img.style.objectFit = 'contain';
        content.appendChild(img);
    }
    
    document.getElementById('media-viewer-download').href = url;
    document.getElementById('media-viewer-download').download = title;
    
    currentMediaUrl = url;
    currentIsBlob = isBlob;
};

document.getElementById('close-media-viewer')?.addEventListener('click', () => {
    document.getElementById('modal-media-viewer').classList.remove('active');
    document.getElementById('media-viewer-content').innerHTML = ''; // Stop video
    
    if (currentIsBlob && currentMediaUrl) {
        window.URL.revokeObjectURL(currentMediaUrl);
    }
    currentMediaUrl = null;
    currentIsBlob = false;
});

// Navigation logic for external views
document.addEventListener('DOMContentLoaded', () => {
    const navDrive = document.getElementById('nav-drive');
    const navDevices = document.getElementById('nav-devices');
    const navShared = document.getElementById('nav-shared');
    const navObject = document.getElementById('nav-object');
    
    const fileManager = document.getElementById('file-manager');
    const viewDevices = document.getElementById('view-devices');
    const viewShared = document.getElementById('view-shared');
    const viewObject = document.getElementById('view-object');
    
    // UI elements to hide/show
    const actionBar = document.querySelector('.action-bar-mega');
    const breadcrumbs = document.querySelector('.breadcrumbs-mega');
    const topbarSearch = document.querySelector('.topbar-search');

    function hideAllViews() {
        if(fileManager) fileManager.classList.add('hidden');
        if(viewDevices) viewDevices.classList.add('hidden');
        if(viewShared) viewShared.classList.add('hidden');
        if(viewObject) viewObject.classList.add('hidden');
        
        if(actionBar) actionBar.style.display = 'none';
        if(breadcrumbs) breadcrumbs.style.display = 'none';
        if(topbarSearch) topbarSearch.style.visibility = 'hidden';
    }

    if (navDrive) {
        navDrive.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
            navDrive.classList.add('active');
            
            hideAllViews();
            
            if(fileManager) fileManager.classList.remove('hidden');
            if(actionBar) actionBar.style.display = 'flex';
            if(breadcrumbs) breadcrumbs.style.display = 'block';
            if(topbarSearch) topbarSearch.style.visibility = 'visible';
        });
    }

    if (navDevices && viewDevices) {
        navDevices.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
            navDevices.classList.add('active');
            
            hideAllViews();
            viewDevices.classList.remove('hidden');
        });
    }

    if (navObject && viewObject) {
        navObject.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
            navObject.classList.add('active');
            
            hideAllViews();
            viewObject.classList.remove('hidden');
        });
    }
    
    if (navShared && viewShared) {
        navShared.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
            navShared.classList.add('active');
            
            hideAllViews();
            viewShared.classList.remove('hidden');
        });
        
        // Internal Tabs logic for Shared View
        const sharedTabs = document.querySelectorAll('.shared-tab');
        const sharedPanels = document.querySelectorAll('.shared-content-panel');
        
        sharedTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs & panels
                sharedTabs.forEach(t => t.classList.remove('active'));
                sharedPanels.forEach(p => p.classList.remove('active'));
                
                // Add active to clicked tab
                tab.classList.add('active');
                
                // Show target panel
                const targetId = tab.getAttribute('data-target');
                const targetPanel = document.getElementById(targetId);
                if(targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
        
        // Load links when the shared view is opened
        navShared.addEventListener('click', loadSharedLinks);
    }
});

async function loadSharedLinks() {
    try {
        const response = await fetch('api/shared_links.php');
        const data = await response.json();
        
        if (data.status === 'success') {
            renderSharedLinks(data.links);
        }
    } catch (e) {
        console.error('Failed to load shared links:', e);
    }
}

function renderSharedLinks(links) {
    const tbody = document.querySelector('#shared-links table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (links.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 30px; color: #888;">${i18n.t('no_shared_links', "Vous n'avez créé aucun lien de partage pour l'instant.")}</td></tr>`;
        return;
    }
    
    links.forEach(link => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #1a1a1a';
        tr.style.cursor = 'pointer';
        
        const dateStr = new Date(link.created_at).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute:'2-digit'
        });
        
        const icon = link.item_type === 'folder' 
            ? '<i class="fa-solid fa-folder" style="color: #3b82f6; margin-right: 8px;"></i>' 
            : getFileIcon(link.name); // Reusing getFileIcon from app.js
            
        const sizeStr = link.item_type === 'folder' ? '-' : formatSize(link.size);
        const typeStr = link.item_type === 'folder' ? i18n.t('type_folder', 'Dossier') : (link.type || i18n.t('type_file', 'Fichier'));
        
        const _basePath4 = window.location.pathname.replace(/\/[^\/]*$/, '');
        const linkUrl = window.location.origin + _basePath4 + '/share.html?token=' + link.shared_link_token;
        
        tr.innerHTML = `
            <td style="padding: 10px;"><input type="checkbox"></td>
            <td style="padding: 10px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${icon} ${link.name}</td>
            <td style="padding: 10px; text-align: center;"><i class="fa-regular fa-heart" style="color: #555;"></i></td>
            <td style="padding: 10px;">-</td>
            <td style="padding: 10px; color: #aaa;">${dateStr}</td>
            <td style="padding: 10px; color: #aaa;">-</td>
            <td style="padding: 10px; color: #aaa;">${typeStr}</td>
            <td style="padding: 10px; color: #aaa;">${sizeStr}</td>
            <td style="padding: 10px;"><a href="#" style="color: #3b82f6; text-decoration: underline;">${link.location}</a></td>
            <td style="padding: 10px; text-align: right;" title="${i18n.t('copy_link', 'Copier le lien')}">
                <i class="fa-solid fa-link" style="color: #888;" onclick="event.stopPropagation(); navigator.clipboard.writeText('${linkUrl}'); showNotification(i18n.t('link_copied', 'Lien copié dans le presse-papiers'));"></i>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}


// Toggle hidden files visibility for PRO
document.getElementById('menu-toggle-hidden')?.addEventListener('click', () => {
    showHiddenFiles = !showHiddenFiles;
    const icon = document.querySelector('#menu-toggle-hidden i');
    const text = document.querySelector('#menu-toggle-hidden span');
    
    if (showHiddenFiles) {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        icon.style.color = '#3b82f6';
        text.textContent = i18n.t('menu_toggle_hidden_active', 'Masquer éléments cachés');
    } else {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        icon.style.color = '#aeb4c0';
        text.textContent = i18n.t('menu_toggle_hidden', 'Afficher éléments cachés');
    }
    
    document.getElementById('modal-user-menu').classList.add('hidden');
    loadItems();
});

function getTargetsToProcess() {
    if (!ctxTarget) return [];
    const isCtxInSelection = Array.from(selectedItems).some(row => row.dataset.id == ctxTarget.id && row.dataset.type == ctxTarget.type);
    if (isCtxInSelection && selectedItems.size > 1) {
        return Array.from(selectedItems).map(row => ({ id: row.dataset.id, type: row.dataset.type }));
    }
    return [{ id: ctxTarget.id, type: ctxTarget.type }];
}

// --- View Modes & Sorting ---
function applyViewMode() {
    const fileManager = document.getElementById('file-manager');
    if (!fileManager) return;
    
    fileManager.classList.remove('view-compact', 'view-grid');
    if (currentViewMode === 'compact') {
        fileManager.classList.add('view-compact');
    } else if (currentViewMode === 'grid') {
        fileManager.classList.add('view-grid');
    }
    
    document.querySelectorAll('.view-controls .btn-icon').forEach(btn => btn.classList.remove('active'));
    if (currentViewMode === 'list') document.getElementById('btn-view-list')?.classList.add('active');
    if (currentViewMode === 'compact') document.getElementById('btn-view-compact')?.classList.add('active');
    if (currentViewMode === 'grid') document.getElementById('btn-view-grid')?.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    // View Buttons
    document.getElementById('btn-view-list')?.addEventListener('click', () => {
        currentViewMode = 'list';
        localStorage.setItem('mega_view_mode', 'list');
        applyViewMode();
    });
    document.getElementById('btn-view-compact')?.addEventListener('click', () => {
        currentViewMode = 'compact';
        localStorage.setItem('mega_view_mode', 'compact');
        applyViewMode();
    });
    document.getElementById('btn-view-grid')?.addEventListener('click', () => {
        currentViewMode = 'grid';
        localStorage.setItem('mega_view_mode', 'grid');
        applyViewMode();
    });
    
    // Sort Headers
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const sortField = th.getAttribute('data-sort');
            if (currentSortBy === sortField) {
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortBy = sortField;
                currentSortOrder = 'asc';
            }
            
            // Update icons
            document.querySelectorAll('th[data-sort] .sort-icon').forEach(icon => {
                icon.className = 'fa-solid fa-sort sort-icon';
                icon.style.opacity = '0.3';
            });
            const icon = th.querySelector('.sort-icon');
            if (icon) {
                icon.className = currentSortOrder === 'asc' ? 'fa-solid fa-arrow-up sort-icon' : 'fa-solid fa-arrow-down sort-icon';
                icon.style.opacity = '1';
            }
            
            loadItems();
        });
    });
});
