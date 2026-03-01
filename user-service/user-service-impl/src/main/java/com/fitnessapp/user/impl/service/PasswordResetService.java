package com.fitnessapp.user.impl.service;

import com.fitnessapp.user.impl.model.User;
import com.fitnessapp.user.impl.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    public PasswordResetService(UserRepository userRepository,
                                @org.springframework.beans.factory.annotation.Autowired(required = false) JavaMailSender mailSender,
                                PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
    }

    @Value("${app.password-reset.expiry-minutes:30}")
    private int expiryMinutes;

    @Value("${app.password-reset.base-url:http://localhost:19006}")
    private String baseUrl;

    @Value("${spring.mail.username:fitnessapp@gmail.com}")
    private String fromEmail;

    /**
     * Generate a reset token, save it to the user, and attempt to send an email with the token.
     * OTP is always saved to DB first. Email is sent best-effort (async).
     */
    public void sendPasswordResetEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with email: " + email));

        // Generate a 6-digit OTP-style token for mobile-friendly reset
        String token = generateOTP();
        user.setPasswordResetToken(token);
        user.setPasswordResetExpiry(LocalDateTime.now().plusMinutes(expiryMinutes));
        userRepository.save(user);

        // Always log OTP for development/debugging (remove in production)
        log.info("=== PASSWORD RESET OTP for {} : {} (valid for {} minutes) ===", email, token, expiryMinutes);

        // Send email asynchronously (non-blocking)
        sendEmailAsync(user.getEmail(), token,
            user.getProfile() != null ? user.getProfile().getFirstName() : "User");
    }

    /**
     * Send email in background thread — never blocks the main request.
     */
    @Async
    public void sendEmailAsync(String toEmail, String token, String firstName) {
        if (mailSender == null) {
            log.warn("Mail sender not configured. OTP is logged above. Configure SMTP in application.yml to enable email.");
            return;
        }
        try {
            sendResetEmailSync(toEmail, token, firstName);
            log.info("Password reset email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.warn("Could not send reset email to {} (OTP is still valid in DB): {}", toEmail, e.getMessage());
        }
    }

    /**
     * Validate the token and reset the password.
     */
    public void resetPassword(String token, String newPassword) {
        validatePasswordStrength(newPassword);

        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (user.getPasswordResetExpiry() == null || user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
            // Clear expired token
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
        // 6-digit numeric OTP
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

    private void sendResetEmailSync(String toEmail, String token, String firstName) {
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
            "— FitnessApp Team \uD83D\uDCAA"
        );
        mailSender.send(message);
    }
}

