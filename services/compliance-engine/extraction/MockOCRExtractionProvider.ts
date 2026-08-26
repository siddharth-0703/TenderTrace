import { DocumentInput, TextExtractionProvider, TextExtractionResult } from "./TextExtractionProvider";

export class MockOCRExtractionProvider implements TextExtractionProvider {
    async extract(document: DocumentInput): Promise<TextExtractionResult> {
        // Mock fallback for text quality check and OCR processing
        // We will just return deterministic test data based on document reference
        
        let syntheticText = "";
        if (document.fileReference.includes("turnover")) {
            syntheticText = "ELIGIBILITY CRITERIA\n\n1. The bidder shall have an average annual turnover of not less than INR 5 Crore during the preceding three financial years.";
        } else if (document.fileReference.includes("experience")) {
            syntheticText = "TECHNICAL REQUIREMENTS\n\nThe bidder must have completed at least three similar works during the last five years.";
        } else if (document.fileReference.includes("alternative")) {
            syntheticText = "DOCUMENT CHECKLIST\n\nThe bidder shall submit either a GST registration certificate or an equivalent statutory registration.";
        } else if (document.fileReference.includes("conditional")) {
            syntheticText = "GENERAL CONDITIONS\n\nManufacturers shall submit a valid authorization letter from the OEM.";
        } else if (document.fileReference.includes("ambiguous")) {
            syntheticText = "QUALIFICATION CRITERIA\n\nThe bidder should have adequate financial capacity.";
        } else if (document.fileReference.includes("conflict")) {
            syntheticText = "SECTION A\nThe minimum turnover shall be ₹5 crore.\n\nSECTION B\nThe minimum turnover shall be ₹10 crore.";
        } else if (document.fileReference.includes("duplicate")) {
            syntheticText = "SECTION A\nAverage annual turnover must be at least ₹5 crore.\n\nSECTION B\nMinimum average annual turnover: ₹5 crore.";
        } else {
            syntheticText = document.fileReference; // Echo back for general tests
        }

        return {
            documentId: document.id,
            pages: [
                {
                    pageNumber: 1,
                    text: syntheticText
                }
            ]
        };
    }
}
