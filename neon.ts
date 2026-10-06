import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  buckets: {
    media: {},
    "public-assets": { access: "public_read" },
  },
});