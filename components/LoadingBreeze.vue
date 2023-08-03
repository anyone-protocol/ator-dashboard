<template>
  <div class="dots-wrapper">
    <div
      v-for="index in dots"
      :key="index"
      class="dot"
      :class="size"
    ></div>
  </div>
</template>

<script lang="ts">
import { PropType } from 'vue'
import anime from 'animejs'

type Sizes = 'small' | 'large'

const sizes = {
  small: 2,
  large: 10
}

export default {
  mounted() {
    // this.startAnimation()
  },
  props: {
    dots: { type: Number, default: 10 },
    size: { type: String as PropType<Sizes>, default: 'small' }
  },
  methods: {
    startAnimation() {
      this.resetAnimation()
      const grid = [this.dots, 1]
      let index = 0

      const play = () => {
        anime.timeline({
          easing: 'easeInOutQuad',
          complete: play
        })
          .add({
            targets: '.dot',
            keyframes: [
              {
                translateX: anime.stagger(`-${sizes[this.size]}px`, { grid: grid, from: index, axis: 'x' }),
                duration: 100,
              },
              {
                translateX: anime.stagger(`${sizes[this.size] * 2}px`, { grid: grid, from: index, axis: 'x' }),
                scale: anime.stagger([2, 1], { grid: grid, from: index }),
                duration: 225,
              },
              {
                translateX: 0,
                scale: 1,
                duration: 1200,
              },
            ],
            delay: anime.stagger(80, { grid: grid, from: index })
          }, 30)
      }

      play()
    },
    resetAnimation() {
      anime.remove('.dot')
    },
  },
}
</script>

<style scoped>
.dots-wrapper {
  display: flex;
  justify-content: center;
}

.dot {
  position: relative;
  z-index: 1;
  background-color: transparent;
  background-image: linear-gradient(180deg, rgb(var(--v-theme-background)) 0, rgb(var(--v-theme-primary)) 100%);
  border-radius: 50%;
}

.small {
  width: 2px;
  height: 2px;
  margin: 1px;
}

.large {
  width: 10px;
  height: 10px;
  margin: 25px;
}
</style>
