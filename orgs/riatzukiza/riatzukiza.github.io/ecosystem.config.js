module.exports = {
    apps: [{
        script: 'npm',
        args:[ "run", "dev"],
        watch: ['./inc','./dev', './server', './src']
    },
    ],
};
