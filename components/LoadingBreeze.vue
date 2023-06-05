<template>
    <div class="dots-wrapper">
        <div v-for="index in dots" :key="index" class="dot"></div>
    </div>
</template>

<script>
import anime from 'animejs'

export default {
  mounted() {
    this.startAnimation()
  },
  props: {
    dots: Number
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
                translateX: anime.stagger('-2px', { grid: grid, from: index, axis: 'x' }),
                duration: 100,
              },
              {
                translateX: anime.stagger('4px', { grid: grid, from: index, axis: 'x' }),
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

<style>
.dots-wrapper {
  display: flex;
}

.dot {
  position: relative;
  z-index: 1;
  width: 2px;
  height: 2px;
  margin: 1px;
  background-color: transparent;
  background-image: linear-gradient(180deg, rgb(var(--v-theme-background)) 0, rgb(var(--v-theme-primary)) 100%);
  border-radius: 50%;
}
</style>
