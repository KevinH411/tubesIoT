CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
	id_lahan BIGSERIAL FOREIGN KEY,
    soil_moisture INTEGER NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,
    ph DOUBLE PRECISION NOT NULL,
    light DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user (
    id_user BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
);
CREATE TABLE tanah (
    id_tanah BIGSERIAL PRIMARY KEY,
    pemilik VARCHAR NOT NULL,
    address VARCHAR NOT NULL,
);
CREATE TABLE lahan (
    id_lahan BIGSERIAL PRIMARY KEY,
    id_tanah BIGINT NOT NULL,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	note VARCHAR NOT NULL,

    CONSTRAINT fk_lahan_tanah
        FOREIGN KEY (id_tanah)
        REFERENCES tanah(id_tanah)
        ON DELETE CASCADE
);

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
