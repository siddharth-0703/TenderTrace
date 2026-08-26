export interface FraudAnalysisInput {
    bidId: string;
    tenderId: string;
}

export interface FraudAnalysisResult {
    status: string;
    riskScore: number | null;
    riskLevel: string | null;
    indicators: any[];
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
            indicators: []
        };
    }
}
