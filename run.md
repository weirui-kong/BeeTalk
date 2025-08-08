# BeeTalk 项目启动和调试指南

## 项目结构

```
BeeTalk/
├── BeeTalkServer/     # 后端服务器 (Node.js + Express)
└── BeeTalkWeb/        # 前端应用 (React + TypeScript)
```

## 环境要求

- Node.js 18+ 
- npm

## 后端启动 (BeeTalkServer)

### 1. 安装依赖
```bash
cd BeeTalkServer
npm install
```

### 2. 启动服务器
```bash
# 开发模式启动
npm start

# 或者直接运行
node src/server-https.js
```

### 3. 服务器配置
- **HTTP端口**: 8000
- **HTTPS端口**: 8081
- **API基础路径**: `/api/v1/`

### 4. 访问地址
- HTTP: `http://localhost:8000`
- HTTPS: `https://localhost:8081`

## 前端启动 (BeeTalkWeb)

### 1. 安装依赖
```bash
cd BeeTalkWeb
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问地址
- 开发服务器: `http://localhost:8899`

## 调试指南

### 后端调试

#### 1. 查看日志
后端使用 Morgan 中间件记录请求日志，可以在控制台查看：
```bash
# 启动时查看实时日志
npm start
```

## 生产环境部署

### 1. 前端构建
```bash
cd BeeTalkWeb
npm run build
```

### 2. 后端部署
```bash
cd BeeTalkServer
npm install --production
npm start
```

### 3. 环境变量配置
创建 `.env` 文件配置生产环境变量：
```env
NODE_ENV=production
PORT=8000
HTTPS_PORT=8081
```