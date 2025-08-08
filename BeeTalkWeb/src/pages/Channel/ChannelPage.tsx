import { useState, useEffect } from 'react';
import { ApiService } from '../../utils/api';
import './ChannelPage.css';

const ChannelPage = () => {
  const [channels, setChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChannelName, setNewChannelName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // 获取频道列表
  const fetchChannels = async () => {
    try {
      const channels = await ApiService.getChannels();
      setChannels(channels);
    } catch (error) {
      console.error('获取频道列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 添加新频道
  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    setIsAdding(true);
    try {
      const result = await ApiService.addChannel(newChannelName.trim());
      if (result.success) {
        setNewChannelName('');
        fetchChannels(); // 重新获取频道列表
      } else {
        alert(`添加频道失败: ${result.error}`);
      }
    } catch (error) {
      console.error('添加频道失败:', error);
      alert('添加频道失败，请检查网络连接');
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  return (
    <div className="channel-page">
      <div className="page-header">
        <h2>频道管理</h2>
        <p>管理聊天频道，创建新的讨论空间</p>
      </div>

      {/* 添加新频道 */}
      <div className="add-channel-section">
        <h3>添加新频道</h3>
        <form onSubmit={handleAddChannel} className="add-channel-form">
          <div className="form-group">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="输入频道名称..."
              className="channel-input"
              disabled={isAdding}
            />
            <button 
              type="submit" 
              disabled={!newChannelName.trim() || isAdding}
              className="add-button"
            >
              {isAdding ? '添加中...' : '添加频道'}
            </button>
          </div>
        </form>
      </div>

      {/* 频道列表 */}
      <div className="channels-section">
        <h3>现有频道</h3>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="channels-grid">
            {channels.length === 0 ? (
              <div className="empty-channels">
                <p>暂无频道</p>
                <p>创建第一个频道开始吧！</p>
              </div>
            ) : (
              channels.map(channel => (
                <div key={channel} className="channel-card">
                  <div className="channel-info">
                    <h4 className="channel-name">#{channel}</h4>
                    <p className="channel-meta">频道</p>
                  </div>
                  <div className="channel-actions">
                    <button 
                      className="action-button view"
                      onClick={() => window.location.href = `/chat/${encodeURIComponent(channel)}`}
                    >
                      查看
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelPage;