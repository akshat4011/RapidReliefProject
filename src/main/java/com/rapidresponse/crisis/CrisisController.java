package com.rapidresponse.crisis;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rapidresponse.user.UserRepository;

@RestController
@RequestMapping("/api/crisis")
@CrossOrigin
public class CrisisController {
    private final CrisisReportRepository reports;
    private final UserRepository users;

    public CrisisController(CrisisReportRepository reports, UserRepository users) {
        this.reports = reports;
        this.users = users;
    }

    @PostMapping("/report")
    public ResponseEntity<?> report(@RequestBody CrisisReportRequest request) {
        Long userId = request.userId();
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User id is required."));
        }

        return users.findById(userId)
                .<ResponseEntity<?>>map(user -> {
                    CrisisReport report = new CrisisReport();
                    applyReportValues(report, request);
                    report.setUser(user);
                    report.setCreatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(CrisisReportResponse.from(reports.save(report)));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body(Map.of("message", "User not found.")));
    }

    @GetMapping("/reports/{userId}")
    public List<CrisisReportResponse> reports(@PathVariable Long userId) {
        return reports.findTop10ByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(CrisisReportResponse::from)
                .toList();
    }

    @PutMapping("/{reportId}")
    public ResponseEntity<?> update(@PathVariable Long reportId, @RequestBody CrisisReportRequest request) {
        Long userId = request.userId();
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User id is required."));
        }

        return reports.findById(reportId)
                .<ResponseEntity<?>>map(report -> {
                    if (!report.getUser().getId().equals(userId)) {
                        return ResponseEntity.badRequest().body(Map.of("message", "You can edit only your own alert."));
                    }
                    applyReportValues(report, request);
                    return ResponseEntity.ok(CrisisReportResponse.from(reports.save(report)));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body(Map.of("message", "Report not found.")));
    }

    @DeleteMapping("/{reportId}")
    public ResponseEntity<?> delete(@PathVariable Long reportId, @RequestBody ReportOwnerRequest request) {
        Long userId = request.userId();
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User id is required."));
        }

        return reports.findById(reportId)
                .<ResponseEntity<?>>map(report -> {
                    if (!report.getUser().getId().equals(userId)) {
                        return ResponseEntity.badRequest().body(Map.of("message", "You can delete only your own alert."));
                    }
                    reports.delete(report);
                    return ResponseEntity.ok(Map.of("message", "Report deleted.", "id", reportId));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body(Map.of("message", "Report not found.")));
    }

    @PostMapping("/{reportId}/assign")
    public ResponseEntity<?> assign(@PathVariable Long reportId) {
        return reports.findById(reportId)
                .<ResponseEntity<?>>map(report -> {
                    report.setAssignedAt(LocalDateTime.now());
                    return ResponseEntity.ok(CrisisReportResponse.from(reports.save(report)));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body(Map.of("message", "Report not found.")));
    }

    @PostMapping("/{reportId}/resolve")
    public ResponseEntity<?> resolve(@PathVariable Long reportId) {
        return reports.findById(reportId)
                .<ResponseEntity<?>>map(report -> {
                    if (report.getAssignedAt() == null) {
                        report.setAssignedAt(LocalDateTime.now());
                    }
                    report.setResolvedAt(LocalDateTime.now());
                    return ResponseEntity.ok(CrisisReportResponse.from(reports.save(report)));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body(Map.of("message", "Report not found.")));
    }

    private static void applyReportValues(CrisisReport report, CrisisReportRequest request) {
        report.setCrisisType(request.crisisType() == null ? "Medical emergency" : request.crisisType());
        report.setDescription(request.description() == null ? "" : request.description());
        report.setSourceLat(request.sourceLat());
        report.setSourceLng(request.sourceLng());
        report.setDestinationLat(request.destinationLat());
        report.setDestinationLng(request.destinationLng());
        report.setDistanceKm(distanceKm(
                request.sourceLat(),
                request.sourceLng(),
                request.destinationLat(),
                request.destinationLng()));
    }

    private static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        final double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(earthRadiusKm * c * 10.0) / 10.0;
    }
}
