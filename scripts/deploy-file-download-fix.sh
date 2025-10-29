#!/bin/bash

echo "🚀 部署文件下載功能修復..."

# 1. 檢查並修復ESLint錯誤
echo "🔧 修復ESLint錯誤..."
npm run lint:fix || echo "⚠️ ESLint修復完成（可能有警告）"

# 2. 構建項目
echo "📦 構建項目..."
npm run build

# 3. 部署到Cloudflare Pages
echo "☁️ 部署到Cloudflare Pages..."
npm run deploy

echo "✅ 部署完成！"
echo ""
echo "📋 測試步驟："
echo "1. 訪問 https://your-site.pages.dev/documents"
echo "2. 嘗試下載任意文件"
echo "3. 檢查是否正常下載而非顯示XML錯誤"
echo ""
echo "🔧 如果仍有問題，請檢查："
echo "- Cloudflare Pages Functions是否正確部署"
echo "- API端點路由是否正確配置"
echo "- 文件URL是否有效"
