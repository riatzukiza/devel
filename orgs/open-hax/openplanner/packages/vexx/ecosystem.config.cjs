module.exports = {
  apps: [
    {
      name: "vexx",
      cwd: "/home/err/devel/orgs/open-hax/openplanner/packages/vexx",
      script: "clojure",
      args: "-M:run",
      interpreter: "none",
      env: {
        VEXX_HOST: "0.0.0.0",
        VEXX_PORT: "8791",
        VEXX_API_KEY: "",
        VEXX_DEVICE: "NPU",
        VEXX_AUTO_ORDER: "NPU,GPU,CPU",
        VEXX_REQUIRE_ACCEL: "true",
        VEXX_PAIR_CACHE_MAX_ENTRIES: "250000",
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 10000,
    },
  ],
};
