#!/bin/bash
# 有道API配置验证脚本

echo "======================================"
echo "第1步：验证有道API配置"
echo "======================================"
python3 diagnose_youdao.py

echo ""
echo "======================================"
echo "如果上面显示【错误码: 0】和【✅ 成功】"
echo "说明配置正确，可以继续下一步"
echo ""
echo "第2步：启动后端服务"
echo "命令：python3 -m uvicorn main:app --reload --port 8000"
echo ""
echo "第3步：打开前端测试"
echo "访问：http://localhost:5173"
echo "======================================"
