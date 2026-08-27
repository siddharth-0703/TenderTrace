export const FIELD_ALIASES: Record<string, string[]> = {
    TURNOVER: [
        "annual turnover",
        "average annual turnover",
        "financial turnover",
        "average turnover",
        "sales turnover"
    ],
    GST: [
        "gst",
        "gstin",
        "gst registration",
        "goods and services tax"
    ],
    EXPERIENCE: [
        "similar experience",
        "similar contracts",
        "similar projects",
        "past experience",
        "experience"
    ],
    PAN: [
        "pan",
        "permanent account number"
    ],
    UDYAM: [
        "udyam",
        "udyam registration no"
    ]
};

export function getCanonicalField(fieldName: string): string {
    const lower = fieldName.toLowerCase().trim();
    for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
        if (canonical.toLowerCase() === lower || aliases.includes(lower)) {
            return canonical;
        }
    }
    return fieldName.toUpperCase(); // Fallback
}
