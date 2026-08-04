#!/usr/bin/env bash
# 把视频转码为浏览器兼容的 MP4 (H.264 + AAC)
# 用法:
#   bash convert.sh <input> [--compress] [--crf N]
# 示例:
#   bash convert.sh public/videos/IMG_2507.mov
#   bash convert.sh public/videos/IMG_2621.mov --compress
#   bash convert.sh public/videos/IMG_2621.mov --compress --crf 30
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "用法: bash convert.sh <input.mov> [--compress] [--crf N]" >&2
  exit 1
fi

INPUT="$1"
COMPRESS=false
CRF=28

for arg in "${@:2}"; do
  case "$arg" in
    --compress) COMPRESS=true ;;
    --crf) shift ;;
    --crf=*) CRF="${arg#*=}" ;;
    *) if [[ "$arg" =~ ^[0-9]+$ ]]; then CRF="$arg"; fi ;;
  esac
done

# 检查输入文件
if [ ! -f "$INPUT" ]; then
  echo "错误: 找不到输入文件 $INPUT" >&2
  exit 1
fi

# 生成输出路径 (把扩展名换成 .mp4)
EXT="${INPUT##*.}"
OUTPUT="${INPUT%.$EXT}.mp4"

if [ -f "$OUTPUT" ]; then
  echo "警告: 输出文件已存在, 将被覆盖: $OUTPUT"
fi

echo "=== 输入文件 ==="
ls -lh "$INPUT"
echo "=== 开始转码 ==="

if [ "$COMPRESS" = true ]; then
  echo "模式: 压缩 (CRF=$CRF, preset=slow, audio=128k)"
  ffmpeg -hide_banner -loglevel warning -i "$INPUT" \
    -c:v libx264 -crf "$CRF" -preset slow \
    -c:a aac -b:a 128k \
    -movflags +faststart -y "$OUTPUT"
else
  echo "模式: 标准 (画质优先)"
  ffmpeg -hide_banner -loglevel warning -i "$INPUT" \
    -c:v libx264 -c:a aac \
    -movflags +faststart -y "$OUTPUT"
fi

echo "=== 验证输出 ==="
ffprobe -v error -show_entries stream=codec_name,codec_type,width,height \
  -of default=noprint_wrappers=1 "$OUTPUT"
ls -lh "$OUTPUT"

echo
echo "=== 完成! 下一步 ==="
echo "把文章 src/content/**/index.md 中的引用改为:"
echo "  <source src=\"${OUTPUT#public}\" type=\"video/mp4\" />"
