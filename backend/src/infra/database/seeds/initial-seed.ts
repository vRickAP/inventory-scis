import { AppDataSource } from '../ormconfig';
import { User } from '@core/entities/user.entity';
import { Product } from '@core/entities/product.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  try {
    console.log('Initializing data source...');
    await AppDataSource.initialize();

    console.log('Seeding database...');

    // Create admin user
    const userRepository = AppDataSource.getRepository(User);
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      const admin = userRepository.create({
        email: 'admin@example.com',
        fullName: 'System Administrator',
        passwordHash,
        isActive: true,
      });
      await userRepository.save(admin);
      console.log('✓ Admin user created (email: admin@example.com, password: Admin123!)');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Create sample products
    const productRepository = AppDataSource.getRepository(Product);
    const existingProducts = await productRepository.count();

    if (existingProducts === 0) {
      const sampleProducts = [
        {
          sku: 'WIDGET-001',
          name: 'Standard Widget',
          unitOfMeasure: 'PCS',
          stock: 100,
          isActive: true,
        },
        {
          sku: 'GADGET-002',
          name: 'Premium Gadget',
          unitOfMeasure: 'PCS',
          stock: 50,
          isActive: true,
        },
        {
          sku: 'TOOL-003',
          name: 'Industrial Tool',
          unitOfMeasure: 'PCS',
          stock: 25,
          isActive: true,
        },
        {
          sku: 'PART-A100',
          name: 'Component A100',
          unitOfMeasure: 'PCS',
          stock: 200,
          isActive: true,
        },
        {
          sku: 'PART-B200',
          name: 'Component B200',
          unitOfMeasure: 'PCS',
          stock: 150,
          isActive: true,
        },
        {
          sku: 'CABLE-5M',
          name: 'Cable 5 Meters',
          unitOfMeasure: 'MTR',
          stock: 500,
          isActive: true,
        },
        {
          sku: 'SCREW-M5',
          name: 'M5 Screw',
          unitOfMeasure: 'PCS',
          stock: 1000,
          isActive: true,
        },
        {
          sku: 'PAINT-1L',
          name: 'Industrial Paint 1L',
          unitOfMeasure: 'LTR',
          stock: 30,
          isActive: true,
        },
        {
          sku: 'GLUE-500G',
          name: 'Industrial Glue 500g',
          unitOfMeasure: 'KG',
          stock: 45,
          isActive: true,
        },
        {
          sku: 'BEARING-SKF',
          name: 'SKF Bearing',
          unitOfMeasure: 'PCS',
          stock: 75,
          isActive: true,
        },
        {
          sku: 'MOTOR-AC1',
          name: 'AC Motor Type 1',
          unitOfMeasure: 'PCS',
          stock: 15,
          isActive: true,
        },
        {
          sku: 'SENSOR-T100',
          name: 'Temperature Sensor T100',
          unitOfMeasure: 'PCS',
          stock: 60,
          isActive: true,
        },
        {
          sku: 'VALVE-V50',
          name: 'Valve 50mm',
          unitOfMeasure: 'PCS',
          stock: 8,
          isActive: true,
        },
        {
          sku: 'FILTER-F200',
          name: 'Air Filter F200',
          unitOfMeasure: 'PCS',
          stock: 40,
          isActive: true,
        },
        {
          sku: 'OBSOLETE-001',
          name: 'Obsolete Part',
          unitOfMeasure: 'PCS',
          stock: 5,
          isActive: false,
        },
      ];

      for (const productData of sampleProducts) {
        const product = productRepository.create(productData);
        await productRepository.save(product);
      }

      console.log(`✓ Created ${sampleProducts.length} sample products`);
    } else {
      console.log('✓ Products already exist');
    }

    console.log('Seeding completed successfully!');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
