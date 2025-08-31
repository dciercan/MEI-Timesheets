
import type { User, Activity, UnproductiveReason, Location } from './types';
import usersData from './users.json';
import activitiesData from './activities.json';
import unproductiveReasonsData from './unproductiveReasons.json';
import locationsData from './locations.json';

export const users: User[] = usersData;
export const activities: Activity[] = activitiesData;
export const unproductiveReasons: UnproductiveReason[] = unproductiveReasonsData;
export const locations: Location[] = locationsData;
