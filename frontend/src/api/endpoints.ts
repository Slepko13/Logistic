export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
  },
  CITIES: {
    GET_ALL: '/api/cities',
    CREATE: '/api/cities',
    UPDATE: (id: number | string) => `/api/cities/${id}`,
    DELETE: (id: number | string) => `/api/cities/${id}`,
  },
  USERS: {
    GET_ALL: '/api/users',
    CREATE: '/api/users',
    UPDATE: (id: number | string) => `/api/users/${id}`,
    DELETE: (id: number | string) => `/api/users/${id}`,
    PROMOTE_ADMIN: (id: number | string) => `/api/users/${id}/promote-admin`,
  },
  VEHICLES: {
    GET_ALL: '/api/vehicles',
    CREATE: '/api/vehicles',
    UPDATE: (id: number | string) => `/api/vehicles/${id}`,
    DELETE: (id: number | string) => `/api/vehicles/${id}`,
  },
  TRIPS: {
    GET_ALL: '/api/trips',
    GET_HISTORY: '/api/trips/history',
    GET_BY_ID: (id: number | string) => `/api/trips/${id}`,
    UPDATE: (id: number | string) => `/api/trips/${id}`,
    COMPLETE: (id: number | string) => `/api/trips/${id}/complete`,
    ADD_DRIVER: (tripId: number | string) => `/api/trips/${tripId}/drivers`,
    REMOVE_DRIVER: (tripId: number | string, userId: number | string) =>
      `/api/trips/${tripId}/drivers/${userId}`,
    BOOK_SEAT: (tripId: number | string) => `/api/trips/${tripId}/seats`,
    UPDATE_SEAT: (tripId: number | string, seatNumber: number | string) =>
      `/api/trips/${tripId}/seats/${seatNumber}`,
    CLEAR_SEAT: (tripId: number | string, seatNumber: number | string) =>
      `/api/trips/${tripId}/seats/${seatNumber}`,
    ADD_PARCEL: (tripId: number | string) => `/api/trips/${tripId}/parcels`,
    UPDATE_PARCEL: (tripId: number | string, parcelId: number | string) =>
      `/api/trips/${tripId}/parcels/${parcelId}`,
    DELETE_PARCEL: (tripId: number | string, parcelId: number | string) =>
      `/api/trips/${tripId}/parcels/${parcelId}`,
  },
};
