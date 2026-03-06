import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AgentLinkInfo,
  importAgentLink,
  listAgentLinks,
  MAX_IMPORT_ZIP_SIZE_BYTES,
  previewAgentLinkZip,
  ZipPreview,
} from '../modules/agent-links/agentLinksApi'

function buildShareUrl(slug: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return new URL(`${base}/agent-links/${encodeURIComponent(slug)}`, window.location.origin).toString()
}

export default function AgentLinkLibraryPage() {
  const [links, setLinks] = useState<AgentLinkInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importSlug, setImportSlug] = useState('')
  const [importName, setImportName] = useState('')
  const [importDescription, setImportDescription] = useState('')
  const [importRuleFile, setImportRuleFile] = useState('.cursor/rules/profile-collector.mdc')
  const [importWelcome, setImportWelcome] = useState('你好，我是科研数字分身采集助手。')
  const [importDefaultModel, setImportDefaultModel] = useState('')
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [zipPreview, setZipPreview] = useState<ZipPreview | null>(null)

  const loadLinks = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listAgentLinks()
      setLinks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const empty = useMemo(() => !loading && !error && links.length === 0, [error, links.length, loading])

  const handleCopy = async (slug: string) => {
    const shareUrl = buildShareUrl(slug)
    await navigator.clipboard.writeText(shareUrl)
    setCopiedSlug(slug)
    window.setTimeout(() => {
      setCopiedSlug((prev) => (prev === slug ? null : prev))
    }, 1600)
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setImportFile(f)
    setImportResult(null)
    setPreviewError(null)
    setZipPreview(null)
    if (!f) return
    if (f.size > MAX_IMPORT_ZIP_SIZE_BYTES) {
      setPreviewError('压缩包超过 5MB 限制，请压缩后重试。')
      return
    }

    setPreviewLoading(true)
    try {
      const preview = await previewAgentLinkZip(f)
      setZipPreview(preview)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : String(err))
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleImport = async (e: FormEvent) => {
    e.preventDefault()
    setImportResult(null)
    if (!importFile) {
      setImportResult('请选择 zip 压缩包')
      return
    }
    if (!importName.trim()) {
      setImportResult('请填写蓝图名称')
      return
    }
    if (!importRuleFile.trim()) {
      setImportResult('请填写提示词入口文件')
      return
    }
    if (!importWelcome.trim()) {
      setImportResult('请填写欢迎语')
      return
    }

    setImportLoading(true)
    try {
      const imported = await importAgentLink({
        file: importFile,
        slug: importSlug,
        name: importName,
        description: importDescription,
        ruleFilePath: importRuleFile,
        welcomeMessage: importWelcome,
        defaultModel: importDefaultModel,
        overwrite: overwriteExisting,
      })
      setImportResult(`导入成功：${imported.name}（${imported.slug}）`)
      setImportFile(null)
      await loadLinks()
    } catch (e) {
      setImportResult(e instanceof Error ? e.message : String(e))
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <header className="mb-5 sm:mb-6">
        <h1 className="text-2xl font-serif font-bold text-black">Agent Link 蓝图库</h1>
        <p className="mt-2 text-sm text-gray-600">
          每个蓝图都是预配置 Agent。点击进入对话，或复制链接一键分享。
        </p>
      </header>

      <section className="mb-6 border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-black">导入蓝图</h2>
        <p className="mt-1 text-xs text-gray-500">上传 zip（最大 5MB）后，定义基本信息、提示词入口文件和欢迎语。</p>
        <form className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleImport}>
          <label className="text-sm text-gray-700 md:col-span-2">
            压缩包（.zip）
            <input
              className="mt-1 block w-full border border-gray-300 p-2 text-sm"
              type="file"
              accept=".zip,application/zip"
              onChange={handleFileChange}
              disabled={importLoading}
            />
          </label>
          <div className="md:col-span-2">
            <p className="text-xs text-gray-500">目录预览</p>
            {previewLoading ? <p className="text-xs text-gray-500 mt-1">解析压缩包中...</p> : null}
            {previewError ? <p className="text-xs text-red-600 mt-1">{previewError}</p> : null}
            {zipPreview ? (
              <div className="mt-1 border border-gray-200 bg-gray-50 p-2 max-h-44 overflow-auto">
                <p className="text-xs text-gray-600 mb-1">
                  共 {zipPreview.total} 个文件{zipPreview.total > zipPreview.files.length ? `（仅展示前 ${zipPreview.files.length} 个）` : ''}
                </p>
                <pre className="text-xs text-gray-800 whitespace-pre-wrap break-all">
{zipPreview.files.join('\n')}
                </pre>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-1">选择 zip 后显示目录清单</p>
            )}
          </div>
          <label className="text-sm text-gray-700">
            蓝图名称 *
            <input
              className="mt-1 block w-full border border-gray-300 p-2 text-sm"
              type="text"
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
              placeholder="Tashan Profile Helper Demo"
              disabled={importLoading}
            />
          </label>
          <label className="text-sm text-gray-700">
            slug（可选）
            <input
              className="mt-1 block w-full border border-gray-300 p-2 text-sm"
              type="text"
              value={importSlug}
              onChange={(e) => setImportSlug(e.target.value)}
              placeholder="tashan-profile-helper-demo"
              disabled={importLoading}
            />
          </label>
          <label className="text-sm text-gray-700 md:col-span-2">
            描述（可选）
            <input
              className="mt-1 block w-full border border-gray-300 p-2 text-sm"
              type="text"
              value={importDescription}
              onChange={(e) => setImportDescription(e.target.value)}
              placeholder="Research digital persona blueprint"
              disabled={importLoading}
            />
          </label>
          <label className="text-sm text-gray-700">
            提示词入口文件 *
            <input
              className="mt-1 block w-full border border-gray-300 p-2 text-sm"
              type="text"
              value={importRuleFile}
              onChange={(e) => setImportRuleFile(e.target.value)}
              placeholder=".cursor/rules/profile-collector.mdc"
              disabled={importLoading}
            />
          </label>
          <label className="text-sm text-gray-700">
            默认模型（可选）
            <input
              className="mt-1 block w-full border border-gray-300 p-2 text-sm"
              type="text"
              value={importDefaultModel}
              onChange={(e) => setImportDefaultModel(e.target.value)}
              placeholder="qwen3.5-plus"
              disabled={importLoading}
            />
          </label>
          <label className="text-sm text-gray-700 md:col-span-2">
            欢迎语 *
            <input
              className="mt-1 block w-full border border-gray-300 p-2 text-sm"
              type="text"
              value={importWelcome}
              onChange={(e) => setImportWelcome(e.target.value)}
              disabled={importLoading}
            />
          </label>
          <label className="text-sm text-gray-700 md:col-span-2 inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={overwriteExisting}
              onChange={(e) => setOverwriteExisting(e.target.checked)}
              disabled={importLoading}
            />
            覆盖同名蓝图
          </label>
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={importLoading}
              className="px-4 py-2 bg-black text-white text-sm font-medium disabled:opacity-50"
            >
              {importLoading ? '导入中...' : '导入蓝图'}
            </button>
            {importResult ? <p className="text-sm text-gray-700">{importResult}</p> : null}
          </div>
        </form>
      </section>

      {loading && <p className="text-sm text-gray-500">加载中...</p>}
      {error && <p className="text-sm text-red-600">加载失败: {error}</p>}
      {empty && <p className="text-sm text-gray-500">暂无可用蓝图</p>}

      {!loading && !error && links.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map((item) => (
            <article key={item.slug} className="border border-gray-200 bg-white p-4 flex flex-col gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-black truncate">{item.name}</h2>
                <p className="text-xs text-gray-500 mt-1">slug: {item.slug}</p>
                {item.description ? (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-3">{item.description}</p>
                ) : null}
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  to={`/agent-links/${encodeURIComponent(item.slug)}`}
                  className="px-3 py-2 bg-black text-white text-sm font-medium"
                >
                  进入对话
                </Link>
                <button
                  type="button"
                  onClick={() => handleCopy(item.slug)}
                  className="px-3 py-2 border border-gray-300 text-sm"
                >
                  {copiedSlug === item.slug ? '已复制链接' : '复制分享链接'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
