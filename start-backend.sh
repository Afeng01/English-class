#!/bin/bash

echo "🚀 启动后端服务..."
cd backend
python3 -m uvicorn main:app --reload --port 8000
