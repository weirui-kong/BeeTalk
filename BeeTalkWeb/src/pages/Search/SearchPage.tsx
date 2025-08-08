import { useState, useEffect } from 'react';
import { ApiService } from '../../utils/api';
import './SearchPage.css';

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SearchFilters {
  channel: string;
  tag: string;
  page: number;
  limit: number;
  sortOrder: 'desc' | 'asc';
}

const SearchPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableChannels, setAvailableChannels] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<SearchFilters>({
    channel: '',
    tag: '',
    page: 1,
    limit: 20,
    sortOrder: 'desc'
  });

  // 获取可用的标签和频道
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [tagsResult, channelsResult] = await Promise.all([
          ApiService.getTags(),
          ApiService.getChannels()
        ]);

        setAvailableTags(tagsResult);
        setAvailableChannels(channelsResult);
      } catch (error) {
        console.error('获取筛选选项失败:', error);
      }
    };

    fetchFilters();
  }, []);

  // 搜索消息
  const searchMessages = async () => {
    setLoading(true);
    try {
      const result = await ApiService.searchMessages({
        channel: filters.channel || undefined,
        tag: filters.tag || undefined,
        page: filters.page,
        limit: filters.limit,
        sortOrder: filters.sortOrder
      });

      if (result.success) {
        setMessages(result.data);
        setPagination(result.pagination);
      } else {
        console.error('搜索失败:', result.error);
        setMessages([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('搜索请求失败:', error);
      setMessages([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    searchMessages();
  }, [filters]);

  // 处理筛选器变化
  const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' ? { page: 1 } : {}) // 非分页参数变化时重置到第一页
    }));
  };

  // 分页处理
  const handlePageChange = (newPage: number) => {
    handleFilterChange('page', newPage);
  };

  return (
    <div className="search-page">
      <div className="page-header">
        <h2>搜索消息</h2>
        <p>在所有频道中搜索和筛选消息</p>
      </div>

      {/* 搜索筛选器 */}
      <div className="search-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="channel-filter">频道:</label>
            <select
              id="channel-filter"
              value={filters.channel}
              onChange={(e) => handleFilterChange('channel', e.target.value)}
              className="filter-select"
            >
              <option value="">所有频道</option>
              {availableChannels.map(channel => (
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="tag-filter">标签:</label>
            <select
              id="tag-filter"
              value={filters.tag}
              onChange={(e) => handleFilterChange('tag', e.target.value)}
              className="filter-select"
            >
              <option value="">所有标签</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-filter">排序:</label>
            <select
              id="sort-filter"
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'desc' | 'asc')}
              className="filter-select"
            >
              <option value="desc">最新优先</option>
              <option value="asc">最旧优先</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="limit-filter">每页条数:</label>
            <select
              id="limit-filter"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="filter-select"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* 搜索结果 */}
      <div className="search-results">
        {loading ? (
          <div className="loading">搜索中...</div>
        ) : (
          <>
            {/* 结果统计 */}
            {pagination && (
              <div className="results-summary">
                <p>
                  共找到 {pagination.total} 条消息，
                  当前第 {pagination.page} / {pagination.totalPages} 页
                </p>
              </div>
            )}

            {/* 消息列表 */}
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="no-results">
                  <p>未找到匹配的消息</p>
                  <p>请尝试调整搜索条件</p>
                </div>
              ) : (
                <div className="messages-list">
                  {messages.map(message => (
                    <div key={message.mid} className={`search-message ${message.type}`}>
                      <div className="message-meta">
                        <span className="message-channel">#{message.channel}</span>
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
                            <span className="file-icon">📎</span>
                            <a 
                              href={`${message.content}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-link"
                            >
                              {message.content.split('/').pop()}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 分页器 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="page-button"
                >
                  上一页
                </button>
                
                <div className="page-info">
                  <span>第 {pagination.page} / {pagination.totalPages} 页</span>
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="page-button"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;