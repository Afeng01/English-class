#!/bin/bash

# 下载NLTK数据（如果还没有）
echo "正在检查NLTK数据..."
python -c "
import nltk
import os

nltk_data_dir = os.path.expanduser('~/nltk_data')
if not os.path.exists(nltk_data_dir):
    print('下载NLTK数据...')
    nltk.download('wordnet')
    nltk.download('omw-1.4')
    print('NLTK数据下载完成')
else:
    print('NLTK数据已存在，跳过下载')
"

# 启动应用
echo "启动FastAPI应用..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
