import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			// Allow serving files from the project root
			allow: ['.']
		}
	},
	optimizeDeps: {
		exclude: ['ethers']
	},
	build: {
		rollupOptions: {
			external: ['ethers']
		}
	},
	ssr: {
		// SSR options
		noExternal: ['ethers']
	}
});
