// src/api/authApi.js

const API_URL = "http://127.0.0.1:8081";

export async function registerUser(userData) {
  try {
    const res = await fetch(`${API_URL}/admin/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await res.json();

    return {
      status: res.status,
      data,
    };
  } catch (error) {
    return {
      status: 500,
      data: { message: "Server connection failed" },
    };
  }
}

export async function loginUser(credentials) {
  try {
    const res = await fetch(`${API_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    return { status: res.status, data };
  } catch (error) {
    return { status: 500, data: { message: "Server connection failed" } };
  }
}