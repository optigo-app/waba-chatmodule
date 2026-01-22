import { GetCredentialsFromCookie } from "../../utils/FetchToken";

const isLocal = ["localhost", "nzen", '9511a53f910a.ngrok-free.app'].includes(window.location.hostname);

const BASE_URL = isLocal ? "http://192.168.1.71:5002/api" : "https://nxt22.optigoapps.com/api";
const MEDIA_BASE_URL = "https://crmapp.mpillarapi.com/api/meta/v19.0/622385334300738/Media/";

export const APIURL = `${BASE_URL}/report`;
export const MEDIAAPIURL = MEDIA_BASE_URL;
export const MESSAGEAPIURL = `${BASE_URL}/whatsapp/chat/send`;
export const MESSAGEAPIURLBULK = `${BASE_URL}/whatsapp/chat/send-bulk`;
export const GETCONVERSATIONURL = `${BASE_URL}/report`;
export const LOGOUTAPI = `${BASE_URL}/whatsapp/chat/logout`;
export const UPLOADMEDIA = MEDIA_BASE_URL;
export const SAVEPLAYERID = `${BASE_URL}/report`;


// ✅ Updated function to skip credentials if missing
export const getHeaders = () => {
    let credentials = GetCredentialsFromCookie();
    const version = "v2";

    if (!credentials) {
        const sessionToken = JSON.parse(sessionStorage.getItem("token"));
        if (sessionToken) {
            credentials = {
                yc: sessionToken.yc,
                sv: sessionToken.sv,
            };
        }
    }

    const headers = {
        Version: version,
        sp: "16",
        whatsappNumber: "622385334300738",
    };

    if (credentials && credentials.yc && credentials.sv) {
        headers.Yearcode = credentials.yc;
        headers.sv = credentials.sv;
    }

    return headers;
};

// ✅ Similarly safe version for login headers
export const getLoginHeaders = (init = {}) => {
    let credentials = GetCredentialsFromCookie();
    const { version = "v2" } = init;

    if (!credentials) {
        const sessionToken = JSON.parse(sessionStorage.getItem("token"));
        if (sessionToken) {
            credentials = {
                yc: sessionToken.yc,
                sv: sessionToken.sv,
            };
        }
    }

    const headers = {
        Version: version,
        sp: "16",
    };

    if (credentials && credentials.yc && credentials.sv) {
        headers.Yearcode = credentials.yc;
        headers.sv = credentials.sv;
    }

    return headers;
};