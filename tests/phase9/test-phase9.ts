import { TenderRequirementDetector } from "../../services/compliance-engine/matching/TenderRequirementDetector";
import { BidEvidenceDetector } from "../../services/compliance-engine/matching/BidEvidenceDetector";
import { RequirementEvidenceMatcher } from "../../services/compliance-engine/matching/RequirementEvidenceMatcher";
import { TenderRequirement, Evidence } from "@prisma/client";
import { Normalizer } from "../../services/compliance-engine/normalization/Normalizer";

function runTest(name: string, tenderText: string, bidText: string, expectedMatches: number, shouldMatch: boolean) {
    const tPages = [{ tenderId: "T1", documentId: "D1", pageNumber: 1, text: tenderText, characterCount: tenderText.length, wordCount: 10 }];
    const reqCands = TenderRequirementDetector.detectRequirements(tPages);
    
    const reqs = reqCands.map(c => ({
        id: c.candidateId,
        tenderId: "T1",
        type: c.type,
        description: c.sourceText,
        sourceDocumentId: c.documentId,
        sourcePage: c.pageNumber,
        rules: { type: "condition", field: c.field, operator: c.operator, value: c.value, currency: c.currency } as any,
        aiMetadata: null,
        reviewStatus: "DETECTED",
        version: 1,
        status: "ACTIVE",
        supersededById: null,
        createdAt: new Date()
    })) as unknown as TenderRequirement[];

    const bPages = [{ bidId: "B1", documentId: "D2", pageNumber: 1, text: bidText, characterCount: bidText.length, wordCount: 10 }];
    const evCands = BidEvidenceDetector.detectEvidence(bPages);
    
    const evs: Evidence[] = evCands.map(c => ({
        id: c.evidenceId,
        documentId: c.documentId,
        type: c.type,
        value: String(c.value),
        numericValue: c.numericValue || null,
        unit: c.currency || null,
        page: c.pageNumber,
        section: null,
        sourceText: c.sourceText,
        extractionMethod: "TEST",
        confidence: 0.8,
        validationStatus: null,
        normalizedValue: null,
        createdAt: new Date()
    }));

    const matches = RequirementEvidenceMatcher.match(reqs, evs);
    
    if (matches.length === expectedMatches) {
        console.log(`[PASS] ${name}`);
    } else {
        console.error(`[FAIL] ${name} (Expected ${expectedMatches} matches, got ${matches.length})`);
        if (matches.length > 0) console.log(matches[0]);
    }
}

console.log("========================================");
console.log("PHASE 9 TEST");
console.log("========================================");

// Scenario 1
runTest(
    "Exact Match (Turnover)",
    "Bidder must have minimum turnover of ₹5 crore.",
    "Annual turnover is ₹7.2 crore.",
    1, true
);

// Scenario 5 - False semantic match
runTest(
    "False Semantic Match (Turnover vs Project value)",
    "Minimum annual turnover ₹5 crore.",
    "Previous project value is ₹8 crore.",
    0, false
);

// Scenario 6 - Alias match
runTest(
    "Alias Matching (GST)",
    "Bidder must possess valid GST registration.",
    "GSTIN: 27ABCDE1234F1Z5",
    1, true
);

console.log("========================================");
console.log("RESULT: COMPLETED");
console.log("========================================");
