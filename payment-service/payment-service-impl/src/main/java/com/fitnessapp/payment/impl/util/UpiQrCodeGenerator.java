package com.fitnessapp.payment.impl.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Slf4j
public class UpiQrCodeGenerator {

    private static final int QR_CODE_SIZE = 400;

    /**
     * Generate UPI deep link string
     */
    public static String generateUpiDeepLink(String merchantUpiId, String merchantName,
                                              BigDecimal amount, String transactionNote, String transactionRef) {
        StringBuilder sb = new StringBuilder("upi://pay?");
        sb.append("pa=").append(encode(merchantUpiId));
        sb.append("&pn=").append(encode(merchantName));
        sb.append("&am=").append(amount.toPlainString());
        sb.append("&cu=INR");
        if (transactionNote != null) {
            sb.append("&tn=").append(encode(transactionNote));
        }
        if (transactionRef != null) {
            sb.append("&tr=").append(encode(transactionRef));
        }
        return sb.toString();
    }

    /**
     * Generate QR code as Base64-encoded PNG
     */
    public static String generateQrCodeBase64(String content) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 2);

            BitMatrix bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, QR_CODE_SIZE, QR_CODE_SIZE, hints);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            byte[] imageBytes = outputStream.toByteArray();

            return Base64.getEncoder().encodeToString(imageBytes);
        } catch (WriterException | java.io.IOException e) {
            log.error("Failed to generate QR code: {}", e.getMessage());
            throw new RuntimeException("QR code generation failed", e);
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}

