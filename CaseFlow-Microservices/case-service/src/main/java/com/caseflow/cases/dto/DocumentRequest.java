package com.caseflow.cases.dto;
import com.caseflow.cases.entity.Document;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class DocumentRequest {
    @NotNull private Long caseId;
    @NotBlank @Size(min = 2, max = 255) private String title;
    @NotNull private Document.DocumentType type;
    @NotBlank private String uri;
    @NotNull private Long uploadedBy;
}
