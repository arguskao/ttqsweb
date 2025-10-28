#!/usr/bin/env node

/**
 * 直接執行 SQL 遷移腳本
 * Direct SQL Migration Executor
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 數據庫連接
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

if (!DATABASE_URL) {
    console.error('❌ 錯誤：未設置 DATABASE_URL 環境變量');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function executeSqlFile(filePath, description) {
    console.log(`\n🔄 執行: ${description}`);
    console.log(`📄 文件: ${filePath}`);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ 文件不存在: ${filePath}`);
            return false;
        }
        
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        console.log(`📊 SQL 內容長度: ${sqlContent.length} 字符`);
        
        // 分割 SQL 語句（以分號分割，但要小心處理函數定義中的分號）
        const statements = sqlContent
            .split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/) // 分割但忽略字符串內的分號
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 找到 ${statements.length} 個 SQL 語句`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.length === 0) continue;
            
            try {
                console.log(`   執行語句 ${i + 1}/${statements.length}...`);
                await sql.unsafe(statement);
                successCount++;
            } catch (error) {
                console.error(`   ❌ 語句 ${i + 1} 失敗:`, error.message);
                console.error(`   SQL: ${statement.substring(0, 100)}...`);
                errorCount++;
                
                // 如果是非關鍵錯誤，繼續執行
                if (error.message.includes('already exists') || 
                    error.message.includes('does not exist') ||
                    error.message.includes('duplicate key')) {
                    console.log(`   ⚠️  非關鍵錯誤，繼續執行`);
                } else {
                    // 關鍵錯誤，停止執行
                    console.error(`   🛑 關鍵錯誤，停止執行`);
                    return false;
                }
            }
        }
        
        console.log(`✅ ${description} 完成`);
        console.log(`   成功: ${successCount} 個語句`);
        console.log(`   錯誤: ${errorCount} 個語句`);
        
        return errorCount === 0 || errorCount < statements.length / 2; // 如果錯誤少於一半，認為成功
        
    } catch (error) {
        console.error(`❌ ${description} 失敗:`, error.message);
        return false;
    }
}

async function checkTableStructure() {
    console.log('\n🔍 檢查 documents 表結構...');
    
    try {
        const columns = await sql`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'documents' 
            ORDER BY ordinal_position
        `;
        
        console.log('📋 documents 表欄位:');
        columns.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        return columns;
        
    } catch (error) {
        console.error('❌ 檢查表結構失敗:', error.message);
        return [];
    }
}

async function addMissingColumns() {
    console.log('\n🔧 添加缺失的欄位...');
    
    const alterStatements = [
        'ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_name VARCHAR(255)',
        'ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path VARCHAR(500)',
        'ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true',
        'ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ];
    
    for (const statement of alterStatements) {
        try {
            console.log(`   執行: ${statement}`);
            await sql.unsafe(statement);
            console.log(`   ✅ 成功`);
        } catch (error) {
            console.log(`   ⚠️  ${error.message}`);
        }
    }
}

async function updateExistingRecords() {
    console.log('\n🔄 更新現有記錄...');
    
    try {
        const result = await sql`
            UPDATE documents 
            SET 
                original_name = COALESCE(original_name, title),
                file_path = COALESCE(file_path, CONCAT('legacy/', COALESCE(category, 'general'), '/', id, '_', REPLACE(title, ' ', '_'))),
                is_active = COALESCE(is_active, COALESCE(is_public, true))
            WHERE original_name IS NULL OR file_path IS NULL OR is_active IS NULL
        `;
        
        console.log(`✅ 更新了 ${result.length} 筆記錄`);
        
    } catch (error) {
        console.error('❌ 更新記錄失敗:', error.message);
    }
}

async function main() {
    console.log('🚀 SQL 遷移執行器');
    console.log('📅 執行時間:', new Date().toISOString());
    
    try {
        // 步驟 1: 檢查當前表結構
        const currentColumns = await checkTableStructure();
        
        // 步驟 2: 添加缺失的欄位
        await addMissingColumns();
        
        // 步驟 3: 更新現有記錄
        await updateExistingRecords();
        
        // 步驟 4: 檢查更新後的表結構
        console.log('\n🔍 檢查更新後的表結構...');
        await checkTableStructure();
        
        // 步驟 5: 測試插入一筆記錄
        console.log('\n🧪 測試插入記錄...');
        try {
            const testResult = await sql`
                INSERT INTO documents (
                    title, 
                    description, 
                    file_url, 
                    file_type, 
                    file_size, 
                    category, 
                    original_name,
                    file_path,
                    uploaded_by
                ) VALUES (
                    'test_file.txt',
                    '測試文件',
                    'https://example.com/test.txt',
                    'text/plain',
                    1024,
                    'general',
                    'test_file.txt',
                    'test/test_file.txt',
                    26
                ) 
                ON CONFLICT (file_url) DO NOTHING
                RETURNING id
            `;
            
            if (testResult.length > 0) {
                console.log(`✅ 測試插入成功，ID: ${testResult[0].id}`);
                
                // 刪除測試記錄
                await sql`DELETE FROM documents WHERE id = ${testResult[0].id}`;
                console.log('🗑️  測試記錄已刪除');
            } else {
                console.log('ℹ️  測試記錄已存在，跳過插入');
            }
            
        } catch (error) {
            console.error('❌ 測試插入失敗:', error.message);
        }
        
        console.log('\n🎉 遷移完成！');
        console.log('📝 現在可以測試文件同步功能了');
        
    } catch (error) {
        console.error('❌ 遷移過程中發生錯誤:', error);
    }
}

// 執行遷移
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { main };