import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir:'./tests/e2e', fullyParallel:false, workers:1, timeout:30000, use:{baseURL:'http://localhost:5173',channel:'msedge',headless:true,viewport:{width:1440,height:900}}, webServer:{command:'npm run dev',url:'http://localhost:5173',reuseExistingServer:true,timeout:30000}, reporter:'list' });
