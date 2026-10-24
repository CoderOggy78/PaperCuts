import { ConfigurableGemmaProvider } from './configurableGemmaProvider'
import { DemoProvider } from './demoProvider'
import { GeminiServerProvider } from './geminiServerProvider'
import type { AIProviderConfig, DocumentAIProvider } from './types'

export * from './types'
export * from './promptShield'
export * from './demoProvider'
export * from './configurableGemmaProvider'
export * from './geminiServerProvider'

export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  mode: 'custom_proxy',
  endpointUrl: '/api/analyze',
  modelIdentifier: 'gemini-3.5-flash-lite',
  timeoutMs: 45000
}

/**
 * Creates the appropriate DocumentAIProvider based on the user's active configuration.
 * Adheres strictly to the rule:
 * - If in Demo mode, uses DemoProvider without sending document contents anywhere.
 * - If using the secure server boundary, calls GeminiServerProvider via /api/analyze.
 * - If configured with a custom local runner (Ollama, etc.), connects to that exact endpoint.
 */
export function createAIProvider(config: AIProviderConfig): DocumentAIProvider {
  if (config.mode === 'demo_precomputed') {
    return new DemoProvider()
  }

  if (config.mode === 'custom_proxy' || config.endpointUrl === '/api/analyze' || !config.endpointUrl) {
    return new GeminiServerProvider(config.endpointUrl || '/api/analyze')
  }

  return new ConfigurableGemmaProvider(config)
}
