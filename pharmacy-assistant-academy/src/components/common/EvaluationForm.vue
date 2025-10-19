<template>
  <div class="box">
    <h3 class="title is-4">{{ getEvaluationTitle() }}</h3>
    <p class="subtitle is-6">{{ getEvaluationDescription() }}</p>

    <!-- Level 1: Reaction Evaluation -->
    <div v-if="level === 1">
      <div class="field">
        <label class="label">課程滿意度</label>
        <div class="control">
          <div class="rating">
            <span v-for="n in 5" :key="n" @click="formData.course_satisfaction = n" class="star">
              <i class="fas fa-star" :class="{ 'has-text-warning': n <= formData.course_satisfaction }"></i>
            </span>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">講師滿意度</label>
        <div class="control">
          <div class="rating">
            <span v-for="n in 5" :key="n" @click="formData.instructor_satisfaction = n" class="star">
              <i class="fas fa-star" :class="{ 'has-text-warning': n <= formData.instructor_satisfaction }"></i>
            </span>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">內容滿意度</label>
        <div class="control">
          <div class="rating">
            <span v-for="n in 5" :key="n" @click="formData.content_satisfaction = n" class="star">
              <i class="fas fa-star" :class="{ 'has-text-warning': n <= formData.content_satisfaction }"></i>
            </span>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">設施滿意度</label>
        <div class="control">
          <div class="rating">
            <span v-for="n in 5" :key="n" @click="formData.facility_satisfaction = n" class="star">
              <i class="fas fa-star" :class="{ 'has-text-warning': n <= formData.facility_satisfaction }"></i>
            </span>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">整體滿意度</label>
        <div class="control">
          <div class="rating">
            <span v-for="n in 5" :key="n" @click="formData.overall_satisfaction = n" class="star">
              <i class="fas fa-star" :class="{ 'has-text-warning': n <= formData.overall_satisfaction }"></i>
            </span>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">意見回饋</label>
        <div class="control">
          <textarea class="textarea" v-model="formData.comments" placeholder="請分享您的意見和建議"></textarea>
        </div>
      </div>
    </div>

    <!-- Level 2: Learning Evaluation -->
    <div v-if="level === 2">
      <div class="field">
        <label class="label">課前測驗成績</label>
        <div class="control">
          <input class="input" type="number" v-model="formData.pre_test_score" min="0" max="100" placeholder="0-100">
        </div>
      </div>

      <div class="field">
        <label class="label">課後測驗成績 *</label>
        <div class="control">
          <input class="input" type="number" v-model="formData.post_test_score" min="0" max="100" placeholder="0-100" required>
        </div>
      </div>

      <div class="notification is-info is-light" v-if="formData.pre_test_score && formData.post_test_score">
        <p>進步率: {{ calculateImprovement() }}%</p>
        <p>通過狀態: {{ formData.post_test_score >= 80 ? '通過 ✓' : '未通過 ✗' }}</p>
      </div>
    </div>

    <!-- Level 3: Behavior Evaluation -->
    <div v-if="level === 3">
      <div class="field">
        <label class="label">技能應用評分</label>
        <div class="control">
          <div class="rating">
            <span v-for="n in 5" :key="n" @click="formData.skill_application_score = n" class="star">
              <i class="fas fa-star" :class="{ 'has-text-warning': n <= formData.skill_application_score }"></i>
            </span>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">工作品質評分</label>
        <div class="control">
          <div class="rating">
            <span v-for="n in 5" :key="n" @click="formData.work_quality_score = n" class="star">
              <i class="fas fa-star" :class="{ 'has-text-warning': n <= formData.work_quality_score }"></i>
            </span>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">效率評分</label>
        <div class="control">
          <div class="rating">
            <span v-for="n in 5" :key="n" @click="formData.efficiency_score = n" class="star">
              <i class="fas fa-star" :class="{ 'has-text-warning': n <= formData.efficiency_score }"></i>
            </span>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">整體行為評分</label>
        <div class="control">
          <div class="rating">
            <span v-for="n in 5" :key="n" @click="formData.overall_behavior_score = n" class="star">
              <i class="fas fa-star" :class="{ 'has-text-warning': n <= formData.overall_behavior_score }"></i>
            </span>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">評估日期</label>
        <div class="control">
          <input class="input" type="date" v-model="formData.evaluation_date">
        </div>
      </div>

      <div class="field">
        <label class="label">評估意見</label>
        <div class="control">
          <textarea class="textarea" v-model="formData.comments" placeholder="請描述學員的行為表現"></textarea>
        </div>
      </div>
    </div>

    <!-- Level 4: Result Evaluation -->
    <div v-if="level === 4">
      <div class="field">
        <label class="label">就業狀態 *</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="formData.employment_status" required>
              <option value="">請選擇</option>
              <option value="employed">已就業</option>
              <option value="unemployed">未就業</option>
              <option value="seeking">求職中</option>
            </select>
          </div>
        </div>
      </div>

      <div class="field" v-if="formData.employment_status === 'employed'">
        <label class="label">就業日期</label>
        <div class="control">
          <input class="input" type="date" v-model="formData.employment_date">
        </div>
      </div>

      <div class="field" v-if="formData.employment_status === 'employed'">
        <label class="label">職位匹配度 (%)</label>
        <div class="control">
          <input class="input" type="number" v-model="formData.job_match_rate" min="0" max="100" placeholder="0-100">
        </div>
      </div>

      <div class="field" v-if="formData.employment_status === 'employed'">
        <label class="label">薪資水平 (NT$)</label>
        <div class="control">
          <input class="input" type="number" v-model="formData.salary_level" placeholder="月薪">
        </div>
      </div>

      <div class="field" v-if="formData.employment_status === 'employed'">
        <label class="label">雇主滿意度</label>
        <div class="control">
          <div class="rating">
            <span v-for="n in 5" :key="n" @click="formData.employer_satisfaction = n" class="star">
              <i class="fas fa-star" :class="{ 'has-text-warning': n <= formData.employer_satisfaction }"></i>
            </span>
          </div>
        </div>
      </div>

      <div class="field" v-if="formData.employment_status === 'employed'">
        <label class="label">留任月數</label>
        <div class="control">
          <input class="input" type="number" v-model="formData.retention_months" min="0" placeholder="月數">
        </div>
      </div>
    </div>

    <div class="field is-grouped mt-5">
      <div class="control">
        <button class="button is-primary" @click="submitEvaluation">提交評估</button>
      </div>
      <div class="control">
        <button class="button is-light" @click="$emit('cancel')">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import axios from 'axios'

