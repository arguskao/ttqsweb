<template>
  <div class="container">
    <section class="section">
      <h1 class="title">練習場地預約</h1>
      <p class="subtitle">預約練習場地，持續精進您的專業技能</p>

      <div class="tabs">
        <ul>
          <li :class="{ 'is-active': activeTab === 'venues' }">
            <a @click="activeTab = 'venues'">可用場地</a>
          </li>
          <li :class="{ 'is-active': activeTab === 'bookings' }">
            <a @click="activeTab = 'bookings'">我的預約</a>
          </li>
        </ul>
      </div>

      <!-- Venues Tab -->
      <div v-if="activeTab === 'venues'">
        <div v-if="loading" class="has-text-centered">
          <p>載入中...</p>
        </div>

        <div v-else-if="venues.length === 0" class="notification is-info">
          <p>目前沒有可用場地</p>
        </div>

        <div v-else class="columns is-multiline">
          <div v-for="venue in venues" :key="venue.id" class="column is-half">
            <div class="card">
              <div class="card-content">
                <p class="title is-5">{{ venue.name }}</p>
                <p class="content">{{ venue.description }}</p>
                <div class="content">
                  <p>
                    <span class="icon-text">
                      <span class="icon">
                        <i class="fas fa-map-marker-alt"></i>
                      </span>
                      <span>{{ venue.location }}</span>
                    </span>
                  </p>
                  <p>
                    <span class="icon-text">
                      <span class="icon">
                        <i class="fas fa-users"></i>
                      </span>
                      <span>容納人數：{{ venue.capacity }} 人</span>
                    </span>
                  </p>
                  <p>
                    <span class="icon-text">
                      <span class="icon">
                        <i class="fas fa-clock"></i>
                      </span>
                      <span>開放時間：{{ venue.availableHours }}</span>
                    </span>
                  </p>
                  <div v-if="venue.facilities && venue.facilities.length > 0" class="tags mt-2">
                    <span v-for="facility in venue.facilities" :key="facility" class="tag is-info">
                      {{ facility }}
                    </span>
                  </div>
                </div>
              </div>
              <footer class="card-footer">
                <a class="card-footer-item" @click="selectVenue(venue)">預約</a>
              </footer>
            </div>
          </div>
        </div>
      </div>

      <!-- Bookings Tab -->
      <div v-if="activeTab === 'bookings'">
        <div v-if="loading" class="has-text-centered">
          <p>載入中...</p>
        </div>

        <div v-else-if="bookings.length === 0" class="notification is-info">
          <p>您還沒有任何預約記錄</p>
        </div>

        <div v-else>
          <div v-for="booking in bookings" :key="booking.id" class="box">
            <article class="media">
              <div class="media-content">
                <div class="content">
                  <p>
                    <strong>預約日期：</strong> {{ formatDate(booking.bookingDate) }}
                    <br />
                    <strong>時間：</strong> {{ booking.startTime }} - {{ booking.endTime }}
                    <br />
                    <strong>目的：</strong> {{ booking.purpose || '未填寫' }}
                    <br />
                    <span
                      class="tag mt-2"
                      :class="{
                        'is-warning': booking.status === 'pending',
                        'is-success': booking.status === 'confirmed',
                        'is-danger': booking.status === 'cancelled',
                        'is-info': booking.status === 'completed'
                      }"
                    >
                      {{ getStatusLabel(booking.status) }}
                    </span>
                  </p>
                </div>
                <div v-if="booking.status === 'pending' || booking.status === 'confirmed'">
                  <button class="button is-small is-danger" @click="cancelBooking(booking.id)">
                    取消預約
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- Booking Modal -->
    <div class="modal" :class="{ 'is-active': showBookingModal }">
      <div class="modal-background" @click="showBookingModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">預約場地：{{ selectedVenue?.name }}</p>
          <button class="delete" @click="showBookingModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">預約日期</label>
            <div class="control">
              <input v-model="newBooking.bookingDate" class="input" type="date" />
            </div>
          </div>

          <div class="columns">
            <div class="column">
              <div class="field">
                <label class="label">開始時間</label>
                <div class="control">
                  <input v-model="newBooking.startTime" class="input" type="time" />
                </div>
              </div>
            </div>
            <div class="column">
              <div class="field">
                <label class="label">結束時間</label>
                <div class="control">
                  <input v-model="newBooking.endTime" class="input" type="time" />
                </div>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">使用目的</label>
            <div class="control">
              <textarea
                v-model="newBooking.purpose"
                class="textarea"
                placeholder="請簡述使用目的"
              ></textarea>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="createBooking">確認預約</button>
          <button class="button" @click="showBookingModal = false">取消</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api'

const activeTab = ref('venues')
const venues = ref<any[]>([])
const bookings = ref<any[]>([])
const loading = ref(false)
const showBookingModal = ref(false)
const selectedVenue = ref<any>(null)

const newBooking = ref({
  bookingDate: '',
  startTime: '',
  endTime: '',
  purpose: ''
})

const loadVenues = async () => {
  loading.value = true
  try {
    const response = await api.get('/api/v1/venues')
    venues.value = response.data.data
  } catch (error) {
    console.error('載入場地失敗:', error)
  } finally {
    loading.value = false
  }
}

const loadBookings = async () => {
  loading.value = true
  try {
    const response = await api.get('/api/v1/bookings/my-bookings')
    bookings.value = response.data.data
  } catch (error) {
    console.error('載入預約記錄失敗:', error)
  } finally {
    loading.value = false
  }
}

const selectVenue = (venue: any) => {
  selectedVenue.value = venue
  showBookingModal.value = true
}

const createBooking = async () => {
  if (!selectedVenue.value) return

  try {
    await api.post(`/api/v1/venues/${selectedVenue.value.id}/bookings`, newBooking.value)
    showBookingModal.value = false
    newBooking.value = { bookingDate: '', startTime: '', endTime: '', purpose: '' }
    alert('預約成功！')
    activeTab.value = 'bookings'
    loadBookings()
  } catch (error: any) {
    alert(error.response?.data?.error?.message || '預約失敗，請稍後再試')
  }
}

const cancelBooking = async (bookingId: number) => {
  if (!confirm('確定要取消此預約嗎？')) return

  try {
    await api.patch(`/api/v1/bookings/${bookingId}/cancel`)
    alert('已取消預約')
    loadBookings()
  } catch (error) {
    alert('取消預約失敗')
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-TW')
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待確認',
    confirmed: '已確認',
    cancelled: '已取消',
    completed: '已完成'
  }
  return labels[status] || status
}

watch(activeTab, (newTab) => {
  if (newTab === 'venues') {
    loadVenues()
  } else if (newTab === 'bookings') {
    loadBookings()
  }
})

onMounted(() => {
  loadVenues()
})
</script>
