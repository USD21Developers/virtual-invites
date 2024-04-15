module.exports = {
  globDirectory: "./",
  globIgnores: [
    "sw.js",
    "sw-src.js",
    "workbox-config.js",
    ".gitignore",
    "node_modules/*",
    "node_modules/**",
    "js/*",
    "js/**",
  ],
  globPatterns: ["**/*.{html,js,css,map,png,gif,jpg,svg,ico,json}"],
  swSrc: "sw-src.js",
  swDest: "sw.js",
};
