package com.example.tubesIoT.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.tubesIoT.Model.Tanah;
import java.util.List;

@Repository
public interface TanahRepository extends JpaRepository<Tanah, Long> {
    @Query(value = "SELECT t.* FROM tanah t JOIN akses_user au ON t.id_tanah = au.id_tanah WHERE au.id_user = :userId", nativeQuery = true)
    List<Tanah> findByUserId(@Param("userId") Long userId);
}
