// 直接測試群組Repository
import { StudentGroupRepository, GroupMemberRepository } from './src/api/community/repositories'

const testGroupRepoDirect = async () => {
    console.log('🔍 直接測試群組Repository...')

    try {
        const groupRepo = new StudentGroupRepository()
        const memberRepo = new GroupMemberRepository()

        console.log('\n📋 步驟 1: 測試 findById(2)...')
        const group = await groupRepo.findById(2)
        console.log('群組查詢結果:', group)

        if (group) {
            console.log('\n👥 步驟 2: 測試 findByGroup(2)...')
            const members = await memberRepo.findByGroup(2)
            console.log('成員查詢結果:', members)

            console.log('\n✅ 預期的API響應:')
            const expectedResponse = {
                success: true,
                data: {
                    ...group,
                    members
                }
            }
            console.log(JSON.stringify(expectedResponse, null, 2))
        } else {
            console.log('❌ 群組查詢返回 null')
        }

        console.log('\n📋 步驟 3: 測試 getActiveGroups()...')
        const activeGroups = await groupRepo.getActiveGroups()
        console.log('活躍群組:', activeGroups)

    } catch (error) {
        console.error('❌ 測試失敗:', error)
    }
}

testGroupRepoDirect().catch(console.error)