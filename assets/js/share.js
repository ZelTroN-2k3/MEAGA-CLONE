// assets/js/share.js

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

function formatSize(bytes) {
    bytes = parseInt(bytes, 10);
    if (isNaN(bytes) || bytes <= 0) return '0 o';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const hash = window.location.hash.substring(1); // Remove #
    
    const loader = document.getElementById('loader');
    const statusText = document.getElementById('status-text');
    const fileInfo = document.getElementById('file-info');
    
    if (!token) {
        loader.style.display = 'none';
        statusText.textContent = i18n.t('share_invalid_token', "Lien de partage invalide (token manquant).");
        return;
    }
    
    if (!hash) {
        loader.style.display = 'none';
        statusText.style.display = 'none';
        document.getElementById('decryption-key-form').classList.remove('hidden');
        
        document.getElementById('btn-unlock-key').addEventListener('click', () => {
            const key = document.getElementById('unlock-key').value.trim();
            if (key) {
                window.location.hash = key;
                window.location.reload();
            } else {
                showNotification(i18n.t('error_invalid_key', "Veuillez entrer une clé valide"), "error");
            }
        });
        return;
    }
    
    let fileData = null;
    let folderData = null;
    let folderFiles = [];
    
    async function loadShareData(pwd = '') {
        loader.style.display = 'block';
        statusText.style.display = 'block';
        statusText.textContent = i18n.t('decrypting_meta', "Déchiffrement des métadonnées...");
        document.getElementById('password-form').classList.add('hidden');
        
        try {
            const fetchUrl = `api/share.php?action=info&token=${token}${pwd ? '&pwd='+encodeURIComponent(pwd) : ''}`;
            const res = await fetch(fetchUrl);
            const data = await res.json();
            
            if (data.status === 'success') {
                loader.style.display = 'none';
                statusText.style.display = 'none';
                window.currentSharePwd = pwd; // Store for download
                
                if (data.type === 'file') {
                    fileData = data.file;
                    document.getElementById('file-name').textContent = fileData.name;
                    document.getElementById('file-size').textContent = formatSize(fileData.size);
                    document.getElementById('file-info').classList.remove('hidden');
                } else if (data.type === 'folder') {
                    folderData = data.folder;
                    folderFiles = data.files;
                    
                    document.getElementById('folder-name').textContent = folderData.name;
                    const tbody = document.getElementById('folder-files-list');
                    tbody.innerHTML = '';
                    
                    if (folderFiles.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-secondary);">${i18n.t('folder_empty', 'Dossier vide')}</td></tr>`;
                    }
                    
                    folderFiles.forEach(f => {
                        const tr = document.createElement('tr');
                        tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
                        tr.innerHTML = `
                            <td style="padding: 10px; display:flex; align-items:center; gap:10px;">
                                <i class="fa-solid fa-file" style="color:var(--text-secondary);"></i>
                                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:250px;" title="${f.name}">${f.name}</span>
                            </td>
                            <td style="padding: 10px; color:var(--text-secondary); font-size:0.9rem;">${formatSize(f.size)}</td>
                            <td style="padding: 10px; text-align:center;">
                                <button class="btn btn-primary btn-sm dl-btn" data-id="${f.id}" data-enc="${f.encrypted_key}" title="${i18n.t('download', 'Télécharger')}">
                                    <i class="fa-solid fa-download"></i>
                                </button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                    
                    document.getElementById('folder-info').classList.remove('hidden');
                    
                    // Attach event listeners to folder download buttons
                    document.querySelectorAll('.dl-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const target = e.currentTarget;
                            const file_id = target.dataset.id;
                            const encrypted_key = target.dataset.enc;
                            const fileName = target.parentElement.parentElement.querySelector('span').textContent;
                            
                            await downloadSharedItem(target, token, hash, 'folder', file_id, encrypted_key, fileName);
                        });
                    });
                }
            } else if (data.status === 'password_required') {
                loader.style.display = 'none';
                statusText.style.display = 'none';
                document.getElementById('password-form').classList.remove('hidden');
                if (pwd) {
                    showNotification(i18n.t('incorrect_password', "Mot de passe incorrect"), "error");
                }
            } else {
                loader.style.display = 'none';
                statusText.style.display = 'block';
                statusText.textContent = data.message;
            }
        } catch (e) {
            loader.style.display = 'none';
            statusText.style.display = 'block';
            statusText.textContent = i18n.t('error_connection', "Erreur de connexion.");
        }
    }
    
    loadShareData();
    
    document.getElementById('btn-unlock').addEventListener('click', () => {
        const pwd = document.getElementById('unlock-password').value;
        if (pwd) {
            loadShareData(pwd);
        } else {
            showNotification(i18n.t('prompt_password', "Veuillez entrer un mot de passe"), "error");
        }
    });
    
    document.getElementById('btn-download').addEventListener('click', async (e) => {
        if (!fileData) return;
        await downloadSharedItem(e.currentTarget, token, hash, 'file', null, null, fileData.name);
    });
});

async function downloadSharedItem(btn, token, hash, type, file_id = null, folder_encrypted_key = null, fileName = 'download') {
    try {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btn.disabled = true;
        
        let fileKeyBytes, ivBytes;
        
        if (type === 'file') {
            const parts = hash.split(':');
            if (parts.length !== 2) throw new Error(i18n.t('error_corrupted_key', "Clé de déchiffrement corrompue dans l'URL."));
            fileKeyBytes = hexToBuffer(parts[0]);
            ivBytes = hexToBuffer(parts[1]);
        } else if (type === 'folder') {
            if (!folder_encrypted_key || folder_encrypted_key === 'null') throw new Error(i18n.t('error_file_unencrypted_share', "Ce fichier n'est pas chiffré correctement."));
            const folderShareKeyBytes = hexToBuffer(hash);
            
            const parts = folder_encrypted_key.split(':');
            const iv = hexToBuffer(parts[0]);
            const encryptedData = hexToBuffer(parts[1]);
            
            const keyObj = await crypto.subtle.importKey(
                'raw', folderShareKeyBytes, { name: 'AES-GCM' }, false, ['decrypt']
            );
            
            const decryptedData = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv }, keyObj, encryptedData
            );
            
            const decryptedBytes = new Uint8Array(decryptedData);
            fileKeyBytes = decryptedBytes.slice(0, 32);
            ivBytes = decryptedBytes.slice(32);
        }
        
        const urlParams = type === 'folder' ? `&file_id=${file_id}` : '';
        const pwdParam = window.currentSharePwd ? `&pwd=${encodeURIComponent(window.currentSharePwd)}` : '';
        const response = await fetch(`api/share.php?action=download&token=${token}${urlParams}${pwdParam}`);
        if (!response.ok) throw new Error(i18n.t('error_file_not_found_pwd', "Fichier introuvable sur le serveur ou mot de passe requis."));
        
        const encryptedBlob = await response.blob();
        const decryptedBlob = await decryptFile(encryptedBlob, fileKeyBytes, ivBytes);
        
        const url = window.URL.createObjectURL(decryptedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        
    } catch (e) {
        console.error(e);
        showNotification(e.message, 'error');
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }
}
