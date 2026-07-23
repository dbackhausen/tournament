package de.eightbit.tc.tournament.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "dashboard_message")
public class DashboardMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000, nullable = false)
    private String message;
}
