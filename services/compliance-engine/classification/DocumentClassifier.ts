export class DocumentClassifier {
    static classify(filename: string, textContext: string): string {
        const lowerName = filename.toLowerCase();
        
        if (lowerName.includes("corrigendum") || lowerName.includes("amendment")) {
            return "CORRIGENDUM";
        }
        if (lowerName.includes("eligibility")) {
            return "ELIGIBILITY";
        }
        if (lowerName.includes("technical")) {
            return "TECHNICAL_SPECIFICATION";
        }
        if (lowerName.includes("financial") || lowerName.includes("boq")) {
            return "FINANCIAL_REQUIREMENT";
        }
        if (lowerName.includes("main") || lowerName.includes("tender")) {
            return "MAIN_TENDER";
        }
        if (lowerName.includes("annexure")) {
            return "ANNEXURE";
        }
        
        return "UNKNOWN";
    }

    static classifyBidDocument(filename: string, textContext: string): string {
        const lowerName = filename.toLowerCase();

        if (lowerName.includes("gst")) return "GST_CERTIFICATE";
        if (lowerName.includes("ca") || lowerName.includes("turnover")) return "CA_CERTIFICATE";
        if (lowerName.includes("financial") || lowerName.includes("balance")) return "FINANCIAL_STATEMENT";
        if (lowerName.includes("experience") || lowerName.includes("work")) return "EXPERIENCE_CERTIFICATE";
        if (lowerName.includes("oem") || lowerName.includes("authorization")) return "OEM_AUTHORIZATION";
        if (lowerName.includes("registration") || lowerName.includes("pan")) return "COMPANY_REGISTRATION";
        
        return "OTHER";
    }
}
