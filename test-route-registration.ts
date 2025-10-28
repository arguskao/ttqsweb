// 測試路由註冊
import { router } from './src/api/index'

const testRouteRegistration = async () => {
    console.log('🔍 測試路由註冊...')

    try {
        console.log('✅ API模組導入成功')

        // 檢查路由器是否存在
        if (router) {
            console.log('✅ 路由器存在')

            // 獲取所有路由
            const routes = router.getRoutes()
            console.log(`📊 總共註冊了 ${routes.length} 個路由`)

            // 查找文檔相關的路由
            const documentRoutes = routes.filter(route =>
                route.path.includes('documents') || route.path.includes('files')
            )

            console.log(`📄 文檔相關路由數量: ${documentRoutes.length}`)
            documentRoutes.forEach(route => {
                console.log(`  ${route.method} ${route.path}`)
            })

            // 檢查特定的問題路由
            const downloadRoute = routes.find(route =>
                route.path === '/api/v1/documents/:id/download'
            )

            if (downloadRoute) {
                console.log('✅ 找到下載路由:', downloadRoute.path)
            } else {
                console.log('❌ 沒有找到下載路由')
            }

            const categoriesRoute = routes.find(route =>
                route.path === '/api/v1/files/categories/list'
            )

            if (categoriesRoute) {
                console.log('✅ 找到分類路由:', categoriesRoute.path)
            } else {
                console.log('❌ 沒有找到分類路由')
            }

            // 列出所有路由
            console.log('\n📋 所有註冊的路由:')
            routes.forEach(route => {
                console.log(`  ${route.method} ${route.path}`)
            })

        } else {
            console.log('❌ 路由器不存在')
        }
    } catch (error) {
        console.error('❌ 測試失敗:', error)
    }
}

testRouteRegistration().catch(console.error)