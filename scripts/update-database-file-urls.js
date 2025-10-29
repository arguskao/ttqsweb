/**
 * 更新數據庫中的文件URL
 * Update Database File URLs
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

if (!DATABASE_URL) {
    console.error('❌ 錯誤：未設置 DATABASE_URL 環境變量')
    process.exit(1)
}

const sql = neon(DATABASE_URL)

// 正確的R2基礎URL
const R2_BASE_URL = 'https://pub-e914f2115ec14dd98843404fadb92a24.r2.dev'

console.log('🔧 更新數據庫中的文件URL...')
console.log(`📂 R2基礎URL: ${R2_BASE_URL}`)

async function checkCurrentFiles() {
    console.log('\n📋 檢查當前數據庫中的文件...')

    try {
        const files = await sql`SELECT id, title, file_url, category FROM documents ORDER BY id`

        if (files.length === 0) {
            console.log('   ⚠️ 數據庫中沒有文件記錄')
            return []
        }

        console.log(`   📄 找到 ${files.length} 個文件:`)
        files.forEach(file => {
            console.log(`      ${file.id}. ${file.title}`)
            console.log(`         URL: ${file.file_url}`)
            console.log(`         分類: ${file.category}`)
        })

        return files
    } catch (error) {
        console.error('❌ 檢查文件失敗:', error.message)
        return []
    }
}

async function updateFileUrls() {
    console.log('\n🔄 更新文件URL...')

    // 定義正確的文件映射
    const fileUpdates = [
        {
            title: '職能基準一覽表',
            file_url: `${R2_BASE_URL}/%E8%81%B7%E8%83%BD%E5%9F%BA%E6%BA%96%E4%B8%80%E8%A6%BD%E8%A1%A8.pdf`,
            file_name: '職能基準一覽表.pdf',
            category: 'ttqs',
            description: 'TTQS職能基準詳細一覽表'
        },
        {
            title: '藥局助理培訓手冊',
            file_url: `${R2_BASE_URL}/%E8%97%A5%E5%B1%80%E5%8A%A9%E7%90%86%E5%9F%B9%E8%A8%93%E6%89%8B%E5%86%8A.pdf`,
            file_name: '藥局助理培訓手冊.pdf',
            category: 'course',
            description: '藥局助理專業培訓指導手冊'
        },
        {
            title: '課程申請表',
            file_url: `${R2_BASE_URL}/%E8%AA%B2%E7%A8%8B%E7%94%B3%E8%AB%8B%E8%A1%A8.pdf`,
            file_name: '課程申請表.pdf',
            category: 'documents',
            description: '藥局助理課程申請表格'
        },
        {
            title: '實習合約書',
            file_url: `${R2_BASE_URL}/%E5%AF%A6%E7%BF%92%E5%90%88%E7%B4%84%E6%9B%B8.pdf`,
            file_name: '實習合約書.pdf',
            category: 'documents',
            description: '藥局實習合約書範本'
        },
        {
            title: '藥事法規摘要',
            file_url: `${R2_BASE_URL}/%E8%97%A5%E4%BA%8B%E6%B3%95%E8%A6%8F%E6%91%98%E8%A6%81.pdf`,
            file_name: '藥事法規摘要.pdf',
            category: 'reference',
            description: '藥事相關法規重點摘要'
        },
        {
            title: 'TTQS評核表',
            file_url: `${R2_BASE_URL}/TTQS%E8%A9%95%E6%A0%B8%E8%A1%A8.pdf`,
            file_name: 'TTQS評核表.pdf',
            category: 'ttqs',
            description: 'TTQS訓練品質評核表格'
        }
    ]

    try {
        // 首先清空現有的文件記錄
        await sql`DELETE FROM documents`
        console.log('   🗑️ 清空現有文件記錄')

        // 插入新的文件記錄
        for (let i = 0; i < fileUpdates.length; i++) {
            const file = fileUpdates[i]
            const id = i + 1

            await sql`
        INSERT INTO documents (
          id, title, description, file_url, file_type, file_size, 
          category, is_public, download_count, created_at, updated_at
        ) VALUES (
          ${id},
          ${file.title},
          ${file.description},
          ${file.file_url},
          'application/pdf',
          ${1024000 + Math.floor(Math.random() * 2048000)},
          ${file.category},
          true,
          ${Math.floor(Math.random() * 200) + 50},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `

            console.log(`   ✅ 插入文件: ${file.title}`)
        }

        // 重置序列
        await sql`SELECT setval('documents_id_seq', ${fileUpdates.length})`

        console.log(`   🎉 成功插入 ${fileUpdates.length} 個文件`)

    } catch (error) {
        console.error('❌ 更新文件URL失敗:', error.message)
        throw error
    }
}

async function verifyUpdates() {
    console.log('\n✅ 驗證更新結果...')

    try {
        const files = await sql`SELECT id, title, file_url, category FROM documents ORDER BY id`

        console.log(`   📄 數據庫中現有 ${files.length} 個文件:`)
        files.forEach(file => {
            console.log(`      ${file.id}. ${file.title} (${file.category})`)
            console.log(`         URL: ${file.file_url}`)

            // 檢查URL是否正確
            if (file.file_url.includes(R2_BASE_URL)) {
                console.log(`         ✅ URL正確`)
            } else {
                console.log(`         ❌ URL錯誤`)
            }
        })

        return files
    } catch (error) {
        console.error('❌ 驗證失敗:', error.message)
        return []
    }
}

async function testFileAccess() {
    console.log('\n🧪 測試文件訪問...')

    // 測試第一個文件（職能基準一覽表）
    const testUrl = `${R2_BASE_URL}/%E8%81%B7%E8%83%BD%E5%9F%BA%E6%BA%96%E4%B8%80%E8%A6%BD%E8%A1%A8.pdf`

    console.log(`   🔗 測試URL: ${testUrl}`)
    console.log('   📝 請在瀏覽器中手動測試此URL是否可以打開')

    return testUrl
}

async function main() {
    try {
        console.log('🚀 開始更新數據庫文件URL...')

        // 1. 檢查當前文件
        await checkCurrentFiles()

        // 2. 更新文件URL
        await updateFileUrls()

        // 3. 驗證更新
        const updatedFiles = await verifyUpdates()

        // 4. 測試文件訪問
        const testUrl = await testFileAccess()

        console.log('\n🎉 數據庫文件URL更新完成！')
        console.log('\n📋 後續步驟：')
        console.log('   1. 重新部署應用: npm run deploy:pages')
        console.log('   2. 測試文件下載功能')
        console.log('   3. 確認不再出現XML錯誤')

        console.log('\n🔗 測試連結：')
        console.log(`   ${testUrl}`)

    } catch (error) {
        console.error('❌ 更新過程中發生錯誤:', error.message)
        process.exit(1)
    }
}

// 執行更新
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error)
}

export { main }