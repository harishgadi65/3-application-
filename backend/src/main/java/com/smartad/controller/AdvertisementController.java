package com.smartad.controller;

import com.smartad.dto.request.UploadAdRequest;
import com.smartad.dto.response.AdvertisementResponse;
import com.smartad.dto.response.ApiResponse;
import com.smartad.service.AdvertisementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/ads")
@RequiredArgsConstructor
public class AdvertisementController {

    private final AdvertisementService advertisementService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<AdvertisementResponse>> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("mediaType") String mediaType,
            @RequestParam("position") String position,
            @RequestParam("displayOrder") Integer displayOrder) {

        UploadAdRequest request = new UploadAdRequest(title, mediaType, position, displayOrder, file);
        AdvertisementResponse response = advertisementService.upload(request);
        return ResponseEntity.ok(ApiResponse.success("Advertisement uploaded", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdvertisementResponse>>> listActive() {
        return ResponseEntity.ok(ApiResponse.success(advertisementService.listActive()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdvertisementResponse>> update(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "position", required = false) String position,
            @RequestParam(value = "displayOrder", required = false) Integer displayOrder,
            @RequestParam(value = "isActive", required = false) Boolean isActive) {

        AdvertisementResponse response = advertisementService.update(id, title, position, displayOrder, isActive);
        return ResponseEntity.ok(ApiResponse.success("Advertisement updated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        advertisementService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Advertisement deleted", null));
    }
}
