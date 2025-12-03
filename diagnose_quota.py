#!/usr/bin/env python3
"""快速诊断 API 配额问题"""

import os
import requests
import time

api_key = os.environ.get('GEMINI_API_KEY')
project = os.environ.get('GOOGLE_CLOUD_PROJECT')

print("=" * 70)
print("🔍 API 配额快速诊断")
print("=" * 70)
print(f"API Key: {api_key[:20]}...{api_key[-4:]}")
print(f"Project: {project}")
print("=" * 70)

# 快速连续发送 20 个请求，看是否触发 429
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

print("\n正在发送 20 个连续请求测试速率限制...")
print("(免费账户通常在 15 个请求/分钟时触发限制)\n")

success = 0
rate_limited = 0

for i in range(20):
    payload = {
        "contents": [{
            "parts": [{"text": f"测试 {i+1}"}]
        }]
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code == 200:
            success += 1
            print(f"✅ 请求 #{i+1:2d}: 成功")
        elif response.status_code == 429:
            rate_limited += 1
            print(f"❌ 请求 #{i+1:2d}: 速率限制 (429) - 这是免费账户的典型表现")
            print(f"\n响应内容: {response.text[:200]}")
            break
        else:
            print(f"⚠️  请求 #{i+1:2d}: HTTP {response.status_code}")
            
        time.sleep(0.1)  # 稍微延迟避免过快
        
    except Exception as e:
        print(f"❌ 请求 #{i+1:2d}: 错误 - {str(e)[:50]}")

print("\n" + "=" * 70)
print("📊 测试结果")
print("=" * 70)
print(f"成功请求: {success}")
print(f"速率限制: {rate_limited}")

if rate_limited > 0:
    print("\n❌ 结论: 这是一个免费账户")
    print("\n免费账户限制:")
    print("  • 每分钟 15 个请求")
    print("  • 每天 1,500 个请求")
    print("\n解决方案:")
    print("  1. 确认您的 AI Studio 账户已启用付费")
    print("  2. 访问 https://console.cloud.google.com/billing")
    print(f"  3. 检查项目 '{project}' 的计费状态")
    print("  4. 如果未启用计费，请关联付费账单账户")
else:
    print(f"\n✅ 结论: 成功发送 {success} 个请求，未触发速率限制")
    print("\n这可能表示:")
    print("  • 付费账户配置正确")
    print("  • 或者还未达到免费账户的限制阈值")
    print("\n建议:")
    print("  • 完全重启 Antigravity 以确保使用新配置")
    print("  • 访问 Google Cloud Console 确认计费状态")

print("=" * 70)
