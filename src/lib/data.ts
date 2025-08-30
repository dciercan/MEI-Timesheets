
import type { User, Activity, UnproductiveReason } from './types';
import fs from 'fs';
import path from 'path';

const readJsonFile = <T>(filename: string): T => {
  const filePath = path.join(process.cwd(), 'src', 'lib', filename);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
};

export const users: User[] = readJsonFile<User[]>('users.json');
export const activities: Activity[] = readJsonFile<Activity[]>('activities.json');
export const unproductiveReasons: UnproductiveReason[] = readJsonFile<UnproductiveReason[]>('unproductiveReasons.json');
