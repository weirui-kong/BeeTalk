import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './MainLayout.css';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // 在桌面端自动关闭侧边栏
      if (!mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [sidebarOpen]);

  // 切换侧边栏
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // 关闭侧边栏
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="main-layout">
      {/* 顶部导航栏 */}
      <header className="app-header">
        <div className="header-left">
          {/* 汉堡菜单按钮 - 仅在移动端显示 */}
          {isMobile && (
            <button 
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="切换侧边栏"
            >
              ☰
            </button>
          )}
          <h1 className="app-title">🐝 BeeTalk</h1>
        </div>
        
        <div className="header-center">
          <div className="current-channel">
            <span className="channel-icon">#</span>
            <span>欢迎使用</span>
          </div>
        </div>
        
        <div className="header-right">
          {/* 可以添加其他头部按钮 */}
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="main-content">
        {/* 侧边栏 - 桌面端始终显示，移动端可切换 */}
        {(!isMobile || sidebarOpen) && (
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={closeSidebar}
          />
        )}
        
        {/* 内容区域 */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;