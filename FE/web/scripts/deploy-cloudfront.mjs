import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const distPath = resolve(projectRoot, 'dist')

const bucket = process.env.DEPLOY_S3_BUCKET ?? 'rebloom-bucket'
const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID ?? 'E3MQHB59PLAXZT'

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log('Building web...')
run('npm', ['run', 'build'])

if (!existsSync(distPath)) {
  console.error('dist directory was not created.')
  process.exit(1)
}

console.log(`Syncing dist to s3://${bucket}...`)
run('aws', ['s3', 'sync', './dist', `s3://${bucket}`, '--delete'])

console.log(`Invalidating CloudFront distribution ${distributionId}...`)
run('aws', [
  'cloudfront',
  'create-invalidation',
  '--distribution-id',
  distributionId,
  '--paths',
  '/*',
])

console.log('Deploy complete.')
