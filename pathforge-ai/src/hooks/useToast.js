
import { useState } from "react";

export function useToast(duration = 3000) {
    const [message, setMessage] = useState(null);

    const showToast = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), duration);
    };

    return { message, showToast };
}