package com.smartad.service;

import com.smartad.dto.response.ScreenGroupResponse;
import com.smartad.entity.ScreenGroup;
import com.smartad.exception.ResourceNotFoundException;
import com.smartad.repository.ScreenGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Create + rename only, matching the admin dashboard's original client-side
 * behavior - deleting a group would need to decide where its screens go,
 * so that's intentionally not supported yet.
 */
@Service
@RequiredArgsConstructor
public class ScreenGroupService {

    private final ScreenGroupRepository screenGroupRepository;

    public List<ScreenGroupResponse> list() {
        return screenGroupRepository.findAllByOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ScreenGroupResponse create(String name) {
        ScreenGroup group = screenGroupRepository.save(ScreenGroup.builder().name(name).build());
        return toResponse(group);
    }

    @Transactional
    public ScreenGroupResponse rename(Long id, String name) {
        ScreenGroup group = screenGroupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Screen group not found: " + id));
        group.setName(name);
        return toResponse(screenGroupRepository.save(group));
    }

    private ScreenGroupResponse toResponse(ScreenGroup group) {
        return ScreenGroupResponse.builder().id(group.getId()).name(group.getName()).build();
    }
}
