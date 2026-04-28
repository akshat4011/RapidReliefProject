package com.rapidresponse.crisis;

import java.time.LocalDateTime;

record CrisisReportRequest(
        Long userId,
        String crisisType,
        String description,
        double sourceLat,
        double sourceLng,
        double destinationLat,
        double destinationLng) {
}

record ReportOwnerRequest(Long userId) {
}

record CrisisReportResponse(
        Long id,
        String crisisType,
        String description,
        double sourceLat,
        double sourceLng,
        double destinationLat,
        double destinationLng,
        double distanceKm,
        LocalDateTime createdAt,
        LocalDateTime assignedAt,
        LocalDateTime resolvedAt) {
    static CrisisReportResponse from(CrisisReport report) {
        return new CrisisReportResponse(
                report.getId(),
                report.getCrisisType(),
                report.getDescription(),
                report.getSourceLat(),
                report.getSourceLng(),
                report.getDestinationLat(),
                report.getDestinationLng(),
                report.getDistanceKm(),
                report.getCreatedAt(),
                report.getAssignedAt(),
                report.getResolvedAt());
    }
}
