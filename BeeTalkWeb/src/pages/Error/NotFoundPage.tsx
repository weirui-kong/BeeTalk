import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="error-icon">🔍</div>
        <h1 className="error-title">404</h1>
        <h2 className="error-subtitle">页面未找到</h2>
        <p className="error-description">
          抱歉，您要访问的页面不存在或已被移动。
        </p>
        
        <div className="error-actions">
          <Link to="/chat" className="back-home-button">
            返回聊天
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="back-button"
          >
            返回上页
          </button>
        </div>

        <div className="helpful-links">
          <h3>您可能要访问：</h3>
          <ul>
            <li><Link to="/chat">💬 聊天页面</Link></li>
            <li><Link to="/channels">📁 频道管理</Link></li>
            <li><Link to="/files">📎 文件传输</Link></li>
            <li><Link to="/search">🔍 搜索消息</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;