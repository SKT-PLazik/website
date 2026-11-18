// @ts-check
import { defineConfig, fontProviders, logHandlers } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    adapter: node({ mode: 'standalone' }),
    fonts: [{
        provider: fontProviders.google(),
        name: "Patrick Hand",
        subsets: ["latin", "latin-ext"],
        cssVariable: "--font-cursive",
        fallbacks: ["cursive"]
    }],
    scopedStyleStrategy: "where",
    logger: logHandlers.console()
});
