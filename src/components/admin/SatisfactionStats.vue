<template>
  <div class="box">
    <h2 class="title is-4">課程滿意度統計</h2>

    <div class="columns">
      <div class="column is-6">
        <h3 class="subtitle is-5">整體滿意度</h3>
        <div class="satisfaction-overview">
          <div class="overall-rating">
            <div class="rating-circle">
              <div class="rating-value">{{ satisfactionStats.overallRating }}</div>
              <div class="rating-label">平均評分</div>
            </div>
            <div class="rating-breakdown">
              <div class="rating-item">
                <span class="stars">
                  <i v-for="star in 5" :key="star" class="fas fa-star has-text-warning"></i>
                </span>
                <span class="count">{{ satisfactionStats.ratingDistribution[5] ?? 0 }} 人</span>
              </div>
              <div class="rating-item">
                <span class="stars">
                  <i v-for="star in 4" :key="star" class="fas fa-star has-text-warning"></i>
                  <i class="fas fa-star has-text-light"></i>
                </span>
                <span class="count">{{ satisfactionStats.ratingDistribution[4] ?? 0 }} 人</span>
              </div>
              <div class="rating-item">
                <span class="stars">
                  <i v-for="star in 3" :key="star" class="fas fa-star has-text-warning"></i>
                  <i v-for="star in 2" :key="star" class="fas fa-star has-text-light"></i>
                </span>
                <span class="count">{{ satisfactionStats.ratingDistribution[3] ?? 0 }} 人</span>
              </div>
              <div class="rating-item">
                <span class="stars">
                  <i v-for="star in 2" :key="star" class="fas fa-star has-text-warning"></i>
                  <i v-for="star in 3" :key="star" class="fas fa-star has-text-light"></i>
                </span>
                <span class="count">{{ satisfactionStats.ratingDistribution[2] ?? 0 }} 人</span>
              </div>
              <div class="rating-item">
                <span class="stars">
                  <i class="fas fa-star has-text-warning"></i>
                  <i v-for="star in 4" :key="star" class="fas fa-star has-text-light"></i>
                </span>
                <span class="count">{{ satisfactionStats.ratingDistribution[1] ?? 0 }} 人</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="column is-6">
        <h3 class="subtitle is-5">按講師統計</h3>
        <div class="instructor-stats">
          <div
            v-for="instructor in satisfactionStats.instructorStats"
            :key="instructor.id"
            class="instructor-item"
          >
            <div class="instructor-info">
              <div class="instructor-name">{{ instructor.name }}</div>
              <div class="instructor-courses">{{ instructor.courseCount }} 門課程</div>
            </div>
            <div class="instructor-rating">
              <div class="rating-stars">
                <i
                  v-for="star in 5"
                  :key="star"
                  class="fas fa-star"
                  :class="{
                    'has-text-warning': star <= instructor.averageRating,
                    'has-text-light': star > instructor.averageRating
                  }"
                ></i>
              </div>
              <div class="rating-number">{{ instructor.averageRating.toFixed(1) }}</div>
            </div>
            <div class="instructor-students">{{ instructor.studentCount }} 位學員</div>
          </div>
        </div>
      </div>
    </div>

    <div class="columns">
      <div class="column is-12">
        <h3 class="subtitle is-5">滿意度趨勢</h3>
        <div class="satisfaction-trend">
          <canvas ref="satisfactionChart" width="800" height="200"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface InstructorStat {
  id: number
  name: string
  courseCount: number
  averageRating: number
  studentCount: number
}

interface SatisfactionStats {
  overallRating: number
  ratingDistribution: Record<number, number>
  instructorStats: InstructorStat[]
}

interface Props {
  satisfactionStats: SatisfactionStats
}

const props = defineProps<Props>()

const satisfactionChart = ref<HTMLCanvasElement>()

const createSatisfactionChart = () => {
  const canvas = satisfactionChart.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const data = [
    { month: '1月', rating: 4.2 },
    { month: '2月', rating: 4.3 },
    { month: '3月', rating: 4.4 },
    { month: '4月', rating: 4.5 },
    { month: '5月', rating: 4.6 },
    { month: '6月', rating: 4.7 }
  ]

  const padding = 40
  const chartWidth = canvas.width - 2 * padding
  const chartHeight = canvas.height - 2 * padding

  // 繪製網格線
  ctx.strokeStyle = '#e5e5e5'
  ctx.lineWidth = 1

  for (let i = 0; i <= 4; i++) {
    const y = padding + (i / 4) * chartHeight
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(padding + chartWidth, y)
    ctx.stroke()
  }

  // 繪製數據線
  ctx.strokeStyle = '#ffdd57'
  ctx.lineWidth = 3
  ctx.beginPath()

  data.forEach((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((point.rating - 3) / 2) * chartHeight

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()

  // 繪製數據點
  ctx.fillStyle = '#ffdd57'
  data.forEach((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((point.rating - 3) / 2) * chartHeight

    ctx.beginPath()
    ctx.arc(x, y, 5, 0, 2 * Math.PI)
    ctx.fill()
  })

  // 繪製標籤
  ctx.fillStyle = '#666'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'

  data.forEach((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight + 20

    ctx.fillText(point.month, x, y)
  })
}

onMounted(() => {
  createSatisfactionChart()
})

watch(
  () => props.satisfactionStats,
  () => {
    createSatisfactionChart()
  },
  { deep: true }
)
</script>

<style scoped>
.satisfaction-overview {
  display: flex;
  justify-content: center;
}

.overall-rating {
  text-align: center;
}

.rating-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffdd57, #ffb347);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 auto 1rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.rating-value {
  font-size: 2rem;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.rating-label {
  font-size: 0.875rem;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.rating-breakdown {
  margin-top: 1rem;
}

.rating-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
}

.stars {
  margin-right: 0.5rem;
}

.count {
  font-weight: 600;
  color: #666;
}

.instructor-stats {
  max-height: 300px;
  overflow-y: auto;
}

.instructor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  background: #fafafa;
}

.instructor-info {
  flex: 1;
}

.instructor-name {
  font-weight: 600;
  color: #363636;
  margin-bottom: 0.25rem;
}

.instructor-courses {
  font-size: 0.875rem;
  color: #666;
}

.instructor-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 1rem;
}

.rating-stars {
  margin-bottom: 0.25rem;
}

.rating-number {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffdd57;
}

.instructor-students {
  font-size: 0.875rem;
  color: #666;
  min-width: 80px;
  text-align: right;
}

.satisfaction-trend {
  position: relative;
  height: 200px;
}

canvas {
  max-width: 100%;
  height: auto;
}
</style>

