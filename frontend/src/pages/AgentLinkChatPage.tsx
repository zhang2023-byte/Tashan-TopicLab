import { Navigate, useParams } from 'react-router-dom'
import { AgentLinkChatWindow } from '../modules/agent-links/AgentLinkChatWindow'
import '../modules/agent-links/agent-link-chat.css'

export default function AgentLinkChatPage() {
  const { slug } = useParams<{ slug: string }>()
  if (!slug) {
    return <Navigate to="/agent-links" replace />
  }
  return (
    <div className="profile-helper-page">
      <AgentLinkChatWindow slug={slug} />
    </div>
  )
}
