import { useState, useEffect } from 'react'
import './ChatRoom.css'
import MessageInput from '../MessageInput/MessageInput'
import { ApiService } from '../../utils/api'

const ChatRoom = () => {
  const [channels, setChannels] = useState([])
  const [tags, setTags] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedChannel, setSelectedChannel] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [thumbnails, setThumbnails] = useState({})

  // 显示提示消息
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 3000)
  }

  // 复制到剪贴板
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      } catch (fallbackErr) {
        document.body.removeChild(textArea)
        return false
      }
    }
  }

  // 复制消息链接
  const copyMessageLink = async (message) => {
    // 构建完整的链接参数
    const params = new URLSearchParams({
      mid: message.mid,
      channel: message.channel,
      tag: message.tag
    })
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    
    const success = await copyToClipboard(url)
    if (success) {
      showToast('消息链接已复制到剪贴板')
    } else {
      showToast('复制失败，请手动复制', 'error')
    }
  }

  // 复制消息文本
  const copyMessageText = async (content) => {
    const success = await copyToClipboard(content)
    if (success) {
      showToast('消息文本已复制到剪贴板')
    } else {
      showToast('复制失败，请手动复制', 'error')
    }
  }
  
  // 显示删除确认对话框
  const showDeleteConfirm = (messageId) => {
    setDeleteConfirm({
      show: true,
      messageId: messageId,
      loading: false
    })
  }
  
  // 取消删除
  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      messageId: null,
      loading: false
    })
  }
  
  // 确认删除消息
  const confirmDeleteMessage = async () => {
    if (!deleteConfirm.messageId) return
    
    setDeleteConfirm(prev => ({ ...prev, loading: true }))
    
    try {
      const data = await ApiService.deleteMessage(deleteConfirm.messageId)
      
      if (data.success) {
        showToast('消息已删除', 'success')
        // 重新加载消息列表
        loadMessages(selectedChannel, selectedTag)
        cancelDelete()
      } else {
        throw new Error(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除消息失败:', error)
      showToast(`删除失败: ${error.message}`, 'error')
      setDeleteConfirm(prev => ({ ...prev, loading: false }))
    }
  }

  // 获取消息列表的共用函数
  const loadMessages = async (channel, tag) => {
    if (!channel) return
    
    setLoading(true)
    try {
      const data = await ApiService.searchMessages({
        channel: channel,
        tag: tag && tag !== '全部' ? tag : undefined,
        limit: 100
      })
      
      if (data.success) {
        setMessages(data.data)
        // 为文件消息加载缩略图
        loadThumbnails(data.data)
      }
    } catch (error) {
      console.error('获取消息列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载缩略图
  const loadThumbnails = async (messages) => {
    const fileMessages = messages.filter(msg => msg.type === 'file')
    
    for (const message of fileMessages) {
      try {
        const thumbnailUrl = ApiService.getThumbnailUrl(message.mid)
        const img = new Image()
        
        img.onload = () => {
          setThumbnails(prev => ({
            ...prev,
            [message.mid]: thumbnailUrl
          }))
        }
        
        img.onerror = () => {
          // 缩略图加载失败，保持默认状态
          console.log(`缩略图加载失败: ${message.mid}`)
        }
        
        img.src = thumbnailUrl
      } catch (error) {
        console.error('加载缩略图失败:', error)
      }
    }
  }

  // 发送新消息
  const sendMessage = async (messageData) => {
    // 如果是文件上传后的刷新请求
    
    if (messageData.refresh) {
      showToast('发送成功')
      // 重新加载当前频道的消息
      if (selectedChannel) {
        loadMessages(selectedChannel, selectedTag)
      }
      return
    }

    try {
      const result = await ApiService.createTextMessage(messageData)
      
      if (result.success) {
        showToast('消息发送成功')
        // 重新加载当前频道的消息
        if (selectedChannel) {
          loadMessages(selectedChannel, selectedTag)
        }
      } else {
        throw new Error(result.error || result.message || '发送失败')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      showToast(`发送失败: ${error.message}`, 'error')
      throw error
    }
  }

  // URL导航状态管理
  const [urlNavigation, setUrlNavigation] = useState({
    targetMid: null,
    targetChannel: null,
    targetTag: null,
    isProcessing: false
  })
  
  // 删除消息相关状态
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    messageId: null,
    loading: false
  })

  // 检测URL参数并处理导航
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlChannel = urlParams.get('channel')
    const urlTag = urlParams.get('tag')
    const urlMid = urlParams.get('mid')

    if (urlMid || urlChannel || urlTag) {
      setUrlNavigation({
        targetMid: urlMid,
        targetChannel: urlChannel,
        targetTag: urlTag,
        isProcessing: true
      })
      
      // 清理URL参数
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  // 处理URL导航逻辑
  useEffect(() => {
    if (!urlNavigation.isProcessing) return

    const handleUrlNavigation = async () => {
      const { targetMid, targetChannel, targetTag } = urlNavigation

      if (targetMid) {
        // 如果有mid，查询消息信息
        try {
          const data = await ApiService.searchMessages({ mid: targetMid })
          if (data.success && data.data.length > 0) {
            const message = data.data[0]
            
            // 设置频道和标签
            setSelectedChannel(message.channel)
            if (targetTag) {
              setSelectedTag(targetTag)
            } else if (message.tag) {
              setSelectedTag(message.tag)
            }
            
            // 标记为需要滚动
            setUrlNavigation(prev => ({
              ...prev,
              needsScroll: true,
              finalChannel: message.channel,
              finalTag: targetTag || message.tag
            }))
            return
          } else {
            showToast('消息不存在', 'error')
          }
        } catch (error) {
          console.error('获取消息信息失败:', error)
          showToast('无法跳转到指定消息', 'error')
        }
      } else {
        // 没有mid的情况，直接设置频道和标签
        if (targetChannel) setSelectedChannel(targetChannel)
        if (targetTag) setSelectedTag(targetTag)
      }
      
      // 清理处理状态
      setUrlNavigation(prev => ({ ...prev, isProcessing: false }))
    }

    handleUrlNavigation()
  }, [urlNavigation.isProcessing])

  // 在消息加载完成后执行滚动跳转
  useEffect(() => {
    if (urlNavigation.needsScroll && 
        urlNavigation.targetMid && 
        messages.length > 0 &&
        selectedChannel === urlNavigation.finalChannel &&
        selectedTag === urlNavigation.finalTag) {
      
      const targetMid = urlNavigation.targetMid
      
      // 等待DOM更新后执行滚动
      const timer = setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${targetMid}"]`)
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          messageElement.classList.add('highlight-message')
          setTimeout(() => {
            messageElement.classList.remove('highlight-message')
          }, 3000)
          
          // 清理滚动状态
          setUrlNavigation(prev => ({
            ...prev,
            needsScroll: false,
            targetMid: null,
            finalChannel: null,
            finalTag: null
          }))
        } else {
          console.warn('目标消息未找到:', targetMid)
          // 延迟重试
          setTimeout(() => {
            const retryElement = document.querySelector(`[data-message-id="${targetMid}"]`)
            if (retryElement) {
              retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
              retryElement.classList.add('highlight-message')
              setTimeout(() => {
                retryElement.classList.remove('highlight-message')
              }, 3000)
            }
          }, 1000)
          
          // 清理滚动状态
          setUrlNavigation(prev => ({
            ...prev,
            needsScroll: false,
            targetMid: null,
            finalChannel: null,
            finalTag: null
          }))
        }
      }, 300) // 缩短等待时间
      
      return () => clearTimeout(timer)
    }
  }, [messages, urlNavigation, selectedChannel, selectedTag])

  // 获取频道列表
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const channels = await ApiService.getChannels()
        setChannels(channels)
        // 只在没有URL导航或已完成URL导航时设置默认频道
        if (channels.length > 0 && !urlNavigation.isProcessing && !urlNavigation.targetChannel && !urlNavigation.targetMid) {
          setSelectedChannel(channels[0])
        }
      } catch (error) {
        console.error('获取频道列表失败:', error)
      }
    }
    fetchChannels()
  }, [urlNavigation.isProcessing, urlNavigation.targetChannel, urlNavigation.targetMid])

  // 获取标签列表
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await ApiService.getTags()
        setTags(['全部', ...tags]) // 添加"全部"选项
        // 只在没有URL导航或已完成URL导航时设置默认标签
        if (!urlNavigation.isProcessing && !urlNavigation.targetTag && !urlNavigation.targetMid) {
          setSelectedTag('全部')
        }
      } catch (error) {
        console.error('获取标签列表失败:', error)
      }
    }
    fetchTags()
  }, [urlNavigation.isProcessing, urlNavigation.targetTag, urlNavigation.targetMid])

  // 获取消息列表
  useEffect(() => {
    loadMessages(selectedChannel, selectedTag)
  }, [selectedChannel, selectedTag])

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' +
             date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
  }

  // 渲染文件消息
  const renderFileMessage = (content, messageId) => {
    // 支持新的content结构（对象格式）和旧的content结构（字符串路径）
    let fileName, fileUrl, fileSize
    
    if (typeof content === 'object' && content.filename) {
      // 新格式：content是对象
      fileName = content.originalname || content.filename
      fileUrl = ApiService.getFileUrl(content.path || `/uploads/${content.filename}`)
      fileSize = content.size
    } else if (typeof content === 'string') {
      // 旧格式：content是文件路径字符串
      fileName = content.split('/').pop()
      fileUrl = ApiService.getFileUrl(content)
      fileSize = null
    } else {
      fileName = '未知文件'
      fileUrl = '#'
      fileSize = null
    }
    
    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (!bytes) return ''
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    // 检查是否有缩略图
    const hasThumbnail = thumbnails[messageId]
    
    return (
      <div className="file-message">
        <div className="file-icon-container">
          {hasThumbnail ? (
            <img 
              src={hasThumbnail} 
              alt="缩略图" 
              className="file-thumbnail"
              onError={(e) => {
                // 缩略图加载失败时隐藏图片，显示默认图标
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <span 
            className="file-icon"
            style={{ display: hasThumbnail ? 'none' : 'flex' }}
          >
            📎
          </span>
        </div>
        <div className="file-info">
          <div className="file-name">{fileName}</div>
          {fileSize && <div className="file-size">{formatFileSize(fileSize)}</div>}
        </div>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="file-download-btn"
          download={fileName}
        >
          下载
        </a>
      </div>
    )
  }

  return (
    <div className="chat-app">
      {/* 顶部导航栏 */}
      <header className="app-header">
        <div className="header-left">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="app-title">BeeTalk</h1>
        </div>
        
        <div className="header-center">
          {selectedChannel && (
            <div className="current-channel">
              <span className="channel-icon">#</span>
              <span className="channel-name">{selectedChannel}</span>
            </div>
          )}
        </div>
        
        <div className="header-right">
          <button 
            className="filter-toggle"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
          >
            🏷️
          </button>
        </div>
      </header>

      <div className="app-body">
        {/* 左侧边栏 - 频道列表 */}
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-header">
            <h3>频道</h3>
          </div>
          <div className="channels-list">
            {channels.map(channel => (
              <button
                key={channel}
                className={`channel-item ${selectedChannel === channel ? 'active' : ''}`}
                onClick={() => {
                  setSelectedChannel(channel)
                  setSidebarOpen(false) // 移动端选择后关闭侧边栏
                }}
              >
                <span className="channel-hash">#</span>
                <span className="channel-name">{channel}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* 主要内容区域 - 消息列表 */}
        <main className="main-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>加载消息中...</p>
            </div>
          ) : (
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <h3>暂无消息</h3>
                  <p>这个频道还没有消息</p>
                </div>
              ) : (
                <div className="messages-list">
                  {messages.map((message, index) => {
                    const prevMessage = messages[index - 1]
                    const showDateSeparator = !prevMessage || 
                      new Date(message.timestamp).toDateString() !== new Date(prevMessage.timestamp).toDateString()
                    
                    return (
                      <div key={message.mid}>
                        {showDateSeparator && (
                          <div className="date-separator">
                            <span>{new Date(message.timestamp).toLocaleDateString('zh-CN', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                        )}
                        <div className="message-item" data-message-id={message.mid}>
                          <div className="message-avatar">
                            {message.type === 'file' ? '📎' : '💬'}
                          </div>
                          <div className="message-body">
                            <div className="message-meta">
                              <span className="message-tag">{message.tag}</span>
                              <span className="message-time">{formatTime(message.timestamp)}</span>
                            </div>
                            <div className="message-content">
                              {message.type === 'file' ? 
                                renderFileMessage(message.content, message.mid) : 
                                <div className="text-content">{message.content}</div>
                              }
                            </div>
                          </div>
                          <div className="message-actions">
                            <button 
                              className="action-btn"
                              onClick={() => copyMessageLink(message)}
                              title="复制消息链接"
                            >
                              🔗
                            </button>
                            {message.type === 'text' && (
                              <button 
                                className="action-btn"
                                onClick={() => copyMessageText(message.content)}
                                title="复制消息文本"
                              >
                                📋
                              </button>
                            )}
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => showDeleteConfirm(message.mid)}
                              title="删除消息"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* 消息输入区域 */}
          <MessageInput 
            onSendMessage={sendMessage}
            selectedChannel={selectedChannel}
            selectedTag={selectedTag}
          />
        </main>

        {/* 右侧面板 - 标签筛选 */}
        <aside className={`right-panel ${rightPanelOpen ? 'panel-open' : ''}`}>
          <div className="panel-header">
            <h3>筛选标签</h3>
            <button 
              className="panel-close"
              onClick={() => setRightPanelOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="tags-filter">
            {tags.map(tag => (
              <button
                key={tag}
                className={`tag-item ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag === '全部' ? '🌐' : '🏷️'}
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* 移动端遮罩层 */}
      {(sidebarOpen || rightPanelOpen) && (
        <div 
          className="overlay"
          onClick={() => {
            setSidebarOpen(false)
            setRightPanelOpen(false)
          }}
        ></div>
      )}

      {/* Toast 提示 */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteConfirm.show && (
        <div className="delete-modal-overlay" onClick={cancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h3>确认删除</h3>
            </div>
            <div className="delete-modal-body">
              <p>确定要删除这条消息吗？此操作无法撤销。</p>
            </div>
            <div className="delete-modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={cancelDelete}
                disabled={deleteConfirm.loading}
              >
                取消
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmDeleteMessage}
                disabled={deleteConfirm.loading}
              >
                {deleteConfirm.loading ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatRoom