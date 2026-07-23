package de.eightbit.tc.tournament.service;

import de.eightbit.tc.tournament.model.DashboardMessage;
import de.eightbit.tc.tournament.repository.DashboardMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardMessageService {

    private static final String DEFAULT_MESSAGE =
            "Dies ist dein persönliches Dashboard. Hier findest du aktuelle Informationen zu unseren Turnieren.";

    @Autowired
    private DashboardMessageRepository dashboardMessageRepository;

    public String getMessage() {
        return dashboardMessageRepository.findAll().stream()
                .findFirst()
                .map(DashboardMessage::getMessage)
                .orElse(DEFAULT_MESSAGE);
    }

    @Transactional
    public String updateMessage(String message) {
        DashboardMessage dashboardMessage = dashboardMessageRepository.findAll().stream()
                .findFirst()
                .orElseGet(DashboardMessage::new);
        dashboardMessage.setMessage(message);
        return dashboardMessageRepository.save(dashboardMessage).getMessage();
    }
}
