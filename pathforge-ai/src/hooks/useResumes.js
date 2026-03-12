import { useState, useCallback } from 'react';

export const useResumes = () => {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchResumes = useCallback(async () => {
        setLoading(true);
        try {
            // Implement resume fetching logic
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return { resumes, loading, error, fetchResumes };
};
