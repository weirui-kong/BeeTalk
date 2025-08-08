import { useState, useRef } from 'react';
import { ApiService } from '../../utils/api';
import './FileTransferPage.css';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const FileTransferPage = () => {
  const [selectedChannel, setSelectedChannel] = useState('General');
  const [selectedTag, setSelectedTag] = useState('文件');
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploadQueue(prev => [...prev, ...newFiles]);
  };

  // 上传单个文件
  const uploadFile = async (fileItem: UploadProgress, index: number) => {
    const formData = new FormData();
    formData.append('channel', selectedChannel);
    formData.append('tag', selectedTag);
    formData.append('file', fileItem.file);

    // 更新状态为上传中
    setUploadQueue(prev => prev.map((item, i) => 
      i === index ? { ...item, status: 'uploading', progress: 0 } : item
    ));

    try {
      const result = await ApiService.uploadFile(formData);

      if (result.success) {
        // 上传成功
        setUploadQueue(prev => prev.map((item, i) => 
          i === index ? { ...item, status: 'success', progress: 100 } : item
        ));
      } else {
        // 上传失败
        setUploadQueue(prev => prev.map((item, i) => 
          i === index ? { 
            ...item, 
            status: 'error', 
            progress: 0,
            errorMessage: result.error || '上传失败'
          } : item
        ));
      }
    } catch (error) {
      console.error('上传失败:', error);
      setUploadQueue(prev => prev.map((item, i) => 
        i === index ? { 
          ...item, 
          status: 'error', 
          progress: 0,
          errorMessage: '网络错误，上传失败'
        } : item
      ));
    }
  };

  // 开始上传所有文件
  const handleUploadAll = () => {
    uploadQueue.forEach((fileItem, index) => {
      if (fileItem.status === 'pending') {
        uploadFile(fileItem, index);
      }
    });
  };

  // 清除上传队列
  const clearQueue = () => {
    setUploadQueue([]);
  };

  // 移除单个文件
  const removeFile = (index: number) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index));
  };

  // 拖拽处理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className="file-transfer-page">
      <div className="page-header">
        <h2>文件传输</h2>
        <p>上传文件到指定频道，支持拖拽上传</p>
      </div>

      {/* 上传配置 */}
      <div className="upload-config">
        <div className="config-row">
          <div className="form-group">
            <label htmlFor="channel">目标频道:</label>
            <select
              id="channel"
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="select-input"
            >
              <option value="General">General</option>
              <option value="Logs">Logs</option>
              <option value="Development">Development</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="tag">文件标签:</label>
            <input
              id="tag"
              type="text"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              placeholder="输入标签..."
              className="text-input"
            />
          </div>
        </div>
      </div>

      {/* 文件上传区域 */}
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <p className="upload-text">
            <strong>点击选择文件</strong> 或 <strong>拖拽文件到此处</strong>
          </p>
          <p className="upload-hint">
            支持所有文件类型，最大文件大小：500MB
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {/* 上传队列 */}
      {uploadQueue.length > 0 && (
        <div className="upload-queue">
          <div className="queue-header">
            <h3>上传队列 ({uploadQueue.length} 个文件)</h3>
            <div className="queue-actions">
              <button 
                onClick={handleUploadAll}
                disabled={uploadQueue.every(item => item.status !== 'pending')}
                className="upload-all-button"
              >
                开始上传
              </button>
              <button 
                onClick={clearQueue}
                className="clear-button"
              >
                清空队列
              </button>
            </div>
          </div>

          <div className="files-list">
            {uploadQueue.map((fileItem, index) => (
              <div key={index} className={`file-item ${fileItem.status}`}>
                <div className="file-info">
                  <span className="file-name">{fileItem.file.name}</span>
                  <span className="file-size">
                    {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                
                <div className="file-status">
                  {fileItem.status === 'pending' && (
                    <span className="status-badge pending">等待上传</span>
                  )}
                  {fileItem.status === 'uploading' && (
                    <span className="status-badge uploading">上传中...</span>
                  )}
                  {fileItem.status === 'success' && (
                    <span className="status-badge success">✅ 上传成功</span>
                  )}
                  {fileItem.status === 'error' && (
                    <span className="status-badge error">
                      ❌ {fileItem.errorMessage}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => removeFile(index)}
                  className="remove-button"
                  disabled={fileItem.status === 'uploading'}
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileTransferPage;