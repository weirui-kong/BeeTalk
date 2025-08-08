import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ApiService } from '../../utils/api';
import './Sidebar.css';

interface Channel {
  name: string;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const [channels, setChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取频道列表
  useEffect(() => {
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

    fetchChannels();
  }, []);

  // 处理移动端点击遮罩层关闭侧边栏
  const handleOverlayClick = () => {
    if (onClose) {
      onClose();
    }
  };

  // 处理移动端点击链接后关闭侧边栏
  const handleLinkClick = () => {
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* 遮罩层 - 仅在移动端显示 */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'overlay-open' : ''}`}
        onClick={handleOverlayClick}
      />
      
      {/* 侧边栏 */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <nav className="sidebar-nav">
          {/* 主要导航 */}
          <div className="nav-section">
            <h3 className="nav-title">主要功能</h3>
            <ul className="nav-list">
              <li>
                <NavLink 
                  to="/chat" 
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={handleLinkClick}
                >
                  💬 聊天
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/channels" 
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={handleLinkClick}
                >
                  📁 频道管理
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/files" 
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={handleLinkClick}
                >
                  📎 文件传输
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/search" 
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={handleLinkClick}
                >
                  🔍 搜索消息
                </NavLink>
              </li>
            </ul>
          </div>

          {/* 频道列表 */}
          <div className="nav-section">
            <h3 className="nav-title">频道列表</h3>
            {loading ? (
              <div className="loading">加载中...</div>
            ) : (
              <ul className="nav-list channels-list">
                {channels.map(channel => (
                  <li key={channel}>
                    <NavLink 
                      to={`/chat/${encodeURIComponent(channel)}`}
                      className={({ isActive }) => 
                        `nav-link channel-link ${isActive ? 'active' : ''}`
                      }
                      onClick={handleLinkClick}
                    >
                      # {channel}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;