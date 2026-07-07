import { autoAnalyzeDevFlowBrief, type DevFlowAutoAnalyzeResult } from "@/shared/api/devflow-api";
import {
  requestFastBriefAnalysis,
  resetBriefAnalysisCacheForTests,
} from "./brief-analysis";

jest.mock("@/shared/api/devflow-api", () => ({
  autoAnalyzeDevFlowBrief: jest.fn(),
}));

const mockedAutoAnalyze = autoAnalyzeDevFlowBrief as jest.MockedFunction<typeof autoAnalyzeDevFlowBrief>;

const apiResult: DevFlowAutoAnalyzeResult = {
  enhancedBrief: "Acme needs a refined delivery dashboard.",
  suggestedFeatures: ["Dashboard analytics", "Notifications"],
  suggestedTechStack: {
    frontend: "Next.js",
    backend: "NestJS",
    database: "Supabase",
    styling: "Tailwind CSS",
  },
  complexity: "medium",
  estimatedFiles: 10,
};

describe("brief analysis helper", () => {
  beforeEach(() => {
    resetBriefAnalysisCacheForTests();
    mockedAutoAnalyze.mockReset();
  });

  it("coalesces identical in-flight API requests", async () => {
    let resolveRequest!: (value: DevFlowAutoAnalyzeResult) => void;
    mockedAutoAnalyze.mockReturnValue(
      new Promise<DevFlowAutoAnalyzeResult>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = requestFastBriefAnalysis({
      companyName: "Acme",
      brief: "Build a dashboard",
      stackKey: "nextjs-nestjs-supabase",
    });
    const second = requestFastBriefAnalysis({
      companyName: " acme ",
      brief: "  Build   a dashboard  ",
      stackKey: "nextjs-nestjs-supabase",
    });

    expect(mockedAutoAnalyze).toHaveBeenCalledTimes(1);
    expect(mockedAutoAnalyze).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "fast" }),
    );

    resolveRequest(apiResult);
    await expect(Promise.all([first, second])).resolves.toEqual([apiResult, apiResult]);
  });

  it("does not cache failed requests", async () => {
    mockedAutoAnalyze
      .mockRejectedValueOnce(new Error("provider unavailable"))
      .mockResolvedValueOnce(apiResult);

    await expect(requestFastBriefAnalysis({
      companyName: "Acme",
      brief: "Build a dashboard",
      stackKey: "nextjs-nestjs-supabase",
    })).rejects.toThrow("provider unavailable");

    await expect(requestFastBriefAnalysis({
      companyName: "Acme",
      brief: "Build a dashboard",
      stackKey: "nextjs-nestjs-supabase",
    })).resolves.toEqual(apiResult);

    expect(mockedAutoAnalyze).toHaveBeenCalledTimes(2);
  });
});
