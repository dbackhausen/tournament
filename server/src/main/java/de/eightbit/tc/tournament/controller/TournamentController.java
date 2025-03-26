package de.eightbit.tc.tournament.controller;

import de.eightbit.tc.tournament.dto.RegistrationDto;
import de.eightbit.tc.tournament.dto.TournamentDto;
import de.eightbit.tc.tournament.model.Registration;
import de.eightbit.tc.tournament.model.Tournament;
import de.eightbit.tc.tournament.model.TournamentType;
import de.eightbit.tc.tournament.service.RegistrationService;
import de.eightbit.tc.tournament.service.TournamentService;
import de.eightbit.tc.tournament.util.MappingUtils;
import jakarta.validation.Valid;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tournaments")
public class TournamentController {
    private static final Logger logger = LoggerFactory.getLogger(TournamentController.class);

    @Autowired
    private TournamentService tournamentService;

    @Autowired
    private RegistrationService registrationService;

    private final ModelMapper modelMapper;

    public TournamentController(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    @GetMapping("/{id}")
    public ResponseEntity<TournamentDto> getTournamentById(@PathVariable Long id) {
        Optional<Tournament> tournament = tournamentService.getTournamentById(id);
        if (tournament.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        TournamentDto tournamentDto = modelMapper.map(tournament, TournamentDto.class);
        tournamentDto.setRegistrationCount(registrationService.countRegistrationsByTournamentId(id));
        return ResponseEntity.ok(tournamentDto);
    }

    @PostMapping
    public ResponseEntity<TournamentDto> createTournament(@Valid @RequestBody TournamentDto tournamentDto) {
        Tournament savedTournament = tournamentService.createTournament(tournamentDto);
        TournamentDto savedTournamentDto = modelMapper.map(savedTournament, TournamentDto.class);
        return ResponseEntity.ok(savedTournamentDto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TournamentDto> updateTournament(
            @PathVariable Long id,
            @RequestBody TournamentDto tournamentDto) {
            Optional<Tournament> updatedTournament = tournamentService.updateTournament(id, tournamentDto);
        if (updatedTournament.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        TournamentDto updatedTournamentDto = modelMapper.map(updatedTournament, TournamentDto.class);
        return ResponseEntity.ok(updatedTournamentDto);
    }

    @GetMapping
    public ResponseEntity<Iterable<TournamentDto>> getAllTournaments() {
        List<Tournament> tournaments = tournamentService.getAllTournaments();
        List<TournamentDto> tournamentDtos = MappingUtils.mapList(tournaments, TournamentDto.class);
        return ResponseEntity.ok(tournamentDtos);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTournament(@PathVariable Long id) {
        tournamentService.deleteTournament(id);
        return ResponseEntity.noContent().build();
    }
}