CREATE DATABASE IF NOT EXISTS mega_clone_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mega_clone_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    storage_quota BIGINT DEFAULT 53687091200,
    used_storage BIGINT DEFAULT 0,
    total_storage BIGINT DEFAULT 53687091200,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    billing_info VARCHAR(255) NULL,
    subscription_date TIMESTAMP NULL,
    birth_date DATE NULL,
    country VARCHAR(100) NULL,
    status VARCHAR(20) DEFAULT 'active',
    is_admin TINYINT(1) DEFAULT 0,
    plan_type VARCHAR(50) DEFAULT 'free',
    avatar VARCHAR(255) DEFAULT NULL,
    notification_settings JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS folders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    shared_link_token VARCHAR(255) UNIQUE DEFAULT NULL,
    share_password VARCHAR(255) DEFAULT NULL,
    share_expires_at DATETIME DEFAULT NULL,
    is_hidden TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    folder_id INT DEFAULT NULL,
    user_id INT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    shared_link_token VARCHAR(64) DEFAULT NULL UNIQUE,
    share_password VARCHAR(255) DEFAULT NULL,
    share_expires_at DATETIME DEFAULT NULL,
    is_hidden TINYINT(1) DEFAULT 0,
    has_thumbnail TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);
