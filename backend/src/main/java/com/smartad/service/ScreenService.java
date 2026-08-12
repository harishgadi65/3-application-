package com.smartad.service;

import com.smartad.dto.request.TvSetupRequest;
import com.smartad.dto.request.UpsertScreenRequest;
import com.smartad.dto.response.ScreenResponse;
import com.smartad.entity.Screen;
import com.smartad.entity.ScreenAdAssignment;
import com.smartad.exception.AuthenticationException;
import com.smartad.exception.ResourceNotFoundException;
import com.smartad.mapper.ScreenMapper;
import com.smartad.repository.ScreenAdAssignmentRepository;
import com.smartad.repository.ScreenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScreenService {

    private final ScreenRepository screenRepository;
    private final ScreenAdAssignmentRepository screenAdAssignmentRepository;
    private final ScreenMapper screenMapper;

    @Value("${app.tv-setup-password}")
    private String tvSetupPassword;

    private final SecureRandom random = new SecureRandom();

    @Transactional(readOnly = true)
    public List<ScreenResponse> list() {
        return screenRepository.findAllByOrderByScreenNoAsc().stream()
                .map(screenMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ScreenResponse getByDisplayCode(String displayCode) {
        Screen screen = screenRepository.findByDisplayCode(displayCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("No screen registered with code: " + displayCode));
        return screenMapper.toResponse(screen);
    }

    /** One-time TV setup gate: checks the shared device password before
     * registering a screen on a new TV/browser - see DisplayCodeGate. */
    @Transactional(readOnly = true)
    public ScreenResponse verifyTvSetup(TvSetupRequest request) {
        if (!tvSetupPassword.equals(request.getPassword())) {
            throw new AuthenticationException("Incorrect TV setup password");
        }
        return getByDisplayCode(request.getDisplayCode());
    }

    @Transactional
    public ScreenResponse create(UpsertScreenRequest request) {
        Screen screen = Screen.builder()
                .screenNo(request.getScreenNo())
                .displayCode(generateDisplayCode())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .special(request.getSpecial() != null ? request.getSpecial() : false)
                .width(request.getWidth() != null ? request.getWidth() : 1920)
                .height(request.getHeight() != null ? request.getHeight() : 1080)
                .build();
        applyAssignments(screen, request);
        return screenMapper.toResponse(screenRepository.save(screen));
    }

    @Transactional
    public ScreenResponse update(Long id, UpsertScreenRequest request) {
        Screen screen = screenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Screen not found: " + id));

        if (request.getScreenNo() != null) {
            screen.setScreenNo(request.getScreenNo());
        }
        if (request.getStatus() != null) {
            screen.setStatus(request.getStatus());
        }
        if (request.getSpecial() != null) {
            screen.setSpecial(request.getSpecial());
        }
        if (request.getWidth() != null) {
            screen.setWidth(request.getWidth());
        }
        if (request.getHeight() != null) {
            screen.setHeight(request.getHeight());
        }
        applyAssignments(screen, request);
        return screenMapper.toResponse(screenRepository.save(screen));
    }

    @Transactional
    public void delete(Long id) {
        if (!screenRepository.existsById(id)) {
            throw new ResourceNotFoundException("Screen not found: " + id);
        }
        screenRepository.deleteById(id);
    }

    /** Appends one ad to a screen's rotating playlist for one slot, unless
     * it's already in there. Used both for a single screen and, called in
     * a loop, for bulk-assigning to every screen in a group/target. */
    @Transactional
    public void addAdToScreens(List<Long> screenIds, String position, Long advertisementId) {
        String normalizedPosition = position.toUpperCase();
        for (Long screenId : screenIds) {
            if (!screenRepository.existsById(screenId)) {
                throw new ResourceNotFoundException("Screen not found: " + screenId);
            }
            if (screenAdAssignmentRepository.existsByScreenIdAndPositionAndAdvertisementId(
                    screenId, normalizedPosition, advertisementId)) {
                continue;
            }
            int nextOrder = (int) screenAdAssignmentRepository.countByScreenIdAndPosition(screenId, normalizedPosition);
            screenAdAssignmentRepository.save(ScreenAdAssignment.builder()
                    .screenId(screenId)
                    .position(normalizedPosition)
                    .advertisementId(advertisementId)
                    .displayOrder(nextOrder)
                    .build());
        }
    }

    /** Removes one ad from a screen's rotating playlist for one slot. */
    @Transactional
    public void removeAdFromScreen(Long screenId, String position, Long advertisementId) {
        if (!screenRepository.existsById(screenId)) {
            throw new ResourceNotFoundException("Screen not found: " + screenId);
        }
        screenAdAssignmentRepository.deleteByScreenIdAndPositionAndAdvertisementId(
                screenId, position.toUpperCase(), advertisementId);
    }

    private void applyAssignments(Screen screen, UpsertScreenRequest request) {
        if (Boolean.TRUE.equals(request.getClearGroup())) {
            screen.setGroupId(null);
        } else if (request.getGroupId() != null) {
            screen.setGroupId(request.getGroupId());
        }

        if (request.getGameTypes() != null) {
            screen.getGameTypes().clear();
            screen.getGameTypes().addAll(request.getGameTypes());
        }
    }

    private String generateDisplayCode() {
        String code;
        do {
            code = "DSP-" + String.format("%04d", random.nextInt(10000));
        } while (screenRepository.existsByDisplayCode(code));
        return code;
    }
}
