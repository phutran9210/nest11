import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateRolePermissionTables1750320756926 implements MigrationInterface {
  name = 'CreateRolePermissionTables1750320756926'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."permissions_action_enum" AS ENUM('create', 'read', 'update', 'delete', 'manage')`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."permissions_resource_enum" AS ENUM('user', 'role', 'permission', 'system', 'all')`,
    )
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "action" "public"."permissions_action_enum" NOT NULL, "resource" "public"."permissions_resource_enum" NOT NULL, "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "role_hierarchies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "parent_role_id" uuid NOT NULL, "child_role_id" uuid NOT NULL, "depth" integer NOT NULL DEFAULT '1', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a037c0af9719b92b6f48cd8a032" UNIQUE ("parent_role_id", "child_role_id"), CONSTRAINT "PK_462d9bf901f9df6413a78ea7eb5" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "level" integer NOT NULL DEFAULT '1', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "role_hierarchies" ADD CONSTRAINT "FK_84d4ea0b4358113ae1dc56b6c01" FOREIGN KEY ("parent_role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "role_hierarchies" ADD CONSTRAINT "FK_6c4839177755d711bfc8aca8e38" FOREIGN KEY ("child_role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`,
    )
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    )
    await queryRunner.query(
      `ALTER TABLE "role_hierarchies" DROP CONSTRAINT "FK_6c4839177755d711bfc8aca8e38"`,
    )
    await queryRunner.query(
      `ALTER TABLE "role_hierarchies" DROP CONSTRAINT "FK_84d4ea0b4358113ae1dc56b6c01"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_b23c65e50a758245a33ee35fda"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`)
    await queryRunner.query(`DROP TABLE "user_roles"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`)
    await queryRunner.query(`DROP TABLE "role_permissions"`)
    await queryRunner.query(`DROP TABLE "roles"`)
    await queryRunner.query(`DROP TABLE "role_hierarchies"`)
    await queryRunner.query(`DROP TABLE "permissions"`)
    await queryRunner.query(`DROP TYPE "public"."permissions_resource_enum"`)
    await queryRunner.query(`DROP TYPE "public"."permissions_action_enum"`)
  }
}
