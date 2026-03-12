import api from "./api";

// Upload a resume PDF
export const uploadResume = async (file, targetRole) => {
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("targetRole", targetRole);

    const res = await api.post("/api/student/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
};

// Get all resumes and career roadmap for the logged-in student
export const getResumes = async () => {
    const res = await api.get("/api/student/resumes");
    return res.data.data; // Now returns { resumes, careerRoadmap }
};

// Delete a specific resume
export const deleteResume = async (id) => {
    const res = await api.delete(`/api/student/resumes/${id}`);
    return res.data.data;
};

// Get dashboard stats
export const getDashboardStats = async () => {
    const res = await api.get("/api/student/dashboard");
    return res.data.data;
};
// Get the standalone career roadmap
export const getRoadmap = async () => {
    const res = await api.get("/api/student/roadmap");
    return res.data.data;
};
