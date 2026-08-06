package com.smartad.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

/**
 * Builds an {@code S3Client} that talks to MinIO in this POC (via
 * {@code endpointOverride} + path-style access) but would work unmodified
 * against real AWS S3 if {@code AWS_S3_ENDPOINT} is left unset.
 */
@Configuration
public class AwsS3Config {

    @Value("${app.aws.s3.endpoint:}")
    private String s3Endpoint;

    @Value("${app.aws.region:us-east-1}")
    private String region;

    @Value("${app.aws.access-key-id:}")
    private String accessKeyId;

    @Value("${app.aws.secret-access-key:}")
    private String secretAccessKey;

    @Bean
    public S3Client s3Client() {
//        S3Client.Builder builder = S3Client.builder()
//                .region(Region.of(region))
//                .serviceConfiguration(S3Configuration.builder()
//                        .pathStyleAccessEnabled(true) // required for MinIO
//                        .build());
        var builder = S3Client.builder()
                .region(Region.of(region))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build());

        if (accessKeyId != null && !accessKeyId.isBlank()) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKeyId, secretAccessKey)));
        }

        if (s3Endpoint != null && !s3Endpoint.isBlank()) {
            builder.endpointOverride(URI.create(s3Endpoint));
        }

        return builder.build();
    }
}
