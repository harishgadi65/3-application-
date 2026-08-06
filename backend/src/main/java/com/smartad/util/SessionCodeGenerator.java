package com.smartad.util;

import java.security.SecureRandom;

/**
 * Generates short, human-friendly, alphanumeric session codes (e.g. "A1B2C3")
 * used by players to join a session by scanning a QR code or typing the code
 * manually on their phone.
 */
public final class SessionCodeGenerator {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 to avoid confusion
    private static final SecureRandom RANDOM = new SecureRandom();

    private SessionCodeGenerator() {
    }

    public static String generate() {
        return generate(Constants.SESSION_CODE_LENGTH);
    }

    public static String generate(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
