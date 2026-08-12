package com.smartad.service;

import com.smartad.dto.request.UploadAdRequest;
import com.smartad.dto.response.AdvertisementResponse;
import com.smartad.entity.Advertisement;
import com.smartad.exception.ResourceNotFoundException;
import com.smartad.mapper.AdvertisementMapper;
import com.smartad.repository.AdvertisementRepository;
import com.smartad.repository.ScreenAdAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdvertisementService {

    private final AdvertisementRepository advertisementRepository;
    private final ScreenAdAssignmentRepository screenAdAssignmentRepository;
    private final FileStorageService fileStorageService;
    private final AdvertisementMapper advertisementMapper;

    @Transactional
    public AdvertisementResponse upload(UploadAdRequest request) {
        String mediaUrl = fileStorageService.uploadAdMedia(request.getFile());

        Advertisement ad = Advertisement.builder()
                .title(request.getTitle())
                .clientName(request.getClientName())
                .mediaUrl(mediaUrl)
                .mediaType(request.getMediaType().toUpperCase())
                .position(request.getPosition().toUpperCase())
                .isActive(true)
                .displayOrder(request.getDisplayOrder())
                .build();

        ad = advertisementRepository.save(ad);
        return advertisementMapper.toResponse(ad);
    }

    public List<AdvertisementResponse> listActive() {
        return advertisementRepository.findByIsActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc().stream()
                .map(advertisementMapper::toResponse)
                .toList();
    }

    public List<AdvertisementResponse> listAll() {
        return advertisementRepository.findAllByDeletedAtIsNullOrderByDisplayOrderAsc().stream()
                .map(advertisementMapper::toResponse)
                .toList();
    }

    public List<AdvertisementResponse> listTrash() {
        return advertisementRepository.findAllByDeletedAtIsNotNullOrderByDisplayOrderAsc().stream()
                .map(advertisementMapper::toResponse)
                .toList();
    }

    @Transactional
    public AdvertisementResponse update(Long id, String title, String clientName, String position, Integer displayOrder, Boolean isActive) {
        Advertisement ad = findActiveOrThrow(id);

        if (title != null) {
            ad.setTitle(title);
        }
        if (clientName != null) {
            ad.setClientName(clientName);
        }
        if (position != null) {
            ad.setPosition(position.toUpperCase());
        }
        if (displayOrder != null) {
            ad.setDisplayOrder(displayOrder);
        }
        if (isActive != null) {
            ad.setIsActive(isActive);
        }

        ad = advertisementRepository.save(ad);
        return advertisementMapper.toResponse(ad);
    }

    /** Moves an ad to the trash (soft delete) and pulls it out of every
     * screen's rotation immediately, rather than leaving it silently
     * playing somewhere it can no longer be managed. */
    @Transactional
    public void delete(Long id) {
        Advertisement ad = findActiveOrThrow(id);
        ad.setDeletedAt(LocalDateTime.now());
        advertisementRepository.save(ad);
        screenAdAssignmentRepository.deleteByAdvertisementId(id);
    }

    /** Trashes every active ad belonging to one client at once - e.g. when
     * clearing everything a sponsor had running across a screen group. */
    @Transactional
    public int deleteAllByClient(String clientName) {
        List<Advertisement> ads = advertisementRepository.findByClientNameAndDeletedAtIsNull(clientName);
        LocalDateTime now = LocalDateTime.now();
        for (Advertisement ad : ads) {
            ad.setDeletedAt(now);
            screenAdAssignmentRepository.deleteByAdvertisementId(ad.getId());
        }
        advertisementRepository.saveAll(ads);
        return ads.size();
    }

    @Transactional
    public AdvertisementResponse restore(Long id) {
        Advertisement ad = advertisementRepository.findById(id)
                .filter(a -> a.getDeletedAt() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Advertisement not found in trash: " + id));
        ad.setDeletedAt(null);
        ad = advertisementRepository.save(ad);
        return advertisementMapper.toResponse(ad);
    }

    /** Permanently removes a trashed ad. Only callable on ads already in the trash. */
    @Transactional
    public void permanentlyDelete(Long id) {
        Advertisement ad = advertisementRepository.findById(id)
                .filter(a -> a.getDeletedAt() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Advertisement not found in trash: " + id));
        advertisementRepository.delete(ad);
    }

    private Advertisement findActiveOrThrow(Long id) {
        return advertisementRepository.findById(id)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Advertisement not found: " + id));
    }
}
