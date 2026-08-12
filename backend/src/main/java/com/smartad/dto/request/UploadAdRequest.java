package com.smartad.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

/**
 * Multipart form fields accompanying the uploaded ad file in
 * {@code POST /api/ads}. The file itself is bound separately in the
 * controller via {@code @RequestPart("file") MultipartFile file}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UploadAdRequest {

    @NotBlank(message = "title is required")
    private String title;

    /** Optional sponsor/brand name. */
    private String clientName;

    /** "IMAGE" or "VIDEO". */
    @NotBlank(message = "mediaType is required")
    private String mediaType;

    @NotBlank(message = "position is required")
    private String position;

    @NotNull(message = "displayOrder is required")
    private Integer displayOrder;

    /** Populated manually by the controller when handling multipart requests. */
    private transient MultipartFile file;
}
