import { CorrelatedFinding, FraudIndicator, InvestigationPriority, RiskLevel } from "../detectors/FraudIndicator";

export interface FraudAnalysisInput {
    bidId: string;
    tenderId: string;
}

export interface FraudAnalysisResult {
    status: string;
    riskScore: number | null;
    riskLevel: RiskLevel | string | null;
    confidence: number | null;
    investigationPriority: InvestigationPriority | string | null;
    indicators: FraudIndicator[];
    correlatedFindings: CorrelatedFinding[];
    summaryRecommendation?: string;
}

export interface FraudAnalysisService {
    analyze(input: FraudAnalysisInput): Promise<FraudAnalysisResult>;
}

export class MockFraudAnalysisService implements FraudAnalysisService {
    async analyze(input: FraudAnalysisInput): Promise<FraudAnalysisResult> {
        return {
            status: "NOT_ANALYZED",
            riskScore: null,
            riskLevel: null,
            confidence: null,
            investigationPriority: null,
            indicators: [],
            correlatedFindings: []
        };
    }
}
