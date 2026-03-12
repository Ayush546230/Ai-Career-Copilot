import api from "./api";

export const signUp = async (userData) => {
    const res = await api.post("/api/auth/signup", userData);
    if (res.data.data?.token) localStorage.setItem("token", res.data.data.token);
    return res.data.data;
};

export const signIn = async (credentials) => {
    const res = await api.post("/api/auth/login", credentials);
    if (res.data.data?.token) localStorage.setItem("token", res.data.data.token);
    return res.data.data;
};

export const signOut = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
};

export const getMe = async () => {
    const res = await api.get("/api/auth/me");
    return res.data.data;
};