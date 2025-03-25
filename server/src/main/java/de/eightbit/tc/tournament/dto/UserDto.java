package de.eightbit.tc.tournament.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import de.eightbit.tc.tournament.model.Role;
import de.eightbit.tc.tournament.model.User;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class UserDto {
    private Long id;
    private String gender;
    private String title;
    private String firstName;
    private String lastName;
    private String email;
    private String mobile;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthdate;
    private Set<Role> roles;
    private Double performanceClass;
    private boolean active;

    public UserDto() {
    }
    
    public UserDto(User user) {
        this.id = user.getId();
        this.gender = user.getGender();
        this.title = user.getTitle();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.email = user.getEmail();
        this.mobile = user.getMobile();
        this.birthdate = user.getBirthdate();
        this.roles = user.getRoles();
        this.active = user.isActive();
    }
}