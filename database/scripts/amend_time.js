const { execSync } = require('child_process');

const targetDate = '2026-08-22T10:00:00+05:30';
const env = { 
  ...process.env, 
  GIT_COMMITTER_DATE: targetDate, 
  GIT_AUTHOR_DATE: targetDate 
};

console.log('1. Amending commit with exact 10:00 AM timestamp...');
execSync(`git commit --amend --no-edit --date="${targetDate}"`, { env, stdio: 'inherit' });

console.log('\n2. Verifying commit metadata:');
execSync('git log -n 1 --format=fuller', { env, stdio: 'inherit' });

console.log('\n3. Force pushing to GitHub...');
execSync('git push --force origin main', { env, stdio: 'inherit' });

console.log('\n✅ Successfully pushed commit at 10:00 AM timestamp!');
