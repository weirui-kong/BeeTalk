const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// 数据库工具类
class DBUtils {
    
    // 1. 列举所有的 channel
    getAllChannels() {
        return db.get('channels').value();
    }
    
    // 2. 列举所有的 tag（遍历所有消息并去重）
    getAllTags() {
        const messages = db.get('messages').filter({ deleted: false }).value();
        const tags = new Set();
        messages.forEach(message => {
            if (message.tag) {
                tags.add(message.tag);
            }
        });
        return Array.from(tags);
    }
    
    // 3. 根据 mid 获取消息
    getMessageById(mid) {
        return db.get('messages')
            .find({ mid: mid, deleted: false })
            .value();
    }
    
    // 4. 根据 mid 删除消息（打上标记）
    deleteMessage(mid) {
        const message = db.get('messages')
            .find({ mid: mid })
            .value();
            
        if (!message) {
            return false;
        }
        
        db.get('messages')
            .find({ mid: mid })
            .assign({ deleted: true })
            .write();
            
        return true;
    }
    
    // 5. 新增一条消息
    createMessage(channel, tag, content, fileInfo, ua) {
        const newMessage = {
            mid: uuidv4(),
            channel: channel,
            tag: tag || '',
            type: fileInfo ? 'file' : 'text', // 'text' 或 'file'
            content: fileInfo ? fileInfo : content,
            timestamp: Date.now(),
            ua: ua || '',
            deleted: false
        };
        console.log(newMessage);
        // 验证 channel 是否存在
        const channels = this.getAllChannels();
        if (!channels.includes(newMessage.channel)) {
            throw new Error(`Channel '${newMessage.channel}' does not exist`);
        }
        
        // 验证消息类型
        if (!['text', 'file'].includes(newMessage.type)) {
            throw new Error("Message type must be 'text' or 'file'");
        }
        
        db.get('messages')
            .push(newMessage)
            .write();
            
        return newMessage;
    }
    
    // 6. 搜索消息（支持 channel、tag、mid 组合查询和分页）
    searchMessages(filters = {}, pagination = {}) {
        const { channel, tag, mid } = filters;
        const { page = 1, limit = 20, sortOrder = 'desc' } = pagination;
        
        let query = db.get('messages').filter({ deleted: false });
        
        // 应用过滤条件
        if (channel) {
            query = query.filter({ channel: channel });
        }
        
        if (tag) {
            query = query.filter({ tag: tag });
        }
        
        if (mid) {
            query = query.filter({ mid: mid });
        }
        
        // 获取所有符合条件的消息
        let messages = query.value();
        
        // 按时间戳排序
        messages.sort((a, b) => {
            return sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
        });
        
        // 计算分页
        const total = messages.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const paginatedMessages = messages.slice(offset, offset + limit);
        
        return {
            messages: paginatedMessages,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                totalPages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }
    
    // 辅助方法：添加新的 channel
    addChannel(channelName) {
        const channels = this.getAllChannels();
        if (!channels.includes(channelName)) {
            db.get('channels')
                .push(channelName)
                .write();
            return true;
        }
        return false;
    }
}

module.exports = new DBUtils();