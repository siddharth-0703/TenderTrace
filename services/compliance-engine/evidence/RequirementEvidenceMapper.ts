import { TenderRequirement, Evidence } from "@prisma/client";

export class RequirementEvidenceMapper {
    static mapEvidenceToRequirements(activeRequirements: TenderRequirement[], bidEvidence: Evidence[]) {
        const mappings: Record<string, Evidence[]> = {};

        // Initialize empty arrays
        for (const req of activeRequirements) {
            mappings[req.id] = [];
        }

        // Extremely simplified mapping logic for demo: 
        // If evidence.type/field matches a property inside the Requirement's JSON rule, map it.
        for (const ev of bidEvidence) {
            for (const req of activeRequirements) {
                if (req.rules) {
                    const ruleStr = JSON.stringify(req.rules);
                    // Checking if the rule tree mentions this specific field (e.g. minimumTurnover, GST_CERTIFICATE)
                    if (ruleStr.includes(`"field":"${ev.type}"`) || ruleStr.includes(`"field":"${ev.type.replace("field:", "")}"`)) {
                        mappings[req.id].push(ev);
                    }
                }
            }
        }

        return mappings;
    }
}
