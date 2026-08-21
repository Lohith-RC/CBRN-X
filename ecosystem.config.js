module.exports = {
  apps: [
    {
      name: 'cbrsx-backend-8080',
      cwd: './backend',
      script: 'mvn',
      args: 'spring-boot:run',
      env: {
        PORT: 8080,
        SPRING_PROFILES_ACTIVE: 'dev'
      },
      watch: false
    },
    {
      name: 'cbrsx-admin-3000',
      cwd: './dashboard',
      script: 'npm',
      args: 'run dev',
      env: {
        PORT: 3000
      },
      watch: false
    },
    {
      name: 'cbrsx-trainee-5000',
      cwd: './trainee_view',
      script: 'npm',
      args: 'run dev',
      env: {
        PORT: 5000
      },
      watch: false
    }
  ]
};
