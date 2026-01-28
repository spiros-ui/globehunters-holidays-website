/**
 * Admin Authentication System
 * Simple password-based authentication for the back office
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

const DATA_DIR = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "admin-users.json");

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: "admin" | "staff";
  createdAt: string;
  lastLogin?: string;
}

interface UsersData {
  users: AdminUser[];
}

// Hash password with SHA-256
export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Initialize with default admin user if no users exist
function initializeUsers(): UsersData {
  const defaultUsers: UsersData = {
    users: [
      {
        id: "admin-1",
        username: "admin",
        passwordHash: hashPassword("globehunters2024"),
        name: "Administrator",
        role: "admin",
        createdAt: new Date().toISOString(),
      },
    ],
  };
  return defaultUsers;
}

// Read users from file
export function readUsers(): UsersData {
  ensureDataDir();
  if (!existsSync(USERS_FILE)) {
    const defaultUsers = initializeUsers();
    writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    return defaultUsers;
  }
  try {
    const data = readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    const defaultUsers = initializeUsers();
    writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    return defaultUsers;
  }
}

// Write users to file
export function writeUsers(data: UsersData) {
  ensureDataDir();
  writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

// Verify user credentials
export function verifyCredentials(
  username: string,
  password: string
): AdminUser | null {
  const { users } = readUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) return null;

  const passwordHash = hashPassword(password);
  if (user.passwordHash !== passwordHash) return null;

  // Update last login
  user.lastLogin = new Date().toISOString();
  writeUsers({ users });

  return user;
}

// Create a new user (admin only)
export function createUser(
  username: string,
  password: string,
  name: string,
  role: "admin" | "staff" = "staff"
): AdminUser | null {
  const { users } = readUsers();

  // Check if username already exists
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return null;
  }

  const newUser: AdminUser = {
    id: `user-${Date.now()}`,
    username,
    passwordHash: hashPassword(password),
    name,
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers({ users });

  return newUser;
}

// Update user password
export function updatePassword(userId: string, newPassword: string): boolean {
  const data = readUsers();
  const user = data.users.find((u) => u.id === userId);

  if (!user) return false;

  user.passwordHash = hashPassword(newPassword);
  writeUsers(data);

  return true;
}

// Get all users (without password hashes)
export function getAllUsers(): Omit<AdminUser, "passwordHash">[] {
  const { users } = readUsers();
  return users.map(({ passwordHash, ...user }) => user);
}

// Delete user
export function deleteUser(userId: string): boolean {
  const data = readUsers();
  const index = data.users.findIndex((u) => u.id === userId);

  if (index === -1) return false;

  // Don't allow deleting the last admin
  const admins = data.users.filter((u) => u.role === "admin");
  if (admins.length === 1 && data.users[index].role === "admin") {
    return false;
  }

  data.users.splice(index, 1);
  writeUsers(data);

  return true;
}
