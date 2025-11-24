#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
有道词典API测试脚本
用于验证API配置是否正确
"""

import asyncio
import httpx
from dotenv import load_dotenv
import os
import sys

# 添加项目路径
sys.path.insert(0, os.path.dirname(__file__))

# 加载环境变量
load_dotenv()

from app.api.dictionary import query_youdao_dict, truncate

async def test_youdao_api():
    """测试有道词典API"""
    print("=" * 60)
    print("有道词典API测试")
    print("=" * 60)

    # 检查配置
    app_key = os.getenv('YOUDAO_APP_KEY')
    app_secret = os.getenv('YOUDAO_APP_SECRET')

    if not app_key or not app_secret:
        print("❌ 错误：未配置有道词典API")
        print("请在 .env 文件中设置 YOUDAO_APP_KEY 和 YOUDAO_APP_SECRET")
        return

    print(f"✅ 配置已加载")
    print(f"   APP_KEY: {app_key[:10]}...")
    print(f"   APP_SECRET: {app_secret[:10]}...")
    print()

    # 测试单词列表
    test_words = ['hello', 'oak', 'running', 'went', 'world']

    async with httpx.AsyncClient() as client:
        for word in test_words:
            print(f"测试单词: {word}")
            print("-" * 40)

            try:
                result = await query_youdao_dict(client, word)

                if result:
                    print(f"✅ 查询成功")
                    print(f"   单词: {result.get('word')}")
                    print(f"   音标: {result.get('phonetic', '无')}")
                    print(f"   释义数量: {len(result.get('meanings', []))}")

                    # 显示第一个释义
                    meanings = result.get('meanings', [])
                    if meanings:
                        first_meaning = meanings[0]
                        definitions = first_meaning.get('definitions', [])
                        if definitions:
                            print(f"   释义示例: {definitions[0].get('definition')}")
                else:
                    print(f"❌ 查询失败：未返回结果")

            except Exception as e:
                print(f"❌ 查询失败：{e}")

            print()

    print("=" * 60)
    print("测试完成")
    print("=" * 60)

if __name__ == '__main__':
    asyncio.run(test_youdao_api())