const props = defineProps<{
  level: number
  executionId: number
  userId?: number
}>()

const emit = defineEmits(['submitted', 'cancel'])

const formData = ref<any>({
  execution_id: props.executionId,
  user_id: props.userId
})

const getEvaluationTitle = (): string => {
  const titles: Record<number, string> = {
    1: 'Level 1: 反應層評估',
    2: 'Level 2: 學習層評估',
    3: 'Level 3: 行為層評估',
    4: 'Level 4: 成果層評估'
  }
  return titles[props.level] || '評估表單'
}

const getEvaluationDescription = (): string => {
  const descriptions: Record<number, string> = {
    1: '請評估您對課程的滿意度（1-5星）',
    2: '請輸入測驗成績以評估學習成效',
    3: '請評估學員在工作中的行為表現（1-5星）',
    4: '請記錄學員的就業成效'
  }
  return descriptions[props.level] || ''
}

const calculateImprovement = (): string => {
  if (!formData.value.pre_test_score || !formData.value.post_test_score) return '0'
  const improvement = ((formData.value.post_test_score - formData.value.pre_test_score) / formData.value.pre_test_score) * 100
  return improvement.toFixed(1)
}

const submitEvaluation = async () => {
  try {
    const endpoints: Record<number, string> = {
      1: '/api/v1/evaluations/reaction',
      2: '/api/v1/evaluations/learning',
      3: '/api/v1/evaluations/behavior',
      4: '/api/v1/evaluations/result'
    }

    const endpoint = endpoints[props.level]
    if (!endpoint) {
      console.error('Invalid evaluation level')
      return
    }

    const response = await axios.post(endpoint, formData.value)
    if (response.data.success) {
      emit('submitted', response.data.data)
    }
  } catch (error) {
    console.error('提交評估失敗:', error)
  }
}
</script>

<style scoped>
.rating {
  display: flex;
  gap: 0.5rem;
}

.star {
  cursor: pointer;
  font-size: 1.5rem;
  transition: transform 0.2s;
}

.star:hover {
  transform: scale(1.2);
}

.star i {
  color: #dbdbdb;
}

.star i.has-text-warning {
  color: #ffdd57;
}
</style>
