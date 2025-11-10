import "reflect-metadata";
import * as path from "path";
import * as dotenv from "dotenv";
import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import { RoleType } from "../models/role.model";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

type RoleAttrs = {
  id: bigint;
  name: RoleType;
};

type RoleCreationAttrs = Optional<RoleAttrs, "id">;

// Role model for seeding
class RolePlain extends Model<RoleAttrs, RoleCreationAttrs> implements RoleAttrs {
  public id!: bigint;
  public name!: RoleType;
}

async function seedRoles() {
  const dbPortStr = process.env.DATABASE_PORT;
  const dbPort = dbPortStr ? parseInt(dbPortStr, 10) : 3306;

  const sequelize = new Sequelize(
    process.env.DATABASE_NAME as string,
    process.env.DATABASE_USERNAME as string,
    process.env.DATABASE_PASSWORD as string,
    {
      host: process.env.DATABASE_HOST,
      port: dbPort,
      dialect: "mysql",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      timezone: "+05:30", // your local timezone
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true,
      },
    }
  );

  // Initialize Role model
  RolePlain.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      tableName: "roles",
      timestamps: true,
    }
  );

  try {
    await sequelize.authenticate();
    console.log("Connected to database");

    const roles = [
      { name: RoleType.ADMIN },
      { name: RoleType.CONSULTANT },
      { name: RoleType.USER },
    ];

    for (const role of roles) {
      const [rec, created] = await RolePlain.findOrCreate({
        where: { name: role.name },
      });
      console.log(`${created ? "Created" : "Exists"} role: ${rec.get("name")}`);
    }

    console.log("Role seeding complete");
  } catch (err) {
    console.error("Failed to seed roles:", err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seedRoles();
