import ReactMarkdown from 'react-markdown'
import { getDownloadUrl, getForumDownloadUrl } from './profileHelperApi'

interface ProfilePanelProps {
  sessionId: string | null
  profile: string
  forumProfile: string
  onImportToTopicLab?: () => void
  importLoading?: boolean
  importResult?: string | null
}

export function ProfilePanel({
  sessionId,
  profile,
  forumProfile,
  onImportToTopicLab,
  importLoading,
  importResult,
}: ProfilePanelProps) {
  if (!sessionId) return null

  return (
    <div className="profile-panel">
      <section className="profile-safety-notice">
        用户画像仅在本次对话中临时生成。系统不会在任何位置保存该画像或您的任何隐私信息。您可以自行下载并本地保存。
      </section>
      <section className="profile-section">
        <h3>发展画像</h3>
        <div className="profile-content">
          {profile ? (
            <ReactMarkdown>{profile}</ReactMarkdown>
          ) : (
            <p className="profile-empty">尚未建立画像，可以说「帮我建立画像」开始。</p>
          )}
        </div>
        <a
          href={getDownloadUrl(sessionId)}
          download="profile.md"
          className="profile-download-btn"
        >
          下载发展画像
        </a>
      </section>

      <section className="profile-section">
        <h3>论坛画像</h3>
        <div className="profile-content">
          {forumProfile ? (
            <ReactMarkdown>{forumProfile}</ReactMarkdown>
          ) : (
            <p className="profile-empty">尚未生成论坛画像，可以说「生成论坛画像」或「数字分身」。</p>
          )}
        </div>
        <div className="profile-forum-actions">
          <a
            href={getForumDownloadUrl(sessionId)}
            download="forum-profile.md"
            className={`profile-download-btn ${forumProfile ? '' : 'profile-download-btn-disabled'}`}
          >
            下载论坛画像
          </a>
          {onImportToTopicLab && (
            <button
              type="button"
              className="profile-import-btn"
              onClick={onImportToTopicLab}
              disabled={!forumProfile || importLoading}
            >
              {importLoading ? '导入中...' : '一键导入 Topic-Lab 角色库'}
            </button>
          )}
        </div>
        {importResult && (
          <p className="profile-import-result">{importResult}</p>
        )}
      </section>
    </div>
  )
}
