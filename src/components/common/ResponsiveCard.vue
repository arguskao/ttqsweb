<template>
  <div
    class="responsive-card"
    :class="cardClasses"
    :style="cardStyles"
  >
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>

    <div class="card-content">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'small' | 'medium' | 'large'
  hover?: boolean
  clickable?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'medium',
  hover: false,
  clickable: false,
  loading: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const cardClasses = computed(() => ({
  [`card-${props.variant}`]: true,
  [`card-${props.size}`]: true,
  'card-hover': props.hover,
  'card-clickable': props.clickable,
  'card-loading': props.loading
}))

const cardStyles = computed(() => ({
  cursor: props.clickable ? 'pointer' : 'default'
}))

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/responsive.scss';

.responsive-card {
  @include responsive-card;
  background: white;
  border: 1px solid #e5e5e5;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  // 變體樣式
  &.card-primary {
    border-color: #3273dc;
    background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  }

  &.card-secondary {
    border-color: #6c757d;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  }

  &.card-success {
    border-color: #28a745;
    background: linear-gradient(135deg, #f8fff9 0%, #ffffff 100%);
  }

  &.card-warning {
    border-color: #ffc107;
    background: linear-gradient(135deg, #fffdf8 0%, #ffffff 100%);
  }

  &.card-danger {
    border-color: #dc3545;
    background: linear-gradient(135deg, #fff8f8 0%, #ffffff 100%);
  }

  // 尺寸樣式
  &.card-small {
    padding: 0.75rem;

    @include tablet {
      padding: 1rem;
    }
  }

  &.card-medium {
    padding: 1rem;

    @include tablet {
      padding: 1.5rem;
    }

    @include desktop {
      padding: 2rem;
    }
  }

  &.card-large {
    padding: 1.5rem;

    @include tablet {
      padding: 2rem;
    }

    @include desktop {
      padding: 3rem;
    }
  }

  // 懸停效果
  &.card-hover {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }
  }

  // 可點擊樣式
  &.card-clickable {
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
  }

  // 加載狀態
  &.card-loading {
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      animation: loading-shimmer 1.5s infinite;
    }
  }

  .card-header {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e5e5;

    @include mobile {
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
    }
  }

  .card-content {
    flex: 1;
  }

  .card-footer {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e5e5;

    @include mobile {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
    }
  }
}

// 加載動畫
@keyframes loading-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

// 觸摸設備優化
@include touch-device {
  .responsive-card {
    &.card-hover:hover {
      transform: none;
    }

    &.card-clickable {
      &:active {
        transform: scale(0.98);
      }
    }
  }
}

// 深色模式支持
@include dark-mode {
  .responsive-card {
    background: #2a2a2a;
    border-color: #444;
    color: #fff;

    .card-header,
    .card-footer {
      border-color: #444;
    }

    &.card-primary {
      background: linear-gradient(135deg, #1a1a2e 0%, #2a2a2a 100%);
    }

    &.card-secondary {
      background: linear-gradient(135deg, #2a2a2a 0%, #2a2a2a 100%);
    }

    &.card-success {
      background: linear-gradient(135deg, #1a2e1a 0%, #2a2a2a 100%);
    }

    &.card-warning {
      background: linear-gradient(135deg, #2e2a1a 0%, #2a2a2a 100%);
    }

    &.card-danger {
      background: linear-gradient(135deg, #2e1a1a 0%, #2a2a2a 100%);
    }
  }
}

// 高對比度模式
@include high-contrast {
  .responsive-card {
    border-width: 2px;

    &.card-hover:hover {
      border-color: #000;
    }
  }
}

// 減少動畫偏好
@include reduced-motion {
  .responsive-card {
    transition: none;

    &.card-hover:hover {
      transform: none;
    }

    &.card-clickable {
      &:hover,
      &:active {
        transform: none;
      }
    }

    &.card-loading::before {
      animation: none;
    }
  }
}
</style>
