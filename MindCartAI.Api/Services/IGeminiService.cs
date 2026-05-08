using MindCartAI.Api.DTOs;

namespace MindCartAI.Api.Services;

public interface IGeminiService
{
    Task<ProductAnalysisResponse> AnalyzeProductAsync(ProductAnalysisRequest request);

    Task<string> AskTextAsync(string prompt);

    IAsyncEnumerable<string> AskStreamAsync(string prompt);
}