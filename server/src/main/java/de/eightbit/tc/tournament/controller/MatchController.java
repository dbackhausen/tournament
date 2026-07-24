package de.eightbit.tc.tournament.controller;

import de.eightbit.tc.tournament.dto.MatchDto;
import de.eightbit.tc.tournament.model.Match;
import de.eightbit.tc.tournament.service.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tournaments/{tournamentId}/matches")
public class MatchController {

    @Autowired
    private MatchService matchService;

    @GetMapping
    public List<MatchDto> getMatches(@PathVariable Long tournamentId) {
        return matchService.getMatchesByTournament(tournamentId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public MatchDto createMatch(@PathVariable Long tournamentId, @RequestBody MatchDto dto) {
        return toDto(matchService.createMatch(tournamentId, dto));
    }

    @PutMapping("/{matchId}")
    @PreAuthorize("hasRole('ADMIN')")
    public MatchDto updateMatch(@PathVariable Long tournamentId, @PathVariable Long matchId, @RequestBody MatchDto dto) {
        return toDto(matchService.updateMatch(matchId, dto));
    }

    @DeleteMapping("/{matchId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMatch(@PathVariable Long tournamentId, @PathVariable Long matchId) {
        matchService.deleteMatch(matchId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportSchedule(@PathVariable Long tournamentId) {
        byte[] data = matchService.exportToExcel(tournamentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"spielplan.xlsx\"")
                .body(data);
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN')")
    public List<MatchDto> importSchedule(@PathVariable Long tournamentId, @RequestParam("file") MultipartFile file) {
        return matchService.importFromExcel(tournamentId, file).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private MatchDto toDto(Match match) {
        MatchDto dto = new MatchDto();
        dto.setId(match.getId());
        dto.setDate(match.getDate());
        dto.setTime(match.getTime());
        dto.setCourt(match.getCourt());
        dto.setMode(match.getMode());
        dto.setTeamA(match.getTeamA());
        dto.setTeamAPlayer1(match.getTeamAPlayer1());
        dto.setTeamAPlayer2(match.getTeamAPlayer2());
        dto.setTeamB(match.getTeamB());
        dto.setTeamBPlayer1(match.getTeamBPlayer1());
        dto.setTeamBPlayer2(match.getTeamBPlayer2());
        dto.setResult(match.getResult());
        dto.setStatus(match.getStatus());
        return dto;
    }
}
