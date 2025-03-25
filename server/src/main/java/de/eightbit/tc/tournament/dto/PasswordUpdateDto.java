package de.eightbit.tc.tournament.dto;

import lombok.Data;

@Data
public class PasswordUpdateDto {
    private String oldPassword;
    private String newPassword;

    public boolean isValid() {
        return newPassword != null && newPassword.length() >= 8;
    }
}