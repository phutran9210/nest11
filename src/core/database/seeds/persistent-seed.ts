import * as bcrypt from 'bcrypt'
import { UserEntity } from '~shared/entities/user.entity'
import { AppDataSource } from '../../../../data-source'

async function createPersistentData() {
  try {
    console.log('Initializing data source...')
    await AppDataSource.initialize()
    console.log('Database connection established')

    const userRepository = AppDataSource.getRepository(UserEntity)

    // Check if users already exist
    const existingUsersCount = await userRepository.count()

    if (existingUsersCount > 0) {
      console.log(`Found ${existingUsersCount} existing users. Skipping seed creation.`)
      return
    }

    console.log('Creating persistent user data...')

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10')

    // Admin user with strong password as per FIELD_CONFIGS
    const adminExists = await userRepository.findOne({
      where: { email: 'admin@example.com' },
    })

    if (!adminExists) {
      const adminUser = userRepository.create({
        email: 'admin@example.com',
        name: 'Administrator',
        password: await bcrypt.hash('AdminPass123!', saltRounds), // Strong password: 8+ chars, upper, lower, number, symbol
        isActive: true,
      })
      await userRepository.save(adminUser)
      console.log('✅ Created admin user: admin@example.com (password: AdminPass123!)')
    }

    // Regular user with FIELD_CONFIGS example
    const userExists = await userRepository.findOne({
      where: { email: 'user@example.com' },
    })

    if (!userExists) {
      const regularUser = userRepository.create({
        email: 'user@example.com',
        name: 'John Doe', // Using FIELD_CONFIGS name example
        password: await bcrypt.hash('Password123!', saltRounds), // Using FIELD_CONFIGS password example
        isActive: true,
      })
      await userRepository.save(regularUser)
      console.log('✅ Created regular user: user@example.com (password: Password123!)')
    }

    // Test user
    const testUserExists = await userRepository.findOne({
      where: { email: 'test@example.com' },
    })

    if (!testUserExists) {
      const testUser = userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        password: await bcrypt.hash('TestPass123!', saltRounds), // Strong password compliant
        isActive: true,
      })
      await userRepository.save(testUser)
      console.log('✅ Created test user: test@example.com (password: TestPass123!)')
    }

    // Demo users with strong passwords following FIELD_CONFIGS validation rules
    const demoUsers = [
      { email: 'john.doe@example.com', name: 'John Doe', password: 'JohnPass123!' },
      { email: 'jane.smith@example.com', name: 'Jane Smith', password: 'JanePass123!' },
      { email: 'bob.wilson@example.com', name: 'Bob Wilson', password: 'BobPass123!' },
      { email: 'alice.johnson@example.com', name: 'Alice Johnson', password: 'AlicePass123!' },
      { email: 'charlie.brown@example.com', name: 'Charlie Brown', password: 'CharliePass123!' },
      { email: 'dev@example.com', name: 'Developer User', password: 'DevPass123!' },
      { email: 'manager@example.com', name: 'Manager User', password: 'MgrPass123!' },
      { email: 'guest@example.com', name: 'Guest User', password: 'GuestPass123!' },
    ]

    for (const userData of demoUsers) {
      const exists = await userRepository.findOne({
        where: { email: userData.email },
      })

      if (!exists) {
        const demoUser = userRepository.create({
          email: userData.email,
          name: userData.name,
          password: await bcrypt.hash(userData.password, saltRounds),
          isActive: true,
        })
        await userRepository.save(demoUser)
        console.log(`✅ Created demo user: ${userData.email} (password: ${userData.password})`)
      }
    }

    // Create some inactive users for testing
    const inactiveUsers = [
      { email: 'inactive@example.com', name: 'Inactive User', password: 'InactivePass123!' },
      { email: 'disabled@example.com', name: 'Disabled User', password: 'DisabledPass123!' },
    ]

    for (const userData of inactiveUsers) {
      const exists = await userRepository.findOne({
        where: { email: userData.email },
      })

      if (!exists) {
        const inactiveUser = userRepository.create({
          email: userData.email,
          name: userData.name,
          password: await bcrypt.hash(userData.password, saltRounds),
          isActive: false, // Using boolean field as per FIELD_CONFIGS
        })
        await userRepository.save(inactiveUser)
        console.log(`✅ Created inactive user: ${userData.email} (password: ${userData.password})`)
      }
    }

    const finalCount = await userRepository.count()
    console.log(`\n🎉 Persistent seed completed! Total users: ${finalCount}`)
  } catch (error) {
    console.error('❌ Error creating persistent data:', error)
    throw error
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
      console.log('Database connection closed')
    }
  }
}

// Run if called directly
if (require.main === module) {
  createPersistentData()
    .then(() => {
      console.log('✅ Persistent data creation completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Failed to create persistent data:', error)
      process.exit(1)
    })
}

export { createPersistentData }
