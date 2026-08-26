import { TextExtractionResult } from "../extraction/TextExtractionProvider";

export interface DocumentSection {
    title: string;
    text: string;
    pageNumber: number;
}

export class SectionDetector {
    private static readonly SECTION_KEYWORDS = [
        "ELIGIBILITY", "FINANCIAL REQUIREMENTS", "TECHNICAL REQUIREMENTS", 
        "EXPERIENCE", "QUALIFICATION CRITERIA", "DOCUMENT CHECKLIST", 
        "EMD", "BID SECURITY", "SCOPE OF WORK", "TECHNICAL SPECIFICATIONS", 
        "GENERAL CONDITIONS", "SPECIAL CONDITIONS", "SECTION A", "SECTION B"
    ];

    static detectSections(extractionResult: TextExtractionResult): DocumentSection[] {
        const sections: DocumentSection[] = [];
        
        for (const page of extractionResult.pages) {
            // Simplified detection: Split by newline and check if line matches a known heading
            const lines = page.text.split("\n");
            let currentSectionTitle = "GENERAL";
            let currentSectionText = "";

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const isHeading = this.SECTION_KEYWORDS.some(kw => line.toUpperCase().includes(kw));
                
                if (isHeading) {
                    if (currentSectionText.trim().length > 0) {
                        sections.push({ title: currentSectionTitle, text: currentSectionText.trim(), pageNumber: page.pageNumber });
                    }
                    currentSectionTitle = line;
                    currentSectionText = "";
                } else {
                    currentSectionText += line + "\n";
                }
            }

            if (currentSectionText.trim().length > 0) {
                sections.push({ title: currentSectionTitle, text: currentSectionText.trim(), pageNumber: page.pageNumber });
            }
        }

        return sections;
    }
}
