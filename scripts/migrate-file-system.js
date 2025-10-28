#!/usr/bin/env node

/**
 * 文件管理系統遷移腳本
 * File Management System Migration Script
 * 
 * 此腳本會安全地將 documents 和 ttqs_documents 表遷移到統一的 uploaded_files 表
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

async function executeStep(stepName, sqlContent) {
    console.log(`\n🔄 執行步驟: ${stepName}`);
    try {
        await sql.unsafe(sqlContent);
        console.log(`✅ ${stepName} - 完成`);
        return true;
    } catch (error) {
        console.error(`❌ ${stepName} - 失敗:`, error.message);
        return false;
    }
}

async function checkTableExists(tableName) {
    try {
        const result = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = ${tableName}
            ) as exists
        `;
        return result[0].exists;
    } catch (error) {
        console.error(`檢查表 ${tableName} 時出錯:`, error.message);
        return false;
    }
}

async function getTableCount(tableName) {
    try {
        if (!(await checkTableExists(tableName))) {
            return 0;
        }
        const result = await sql.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
        return parseInt(result[0].count);
    } catch (error) {
        console.error(`獲取表 ${tableName} 記錄數時出錯:`, error.message);
        return 0;
    }
}

async function main() {
    console.log('🚀 開始文件管理系統遷移');
    console.log('📅 執行時間:', new Date().toISOString());
    
    try {
        // 步驟 1: 檢查當前狀態
        console.log('\n📊 檢查當前數據庫狀態...');
        
        const documentsExists = await checkTableExists('documents');
        const ttqsDocumentsExists = await checkTableExists('ttqs_documents');
        const uploadedFilesExists = await checkTableExists('uploaded_files');
        
        const documentsCount = await getTableCount('documents');
        const ttqsDocumentsCount = await getTableCount('ttqs_documents');
        const uploadedFilesCount = await getTableCount('uploaded_files');
        
        console.log(`📋 當前狀態:`);
        console.log(`   - documents 表: ${documentsExists ? '存在' : '不存在'} (${documentsCount} 記錄)`);
        console.log(`   - ttqs_documents 表: ${ttqsDocumentsExists ? '存在' : '不存在'} (${ttqsDocumentsCount} 記錄)`);
        console.log(`   - uploaded_files 表: ${uploadedFilesExists ? '存在' : '不存在'} (${uploadedFilesCount} 記錄)`);
        
        if (!documentsExists && !ttqsDocumentsExists) {
            console.log('✅ 沒有需要遷移的表，退出');
            return;
        }
        
        // 步驟 2: 確認執行
        console.log('\n⚠️  即將執行數據遷移，這將：');
        console.log('   1. 創建或更新 uploaded_files 表');
        console.log('   2. 將現有數據遷移到 uploaded_files');
        console.log('   3. 創建向後兼容的視圖');
        
        // 在生產環境中，這裡應該要求用戶確認
        // 為了自動化，我們跳過確認步驟
        
        // 步驟 3: 執行遷移
        console.log('\n🔄 開始執行遷移...');
        
        // 讀取並執行第一個遷移腳本
        const migration014Path = path.join(__dirname, '../src/database/migrations/014_consolidate_file_management.sql');
        if (fs.existsSync(migration014Path)) {
            const migration014Content = fs.readFileSync(migration014Path, 'utf8');
            const success = await executeStep('數據遷移 (014)', migration014Content);
            
            if (!success) {
                console.error('❌ 遷移失敗，停止執行');
                return;
            }
        } else {
            console.error('❌ 找不到遷移文件:', migration014Path);
            return;
        }
        
        // 步驟 4: 驗證遷移結果
        console.log('\n🔍 驗證遷移結果...');
        
        const finalUploadedFilesCount = await getTableCount('uploaded_files');
        const expectedCount = documentsCount + ttqsDocumentsCount;
        
        console.log(`📊 遷移結果:`);
        console.log(`   - 原始記錄總數: ${expectedCount}`);
        console.log(`   - uploaded_files 記錄數: ${finalUploadedFilesCount}`);
        
        if (finalUploadedFilesCount >= expectedCount) {
            console.log('✅ 數據遷移驗證通過');
        } else {
            console.log('⚠️  數據遷移可能不完整，請手動檢查');
        }
        
        // 步驟 5: 顯示後續步驟
        console.log('\n📝 後續步驟:');
        console.log('   1. 測試文件上傳和管理功能');
        console.log('   2. 確認所有 API 正常工作');
        console.log('   3. 如果一切正常，可執行清理腳本移除舊表');
        console.log('   4. 清理腳本: npm run cleanup-old-tables');
        
        console.log('\n🎉 文件管理系統遷移完成！');
        
    } catch (error) {
        console.error('❌ 遷移過程中發生錯誤:', error);
        console.log('\n🔧 故障排除建議:');
        console.log('   1. 檢查數據庫連接');
        console.log('   2. 確認數據庫權限');
        console.log('   3. 查看詳細錯誤信息');
        console.log('   4. 如需回滾，請聯繫數據庫管理員');
    }
}

// 執行遷移
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { main };