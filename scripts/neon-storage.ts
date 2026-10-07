import { neon } from '@neondatabase/serverless'

function getNeonClient() {
  const connectionString = process.env.NEON_DATABASE_URL
  if (!connectionString) {
    throw new Error('Missing NEON_DATABASE_URL')
  }
  return neon(connectionString)
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    console.log('Usage: npm run neon:storage <command>')
    console.log('Commands: list-buckets, test-upload')
    process.exit(1)
  }

  const client = getNeonClient()

  switch (command) {
    case 'list-buckets': {
      console.log('Neon object storage is configured via files-sdk/neon adapter')
      console.log('Endpoint: https://br-silent-darkness-b4ejqmiv.storage.c-6.us-east-2.aws.neon.tech')
      console.log('Region: us-east-2')
      console.log('')
      console.log('Note: Bucket listing requires files-sdk runtime in Next.js server context')
      break
    }
    case 'test-upload': {
      const testKey = `test-${Date.now()}.txt`
      const testContent = Buffer.from('Hello from Neon object storage!')
      
      const { Files } = await import('files-sdk')
      const { neon: neonAdapter } = await import('files-sdk/neon')
      
      const files = new Files({ adapter: neonAdapter({ bucket: 'media' }) })
      await files.upload(testKey, testContent, { contentType: 'text/plain' })
      console.log(`Uploaded: ${testKey}`)
      
      const url = await files.url(testKey, { expiresIn: 3600 })
      console.log(`Signed URL: ${url}`)
      
      const exists = await files.exists(testKey)
      console.log(`Exists: ${exists}`)
      
      await files.delete(testKey)
      console.log(`Deleted: ${testKey}`)
      break
    }
    default:
      console.error(`Unknown command: ${command}`)
      process.exit(1)
  }
}

main().catch((error) => {
  console.error('Storage command failed:', error.message)
  process.exit(1)
})
