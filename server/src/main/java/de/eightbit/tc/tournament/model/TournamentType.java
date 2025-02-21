package de.eightbit.tc.tournament.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TournamentType {
    SINGLE("single"),
    DOUBLE("double"),
    MIXED("mixed");

    private final String value;

    TournamentType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static TournamentType fromValue(String value) {
        for (TournamentType type : TournamentType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException(value);
    }
}
