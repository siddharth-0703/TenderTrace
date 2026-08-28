import { DocumentSection } from "./SectionDetector";

export interface RequirementCandidate {
    sectionTitle: string;
    text: string;
    pageNumber: number;
}

export class RequirementCandidateDetector {
    private static readonly REQUIREMENT_KEYWORDS = [
        "must", "shall", "required", "mandatory", "eligible", 
        "bidder shall have", "bidder must possess", "not less than", 
        "not more than", "minimum", "maximum", "at least", "at most", 
        "submit", "valid", "experience", "turnover", "registration", "certificate"
    ];

    static detectCandidates(sections: DocumentSection[]): RequirementCandidate[] {
        const candidates: RequirementCandidate[] = [];

        for (const section of sections) {
            // Split into roughly sentence/paragraph boundaries
            const blocks = section.text.split(/\.\s+|\n\n/);

            for (const block of blocks) {
                const lowerBlock = block.toLowerCase();
                const hasRequirementSignal = this.REQUIREMENT_KEYWORDS.some(kw => lowerBlock.includes(kw));

                if (hasRequirementSignal && block.trim().length > 10) {
                    candidates.push({
                        sectionTitle: section.title,
                        text: block.trim(),
                        pageNumber: section.pageNumber
                    });
                }
            }
        }

        return candidates;
    }
}
