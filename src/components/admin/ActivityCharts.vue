<template>
  <div class="box">
    <h2 class="title is-4">最近30天活動</h2>
    <div class="columns">
      <div class="column is-6">
        <h3 class="subtitle is-5">註冊趨勢</h3>
        <div class="chart-container">
          <canvas ref="registrationChart" width="400" height="200"></canvas>
        </div>
      </div>
      <div class="column is-6">
        <h3 class="subtitle is-5">課程完成率</h3>
        <div class="chart-container">
          <canvas ref="completionChart" width="400" height="200"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface ActivityData {
  registrationTrend: Array<{ date: string; count: number }>
  completionRate: Array<{ date: string; rate: number }>
}

interface Props {
  activityData: ActivityData
}

const props = defineProps<Props>()

const registrationChart = ref<HTMLCanvasElement>()
const completionChart = ref<HTMLCanvasElement>()

const registrationChartInstance: any = null
const completionChartInstance: any = null

const createChart = (canvas: HTMLCanvasElement, data: any, type: 'line' | 'bar') => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 簡單的圖表繪製邏輯
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (type === 'line') {
    drawLineChart(ctx, data, canvas.width, canvas.height)
  } else {
    drawBarChart(ctx, data, canvas.width, canvas.height)
  }
}

const drawLineChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number
) => {
  if (data.length === 0) return

  const padding = 40
  const chartWidth = width - 2 * padding
  const chartHeight = height - 2 * padding

  const maxValue = Math.max(...data.map(d => d.count || d.rate))
  const minValue = Math.min(...data.map(d => d.count || d.rate))

  ctx.strokeStyle = '#3273dc'
  ctx.lineWidth = 2
  ctx.beginPath()

  data.forEach((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y =
      padding +
      chartHeight -
      (((point.count || point.rate) - minValue) / (maxValue - minValue)) * chartHeight

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()

  // 繪製數據點
  ctx.fillStyle = '#3273dc'
  data.forEach((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y =
      padding +
      chartHeight -
      (((point.count || point.rate) - minValue) / (maxValue - minValue)) * chartHeight

    ctx.beginPath()
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fill()
  })
}

const drawBarChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number
) => {
  if (data.length === 0) return

  const padding = 40
  const chartWidth = width - 2 * padding
  const chartHeight = height - 2 * padding
  const barWidth = (chartWidth / data.length) * 0.8

  const maxValue = Math.max(...data.map(d => d.count || d.rate))

  ctx.fillStyle = '#48c774'

  data.forEach((point, index) => {
    const x =
      padding + (index / data.length) * chartWidth + (chartWidth / data.length - barWidth) / 2
    const barHeight = ((point.count || point.rate) / maxValue) * chartHeight
    const y = padding + chartHeight - barHeight

    ctx.fillRect(x, y, barWidth, barHeight)
  })
}

const updateCharts = () => {
  if (registrationChart.value && props.activityData.registrationTrend) {
    createChart(registrationChart.value, props.activityData.registrationTrend, 'line')
  }

  if (completionChart.value && props.activityData.completionRate) {
    createChart(completionChart.value, props.activityData.completionRate, 'bar')
  }
}

onMounted(() => {
  updateCharts()
})

watch(
  () => props.activityData,
  () => {
    updateCharts()
  },
  { deep: true }
)
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 200px;
}

canvas {
  max-width: 100%;
  height: auto;
}
</style>

