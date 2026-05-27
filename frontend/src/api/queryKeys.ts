export const QUERY_KEYS = {
  USERS: {
    ALL: ['users'],
  },
  CITIES: {
    ALL: ['cities'],
  },
  VEHICLES: {
    ALL: ['vehicles'],
  },
  TRIPS: {
    ALL: ['trips-all'],
    ACTIVE: ['active-trips'],
    HISTORY: ['trips-history'],
    DETAIL: (id: number | string) => ['trip', id],
  },
};
