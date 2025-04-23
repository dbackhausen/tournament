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
@Table(name = "registrations")
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @JsonBackReference
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id")
    @JsonBackReference
    private Tournament tournament;

    @ElementCollection
    @CollectionTable(name = "registration_types", joinColumns = @JoinColumn(name = "registration_id"))
    @Column(name = "type")
    @Enumerated(EnumType.STRING)
    private List<TournamentType> selectedTypes = new ArrayList<>();

    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ParticipationRequest> participationRequests = new ArrayList<>();

    @Length(max = 255)
    private String notes;

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
