import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseEntities } from '../entities';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: databaseEntities,
  migrations: [`${__dirname}/../migrations/*{.ts,.js}`],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});
