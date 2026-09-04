---
name: convert-video
description: '把 iPhone/.mov 视频转码为浏览器可播放的 MP4（H.264+AAC），并同步更新文章中的 <video> 引用。适用于 ffmpeg 视频转换、mov 转 mp4、压缩视频体积、修复网页视频无法播放、更新博客视频格式等场景。Use when: converting videos for web, MOV to MP4, compressing video files, fixing browser playback of videos, updating <source> tags in markdown.'
---

# 视频转换 (Video Conversion)

把项目里的 `.mov`（QuickTime / HEVC）视频转码为浏览器兼容的 MP4（H.264 + AAC），并在文章中更新 `<video>` 标签引用。

## When to Use

- 需要把 `.mov` 转成 `.mp4`
- 需要压缩视频体积（加快网页加载）
- 新增视频到博客

## 关键事实

- 浏览器兼容性最好的格式：**MP4** 容器 + **H.264** 视频编码 + **AAC** 音频编码
- iPhone 拍摄的视频是 HEVC (H.265) 编码，默认转 H.264 体积可能接近原文件甚至更大；需要小体积时用压缩参数
- 用 `-movflags +faststart` 把 moov atom 移到文件开头，支持边下边播

## Procedure

### 1. 确认源文件

```bash
ls -lh public/videos/IMG_XXXX.*
```

- 确认源 `.mov` 存在、路径正确
- 确认输出 `.mp4` 是否已存在（避免误覆盖）

### 2. 转码

优先使用项目脚本（自动处理验证和文章引用提示）：

```bash
bash .agents/skills/convert-video/scripts/convert.sh public/videos/IMG_XXXX.mov
```

需要压缩体积时加 `--compress`：

```bash
bash .agents/skills/convert-video/scripts/convert.sh public/videos/IMG_XXXX.mov --compress
```

手动转码（无脚本时）：

```bash
# 标准转换（画质优先）
ffmpeg -i input.mov -c:v libx264 -c:a aac -movflags +faststart -y output.mp4

# 压缩转换（体积优先，CRF 越大画质越低体积越小，28 是平衡值）
ffmpeg -i input.mov -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k -movflags +faststart -y output.mp4
```

### 3. 验证结果

```bash
ffprobe -v error -show_entries stream=codec_name,codec_type,width,height -of default=noprint_wrappers=1 output.mp4
ls -lh output.mp4
```

- 必须看到 `codec_name=h264`（视频）和 `codec_name=aac`（音频）
- 检查文件体积是否符合预期（压缩模式应明显变小）

### 4. 更新文章引用

在 `src/content/**/index.md` 中找到对应 `<video>` 标签，把 `src` 和 `type` 都改为 mp4：

```md
<video controls>
  <source src="/videos/IMG_XXXX.mp4" type="video/mp4" />
</video>
```

### 5. 完成检查

- [ ] `.mp4` 文件已生成在 `public/videos/`
- [ ] `ffprobe` 显示 h264 + aac
- [ ] 文章 `<source>` 指向 `.mp4` 且 `type="video/mp4"`
- [ ] （可选）建议用户实际预览确认播放正常

## Decision Points

- **体积是否重要？** 文章图片/视频多、追求加载速度 → 用 `--compress`；画质优先 → 标准转换
- **CRF 值怎么调？** 28 平衡；26~27 更好画质、更大体积；30+ 更小体积、略降画质
- **源文件如何处理？** 转码成功后，原始的 `.mov` 可保留（备份）或删除（确认播放正常后）

## 参考

- 转换脚本: [scripts/convert.sh](./scripts/convert.sh)
