"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        environment: 'node',
        include: ['tests/octavia.*.test.ts', 'tests/pm2-clj.*.test.ts'],
        globals: false,
    },
});
