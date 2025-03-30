export const environment = {
  production: true,
  apiUrl: (window as any).env?.API_URL || 'http://localhost:8080/api'
};
