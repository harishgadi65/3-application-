package com.smartad.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

/**
 * Uploads advertisement media (images/video) to the MinIO/S3 bucket and
 * returns a directly-usable public URL. The bucket is configured for
 * anonymous download by docker-compose, so this POC avoids the complexity
 * of presigned URLs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final S3Client s3Client;

    @Value("${app.aws.s3.bucket:ads}")
    private String bucket;

    @Value("${app.aws.s3.endpoint:http://localhost:9000}")
    private String s3Endpoint;

    @Value("${app.aws.s3.public-endpoint:http://localhost:9000}")
    private String s3PublicEndpoint;

    public String uploadAdMedia(MultipartFile file) {
        return upload(file, "ads");
    }

    public String uploadGameIcon(MultipartFile file) {
        return upload(file, "games");
    }

    public String uploadGamePackage(MultipartFile file) {
        return upload(file, "game-packages");
    }

    public String uploadCouponImage(MultipartFile file) {
        return upload(file, "coupons");
    }

    private String upload(MultipartFile file, String prefix) {
        String extension = extractExtension(file.getOriginalFilename());
        String key = prefix + "/" + UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            log.error("Failed to upload file to bucket {}", bucket, e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }

        return buildPublicUrl(key);
    }

    private String buildPublicUrl(String key) {
        String base = s3PublicEndpoint.endsWith("/")
                ? s3PublicEndpoint.substring(0, s3PublicEndpoint.length() - 1)
                : s3PublicEndpoint;
        return base + "/" + bucket + "/" + key;
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
