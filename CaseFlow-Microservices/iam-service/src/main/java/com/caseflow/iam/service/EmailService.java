package com.caseflow.iam.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from-name:CaseFlow Admin}")
    private String fromName;

    @Value("${app.mail.from-address:}")
    private String fromAddress;

    /**
     * Send a plain-text email using the configured SMTP server.
     */
    public void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper message = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body, false);

            String senderAddress = resolveFromAddress();
            if (senderAddress != null && !senderAddress.isBlank()) {
                message.setFrom(senderAddress, fromName);
            }

            mailSender.send(mimeMessage);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
    }

    private String resolveFromAddress() {
        if (fromAddress != null && !fromAddress.isBlank()) {
            return fromAddress.trim();
        }
        if (mailSender instanceof JavaMailSenderImpl senderImpl) {
            String username = senderImpl.getUsername();
            if (username != null && !username.isBlank()) {
                return username.trim();
            }
        }
        return null;
    }
}
