// @ts-check
import { defineConfig, fontProviders, logHandlers } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    fonts: [{
        provider: fontProviders.google(),
        name: "Patrick Hand",
        subsets: ["latin", "latin-ext"],
        cssVariable: "--font-cursive",
        fallbacks: ["cursive"]
    }],
    scopedStyleStrategy: "where",
    experimental: {
        logger: logHandlers.console()
    }
});
