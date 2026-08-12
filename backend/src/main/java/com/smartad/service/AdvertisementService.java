package com.smartad.service;

import com.smartad.dto.request.UploadAdRequest;
import com.smartad.dto.response.AdvertisementResponse;
import com.smartad.entity.Advertisement;
import com.smartad.exception.ResourceNotFoundException;
import com.smartad.mapper.AdvertisementMapper;
import com.smartad.repository.AdvertisementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdvertisementService {

    private final AdvertisementRepository advertisementRepository;
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
        return advertisementRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(advertisementMapper::toResponse)
                .toList();
    }

    public List<AdvertisementResponse> listAll() {
        return advertisementRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(advertisementMapper::toResponse)
                .toList();
    }

    @Transactional
    public AdvertisementResponse update(Long id, String title, String clientName, String position, Integer displayOrder, Boolean isActive) {
        Advertisement ad = advertisementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Advertisement not found: " + id));

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

    @Transactional
    public void delete(Long id) {
        if (!advertisementRepository.existsById(id)) {
            throw new ResourceNotFoundException("Advertisement not found: " + id);
        }
        advertisementRepository.deleteById(id);
    }
}
