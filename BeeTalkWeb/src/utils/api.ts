// API 配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// 构建完整的API URL
const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${API_PREFIX}${endpoint}`;
};

// 构建文件URL
const buildFileUrl = (filePath: string): string => {
  return `${filePath}`;
};

// 通用请求方法
const apiRequest = async (url: string, options: RequestInit = {}): Promise<any> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API 工具类
export class ApiService {
  // 获取频道列表
  static async getChannels(): Promise<string[]> {
    const response = await apiRequest(buildApiUrl('/channels'));
    return response.data || [];
  }

  // 添加新频道
  static async addChannel(name: string): Promise<any> {
    return await apiRequest(buildApiUrl('/channels'), {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // 获取标签列表
  static async getTags(): Promise<string[]> {
    const response = await apiRequest(buildApiUrl('/tags'));
    return response.data || [];
  }

  // 搜索消息
  static async searchMessages(params: {
    mid?: string;
    channel?: string;
    tag?: string;
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const url = buildApiUrl(`/message?${searchParams.toString()}`);
    return await apiRequest(url);
  }

  // 创建文本消息
  static async createTextMessage(data: {
    channel: string;
    tag: string;
    content: string;
  }): Promise<any> {
    return await apiRequest(buildApiUrl('/new'), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 上传文件
  static async uploadFile(formData: FormData): Promise<any> {
    const url = buildApiUrl('/new');
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // 删除消息
  static async deleteMessage(mid: string): Promise<any> {
    return await apiRequest(buildApiUrl(`/delete?mid=${mid}`), {
      method: 'DELETE',
    });
  }

  // 获取缩略图URL
  static getThumbnailUrl(mid: string): string {
    return buildApiUrl(`/thumbnail?mid=${mid}`);
  }

  // 构建文件URL
  static getFileUrl(filePath: string): string {
    return buildFileUrl(filePath);
  }

  // 获取API基础URL（用于直接访问）
  static getBaseUrl(): string {
    return API_BASE_URL;
  }
}

// 导出常量
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  PREFIX: API_PREFIX,
  buildApiUrl,
  buildFileUrl,
}; 