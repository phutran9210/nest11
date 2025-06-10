import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../../shared/entities/user.entity';

export class UserSeederService {
  static async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(UserEntity);

    // Check if users already exist
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping seed...');
      return;
    }

    const defaultUsers = [
      {
        email: 'admin@example.com',
        name: 'System Administrator',
        password: await bcrypt.hash('Admin123!', 10),
        isActive: true,
      },
      {
        email: 'user@example.com',
        name: 'Test User',
        password: await bcrypt.hash('User123!', 10),
        isActive: true,
      },
      {
        email: 'inactive@example.com',
        name: 'Inactive User',
        password: await bcrypt.hash('Inactive123!', 10),
        isActive: false,
      },
    ];

    for (const userData of defaultUsers) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(`Created user: ${user.email}`);
    }

    console.log('User seeding completed!');
  }
}
