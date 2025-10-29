<template>
  <div class="box">
    <h2 class="title is-4">就業媒合統計</h2>

    <div class="columns">
      <div class="column is-6">
        <h3 class="subtitle is-5">就業成功率</h3>
        <div class="success-metrics">
          <div class="metric-item">
            <div class="metric-value">{{ jobStats.overallSuccessRate }}%</div>
            <div class="metric-label">整體就業成功率</div>
            <div
              class="metric-change"
              :class="jobStats.successRateChange >= 0 ? 'positive' : 'negative'"
            >
              <i
                :class="jobStats.successRateChange >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"
              ></i>
              {{ Math.abs(jobStats.successRateChange) }}%
            </div>
          </div>

          <div class="metric-item">
            <div class="metric-value">{{ jobStats.averageSalary }}</div>
            <div class="metric-label">平均薪資 (新台幣)</div>
            <div class="metric-change positive">
              <i class="fas fa-arrow-up"></i>
              {{ jobStats.salaryGrowth }}%
            </div>
          </div>
        </div>
      </div>

      <div class="column is-6">
        <h3 class="subtitle is-5">學員就業成功率</h3>
        <div class="employment-chart">
          <canvas ref="employmentChart" width="400" height="200"></canvas>
        </div>
      </div>
    </div>

    <div class="columns">
      <div class="column is-12">
        <h3 class="subtitle is-5">行業分布</h3>
        <div class="industry-distribution">
          <div
            v-for="industry in jobStats.industryDistribution"
            :key="industry.name"
            class="industry-item"
          >
            <div class="industry-info">
              <span class="industry-name">{{ industry.name }}</span>
              <span class="industry-count">{{ industry.count }} 人</span>
            </div>
            <div class="industry-bar">
              <div
                class="industry-progress"
                :style="{ width: `${(industry.count / jobStats.totalEmployed) * 100}%` }"
              ></div>
            </div>
            <span class="industry-percentage">
              {{ ((industry.count / jobStats.totalEmployed) * 100).toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface IndustryDistribution {
  name: string
  count: number
}

interface JobStats {
  overallSuccessRate: number
  successRateChange: number
  averageSalary: number
  salaryGrowth: number
  industryDistribution: IndustryDistribution[]
  totalEmployed: number
}

interface Props {
  jobStats: JobStats
}

const props = defineProps<Props>()

const employmentChart = ref<HTMLCanvasElement>()

const createEmploymentChart = () => {
  const canvas = employmentChart.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 簡單的就業成功率圖表
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const data = [
    { month: '1月', rate: 75 },
    { month: '2月', rate: 78 },
    { month: '3月', rate: 82 },
    { month: '4月', rate: 85 },
    { month: '5月', rate: 88 },
    { month: '6月', rate: 90 }
  ]

  const padding = 40
  const chartWidth = canvas.width - 2 * padding
  const chartHeight = canvas.height - 2 * padding

  // 繪製網格線
  ctx.strokeStyle = '#e5e5e5'
  ctx.lineWidth = 1

  for (let i = 0; i <= 5; i++) {
    const y = padding + (i / 5) * chartHeight
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(padding + chartWidth, y)
    ctx.stroke()
  }

  // 繪製數據線
  ctx.strokeStyle = '#48c774'
  ctx.lineWidth = 3
  ctx.beginPath()

  data.forEach((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((point.rate - 70) / 25) * chartHeight

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()

  // 繪製數據點
  ctx.fillStyle = '#48c774'
  data.forEach((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((point.rate - 70) / 25) * chartHeight

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
  createEmploymentChart()
})

watch(
  () => props.jobStats,
  () => {
    createEmploymentChart()
  },
  { deep: true }
)
</script>

<style scoped>
.success-metrics {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.metric-item {
  text-align: center;
  padding: 1rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fafafa;
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  color: #3273dc;
  margin-bottom: 0.5rem;
}

.metric-label {
  color: #666;
  margin-bottom: 0.5rem;
}

.metric-change {
  font-size: 0.875rem;
  font-weight: 600;
}

.metric-change.positive {
  color: #48c774;
}

.metric-change.negative {
  color: #ff3860;
}

.employment-chart {
  position: relative;
  height: 200px;
}

canvas {
  max-width: 100%;
  height: auto;
}

.industry-distribution {
  margin-top: 1rem;
}

.industry-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background: #fafafa;
}

.industry-info {
  display: flex;
  justify-content: space-between;
  min-width: 200px;
  margin-right: 1rem;
}

.industry-name {
  font-weight: 600;
  color: #363636;
}

.industry-count {
  color: #666;
  font-size: 0.875rem;
}

.industry-bar {
  flex: 1;
  height: 20px;
  background: #e5e5e5;
  border-radius: 10px;
  margin-right: 1rem;
  overflow: hidden;
}

.industry-progress {
  height: 100%;
  background: linear-gradient(90deg, #3273dc, #48c774);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.industry-percentage {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
  color: #3273dc;
}
</style>
