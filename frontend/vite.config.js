// D:\Laragon\www\wwan_film\frontend\vite.config.js
import { defineConfig, loadEnv } from 'vite'; // Thêm loadEnv
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    // Load các biến môi trường từ file .env dựa trên mode (development, production)
    // Vite sẽ tự động load các file .env, .env.development, .env.production
    // Các biến phải có tiền tố VITE_ hoặc tiền tố bạn định nghĩa trong envPrefix
    const env = loadEnv(mode, process.cwd(), ''); // process.cwd() trỏ đến thư mục gốc dự án

    return {
        plugins: [
            react(),
            visualizer({ open: true, gzipSize: true, brotliSize: true }),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@components': path.resolve(__dirname, './src/components'),
                '@pages': path.resolve(__dirname, './src/pages'),
                '@features': path.resolve(__dirname, './src/features'),
                '@hooks': path.resolve(__dirname, './src/hooks'),
                '@services': path.resolve(__dirname, './src/services'),
                '@utils': path.resolve(__dirname, './src/utils'),
                '@contexts': path.resolve(__dirname, './src/contexts'),
                '@assets': path.resolve(__dirname, './src/assets'),
                '@router': path.resolve(__dirname, './src/router'),
                '@app': path.resolve(__dirname, './src/app'),
            },
        },
        server: {
            port: 3000,
            proxy: {
                '/api': {
                    target: env.REACT_APP_API_URL || 'http://localhost:5000',
                    changeOrigin: true,
                },
            },
        },
        build: {
            outDir: 'build',
        },
        // Để Vite nhận diện và sử dụng các biến môi trường có tiền tố REACT_APP_
        // và bạn có thể truy cập chúng qua import.meta.env.REACT_APP_YOUR_VARIABLE
        // HOẶC nếu bạn muốn giữ nguyên process.env.REACT_APP_... trong code:
        define: {
            'process.env.REACT_APP_FIREBASE_API_KEY': JSON.stringify(env.REACT_APP_FIREBASE_API_KEY),
            'process.env.REACT_APP_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.REACT_APP_FIREBASE_AUTH_DOMAIN),
            'process.env.REACT_APP_FIREBASE_PROJECT_ID': JSON.stringify(env.REACT_APP_FIREBASE_PROJECT_ID),
            'process.env.REACT_APP_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.REACT_APP_FIREBASE_STORAGE_BUCKET),
            'process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID),
            'process.env.REACT_APP_FIREBASE_APP_ID': JSON.stringify(env.REACT_APP_FIREBASE_APP_ID),
            'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL || 'http://localhost:5000'),
            'process.env.REACT_APP_API_URL_IMAGE': JSON.stringify(env.REACT_APP_API_URL_IMAGE || 'http://localhost:5000/uploads'),
            
        },
        // Nếu bạn muốn Vite load các biến có tiền tố REACT_APP_ và truy cập qua import.meta.env
        // thì dùng envPrefix thay cho define:
        // envPrefix: 'REACT_APP_',
    };
});