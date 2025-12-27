// In-memory user database for demo purposes
// In production, this would be a real database like MongoDB, PostgreSQL, etc.

let usersDatabase = []

export function getUser(email) {
  return usersDatabase.find(user => user.email === email)
}

export function createUser(userData) {
  const user = {
    id: Math.random().toString(36).substr(2, 9),
    ...userData,
    createdAt: new Date().toISOString(),
  }
  usersDatabase.push(user)
  return user
}

export function getAllUsers() {
  return usersDatabase
}

export function clearDatabase() {
  usersDatabase = []
}
