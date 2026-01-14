package com.example.tubesIoT.Repository;

import com.example.tubesIoT.Model.SensorReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {
    /**
     * Mencari riwayat pembacaan sensor berdasarkan ID Lahan.
     * Spring Data JPA akan secara otomatis menerjemahkan ini menjadi query filter.
     */
    List<SensorReading> findByLahan_IdLahan(Long idLahan);
}
