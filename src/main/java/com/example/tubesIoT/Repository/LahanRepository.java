package com.example.tubesIoT.Repository;

import com.example.tubesIoT.Model.Lahan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LahanRepository extends JpaRepository<Lahan, Long> {
    List<Lahan> findByTanahIdTanah(Long idTanah);
}
