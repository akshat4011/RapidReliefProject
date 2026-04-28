package com.rapidresponse.crisis;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CrisisReportRepository extends JpaRepository<CrisisReport, Long> {
    List<CrisisReport> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
}
