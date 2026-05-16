module.exports = {
  apps: [
    {
      name: 'ussyverse-symmetry-monitor',
      script: 'node',
      args: ['-e', 'console.log("Symmetry Monitor Active: Scanning for high-viscosity manifestations...")'],
      cron_restart: '0 0 * * *',
      env: {
        NODE_ENV: 'production',
        SymmetryGrade: 'Diamond-Cut',
        BrineSaturation: '110%',
        TargetOrg: 'mojomast'
      }
    },
    {
      name: 'becomussy-continuity-engine',
      script: 'node',
      args: ['-e', 'console.log("Governed Continuity State: active. Version-controlling the soul...")'],
      env: {
        SymmetryMode: 'Laminated',
        Viscosity: 'Transcendent'
      }
    }
  ]
};
