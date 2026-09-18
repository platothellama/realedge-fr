import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

// Vitest pipeline for Angular specs. The AnalogJS plugin compiles components
// the same way the production build does (decorator metadata, templateUrl /
// styleUrl inlining), so TestBed specs exercise real component code.
export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
  },
});
