package de.eightbit.tc.tournament.controller;

import de.eightbit.tc.tournament.dto.DashboardMessageDto;
import de.eightbit.tc.tournament.service.DashboardMessageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardMessageService dashboardMessageService;

    @GetMapping("/message")
    public ResponseEntity<DashboardMessageDto> getMessage() {
        DashboardMessageDto dto = new DashboardMessageDto();
        dto.setMessage(dashboardMessageService.getMessage());
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/message")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardMessageDto> updateMessage(@Valid @RequestBody DashboardMessageDto dto) {
        DashboardMessageDto updated = new DashboardMessageDto();
        updated.setMessage(dashboardMessageService.updateMessage(dto.getMessage()));
        return ResponseEntity.ok(updated);
    }
}
