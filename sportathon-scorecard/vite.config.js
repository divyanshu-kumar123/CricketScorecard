import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Production builds target GitHub Pages project URL: /CricketScorecard/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/CricketScorecard/' : '/',
  plugins: [react()],
}))
