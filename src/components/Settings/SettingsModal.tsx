import { useState } from 'react'
import {
  X,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import { getStorageUsage, purgeAllPaperCutsData } from '../../lib/storage'
import type { AIProviderConfig } from '../../lib/ai/types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentConfig: AIProviderConfig
  onSaveConfig: (config: AIProviderConfig) => void
  onDataPurged: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  onDataPurged
}) => {
  const [mode, setMode] = useState<AIProviderConfig['mode']>(currentConfig.mode)
  const [endpointUrl, setEndpointUrl] = useState(currentConfig.endpointUrl || '')
  const [modelIdentifier, setModelIdentifier] = useState(currentConfig.modelIdentifier || 'gemma-4')
  const [ephemeralToken, setEphemeralToken] = useState(currentConfig.ephemeralToken || '')
  const [timeoutSeconds, setTimeoutSeconds] = useState(
    Math.round((currentConfig.timeoutMs || 45000) / 1000)
  )
  const [confirmPurge, setConfirmPurge] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (!isOpen) return null

  const storageMetrics = getStorageUsage()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveConfig({
      mode,
      endpointUrl: endpointUrl.trim(),
      modelIdentifier: modelIdentifier.trim(),
      ephemeralToken: ephemeralToken.trim(),
      timeoutMs: timeoutSeconds * 1000
    })
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onClose()
    }, 600)
  }

  const handlePurge = () => {
    purgeAllPaperCutsData()
    setConfirmPurge(false)
    onDataPurged()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg max-w-xl w-full shadow-lg overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e6dfd3] flex items-center justify-between bg-[#fbf9f5]">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-[#2563eb]" />
            <div>
              <h2 className="font-editorial text-lg font-bold text-[#191716]">
                Settings & AI Configuration
              </h2>
              <p className="text-xs text-[#57534e]">
                Configure your Gemma 4 model endpoint, proxy, and local storage controls.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#736d65] hover:text-[#191716] hover:bg-[#efebe2]"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          {/* Section 1: AI Provider Mode */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block font-bold text-[#191716] mb-1.5">
                AI Provider Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('demo_precomputed')}
                  className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                    mode === 'demo_precomputed'
                      ? 'border-[#2563eb] bg-[#f5f1ea] font-semibold text-[#191716]'
                      : 'border-[#e6dfd3] hover:bg-[#fbf9f5] text-[#57534e]'
                  }`}
                >
                  <p className="font-bold text-xs text-[#191716]">Demo Mode</p>
                  <p className="text-[10px] text-[#736d65] mt-0.5">
                    100% in-browser. Zero external network calls.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('local_endpoint')}
                  className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                    mode === 'local_endpoint'
                      ? 'border-[#2563eb] bg-[#f5f1ea] font-semibold text-[#191716]'
                      : 'border-[#e6dfd3] hover:bg-[#fbf9f5] text-[#57534e]'
                  }`}
                >
                  <p className="font-bold text-xs text-[#191716]">Local Runner</p>
                  <p className="text-[10px] text-[#736d65] mt-0.5">
                    Ollama, llama.cpp, LocalAI on localhost.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('custom_proxy')
                    setEndpointUrl('/api/analyze')
                    setModelIdentifier('gemini-3.5-flash-lite')
                  }}
                  className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                    mode === 'custom_proxy'
                      ? 'border-[#2563eb] bg-[#eff6ff] font-semibold text-[#181615]'
                      : 'border-[#e6dfd3] hover:bg-[#fbf9f5] text-[#57534e]'
                  }`}
                >
                  <p className="font-bold text-xs text-[#181615]">Gemini Server Boundary</p>
                  <p className="text-[10px] text-[#736d65] mt-0.5">
                    Secure endpoint (/api/analyze). Keeps API key safe.
                  </p>
                </button>
              </div>
            </div>

            {/* Architecture / Secret Protection Disclosure */}
            <div className="p-3.5 bg-[#f7f4ed] border border-[#e6dfd3] rounded-md space-y-1.5 text-[#57534e]">
              <div className="flex items-center space-x-1.5 font-bold text-[#191716]">
                <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
                <span>Client-Side Secret Protection Architecture</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                A static web frontend delivered to a browser cannot safely conceal API secrets (such as Gemini API keys) without exposing them in browser bundles or network devtools. For production usage with remote LLMs, point PaperCuts to your lightweight backend proxy or local Gemma runner.
              </p>
            </div>

            {/* Config Fields (shown when not in pure demo) */}
            {mode !== 'demo_precomputed' && (
              <div className="space-y-3 pt-1 border-t border-[#e6dfd3]">
                <div>
                  <label className="block font-semibold text-[#191716] mb-1">
                    Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={endpointUrl}
                    onChange={(e) => setEndpointUrl(e.target.value)}
                    placeholder="e.g. http://localhost:11434/api/generate or https://proxy.internal/v1/chat"
                    className="w-full px-3 py-1.5 border border-[#e6dfd3] rounded-md bg-[#fbf9f5] text-[#191716]"
                    required
                  />
                  <p className="text-[10px] text-[#736d65] mt-0.5">
                    Must accept POST requests containing JSON prompt payloads.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-[#191716] mb-1">
                    Model Identifier
                  </label>
                  <input
                    type="text"
                    value={modelIdentifier}
                    onChange={(e) => setModelIdentifier(e.target.value)}
                    placeholder="e.g. gemma-4 or gemma-4-27b-it"
                    className="w-full px-3 py-1.5 border border-[#e6dfd3] rounded-md bg-[#fbf9f5] text-[#191716]"
                    required
                  />
                  <p className="text-[10px] text-[#736d65] mt-0.5">
                    Exact model name expected by your local runner or proxy endpoint.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-[#191716] mb-1">
                    Ephemeral Auth Token (Volatile Session Memory Only)
                  </label>
                  <input
                    type="password"
                    value={ephemeralToken}
                    onChange={(e) => setEphemeralToken(e.target.value)}
                    placeholder="Bearer token (never saved to localStorage)"
                    className="w-full px-3 py-1.5 border border-[#e6dfd3] rounded-md bg-[#fbf9f5] text-[#191716]"
                  />
                  <p className="text-[10px] text-[#736d65] mt-0.5">
                    Held only in volatile memory during this tab session. Discarded on page reload.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-[#191716] mb-1">
                    Request Timeout (Seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={timeoutSeconds}
                    onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 border border-[#e6dfd3] rounded-md bg-[#fbf9f5] text-[#191716]"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="flex items-center space-x-1 text-[#2563eb] font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configuration saved!</span>
                </span>
              ) : (
                <span />
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-[#2563eb] hover:bg-[#143326] text-[#fbf9f5] rounded-md font-semibold text-xs transition-colors"
              >
                Save Settings
              </button>
            </div>
          </form>

          {/* Section 2: Storage & Privacy Controls */}
          <div className="pt-4 border-t border-[#e6dfd3] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-sm font-bold text-[#191716]">
                  Browser Storage & Privacy
                </h3>
                <p className="text-[11px] text-[#736d65]">
                  Documents and task checklist state stored locally in your browser.
                </p>
              </div>

              <div className="text-right text-[11px] font-mono text-[#4a4642]">
                <p>Usage: <strong>{storageMetrics.formatted}</strong></p>
                <p>{storageMetrics.docCount} stored document(s)</p>
              </div>
            </div>

            {confirmPurge ? (
              <div className="p-3 bg-[#fee2e2] border border-[#fca5a5] rounded-md space-y-2 text-[#991b1b]">
                <p className="font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm Complete Data Purge?</span>
                </p>
                <p className="text-[11px]">
                  This will permanently wipe all imported documents, extracted pages, task notes, and profile answers from this browser. This cannot be undone.
                </p>
                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={() => setConfirmPurge(false)}
                    className="px-3 py-1 bg-[#ffffff] border border-[#fca5a5] rounded text-xs text-[#191716]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePurge}
                    className="px-3 py-1 bg-[#991b1b] hover:bg-[#7f1d1d] text-[#ffffff] rounded text-xs font-semibold"
                  >
                    Yes, Purge Everything
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmPurge(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 border border-[#fee2e2] hover:bg-[#fee2e2] text-[#991b1b] rounded-md text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Stored Documents & Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
