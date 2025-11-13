import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

const AllowedDomains = ["localhost"];

if (process.env.NODE_ENV === "development" || AllowedDomains.some((domain) => window.location.hostname.includes(domain))) {
    // Cookies.set("skey", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJpdGFzayIsImF1ZCI6ImFtVnVhWE5BWldjdVkyOXQiLCJleHAiOjE3NDYxODg3NDgsInVpZCI6ImFtVnVhWE5BWldjdVkyOXQiLCJ5YyI6ImUzdHVlbVZ1ZlgxN2V6SXdmWDE3ZTI5eVlXbHNNalY5Zlh0N2IzSmhhV3d5TlgxOSIsInN2IjoiMCJ9.Ui_Taj21Fb8oDWvhEc8IwHJZTeFxUos46Jb6H4Iyk8M", { path: "/" });
    Cookies.set("skey", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJpdGFzayIsImF1ZCI6IllXMXlkWFJBWldjdVkyOXQiLCJleHAiOjE3NDcxMzk2ODYsInVpZCI6IllXMXlkWFJBWldjdVkyOXQiLCJ5YyI6ImUzdHVlbVZ1ZlgxN2V6SXdmWDE3ZTI5eVlXbHNNalY5Zlh0N2IzSmhhV3d5TlgxOSIsInN2IjoiMCJ9.m4NonzyJfWdM0frEq1Cn4h1ABThBa1wgosx8Z7Mg5VI", { path: "/" });
}
// Amrut Sir Login Cookies
// if (process.env.NODE_ENV === 'development') {
//     console.log("AuthUtils.js is running in development mode");
// }

export function decodeBase64(base64Str) {
    try {
        return decodeURIComponent(
            atob(base64Str)
                .split("")
                .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
                .join(""),
        );
    } catch (error) {
        console.error("Base64 decoding failed:", error);
        return null;
    }
}

export function GetCredentialsFromCookie() {
    try {
        const token = Cookies.get("skey");
        if (!token) {
            console.warn("skey cookie not found");
            return null;
        }
        const decoded = jwtDecode(token);
        const companyEncoded = decoded?.uid;
        const user = companyEncoded ? decodeBase64(companyEncoded) : null;
        return {
            ...decoded,
            userId: user,
        };
    } catch (error) {
        console.error("Failed to parse JWT from skey cookie:", error);
        return null;
    }
}
