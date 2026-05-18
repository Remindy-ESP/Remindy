const { execSync } = require('child_process');

try {
  const output = execSync('npm run test src/modules/scheduler/tasks/process-renewal-notifications.task.spec.ts', { encoding: 'utf-8', cwd: __dirname });
  console.log(output);
} catch (e) {
  console.log(e.stdout);
  console.log(e.stderr);
}
