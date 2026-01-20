-- =========================
-- DROP TABLES (optional)
-- =========================
DROP TABLE IF EXISTS sensor_readings CASCADE;
DROP TABLE IF EXISTS akses_user CASCADE;
DROP TABLE IF EXISTS lokasi CASCADE;
DROP TABLE IF EXISTS tanah CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id_user BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

-- =========================
-- TANAH
-- =========================
CREATE TABLE tanah (
    id_tanah BIGSERIAL PRIMARY KEY,
    pemilik VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL
);

-- =========================
-- LOKASI
-- =========================
CREATE TABLE lokasi (
    id_lokasi BIGSERIAL PRIMARY KEY,
    id_tanah BIGINT NOT NULL,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255) NOT NULL,

    CONSTRAINT fk_lokasi_tanah
        FOREIGN KEY (id_tanah)
        REFERENCES tanah(id_tanah)
        ON DELETE CASCADE
);

-- =========================
-- AKSES USER ↔ TANAH
-- =========================
CREATE TABLE akses_user (
    id_user  BIGINT NOT NULL,
    id_tanah BIGINT NOT NULL,

    PRIMARY KEY (id_user, id_tanah),

    CONSTRAINT fk_akses_user_user
        FOREIGN KEY (id_user)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_akses_user_tanah
        FOREIGN KEY (id_tanah)
        REFERENCES tanah(id_tanah)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- SENSOR READINGS
-- =========================
CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    id_lokasi BIGINT NOT NULL,
    soil_moisture INTEGER NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,
    ph DOUBLE PRECISION NOT NULL,
    light DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sensor_lokasi
        FOREIGN KEY (id_lokasi)
        REFERENCES lokasi(id_lokasi)
        ON DELETE CASCADE
);

-- =========================
-- DUMMY DATA
-- =========================

-- USERS
INSERT INTO users (username, password, email) VALUES
('admin', 'admin123', 'admin@mail.com'),
('kevin', 'kevin123', 'kevin@mail.com'),
('farmer1', 'farmer123', 'farmer1@mail.com');

-- TANAH
INSERT INTO tanah (pemilik, address) VALUES
('Kevin Halim', 'Jl. Merdeka No. 10'),
('Budi Santoso', 'Jl. Sudirman No. 22');

-- LOKASI
INSERT INTO lokasi (id_tanah, note) VALUES
(1, 'Lahan cabai belakang rumah'),
(1, 'Lahan tomat samping rumah'),
(2, 'Lahan padi utama');

-- AKSES USER
INSERT INTO akses_user (id_user, id_tanah) VALUES
(1, 1),
(2, 1),
(3, 2);

-- SENSOR READINGS
INSERT INTO sensor_readings
(id_lokasi, soil_moisture, temperature, ph, light)
VALUES
(1, 45, 28.5, 6.5, 1200),
(1, 47, 29.0, 6.6, 1300),
(2, 52, 27.8, 6.8, 1500),
(3, 60, 26.2, 7.0, 2000);