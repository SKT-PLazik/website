// @ts-check
import { defineConfig, logHandlers } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    experimental: {
        logger: logHandlers.console()
    }
});
