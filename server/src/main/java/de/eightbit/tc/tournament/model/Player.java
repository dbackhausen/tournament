package de.eightbit.tc.tournament.model;

import de.eightbit.tc.tournament.util.Gender;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.util.Date;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@Table(name = "players")
public class Player extends User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Gender gender = Gender.MALE;
    private String title;
    private String firstname;
    private String lastname;
    @Column(unique = true, nullable = false)
    private String email;
    private LocalDate birthdate;
    private String phone;
    private String mobile;
    private Double performanceClass = 25.0;

    protected Player() {
    }
}
