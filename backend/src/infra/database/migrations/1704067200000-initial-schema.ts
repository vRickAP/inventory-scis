import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sku VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        unit_of_measure VARCHAR(16) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create inventory_movements table
    await queryRunner.query(`
      CREATE TYPE movement_type_enum AS ENUM ('IN', 'OUT', 'ADJUST', 'TRANSFER');
      CREATE TYPE movement_status_enum AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

      CREATE TABLE inventory_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        movement_type movement_type_enum NOT NULL,
        status movement_status_enum NOT NULL DEFAULT 'DRAFT',
        reference VARCHAR(120),
        notes TEXT,
        created_by UUID NOT NULL,
        posted_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Create inventory_movement_items table
    await queryRunner.query(`
      CREATE TABLE inventory_movement_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        movement_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_of_measure VARCHAR(16) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_movement FOREIGN KEY (movement_id) REFERENCES inventory_movements(id) ON DELETE CASCADE,
        CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`CREATE INDEX idx_products_sku ON products(sku)`);
    await queryRunner.query(`CREATE INDEX idx_products_is_active ON products(is_active)`);
    await queryRunner.query(
      `CREATE INDEX idx_inventory_movement_items_product_id ON inventory_movement_items(product_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_inventory_movements_status ON inventory_movements(status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_inventory_movements_created_by ON inventory_movements(created_by)`,
    );

    // Create trigger to update updated_at timestamp
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Apply trigger to all tables
    await queryRunner.query(`
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_inventory_movements_updated_at BEFORE UPDATE ON inventory_movements
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_inventory_movement_items_updated_at BEFORE UPDATE ON inventory_movement_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_users_updated_at ON users`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_products_updated_at ON products`);
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_inventory_movements_updated_at ON inventory_movements`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_inventory_movement_items_updated_at ON inventory_movement_items`,
    );

    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_sku`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_is_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movement_items_product_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_created_by`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS inventory_movement_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS inventory_movements`);
    await queryRunner.query(`DROP TABLE IF EXISTS products`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS movement_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS movement_type_enum`);
  }
}
