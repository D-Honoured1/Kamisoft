module.exports = {
  siteUrl: process.env.SITE_URL || "https://kamisoft.vercel.app",
  generateRobotsTxt: true,
  exclude: ["/admin/*", "/api/*", "/payment/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/payment/"],
      },
    ],
  },
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: path === "/" ? "daily" : "weekly",
      priority: path === "/" ? 1.0 : 0.7,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    }
  },
}
