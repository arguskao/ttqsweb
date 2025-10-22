<template>
  <div class="container mt-5">
    <h1 class="title">TTQS品質管理儀表板</h1>
    <p class="subtitle">訓練品質系統評估與管理</p>

    <!-- PDDRO Compliance Status -->
    <div class="box">
      <h2 class="title is-4">PDDRO體系合規狀態</h2>
      <div class="columns is-multiline">
        <div
          class="column is-one-fifth"
          v-for="(status, key) in complianceData.pddro_status"
          :key="key"
        >
          <div class="has-text-centered">
            <span class="icon is-large" :class="status ? 'has-text-success' : 'has-text-danger'">
              <i class="fas fa-3x" :class="status ? 'fa-check-circle' : 'fa-times-circle'"></i>
            </span>
            <p class="has-text-weight-bold mt-2">{{ getPDDROLabel(String(key)) }}</p>
          </div>
        </div>
      </div>
      <progress
        class="progress is-success mt-4"
        :value="String(complianceData.compliance_rate)"
        max="100"
      >
        {{ complianceData.compliance_rate }}%
      </progress>
      <p class="has-text-centered">合規率: {{ complianceData.compliance_rate?.toFixed(1) }}%</p>
    </div>

    <!-- Overview Statistics -->
    <div class="columns is-multiline">
      <div class="column is-3">
        <div class="box has-background-info-light">
          <p class="heading">訓練計劃總數</p>
          <p class="title">{{ dashboardData.overview?.total_plans ?? 0 }}</p>
        </div>
      </div>
      <div class="column is-3">
        <div class="box has-background-success-light">
          <p class="heading">進行中計劃</p>
          <p class="title">{{ dashboardData.overview?.active_plans ?? 0 }}</p>
        </div>
      </div>
      <div class="column is-3">
        <div class="box has-background-primary-light">
          <p class="heading">已完成計劃</p>
          <p class="title">{{ dashboardData.overview?.completed_plans ?? 0 }}</p>
        </div>
      </div>
      <div class="column is-3">
        <div class="box has-background-warning-light">
          <p class="heading">執行次數</p>
          <p class="title">{{ dashboardData.execution?.total_executions ?? 0 }}</p>
        </div>
      </div>
    </div>

    <!-- Four-Level Evaluation Results -->
    <div class="box">
      <h2 class="title is-4">四層評估結果</h2>
      <div class="columns is-multiline">
        <!-- Level 1: Reaction -->
        <div class="column is-6">
          <div class="card">
            <div class="card-header">
              <p class="card-header-title">Level 1: 反應層評估（滿意度）</p>
            </div>
            <div class="card-content">
              <div class="content">
                <p class="is-size-3 has-text-centered has-text-weight-bold">
                  {{ dashboardData.satisfaction?.avg_satisfaction?.toFixed(2) || 'N/A' }} / 5.0
                </p>
                <p class="has-text-centered">
                  回應數: {{ dashboardData.satisfaction?.total_responses ?? 0 }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Level 2: Learning -->
        <div class="column is-6">
          <div class="card">
            <div class="card-header">
              <p class="card-header-title">Level 2: 學習層評估（測驗成績）</p>
            </div>
            <div class="card-content">
              <div class="content">
                <p class="is-size-3 has-text-centered has-text-weight-bold">
                  {{ dashboardData.learning?.avg_test_score?.toFixed(1) || 'N/A' }} 分
                </p>
                <p class="has-text-centered">
                  通過率: {{ dashboardData.learning?.pass_rate?.toFixed(1) ?? 0 }}%
                  <span
                    class="tag ml-2"
                    :class="getPassRateClass(dashboardData.learning?.pass_rate)"
                  >
                    {{ getPassRateStatus(dashboardData.learning?.pass_rate) }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Level 3: Behavior -->
        <div class="column is-6">
          <div class="card">
            <div class="card-header">
              <p class="card-header-title">Level 3: 行為層評估（應用能力）</p>
            </div>
            <div class="card-content">
              <div class="content">
                <p class="is-size-3 has-text-centered has-text-weight-bold">
                  {{ dashboardData.behavior?.avg_behavior_score?.toFixed(2) || 'N/A' }} / 5.0
                </p>
                <p class="has-text-centered">
                  評估數: {{ dashboardData.behavior?.total_evaluations ?? 0 }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Level 4: Results -->
        <div class="column is-6">
          <div class="card">
            <div class="card-header">
              <p class="card-header-title">Level 4: 成果層評估（就業成效）</p>
            </div>
            <div class="card-content">
              <div class="content">
                <p class="is-size-3 has-text-centered has-text-weight-bold">
                  {{ dashboardData.employment?.employment_rate?.toFixed(1) || 'N/A' }}%
                </p>
                <p class="has-text-centered">
                  就業率
                  <span
                    class="tag ml-2"
                    :class="getEmploymentRateClass(dashboardData.employment?.employment_rate)"
                  >
                    {{ getEmploymentRateStatus(dashboardData.employment?.employment_rate) }}
                  </span>
                </p>
                <p class="has-text-centered mt-2">
                  平均薪資: NT$
                  {{ dashboardData.employment?.avg_salary?.toLocaleString() || 'N/A' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Improvement Actions -->
    <div class="box">
      <h2 class="title is-4">改善行動</h2>
      <div class="columns">
        <div class="column is-4">
          <p class="heading">總行動數</p>
          <p class="title is-5">{{ dashboardData.improvement?.total_actions ?? 0 }}</p>
        </div>
        <div class="column is-4">
          <p class="heading">已完成</p>
          <p class="title is-5">{{ dashboardData.improvement?.completed_actions ?? 0 }}</p>
        </div>
        <div class="column is-4">
          <p class="heading">平均效果評分</p>
          <p class="title is-5">
            {{ dashboardData.improvement?.avg_effectiveness?.toFixed(2) || 'N/A' }} / 5.0
          </p>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="buttons">
      <router-link to="/admin/ttqs/plans" class="button is-primary">
        <span class="icon"><i class="fas fa-list"></i></span>
        <span>管理訓練計劃</span>
      </router-link>
      <button class="button is-info" @click="generateReport">
        <span class="icon"><i class="fas fa-file-alt"></i></span>
        <span>生成報告</span>
      </button>
      <button class="button is-link" @click="loadData">
        <span class="icon"><i class="fas fa-sync"></i></span>
        <span>重新整理</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted } from 'vue'

const dashboardData = ref<any>({})
const complianceData = ref<any>({
  pddro_status: {},
  compliance_rate: 0
})

const loadData = async () => {
  try {
    // Load dashboard data
    const dashboardResponse = await axios.get('/ttqs/dashboard')
    if (dashboardResponse.data.success) {
      dashboardData.value = dashboardResponse.data.data
    }

    // Load compliance data
    const complianceResponse = await axios.get('/ttqs/compliance')
    if (complianceResponse.data.success) {
      complianceData.value = complianceResponse.data.data
    }
  } catch (error) {
    console.error('載入儀表板數據失敗:', error)
  }
}

const getPDDROLabel = (key: string): string => {
  const labels: Record<string, string> = {
    plan: '計劃 (Plan)',
    design: '設計 (Design)',
    do: '執行 (Do)',
    review: '評估 (Review)',
    outcome: '成果 (Outcome)'
  }
  return labels[key] || key
}

const getPassRateClass = (rate: number | undefined): string => {
  if (!rate) return 'is-light'
  if (rate >= 80) return 'is-success'
  if (rate >= 60) return 'is-warning'
  return 'is-danger'
}

const getPassRateStatus = (rate: number | undefined): string => {
  if (!rate) return '無數據'
  if (rate >= 80) return '達標'
  if (rate >= 60) return '需改善'
  return '未達標'
}

const getEmploymentRateClass = (rate: number | undefined): string => {
  if (!rate) return 'is-light'
  if (rate >= 80) return 'is-success'
  if (rate >= 60) return 'is-warning'
  return 'is-danger'
}

const getEmploymentRateStatus = (rate: number | undefined): string => {
  if (!rate) return '無數據'
  if (rate >= 80) return '達標'
  if (rate >= 60) return '需改善'
  return '未達標'
}

const generateReport = () => {
  // Navigate to report generation page or trigger report download
  alert('報告生成功能開發中')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card {
  height: 100%;
}
</style>
