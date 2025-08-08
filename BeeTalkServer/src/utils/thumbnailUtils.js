const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec } = require('child_process')
const util = require('util')
const crypto = require('crypto')

const execAsync = util.promisify(exec)

class ThumbnailUtils {
  constructor() {
    // 缩略图缓存目录
    this.cacheDir = path.join(os.tmpdir(), 'beetalk-thumbnails')
    this.ensureCacheDir()
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  // 生成缓存文件名
  getCacheFileName(mid, filepath, maxSize = 256) {
    const hash = crypto.createHash('md5').update(`${mid}-${filepath}-${maxSize}`).digest('hex')
    return path.join(this.cacheDir, `${hash}.jpg`)
  }

  // 检查缓存是否存在
  isCached(mid, filepath, maxSize = 256) {
    const cacheFile = this.getCacheFileName(mid, filepath, maxSize)
    return fs.existsSync(cacheFile)
  }

  // 从缓存读取缩略图
  getFromCache(mid, filepath, maxSize = 256) {
    const cacheFile = this.getCacheFileName(mid, filepath, maxSize)
    if (fs.existsSync(cacheFile)) {
      return fs.readFileSync(cacheFile)
    }
    return null
  }

  // 保存到缓存
  saveToCache(mid, filepath, buffer, maxSize = 256) {
    const cacheFile = this.getCacheFileName(mid, filepath, maxSize)
    fs.writeFileSync(cacheFile, buffer)
  }

  isImage(mimetype) {
    return mimetype && mimetype.startsWith('image/')
  }

  isVideo(mimetype) {
    return mimetype && mimetype.startsWith('video/')
  }

  getFileExtension(filename) {
    return path.extname(filename).toLowerCase()
  }

  async convertHeicToJpeg(inputPath) {
    const tempOutput = path.join(os.tmpdir(), `heic-convert-${Date.now()}.jpg`)
    const platform = process.platform

    try {
      if (platform === 'darwin') {
        // macOS 使用 sips
        await execAsync(`sips -s format jpeg "${inputPath}" --out "${tempOutput}"`)
      } else {
        // Linux 假设已安装 imagemagick
        await execAsync(`magick convert "${inputPath}" "${tempOutput}"`)
      }

      return tempOutput
    } catch (error) {
      throw new Error(`HEIC 转 JPEG 失败: ${error.message}`)
    }
  }

  async generateImageThumbnail(filepath, maxSize = 256) {
    let tempFile = null
    try {
      const ext = this.getFileExtension(filepath)

      // 对 HEIC/HEIF 等不支持格式先转换
      if (ext === '.heic' || ext === '.heif') {
        tempFile = await this.convertHeicToJpeg(filepath)
        filepath = tempFile
      }

      const buffer = await sharp(filepath)
        .resize(maxSize, maxSize, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer()

      return buffer
    } catch (error) {
      throw new Error(`Failed to generate image thumbnail: ${error.message}`)
    } finally {
      // 清理临时文件
      if (tempFile && fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile)
      }
    }
  }

  async generateVideoThumbnail(filepath, maxSize = 256) {
    try {
      const outputPath = path.join(os.tmpdir(), `thumb_${Date.now()}.jpg`)
      const command = `ffmpeg -i "${filepath}" -ss 00:00:01 -vframes 1 -vf "scale=${maxSize}:${maxSize}:force_original_aspect_ratio=decrease" -y "${outputPath}"`
      await execAsync(command)

      const buffer = fs.readFileSync(outputPath)
      fs.unlinkSync(outputPath)

      return buffer
    } catch (error) {
      throw new Error(`Failed to generate video thumbnail: ${error.message}`)
    }
  }

  async generateThumbnail(filepath, mimetype, maxSize = 256) {
    if (!fs.existsSync(filepath)) {
      throw new Error('File not found');
    }
    const mime = require('mime');
    if (!mimetype) {
      mimetype = mime.getType(filepath);
    }
  
    if (this.isImage(mimetype)) {
      return await this.generateImageThumbnail(filepath, maxSize);
    } else if (this.isVideo(mimetype)) {
      return await this.generateVideoThumbnail(filepath, maxSize);
    } else {
      throw new Error(`File type not supported for thumbnail generation (mimetype: ${mimetype})`);
    }
  }

  // 新的带缓存的缩略图生成方法
  async generateThumbnailWithCache(mid, filepath, mimetype, maxSize = 256) {
    // 检查缓存
    const cached = this.getFromCache(mid, filepath, maxSize)
    if (cached) {
      console.log(`📸 Using cached thumbnail for mid: ${mid}`)
      return cached
    }

    // 生成新的缩略图
    console.log(`📸 Generating new thumbnail for mid: ${mid}`)
    const buffer = await this.generateThumbnail(filepath, mimetype, maxSize)
    
    // 保存到缓存
    this.saveToCache(mid, filepath, buffer, maxSize)
    
    return buffer
  }
  
}

module.exports = new ThumbnailUtils()
