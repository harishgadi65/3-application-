package com.smartad.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.EnumMap;
import java.util.Map;

/**
 * Generates PNG QR codes (via ZXing) encoding the mobile join URL for a
 * given session code, so the TV screen can display a scannable code.
 */
@Service
public class QrCodeService {

    @Value("${app.frontend.mobile-url:http://localhost:5174}")
    private String mobileBaseUrl;

    private static final int SIZE = 400;

    public byte[] generateJoinQrPng(String sessionCode) throws IOException, WriterException {
        String joinUrl = buildJoinUrl(sessionCode);
        return generatePng(joinUrl, SIZE, SIZE);
    }

    public String buildJoinUrl(String sessionCode) {
        return baseUrl() + "/join/" + sessionCode;
    }

    /** QR for an idle screen: scanning it joins (or starts) that screen's pending session. */
    public byte[] generateScreenJoinQrPng(String displayCode) throws IOException, WriterException {
        return generatePng(buildScreenJoinUrl(displayCode), SIZE, SIZE);
    }

    public String buildScreenJoinUrl(String displayCode) {
        return baseUrl() + "/scan/" + displayCode;
    }

    private String baseUrl() {
        return mobileBaseUrl.endsWith("/") ? mobileBaseUrl.substring(0, mobileBaseUrl.length() - 1) : mobileBaseUrl;
    }

    private byte[] generatePng(String content, int width, int height) throws WriterException, IOException {
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        hints.put(EncodeHintType.MARGIN, 1);

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, width, height, hints);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return out.toByteArray();
        }
    }
}
