
import type { User, Activity, UnproductiveReason } from './types';
import usersData from './users.json';
import activitiesData from './activities.json';
import unproductiveReasonsData from './unproductiveReasons.json';

export const users: User[] = usersData;
export const activities: Activity[] = activitiesData;
export const unproductiveReasons: UnproductiveReason[] = unproductiveReasonsData;
