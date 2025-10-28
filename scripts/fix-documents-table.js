#!/usr/bin/env node

/**
 * 修復 documents 表結構
 * Fix documents table structure
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_uBHAc2hinfI4@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(DATABASE_URL);

async function main() {
    console.log('🔧 修復 documents 表結構');
    
    try {
        // 一個一個執行 ALTER TABLE 命令
        console.log('1. 添加 original_name 欄位...');
        await sql`ALTER TABLE documents ADD COLUMN original_name VARCHAR(255)`;
        console.log('✅ original_name 添加成功');
        
        console.log('2. 添加 file_path 欄位...');
        await sql`ALTER TABLE documents ADD COLUMN file_path VARCHAR(500)`;
        console.log('✅ file_path 添加成功');
        
        console.log('3. 添加 is_active 欄位...');
        await sql`ALTER TABLE documents ADD COLUMN is_active BOOLEAN DEFAULT true`;
        console.log('✅ is_active 添加成功');
        
        console.log('4. 更新現有記錄...');
        const updateResult = await sql`
            UPDATE documents 
            SET 
                original_name = title,
                file_path = CONCAT('legacy/', COALESCE(category, 'general'), '/', id, '_', REPLACE(title, ' ', '_')),
                is_active = COALESCE(is_public, true)
            WHERE original_name IS NULL
        `;
        console.log(`✅ 更新了記錄`);
        
        console.log('5. 檢查最終結構...');
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'documents' 
            ORDER BY ordinal_position
        `;
        
        console.log('📋 最終表結構:');
        columns.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
        
        console.log('🎉 修復完成！');
        
    } catch (error) {
        console.error('❌ 修復失敗:', error.message);
        
        // 如果欄位已存在，嘗試直接更新
        if (error.message.includes('already exists')) {
            console.log('⚠️  欄位已存在，嘗試更新記錄...');
            try {
                await sql`
                    UPDATE documents 
                    SET 
                        original_name = COALESCE(original_name, title),
                        file_path = COALESCE(file_path, CONCAT('legacy/', COALESCE(category, 'general'), '/', id, '_', REPLACE(title, ' ', '_'))),
                        is_active = COALESCE(is_active, COALESCE(is_public, true))
                `;
                console.log('✅ 記錄更新成功');
            } catch (updateError) {
                console.error('❌ 更新記錄失敗:', updateError.message);
            }
        }
    }
}

main().catch(console.error);