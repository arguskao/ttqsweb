<template>
  <div class="container">
    <section class="section">
      <!-- Back Button -->
      <div class="mb-4">
        <router-link to="/community/groups" class="button is-light">
          <span class="icon">
            <i class="fas fa-arrow-left"></i>
          </span>
          <span>返回群組列表</span>
        </router-link>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="has-text-centered">
        <p>載入中...</p>
      </div>

      <!-- Group Content -->
      <div v-else-if="group">
        <!-- Group Header -->
        <div class="box mb-4">
          <div class="level">
            <div class="level-left">
              <div class="level-item">
                <div>
                  <h1 class="title">{{ group.name }}</h1>
                  <p class="subtitle is-6">
                    <span class="tag" :class="getGroupTypeClass(group.groupType)">
                      {{ getGroupTypeLabel(group.groupType) }}
                    </span>
                  </p>
                  <p class="content">{{ group.description }}</p>
                </div>
              </div>
            </div>
            <div class="level-right">
              <div class="level-item">
                <div class="has-text-right">
                  <p class="heading">成員</p>
                  <p class="title is-5">{{ group.memberCount }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="field is-grouped mt-4">
            <div class="control">
              <button
                v-if="!isMember"
                class="button is-primary"
                @click="joinGroup"
                :disabled="isJoining"
              >
                {{ isJoining ? '加入中...' : '加入群組' }}
              </button>
              <button v-else class="button is-success" disabled>
                <span class="icon">
                  <i class="fas fa-check"></i>
                </span>
                <span>已加入</span>
              </button>
            </div>
            <div class="control">
              <router-link
                v-if="isMember"
                :to="`/community/forum?groupId=${group.id}`"
                class="button is-info"
              >
                <span class="icon">
                  <i class="fas fa-comments"></i>
                </span>
                <span>查看討論</span>
              </router-link>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <ul>
            <li :class="{ 'is-active': activeTab === 'members' }">
              <a @click="activeTab = 'members'">成員 ({{ group.memberCount }})</a>
            </li>
            <li :class="{ 'is-active': activeTab === 'topics' }">
              <a @click="activeTab = 'topics'">討論主題 ({{ topics.length }})</a>
            </li>
          </ul>
        </div>

        <!-- Members Tab -->
        <div v-if="activeTab === 'members'">
          <div v-if="members.length === 0" class="notification is-info">
            <p>目前沒有成員</p>
          </div>

          <div v-else class="columns is-multiline">
            <div v-for="member in members" :key="member.id" class="column is-one-quarter">
              <div class="box has-text-centered">
                <figure class="image is-64x64 mb-3" style="margin-left: auto; margin-right: auto">
                  <img :src="`https://ui-avatars.com/api/?name=${member.userName}`" alt="avatar" />
                </figure>
                <p class="title is-6">{{ member.userName }}</p>
                <p class="subtitle is-7">
                  <span class="tag" :class="getRoleClass(member.role)">
                    {{ getRoleLabel(member.role) }}
                  </span>
                </p>
                <p class="has-text-grey-light is-size-7">
                  加入於 {{ formatDate(member.joinedAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Topics Tab -->
        <div v-if="activeTab === 'topics'">
          <div v-if="topics.length === 0" class="notification is-info">
            <p>目前沒有討論主題</p>
          </div>

          <div v-else>
            <div v-for="topic in topics" :key="topic.id" class="box mb-3">
              <div class="level">
                <div class="level-left">
                  <div class="level-item">
                    <div class="is-flex-grow-1">
                      <h3 class="title is-5 mb-2">
                        <router-link :to="`/community/forum/topics/${topic.id}`">
                          {{ topic.title }}
                        </router-link>
                      </h3>
                      <p class="subtitle is-6 mb-2">
                        <span class="tag" :class="getCategoryClass(topic.category)">
                          {{ getCategoryLabel(topic.category) }}
                        </span>
                      </p>
                      <p class="has-text-grey-light is-size-7">
                        由 <strong>{{ topic.authorName }}</strong> 發起於
                        {{ formatDate(topic.createdAt) }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="level-right">
                  <div class="level-item">
                    <div class="has-text-right">
                      <p class="heading">回覆</p>
                      <p class="title is-5">{{ topic.replyCount }}</p>
                    </div>
                  </div>
                  <div class="level-item">
                    <div class="has-text-right">
                      <p class="heading">瀏覽</p>
                      <p class="title is-5">{{ topic.viewCount }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Not Found -->
      <div v-else class="notification is-danger">
        <p>群組不存在</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { apiService } from '@/services/api-enhanced'

interface Group {
  id: number
  name: string
  description: string
  groupType: string
  memberCount: number
  createdAt: string
}

interface Member {
  id: number
  userName: string
  role: string
  joinedAt: string
}

interface Topic {
  id: number
  title: string
  content: string
  category: string
  authorName: string
  createdAt: string
  replyCount: number
  viewCount: number
}

const route = useRoute()
const groupId = Number(route.params.id)

const group = ref<Group | null>(null)
const members = ref<Member[]>([])
const topics = ref<Topic[]>([])
const loading = ref(false)
const isJoining = ref(false)
const isMember = ref(false)
const activeTab = ref('members')

const loadGroup = async () => {
  loading.value = true
  try {
    const response = await apiService.get<Group>(`/groups/${groupId}`)
    if (response.success && response.data) {
      group.value = response.data
    }
  } catch (error) {
    console.error('載入群組失敗:', error)
  } finally {
    loading.value = false
  }
}

const loadMembers = async () => {
  try {
    const response = await apiService.get<Member[]>(`/groups/${groupId}/members`)
    if (response.success && response.data) {
      members.value = response.data
    }
  } catch (error) {
    console.error('載入成員失敗:', error)
  }
}

const loadTopics = async () => {
  try {
    const response = await apiService.get<Topic[]>(`/groups/${groupId}/topics`)
    if (response.success && response.data) {
      topics.value = response.data
    }
  } catch (error) {
    console.error('載入討論主題失敗:', error)
  }
}

const joinGroup = async () => {
  isJoining.value = true
  try {
    await apiService.post(`/groups/${groupId}/join`, {})
    isMember.value = true
    if (group.value) {
      group.value.memberCount += 1
    }
    alert('成功加入群組！')
  } catch (error) {
    console.error('加入群組失敗:', error)
    alert('加入群組失敗，請稍後再試')
  } finally {
    isJoining.value = false
  }
}

const getGroupTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    course: '課程學習',
    interest: '興趣交流',
    alumni: '校友會',
    study: '讀書會'
  }
  return labels[type] || type
}

const getGroupTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    course: 'is-info',
    interest: 'is-success',
    alumni: 'is-warning',
    study: 'is-primary'
  }
  return classes[type] ?? ''
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    question: '提問',
    discussion: '討論',
    announcement: '公告',
    resource: '資源分享'
  }
  return labels[category] || category
}

const getCategoryClass = (category: string) => {
  const classes: Record<string, string> = {
    question: 'is-info',
    discussion: 'is-primary',
    announcement: 'is-warning',
    resource: 'is-success'
  }
  return classes[category] ?? ''
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: '管理員',
    moderator: '版主',
    member: '成員'
  }
  return labels[role] || role
}

const getRoleClass = (role: string) => {
  const classes: Record<string, string> = {
    admin: 'is-danger',
    moderator: 'is-warning',
    member: 'is-info'
  }
  return classes[role] ?? ''
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(() => {
  loadGroup()
  loadMembers()
  loadTopics()
})
</script>

<style scoped>
.box {
  transition: box-shadow 0.3s ease;
}

.box:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
