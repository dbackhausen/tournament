package de.eightbit.tc.tournament.service;

import de.eightbit.tc.tournament.dto.UserDto;
import de.eightbit.tc.tournament.model.Role;
import de.eightbit.tc.tournament.model.User;
import de.eightbit.tc.tournament.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    private final ModelMapper modelMapper;

    public UserService(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getAllPlayers() {
        return userRepository.findAllPlayers();
    }

    public List<User> getAllAdmins() {
        return userRepository.findAllAdmins();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User updateUser(User user) {
        userRepository.findById(user.getId())
                .orElseThrow(() -> new EntityNotFoundException("User not found!"));
        return userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    // -- MAPPING UTILS ----

    public UserDto mapToDto(User user) {
        return modelMapper.map(user, UserDto.class);
    }

    public User mapToEntity(UserDto dto) {
        User user = new User();

        user.setId(dto.getId());
        user.setEmail(dto.getEmail());
        user.setGender(dto.getGender());
        user.setTitle(dto.getTitle());
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setMobile(dto.getMobile());
        user.setBirthdate(dto.getBirthdate());
        user.setActive(dto.isActive());

        if (dto.getRoles() != null) {
            user.setRoles(new HashSet<>(dto.getRoles()));
        }

        return user;
    }
}
