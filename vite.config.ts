import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // <--- This is critical!
    port: 5173,       // Or your chosen port
  },
});