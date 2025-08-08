import { useState, useEffect, useRef } from 'react'
import { ApiService } from '../../utils/api'
import './MessageInput.css'

const MessageInput = ({ onSendMessage, selectedChannel, selectedTag }) => {
  const [tag, setTag] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // 从本地存储加载tag
  useEffect(() => {
    const savedTag = localStorage.getItem('beetalk-default-tag')
    setTag(savedTag || 'Anonymous')
  }, [])

  // 当外部传入的selectedTag变化时，更新tag输入框
  useEffect(() => {
    if (selectedTag && selectedTag !== '全部') {
      setTag(selectedTag)
      // 同时保存到本地存储
      localStorage.setItem('beetalk-default-tag', selectedTag)
    }
  }, [selectedTag])

  // 保存tag到本地存储
  const handleTagChange = (value) => {
    setTag(value)
    localStorage.setItem('beetalk-default-tag', value)
  }

  // 自动调整textarea高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 200)
      textarea.style.height = `${newHeight}px`
    }
  }

  // 处理文本内容变化
  const handleContentChange = (e) => {
    setContent(e.target.value)
    adjustTextareaHeight()
  }

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 发送消息
  const handleSend = async () => {
    if (!content.trim() || !tag.trim() || !selectedChannel || sending) {
      return
    }

    setSending(true)
    try {
      const result = await ApiService.createTextMessage({
        channel: selectedChannel,
        tag: tag.trim(),
        content: content.trim()
      })
      
      if (result.success) {
        // 通知父组件刷新消息列表
        await onSendMessage({ refresh: true })
        setContent('')
        // 重置textarea高度
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      } else {
        throw new Error(result.error || result.message || '发送失败')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      alert(`发送失败: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  // 处理文件选择
  const handleFileSelect = () => {
    if (uploading || !selectedChannel || !tag.trim()) {
      return
    }
    fileInputRef.current?.click()
  }

  // 处理文件上传
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // 检查文件大小限制 (500MB)
    if (file.size > 500 * 1024 * 1024) {
      alert('文件大小不能超过 500MB')
      return
    }

    if (!tag.trim() || !selectedChannel) {
      alert('请先选择频道并输入标签')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('channel', selectedChannel)
      formData.append('tag', tag.trim())
      // 添加content字段，使用文件名作为内容描述
      formData.append('content', `${file.name}`)

      const result = await ApiService.uploadFile(formData)
      
      if (result.success) {
        // 文件上传成功，通知父组件刷新消息列表
        await onSendMessage({ refresh: true })
      } else {
        throw new Error(result.error || result.message || '上传失败')
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      alert(`文件上传失败: ${error.message}`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // 清空file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="message-input">
      <div className="input-row">
        <div className="tag-input-wrapper">
          <input
            type="text"
            className="tag-input"
            value={tag}
            onChange={(e) => handleTagChange(e.target.value)}
            placeholder="输入标签..."
            maxLength={20}
          />
        </div>
        
        <div className="content-input-wrapper">
          <textarea
            ref={textareaRef}
            className="content-input"
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={selectedChannel ? `在 ${selectedChannel} 频道发送消息...` : "请先选择频道..."}
            disabled={!selectedChannel || sending}
            rows={1}
          />
        </div>
        
        <button
          className={`upload-button ${!tag.trim() || !selectedChannel || uploading ? 'disabled' : ''}`}
          onClick={handleFileSelect}
          disabled={!tag.trim() || !selectedChannel || uploading}
          title="上传文件"
        >
          {uploading ? '⏳' : '📎'}
        </button>
        
        <button
          className={`send-button ${!content.trim() || !tag.trim() || !selectedChannel || sending ? 'disabled' : ''}`}
          onClick={handleSend}
          disabled={!content.trim() || !tag.trim() || !selectedChannel || sending}
          title="发送消息 (Enter)"
        >
          {sending ? '⏳' : '📤'}
        </button>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        accept="*/*"
      />

      {/* 上传进度显示 */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <span className="progress-text">{uploadProgress}%</span>
        </div>
      )}
    </div>
  )
}

export default MessageInput