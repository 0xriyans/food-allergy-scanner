package com.example.allergy_scanner.repository;

import com.example.allergy_scanner.model.ScanHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScanHistoryRepository extends JpaRepository<ScanHistory, Long> {
    List<ScanHistory> findByUserIdOrderByScanDateDesc(Long userId);
}
