package de.eightbit.tc.tournament.service;

import de.eightbit.tc.tournament.dto.MatchDto;
import de.eightbit.tc.tournament.model.Match;
import de.eightbit.tc.tournament.model.Tournament;
import de.eightbit.tc.tournament.repository.MatchRepository;
import de.eightbit.tc.tournament.repository.TournamentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MatchService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private static final List<String> HEADERS = List.of(
            "ID", "Datum", "Uhrzeit", "Platz", "Modus",
            "Team 1", "Team 1 Spieler 1", "Team 1 Spieler 2",
            "Team 2", "Team 2 Spieler 1", "Team 2 Spieler 2",
            "Ergebnis", "Status"
    );

    // Stored value (DB/API) -> German display label (UI/Excel)
    private static final Map<String, String> MODE_LABELS = new LinkedHashMap<>();
    private static final Map<String, String> STATUS_LABELS = new LinkedHashMap<>();
    // Reverse lookup for Excel import: lower-cased German label -> stored value
    private static final Map<String, String> MODE_VALUES = new LinkedHashMap<>();
    private static final Map<String, String> STATUS_VALUES = new LinkedHashMap<>();

    static {
        MODE_LABELS.put("single", "Einzel");
        MODE_LABELS.put("double", "Doppel");
        MODE_LABELS.put("mixed", "Mixed");
        MODE_LABELS.forEach((value, label) -> MODE_VALUES.put(label.toLowerCase(), value));

        STATUS_LABELS.put("planned", "geplant");
        STATUS_LABELS.put("complete", "abgeschlossen");
        STATUS_LABELS.forEach((value, label) -> STATUS_VALUES.put(label.toLowerCase(), value));
    }

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    public List<Match> getMatchesByTournament(Long tournamentId) {
        return matchRepository.findByTournamentIdOrderByDateAscTimeAsc(tournamentId);
    }

    @Transactional
    public Match createMatch(Long tournamentId, MatchDto dto) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new EntityNotFoundException("Tournament not found"));
        Match match = new Match();
        match.setTournament(tournament);
        applyDto(match, dto);
        return matchRepository.save(match);
    }

    @Transactional
    public Match updateMatch(Long matchId, MatchDto dto) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new EntityNotFoundException("Match not found"));
        applyDto(match, dto);
        return matchRepository.save(match);
    }

    @Transactional
    public void deleteMatch(Long matchId) {
        matchRepository.deleteById(matchId);
    }

    @Transactional
    public List<Match> replaceSchedule(Long tournamentId, List<MatchDto> matches) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new EntityNotFoundException("Tournament not found"));

        matchRepository.deleteByTournamentId(tournamentId);
        matchRepository.flush();

        List<Match> entities = matches.stream().map(dto -> {
            Match match = new Match();
            match.setTournament(tournament);
            applyDto(match, dto);
            return match;
        }).collect(Collectors.toList());

        return matchRepository.saveAll(entities);
    }

    private void applyDto(Match match, MatchDto dto) {
        match.setDate(dto.getDate());
        match.setTime(dto.getTime());
        match.setCourt(dto.getCourt());
        match.setMode(dto.getMode());
        match.setTeamA(dto.getTeamA());
        match.setTeamAPlayer1(dto.getTeamAPlayer1());
        match.setTeamAPlayer2(dto.getTeamAPlayer2());
        match.setTeamB(dto.getTeamB());
        match.setTeamBPlayer1(dto.getTeamBPlayer1());
        match.setTeamBPlayer2(dto.getTeamBPlayer2());
        match.setResult(dto.getResult());
        match.setStatus(dto.getStatus());
    }

    // ------------------ EXCEL EXPORT ------------------

    public byte[] exportToExcel(Long tournamentId) {
        List<Match> matches = getMatchesByTournament(tournamentId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Spielplan");

            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("dd.mm.yyyy"));

            CellStyle timeStyle = workbook.createCellStyle();
            timeStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("hh:mm"));

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.size(); i++) {
                headerRow.createCell(i).setCellValue(HEADERS.get(i));
            }

            int rowIndex = 1;
            for (Match match : matches) {
                Row row = sheet.createRow(rowIndex++);

                if (match.getId() != null) {
                    row.createCell(0).setCellValue(match.getId());
                }
                if (match.getDate() != null) {
                    Cell dateCell = row.createCell(1);
                    dateCell.setCellValue(match.getDate());
                    dateCell.setCellStyle(dateStyle);
                }
                if (match.getTime() != null) {
                    Cell timeCell = row.createCell(2);
                    timeCell.setCellValue(match.getTime().toSecondOfDay() / 86400.0);
                    timeCell.setCellStyle(timeStyle);
                }
                if (match.getCourt() != null) {
                    row.createCell(3).setCellValue(match.getCourt());
                }
                setStringCell(row, 4, MODE_LABELS.getOrDefault(match.getMode(), match.getMode()));
                setStringCell(row, 5, match.getTeamA());
                setStringCell(row, 6, match.getTeamAPlayer1());
                setStringCell(row, 7, match.getTeamAPlayer2());
                setStringCell(row, 8, match.getTeamB());
                setStringCell(row, 9, match.getTeamBPlayer1());
                setStringCell(row, 10, match.getTeamBPlayer2());
                setStringCell(row, 11, match.getResult());
                setStringCell(row, 12, STATUS_LABELS.getOrDefault(match.getStatus(), match.getStatus()));
            }

            for (int i = 0; i < HEADERS.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate schedule export", e);
        }
    }

    private void setStringCell(Row row, int index, String value) {
        if (value != null) {
            row.createCell(index).setCellValue(value);
        }
    }

    // ------------------ EXCEL IMPORT ------------------

    @Transactional
    public List<Match> importFromExcel(Long tournamentId, MultipartFile file) {
        List<MatchDto> parsed = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) {
                    continue;
                }

                MatchDto dto = new MatchDto();
                dto.setDate(readDate(row.getCell(1)));
                dto.setTime(readTime(row.getCell(2)));
                dto.setCourt(readInteger(row.getCell(3)));
                dto.setMode(normalize(readString(row.getCell(4)), MODE_VALUES));
                dto.setTeamA(readString(row.getCell(5)));
                dto.setTeamAPlayer1(readString(row.getCell(6)));
                dto.setTeamAPlayer2(readString(row.getCell(7)));
                dto.setTeamB(readString(row.getCell(8)));
                dto.setTeamBPlayer1(readString(row.getCell(9)));
                dto.setTeamBPlayer2(readString(row.getCell(10)));
                dto.setResult(readString(row.getCell(11)));
                dto.setStatus(normalize(readString(row.getCell(12)), STATUS_VALUES));

                parsed.add(dto);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded schedule", e);
        }

        return replaceSchedule(tournamentId, parsed);
    }

    // Accepts either the German label from the Excel template (e.g. "Einzel") or
    // an already-stored value (e.g. "single"), always returning the stored value.
    private String normalize(String value, Map<String, String> labelToValue) {
        if (value == null) {
            return null;
        }
        String key = value.trim().toLowerCase();
        return labelToValue.getOrDefault(key, key);
    }

    private boolean isRowEmpty(Row row) {
        for (Cell cell : row) {
            if (cell.getCellType() != CellType.BLANK) {
                return false;
            }
        }
        return true;
    }

    private LocalDate readDate(Cell cell) {
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getLocalDateTimeCellValue().toLocalDate();
        }
        String value = readString(cell);
        return value == null ? null : LocalDate.parse(value, DATE_FORMATTER);
    }

    private LocalTime readTime(Cell cell) {
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getLocalDateTimeCellValue().toLocalTime();
        }
        String value = readString(cell);
        return value == null ? null : LocalTime.parse(value, TIME_FORMATTER);
    }

    private Integer readInteger(Cell cell) {
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) cell.getNumericCellValue();
        }
        String value = readString(cell);
        return value == null ? null : Integer.parseInt(value.trim());
    }

    private String readString(Cell cell) {
        if (cell == null) {
            return null;
        }
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim().isEmpty() ? null : cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
    }
}
