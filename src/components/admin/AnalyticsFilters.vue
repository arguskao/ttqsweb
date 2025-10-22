<template>
  <div class="box">
    <div class="columns">
      <div class="column is-3">
        <div class="field">
          <label class="label">開始日期</label>
          <div class="control">
            <input
              :value="startDate"
              type="date"
              class="input"
              @input="$emit('update:startDate', ($event.target as HTMLInputElement).value)"
              @change="$emit('filter-change')"
            />
          </div>
        </div>
      </div>
      <div class="column is-3">
        <div class="field">
          <label class="label">結束日期</label>
          <div class="control">
            <input
              :value="endDate"
              type="date"
              class="input"
              @input="$emit('update:endDate', ($event.target as HTMLInputElement).value)"
              @change="$emit('filter-change')"
            />
          </div>
        </div>
      </div>
      <div class="column is-3">
        <div class="field">
          <label class="label">報告類型</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select
                :value="exportType"
                @change="
                  (event: Event) => {
                    const target = event.target as HTMLSelectElement
                    $emit('update:exportType', target.value)
                  }
                "
              >
                <option value="learning">學習統計</option>
                <option value="job-matching">就業媒合</option>
                <option value="satisfaction">課程滿意度</option>
                <option value="comprehensive">綜合報告</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="column is-3">
        <div class="field">
          <label class="label">&nbsp;</label>
          <div class="control">
            <button
              class="button is-primary is-fullwidth"
              @click="$emit('export-report')"
              :disabled="isExporting"
            >
              <span v-if="isExporting" class="icon">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              <span v-else class="icon">
                <i class="fas fa-download"></i>
              </span>
              <span>{{ isExporting ? '匯出中...' : '匯出報告' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  startDate: string
  endDate: string
  exportType: string
  isExporting?: boolean
}

defineProps<Props>()

defineEmits<{
  'update:startDate': [value: string]
  'update:endDate': [value: string]
  'update:exportType': [value: string]
  'filter-change': []
  'export-report': []
}>()
</script>
