export interface NormalizedNumeric {
    amount: number;
    currency?: string;
}

export class Normalizer {
    /**
     * Parses values like "5 Cr", "50,000,000", "50 million INR" into a canonical structure
     */
    static normalizeNumeric(value: string | number): NormalizedNumeric | null {
        if (typeof value === "number") return { amount: value };
        
        let normalized = value.toLowerCase().replace(/,/g, "");
        
        let currency = "INR"; // Default fallback
        if (normalized.includes("usd") || normalized.includes("$")) currency = "USD";
        else if (normalized.includes("inr") || normalized.includes("₹") || normalized.includes("rs")) currency = "INR";
        
        normalized = normalized.replace(/[^\d\.]/g, "");
        
        let amount = parseFloat(normalized);
        if (isNaN(amount)) return null;

        const lowerValue = value.toLowerCase();
        if (lowerValue.includes("cr") || lowerValue.includes("crore")) amount *= 10000000;
        else if (lowerValue.includes("lakh") || lowerValue.includes("lac")) amount *= 100000;
        else if (lowerValue.includes("million")) amount *= 1000000;
        else if (lowerValue.includes("billion")) amount *= 1000000000;
        else if (lowerValue.includes("k")) amount *= 1000;

        return { amount, currency };
    }
}
