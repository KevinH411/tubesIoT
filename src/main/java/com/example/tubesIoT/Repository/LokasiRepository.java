package com.example.tubesIoT.Repository;

import com.example.tubesIoT.Model.Lokasi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LokasiRepository extends JpaRepository<Lokasi, Long> {
    List<Lokasi> findByTanahIdTanah(Long idTanah);
}
