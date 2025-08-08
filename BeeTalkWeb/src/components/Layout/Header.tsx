import { useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/chat')) {
      const parts = pathname.split('/');
      if (parts.length > 2 && parts[2]) {
        return `聊天 - ${decodeURIComponent(parts[2])}`;
      }
      return '聊天';
    }
    
    switch (pathname) {
      case '/channels':
        return '频道管理';
      case '/files':
        return '文件传输';
      case '/search':
        return '搜索消息';
      default:
        return 'BeeTalk';
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="app-title">🐝 BeeTalk</h1>
      </div>
      
      <div className="header-center">
        <h2 className="page-title">{getPageTitle(location.pathname)}</h2>
      </div>
      
      <div className="header-right">
        <div className="user-info">
          <span className="user-name">用户</span>
          <div className="user-avatar">👤</div>
        </div>
      </div>
    </header>
  );
};

export default Header;