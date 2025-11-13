import axios from "axios";
import { APIURL, getHeaders, getLoginHeaders } from "./Config";

export const CommonAPI = async (body, version, pageName, signal) => {
    try {
        const headers = getHeaders();
        const loginHeader = getLoginHeaders();

        // Fix the axios call to properly pass the signal
        const { data } = await axios.post(APIURL, body, { 
            headers: version === "login" ? loginHeader : headers,
            ...(signal && { signal }) // Only add signal if it exists
        });
        return data;
    } catch (error) {
        // Check if it's an abort error
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('AbortError');
        }
        console.error("API Error:", error);
        return null;
    }
};