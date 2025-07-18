import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import { DataSource, DataSourceOptions } from 'typeorm'
import { getDatabaseConfig } from '~core/config'
import { seedRbacData } from './rbac.seed'
import { runUserSeeder } from './user.seed'

// Load environment variables

config()

async function runSeeds() {
  const configService = new ConfigService()
  const dbConfig = getDatabaseConfig(configService)

  const dataSource = new DataSource({
    ...dbConfig,
    entities: ['src/**/*.entity{.ts,.js}'],
  } as DataSourceOptions)

  try {
    await dataSource.initialize()
    console.log('Database connection established')

    // Run seeders
    console.log('Starting seed process...')

    await seedRbacData(dataSource)
    await runUserSeeder(dataSource)

    console.log('All seeds completed successfully!')
  } catch (error) {
    console.error('Error during seeding:', error)
    process.exit(1)
  } finally {
    await dataSource.destroy()
    console.log('Database connection closed')
  }
}

// Run seeds if this file is executed directly
if (require.main === module) {
  void runSeeds()
}
