<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import PsychoFrameHero from './components/PsychoFrameHero.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #home-hero-image>
      <PsychoFrameHero />
    </template>
  </Layout>
</template>
