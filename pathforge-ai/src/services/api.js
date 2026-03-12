import axios from 'axios'

const api = axios.create({
    baseURL: '',
    headers: { 'Content-Type': 'application/json' }
})

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Handle expired tokens globally
api.interceptors.response.use(
    (res) => res,
    (error) => {
        const isAuthRequest = error.config?.url?.includes('/login') || error.config?.url?.includes('/signup');
        if (error.response?.status === 401 && !isAuthRequest) {
            localStorage.removeItem('token')
            window.location.href = '/signin'
        }
        return Promise.reject(error)
    }
)

export default api