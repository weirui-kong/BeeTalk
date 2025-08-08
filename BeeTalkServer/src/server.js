const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const dbUtils = require('./utils/dbUtils');
const thumbnailUtils = require('./utils/thumbnailUtils');

const app = express();
const HTTP_PORT = 8000;
const HTTPS_PORT = 8081;

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:8899", "https://localhost:8899"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: [
    // 'http://beetalk.shopee.onespirit.fyi:8000',
    'https://beetalk.shopee.onespirit.fyi:8899',
    // 'http://beetalk.shopee.onespirit.fyi:8900',
    'https://beetalk.shopee.onespirit.fyi:8899',
    // 'http://localhost:8000',
    'https://localhost:8443',
    // 开发环境支持
    'http://localhost:8899',
    'https://localhost:8899',
    'http://127.0.0.1:8899',
    'https://127.0.0.1:8899'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置文件上传
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    }
});

// API 路由

// 1. 列出频道
app.get('/api/v1/channels', (req, res) => {
    try {
        const channels = dbUtils.getAllChannels();
        res.json({
            success: true,
            data: channels
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get channels',
            error: error.message
        });
    }
});

// 2. 列出标签
app.get('/api/v1/tags', (req, res) => {
    try {
        const tags = dbUtils.getAllTags();
        res.json({
            success: true,
            data: tags
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get tags',
            error: error.message
        });
    }
});

// 3. 搜索消息 (支持 mid, channel, tag 组合查询和分页)
app.get('/api/v1/message', (req, res) => {
    try {
        const { mid, channel, tag, page = 1, limit = 20, sortOrder = 'desc' } = req.query;
        
        // 构建过滤条件
        const filters = {};
        if (mid) filters.mid = mid;
        if (channel) filters.channel = channel;
        if (tag) filters.tag = tag;
        
        const result = dbUtils.searchMessages(filters, parseInt(page), parseInt(limit), sortOrder);
        
        res.json({
            success: true,
            data: result.messages,
            pagination: {
                currentPage: parseInt(page),
                totalPages: result.totalPages,
                totalItems: result.totalItems,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to search messages',
            error: error.message
        });
    }
});

// 4. 创建新消息
app.post('/api/v1/new', upload.single('file'), (req, res) => {
    try {
        const { channel, tag, content } = req.body;
        const ua = req.headers['user-agent'];
        if (!channel || !tag ) {
            return res.status(400).json({
                success: false,
                message: 'Channel, tag, and content are required'
            });
        }
        
        let fileInfo = null;
        if (req.file) {
            fileInfo = {
                filename: Buffer.from(req.file.filename, 'binary').toString('utf8'),
                originalname: Buffer.from(req.file.originalname, 'binary').toString('utf8'),
                size: req.file.size,
                mimetype: Buffer.from(req.file.mimetype, 'binary').toString('utf8'),
                path: Buffer.from(`./uploads/${req.file.filename}`, 'binary').toString('utf8')
            };
        }
        console.log(fileInfo);
        
        const messageId = dbUtils.createMessage(channel, tag, content, fileInfo, ua);
        
        res.status(201).json({
            success: true,
            message: 'Message created successfully',
            data: {
                mid: messageId,
                channel,
                tag,
                content,
                file: fileInfo
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create message',
            error: error.message
        });
    }
});

// 5. 删除消息
app.delete('/api/v1/delete', (req, res) => {
    try {
        const { mid } = req.query;
        
        if (!mid) {
            return res.status(400).json({
                success: false,
                message: 'Message ID (mid) is required'
            });
        }
        
        const deleted = dbUtils.deleteMessage(mid);
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Message deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete message',
            error: error.message
        });
    }
});

