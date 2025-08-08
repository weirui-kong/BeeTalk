import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ApiService } from '../../utils/api';
import './ChatPage.css';

interface Message {
  mid: string;
  channel: string;
  tag: string;
  type: 'text' | 'file';
  content: string;
  timestamp: number;
  ua: string;
  deleted: boolean;
}

const ChatPage = () => {
  const { channelName } = useParams<{ channelName: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentChannel, setCurrentChannel] = useState(channelName || 'General');

  // 获取消息列表
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const result = await ApiService.searchMessages({
          channel: channelName,
          sortOrder: 'desc'
        });
        
        if (result.success) {
          setMessages(result.data);
          setCurrentChannel(channelName || 'General');
        }
      } catch (error) {
        console.error('获取消息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [channelName]);

  // 获取文件名
  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || '未知文件';
  };

  // 获取文件类型图标
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return '🖼️';
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📈';
      case 'zip':
      case 'rar':
      case '7z':
        return '📦';
      case 'mp3':
      case 'wav':
      case 'flac':
        return '🎵';
      case 'mp4':
      case 'avi':
      case 'mov':
        return '🎬';
      case 'txt':
        return '📄';
      default:
        return '📎';
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h2>#{currentChannel}</h2>
        <div className="chat-info">
          <span>{messages.length} 条消息</span>
        </div>
      </div>

      <div className="chat-content">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>加载消息中...</span>
          </div>
        ) : (
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-messages">
                <h3>暂无消息</h3>
                <p>发送第一条消息开始聊天吧！</p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map(message => (
                  <div key={message.mid} className={`message ${message.type}`}>
                    <div className="message-header">
                      <span className="message-tag">#{message.tag}</span>
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="message-content">
                      {message.type === 'text' ? (
                        <p>{message.content}</p>
                      ) : (
                        <div className="file-message">
                          <span className="file-icon">
                            {getFileIcon(getFileName(message.content))}
                          </span>
                          <div className="file-info">
                            <a 
                              href={ApiService.getFileUrl(message.content)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-link"
                              title={getFileName(message.content)}
                            >
                              {getFileName(message.content)}
                            </a>
                            <span className="file-download">下载</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <div className="input-placeholder">
          <p>消息输入区域（后续实现）</p>
          <p>将包含：文本输入框、文件上传、标签选择等功能</p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;