package de.eightbit.tc.tournament.controller;

import de.eightbit.tc.tournament.model.Tournament;
import de.eightbit.tc.tournament.repository.TournamentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tournaments")
public class TournamentController {

    @Autowired
    private TournamentRepository tournamentRepository;

    @GetMapping
    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    @PostMapping
    public Tournament createTournament(@RequestBody Tournament tournament) {
        return tournamentRepository.save(tournament);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tournament> getTournamentById(@PathVariable Long id) {
        return tournamentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tournament> updateTournament(@PathVariable Long id, @RequestBody Tournament updatedTournament) {
        return tournamentRepository.findById(id)
                .map(tournament -> {
                    tournament.setStartDate(updatedTournament.getStartDate());
                    tournament.setEndDate(updatedTournament.getEndDate());
                    tournament.setName(updatedTournament.getName());
                    tournament.setDescription(updatedTournament.getDescription());
                    tournament.setAdditionalNotes(updatedTournament.getAdditionalNotes());
                    Tournament savedTournament = tournamentRepository.save(tournament);
                    return ResponseEntity.ok(savedTournament);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTournament(@PathVariable Long id) {
        tournamentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
