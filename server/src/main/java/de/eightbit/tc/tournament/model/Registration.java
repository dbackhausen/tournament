package de.eightbit.tc.tournament.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "registrations", indexes = {
        @Index(name = "idx_reg_user", columnList = "user_id"),
        @Index(name = "idx_reg_tournament", columnList = "tournament_id")
})
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonBackReference
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id")
    @JsonBackReference
    private Tournament tournament;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "registration_types", joinColumns = @JoinColumn(name = "registration_id"))
    @Column(name = "type")
    @Enumerated(EnumType.STRING)
    private List<TournamentType> selectedTypes = new ArrayList<>();

    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ParticipationRequest> participationRequests = new ArrayList<>();

    @Length(max = 255)
    private String notes;

    private boolean payed;

    public void setSelectedTypes(List<TournamentType> selectedTypes) {
        this.selectedTypes.clear();
        if (selectedTypes != null) {
            this.selectedTypes.addAll(selectedTypes);
        }
    }

    public void setParticipationRequests(List<ParticipationRequest> requests) {
        this.participationRequests.clear();
        if (requests != null) {
            this.participationRequests.addAll(requests);
        }
    }
}
