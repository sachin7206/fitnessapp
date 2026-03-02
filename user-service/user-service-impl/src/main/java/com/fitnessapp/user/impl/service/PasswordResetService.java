package com.fitnessapp.user.impl.service;

import com.fitnessapp.user.impl.model.User;
import com.fitnessapp.user.impl.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    public PasswordResetService(UserRepository userRepository,
                                @Autowired(required = false) JavaMailSender mailSender,
                                PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
        if (mailSender == null) {
            log.warn("JavaMailSender not available. Password reset emails will NOT be sent. OTP will be logged to console only.");
        }
    }

    @Value("${app.password-reset.expiry-minutes:30}")
    private int expiryMinutes;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    /**
     * Generate OTP, save to DB, return immediately, send email in background thread.
     */
    public void sendPasswordResetEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with email: " + email));

        String token = generateOTP();
        user.setPasswordResetToken(token);
        user.setPasswordResetExpiry(LocalDateTime.now().plusMinutes(expiryMinutes));
        userRepository.save(user);

        log.info("========================================");
        log.info("  PASSWORD RESET OTP for {}", email);
        log.info("  OTP: {}", token);
        log.info("  Valid for {} minutes", expiryMinutes);
        log.info("========================================");

        // Fire-and-forget: send email in a separate thread so HTTP response returns immediately
        String firstName = (user.getProfile() != null && user.getProfile().getFirstName() != null)
                ? user.getProfile().getFirstName() : "User";
        CompletableFuture.runAsync(() -> {
            try {
                sendEmail(email, token, firstName);
            } catch (Exception e) {
                log.warn("Email send failed for {} (OTP still valid in DB): {}", email, e.getMessage());
            }
        });
    }

    /**
     * Validate the token and reset the password.
     */
    public void resetPassword(String token, String newPassword) {
        validatePasswordStrength(newPassword);

        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (user.getPasswordResetExpiry() == null || user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
            user.setPasswordResetToken(null);
            user.setPasswordResetExpiry(null);
            userRepository.save(user);
            throw new RuntimeException("Reset token has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiry(null);
        userRepository.save(user);
        log.info("Password reset successful for {}", user.getEmail());
    }

    private String generateOTP() {
        int otp = 100000 + (int) (Math.random() * 900000);
        return String.valueOf(otp);
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters long");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new RuntimeException("Password must contain at least one uppercase letter");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new RuntimeException("Password must contain at least one lowercase letter");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new RuntimeException("Password must contain at least one number");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*")) {
            throw new RuntimeException("Password must contain at least one special character (!@#$%^&*...)");
        }
    }

    private void sendEmail(String toEmail, String token, String firstName) {
        if (mailSender == null || fromEmail == null || fromEmail.isBlank()) {
            log.info("Mail not configured — skipping email send. Use OTP from console log above.");
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("FitnessApp - Password Reset OTP");
        message.setText(
            "Hi " + firstName + ",\n\n" +
            "You requested to reset your password for FitnessApp.\n\n" +
            "Your OTP code is: " + token + "\n\n" +
            "This code is valid for " + expiryMinutes + " minutes.\n\n" +
            "If you did not request this, please ignore this email.\n\n" +
            "— FitnessApp Team"
        );
        mailSender.send(message);
        log.info("Password reset email sent successfully to {}", toEmail);
    }
}

