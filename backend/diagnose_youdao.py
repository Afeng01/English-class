#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
有道API详细诊断脚本
"""

import hashlib
import time
import uuid
import requests
from dotenv import load_dotenv
import os

load_dotenv()

APP_KEY = os.getenv('YOUDAO_APP_KEY')
APP_SECRET = os.getenv('YOUDAO_APP_SECRET')
YOUDAO_URL = 'https://openapi.youdao.com/api'

def truncate(q):
    """截断文本"""
    if q is None:
        return None
    size = len(q)
    return q if size <= 20 else q[0:10] + str(size) + q[size - 10:size]

def test_api():
    print("=" * 70)
    print("有道词典API详细诊断")
    print("=" * 70)

    # 1. 检查配置
    print("\n【步骤1】检查配置")
    print(f"APP_KEY: {APP_KEY}")
    print(f"APP_SECRET: {APP_SECRET}")

    if not APP_KEY or not APP_SECRET:
        print("❌ 配置缺失！")
        return

    # 2. 准备请求参数
    print("\n【步骤2】准备请求参数")
    q = "hello"
    salt = str(uuid.uuid4())
    curtime = str(int(time.time()))

    # 计算签名
    sign_str = APP_KEY + truncate(q) + salt + curtime + APP_SECRET
    sign = hashlib.sha256(sign_str.encode('utf-8')).hexdigest()

    print(f"查询词: {q}")
    print(f"truncate(q): {truncate(q)}")
    print(f"salt: {salt}")
    print(f"curtime: {curtime}")
    print(f"签名字符串: {sign_str[:50]}...")
    print(f"签名: {sign}")

    # 3. 构造请求数据
    data = {
        'q': q,
        'from': 'en',
        'to': 'zh-CHS',
        'appKey': APP_KEY,
        'salt': salt,
        'sign': sign,
        'signType': 'v3',
        'curtime': curtime,
    }

    print("\n【步骤3】发送请求")
    print(f"URL: {YOUDAO_URL}")
    print(f"请求数据: {data}")

    # 4. 发送请求
    try:
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        response = requests.post(YOUDAO_URL, data=data, headers=headers, timeout=10)

        print(f"\n【步骤4】接收响应")
        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        print(f"\n完整响应内容:")
        print("-" * 70)
        print(response.text)
        print("-" * 70)

        # 解析响应
        if response.status_code == 200:
            data = response.json()
            error_code = data.get('errorCode')

            print(f"\n【诊断结果】")
            print(f"错误码: {error_code}")

            error_messages = {
                '0': '✅ 成功',
                '101': '❌ 缺少必填的参数',
                '102': '❌ 不支持的语言类型',
                '103': '❌ 翻译文本过长',
                '108': '❌ 应用ID无效 - 请检查：\n   1. APP_KEY是否正确\n   2. 应用是否已激活\n   3. 是否选择了"自然语言翻译"服务',
                '110': '❌ 无相关服务的有效实例',
                '111': '❌ 开发者账号无效',
                '113': '❌ q不能为空',
                '202': '❌ 签名检验失败 - 请检查：\n   1. APP_SECRET是否正确\n   2. 签名算法是否正确',
                '401': '❌ 账户已欠费',
                '411': '❌ 访问频率受限'
            }

            message = error_messages.get(error_code, f'未知错误码: {error_code}')
            print(f"说明: {message}")

            if error_code == '0':
                print("\n✅ API调用成功！")
                print(f"翻译结果: {data.get('translation')}")
                print(f"基本释义: {data.get('basic', {}).get('explains')}")

    except Exception as e:
        print(f"\n❌ 请求失败: {e}")

    print("\n" + "=" * 70)
    print("【建议】")
    print("1. 访问 https://ai.youdao.com/console 检查应用状态")
    print("2. 确认应用已选择\"自然语言翻译\"服务")
    print("3. 确认应用状态为\"已激活\"")
    print("4. 检查APP_KEY和APP_SECRET是否完全匹配（无多余空格）")
    print("=" * 70)

if __name__ == '__main__':
    test_api()