// 6. 生成缩略图
app.get('/api/v1/thumbnail', async (req, res) => {
    try {
        const { mid } = req.query;
        
        if (!mid) {
            return res.status(400).json({
                success: false,
                message: 'Message ID (mid) is required'
            });
        }
        const messages = dbUtils.searchMessages({mid: mid}).messages;
        const file = messages[0];
        console.log(file);
        var filePath = '';
        if (file.type === 'file') {
            filePath = file.content.path;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Message is not a file'
            });
        }

        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
        
        // 生成缩略图（带缓存）
        const thumbnailBuffer = await thumbnailUtils.generateThumbnailWithCache(mid, filePath, file.content.mimetype, 256);
        
        // 设置响应头
        res.set({
            'Content-Type': 'image/jpeg',
            'Content-Length': thumbnailBuffer.length,
            'Cache-Control': 'public, max-age=120'
        });
        
        // 返回缩略图
        res.send(thumbnailBuffer);
        
    } catch (error) {
        console.error('Thumbnail generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate thumbnail',
            error: error.message
        });
    }
});

// 添加新频道的辅助API
app.post('/api/v1/channels', (req, res) => {
    try {
        const { channelName } = req.body;
        
        if (!channelName) {
            return res.status(400).json({
                success: false,
                message: 'Channel name is required'
            });
        }
        
        const added = dbUtils.addChannel(channelName);
        
        if (added) {
            res.status(201).json({
                success: true,
                message: 'Channel added successfully'
            });
        } else {
            res.status(409).json({
                success: false,
                message: 'Channel already exists'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add channel',
            error: error.message
        });
    }
});

// 静态文件服务 (用于访问上传的文件)
app.use('/uploads', express.static(uploadDir));

// 静态文件服务 (用于访问前端产物)
app.use(express.static(path.join(__dirname, '../public')));

// 处理前端路由 - 所有非API请求都返回index.html
app.get('*', (req, res, next) => {
    // 如果是API请求，跳过
    if (req.path.startsWith('/api/')) {
        return next();
    }
    // 如果是静态资源请求，跳过
    if (req.path.startsWith('/uploads/')) {
        return next();
    }
    // 其他请求返回index.html
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// HTTPS 配置函数
function createHttpsServer() {
    const certPath = path.join(__dirname, '../certs');
    const certFile = path.join(certPath, 'cert.pem');
    const keyFile = path.join(certPath, 'key.pem');
    
    // 检查证书文件是否存在
    if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
        console.log('⚠️  SSL证书文件未找到，HTTPS服务器将不会启动');
        console.log(`   请将证书文件放置在以下位置:`);
        console.log(`   - 证书文件: ${certFile}`);
        console.log(`   - 私钥文件: ${keyFile}`);
        return null;
    }
    
    try {
        const options = {
            cert: fs.readFileSync(certFile),
            key: fs.readFileSync(keyFile)
        };
        
        return https.createServer(options, app);
    } catch (error) {
        console.error('❌ 读取SSL证书失败:', error.message);
        return null;
    }
}

// 启动服务器
function startServers() {
    // 启动 HTTP 服务器
    const httpServer = http.createServer(app);
    httpServer.listen(HTTP_PORT, () => {
        console.log(`🌐 HTTP Server is running on port ${HTTP_PORT}`);
        console.log(`   Access: http://beetalk.shopee.onespirit.fyi:${HTTP_PORT}`);
    });
    
    // 启动 HTTPS 服务器
    const httpsServer = createHttpsServer();
    if (httpsServer) {
        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`🔒 HTTPS Server is running on port ${HTTPS_PORT}`);
            console.log(`   Access: https://beetalk.shopee.onespirit.fyi:${HTTPS_PORT}`);
        });
    }
    
    console.log(`\n📋 API endpoints:`);
    console.log(`  GET  /api/v1/channels - List all channels`);
    console.log(`  GET  /api/v1/tags - List all tags`);
    console.log(`  GET  /api/v1/message - Search messages`);
    console.log(`  POST /api/v1/new - Create new message`);
    console.log(`  DELETE /api/v1/delete - Delete message`);
    console.log(`  GET  /api/v1/thumbnail - Generate thumbnail`);
    console.log(`  POST /api/v1/channels - Add new channel`);
    
    console.log(`\n📁 证书文件位置:`);
    console.log(`   - 证书: ${path.join(__dirname, '../certs/cert.pem')}`);
    console.log(`   - 私钥: ${path.join(__dirname, '../certs/key.pem')}`);
}

// 如果直接运行此文件，启动服务器
if (require.main === module) {
    startServers();
}

module.exports = { app, startServers }; 