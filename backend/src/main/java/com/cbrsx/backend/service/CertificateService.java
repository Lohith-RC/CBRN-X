package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.ScoreReportDTO;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.SessionRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Dynamic, tamper-evident PDF Certificate Generation Engine.
 * Produces military/civil-defense Certificates of Operational Readiness
 * for passing CBRN disaster response simulation sessions (score >= 70%).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CertificateService {

    private static final String CRYPTO_SALT = "CBRSX_TAMPER_EVIDENT_SALT_NDRF_2026";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss 'UTC'")
            .withZone(ZoneId.of("UTC"));

    private final ScoringService scoringService;
    private final SessionRepository sessionRepository;

    /**
     * Generates a tamper-evident PDF certificate for a passed simulation session.
     *
     * @param sessionId The session identifier
     * @return Byte array containing the raw PDF document
     * @throws IllegalArgumentException if session is not found
     * @throws IllegalStateException    if session has not passed (score < 70)
     */
    @Transactional(readOnly = true)
    public byte[] generateCertificatePdf(String sessionId) {
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        ScoreReportDTO report = scoringService.previewScore(sessionId);

        if (!report.isPassed() || report.getFinalScore() < ScoringService.PASS_THRESHOLD) {
            throw new IllegalStateException(String.format(
                    "Certificate generation refused: Session %s did not achieve the required passing threshold (%d/100). Score: %d",
                    sessionId, ScoringService.PASS_THRESHOLD, report.getFinalScore()
            ));
        }

        String verificationHash = computeVerificationHash(report);
        String certificateId = String.format("NDRF-CBRN-%s-%04d",
                report.getScenarioCode() != null ? report.getScenarioCode() : "GEN",
                Math.abs(sessionId.hashCode()) % 10000);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Color Palette
            Color primaryNavy = new Color(15, 23, 42);     // #0f172a
            Color accentGold = new Color(202, 138, 4);     // #ca8a04
            Color passGreen = new Color(16, 185, 129);     // #10b981
            Color borderGray = new Color(226, 232, 240);   // #e2e8f0
            Color textMuted = new Color(100, 116, 139);    // #64748b

            // Fonts
            Font headerOrgFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, accentGold);
            Font headerSubFont = FontFactory.getFont(FontFactory.HELVETICA, 9, textMuted);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, primaryNavy);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
            Font boldBodyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, primaryNavy);
            Font scoreBigFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, passGreen);
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font tableBodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.DARK_GRAY);
            Font hashFont = FontFactory.getFont(FontFactory.COURIER, 7, textMuted);

            // Outer Border Table Container
            PdfPTable outerBox = new PdfPTable(1);
            outerBox.setWidthPercentage(100);
            PdfPCell boxCell = new PdfPCell();
            boxCell.setBorderColor(accentGold);
            boxCell.setBorderWidth(3);
            boxCell.setPadding(20);
            boxCell.setBackgroundColor(new Color(248, 250, 252));

            // Header Section
            Paragraph orgHeader = new Paragraph("NATIONAL DISASTER RESPONSE FORCE (NDRF)", headerOrgFont);
            orgHeader.setAlignment(Element.ALIGN_CENTER);
            boxCell.addElement(orgHeader);

            Paragraph subHeader = new Paragraph("MINISTRY OF HOME AFFAIRS, GOVERNMENT OF INDIA • CBRN VR SIMULATION ACADEMY", headerSubFont);
            subHeader.setAlignment(Element.ALIGN_CENTER);
            subHeader.setSpacingAfter(10);
            boxCell.addElement(subHeader);

            Paragraph certTitle = new Paragraph("CERTIFICATE OF OPERATIONAL CBRN READINESS", titleFont);
            certTitle.setAlignment(Element.ALIGN_CENTER);
            certTitle.setSpacingAfter(12);
            boxCell.addElement(certTitle);

            // Certificate Body Narrative
            Paragraph narrative = new Paragraph();
            narrative.setAlignment(Element.ALIGN_CENTER);
            narrative.add(new Chunk("This is to certify that responder ", bodyFont));
            narrative.add(new Chunk(report.getTraineeName() != null ? report.getTraineeName().toUpperCase() : "RESPONDER", boldBodyFont));
            narrative.add(new Chunk(" (ID: " + report.getTraineeId() + ") of unit ", bodyFont));
            narrative.add(new Chunk(report.getBatchUnit() != null ? report.getBatchUnit() : "NDRF 10th Battalion", boldBodyFont));
            narrative.add(new Chunk(" has successfully undergone rigorous tactical evaluation in mission scenario:\n", bodyFont));
            narrative.add(new Chunk(report.getScenarioTitle() + " (" + report.getScenarioCode() + ")", boldBodyFont));
            narrative.setSpacingAfter(12);
            boxCell.addElement(narrative);

            // Score & Tactical Tier Highlights
            PdfPTable scoreTable = new PdfPTable(3);
            scoreTable.setWidthPercentage(90);
            scoreTable.setHorizontalAlignment(Element.ALIGN_CENTER);
            scoreTable.setSpacingAfter(12);

            PdfPCell c1 = createMetricCell("FINAL SCORE", report.getFinalScore() + " / 100", scoreBigFont, borderGray);
            PdfPCell c2 = createMetricCell("TACTICAL STATUS", report.getPassStatus(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, passGreen), borderGray);
            PdfPCell c3 = createMetricCell("DURATION", report.getTotalDurationSeconds() + " SECONDS", boldBodyFont, borderGray);

            scoreTable.addCell(c1);
            scoreTable.addCell(c2);
            scoreTable.addCell(c3);
            boxCell.addElement(scoreTable);

            // 6-Dimension Breakdown Table
            PdfPTable dimTable = new PdfPTable(6);
            dimTable.setWidthPercentage(95);
            dimTable.setHorizontalAlignment(Element.ALIGN_CENTER);
            dimTable.setSpacingAfter(14);

            String[] headers = {"PPE Protocol", "Detection", "Evacuation", "Containment", "Decontamination", "Time Bonus"};
            for (String h : headers) {
                PdfPCell th = new PdfPCell(new Phrase(h, tableHeaderFont));
                th.setBackgroundColor(primaryNavy);
                th.setHorizontalAlignment(Element.ALIGN_CENTER);
                th.setPadding(4);
                dimTable.addCell(th);
            }

            dimTable.addCell(createDimCell(report.getBreakdown().getPpeScore() + "/10", tableBodyFont));
            dimTable.addCell(createDimCell(report.getBreakdown().getDetectionScore() + "/10", tableBodyFont));
            dimTable.addCell(createDimCell(report.getBreakdown().getEvacuationScore() + "/15", tableBodyFont));
            dimTable.addCell(createDimCell(report.getBreakdown().getContainmentScore() + "/15", tableBodyFont));
            dimTable.addCell(createDimCell(report.getBreakdown().getDecontaminationScore() + "/10", tableBodyFont));
            dimTable.addCell(createDimCell(report.getBreakdown().getTimeBonusScore() + "/20", tableBodyFont));

            boxCell.addElement(dimTable);

            // Footer / Signatures & Cryptographic Verification
            PdfPTable footerTable = new PdfPTable(2);
            footerTable.setWidthPercentage(100);

            PdfPCell leftFooter = new PdfPCell();
            leftFooter.setBorder(Rectangle.NO_BORDER);
            leftFooter.addElement(new Paragraph("CERTIFICATE ID: " + certificateId, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, primaryNavy)));
            leftFooter.addElement(new Paragraph("ISSUED AT: " + (report.getCompletedAt() != null ? DATE_FORMATTER.format(report.getCompletedAt()) : "N/A"), FontFactory.getFont(FontFactory.HELVETICA, 7, textMuted)));
            leftFooter.addElement(new Paragraph("SHA-256 VERIFICATION: " + verificationHash, hashFont));

            PdfPCell rightFooter = new PdfPCell();
            rightFooter.setBorder(Rectangle.NO_BORDER);
            rightFooter.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph sig = new Paragraph("Col. V. Sharma\nLead CBRN Incident Evaluator & Commandant", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, primaryNavy));
            sig.setAlignment(Element.ALIGN_RIGHT);
            rightFooter.addElement(sig);

            footerTable.addCell(leftFooter);
            footerTable.addCell(rightFooter);
            boxCell.addElement(footerTable);

            outerBox.addCell(boxCell);
            document.add(outerBox);
            document.close();

            log.info("Successfully generated PDF certificate for session {} (Trainee: {}, Score: {})",
                    sessionId, report.getTraineeName(), report.getFinalScore());
            return out.toByteArray();
        } catch (DocumentException e) {
            log.error("Failed to generate PDF certificate for session {}", sessionId, e);
            throw new RuntimeException("Failed to generate PDF certificate", e);
        } catch (Exception e) {
            log.error("Unexpected error during certificate generation for session {}", sessionId, e);
            throw new RuntimeException("Error rendering certificate document", e);
        }
    }

    /**
     * Computes a deterministic SHA-256 cryptographic verification digest
     * across key session outcome parameters to guarantee tamper resistance.
     */
    public String computeVerificationHash(ScoreReportDTO report) {
        String payload = String.format("%s:%s:%s:%d:%s:%s",
                report.getSessionId(),
                report.getTraineeId(),
                report.getScenarioCode(),
                report.getFinalScore(),
                report.getCompletedAt() != null ? report.getCompletedAt().toString() : "COMPLETED",
                CRYPTO_SALT
        );

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().toUpperCase();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private PdfPCell createMetricCell(String label, String value, Font valFont, Color borderColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(borderColor);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBackgroundColor(Color.WHITE);

        Paragraph pLabel = new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA, 7, new Color(100, 116, 139)));
        pLabel.setAlignment(Element.ALIGN_CENTER);
        Paragraph pVal = new Paragraph(value, valFont);
        pVal.setAlignment(Element.ALIGN_CENTER);

        cell.addElement(pLabel);
        cell.addElement(pVal);
        return cell;
    }

    private PdfPCell createDimCell(String value, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(4);
        cell.setBackgroundColor(Color.WHITE);
        return cell;
    }
}
