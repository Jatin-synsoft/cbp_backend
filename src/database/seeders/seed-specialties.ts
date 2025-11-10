import "reflect-metadata";
import * as path from "path";
import * as dotenv from "dotenv";
import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import tags from "./tags";

// Load env from project root .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Specialty attributes
type SpecialtyAttrs = {
  id: number;
  name: string;
  description?: string | null;
};

type SpecialtyCreationAttrs = Optional<SpecialtyAttrs, "id" | "description">;

class SpecialtyPlain extends Model<SpecialtyAttrs, SpecialtyCreationAttrs> implements SpecialtyAttrs {
  public id!: number;
  public name!: string;
  public description?: string | null;
}

async function seedSpecialties() {
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
      timezone: "+05:30",
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true,
      },
    }
  );

  SpecialtyPlain.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "specialtiesmst",
      timestamps: true,
    }
  );

  try {
    await sequelize.authenticate();
    console.log("Connected to database");

    const specialties = tags


    for (const s of specialties) {
      const [rec, created] = await SpecialtyPlain.findOrCreate({
        where: { name: s.name },
        defaults: { ...s },
      });
      console.log(`${created ? "Created" : "Exists"} specialty: ${rec.get("name")}`);
    }

    console.log("Specialties seeding complete");
  } catch (err) {
    console.error("Failed to seed specialties:", err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seedSpecialties();
