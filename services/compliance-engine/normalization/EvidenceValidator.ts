export type ValidationStatus = "VALID" | "EXPIRED" | "EXPIRING" | "UNKNOWN" | "INVALID";

export class EvidenceValidator {
    /**
     * Examines evidence metadata (like validity dates) to assign a status.
     * Stubbed logic for Phase 2: if value string contains "expired", it's marked as EXPIRED.
     */
    static validate(evidence: any): ValidationStatus {
        if (!evidence || !evidence.value) return "UNKNOWN";
        
        const text = String(evidence.value).toLowerCase();
        if (text.includes("expired")) {
            return "EXPIRED";
        }
        
        if (text.includes("invalid")) {
            return "INVALID";
        }

        return "VALID";
    }
}
