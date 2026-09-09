package com.taskmanager.shared.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Gera tokens opacos de alta entropia e seus hashes de armazenamento. Usado por
 * refresh tokens e tokens de convite: o valor bruto é exibido uma única vez,
 * apenas o hash SHA-256 é persistido.
 */
public final class OpaqueTokens {

    private static final SecureRandom ALEATORIO = new SecureRandom();

    private OpaqueTokens() {
    }

    public static String gerar() {
        byte[] bytes = new byte[32];
        ALEATORIO.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String gerarHash(String bruto) {
        try {
            MessageDigest digestor = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digestor.digest(bruto.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
