import { GetCredentialsFromCookie } from "../../utils/FetchToken";


const isLocal = ["localhost", '5dmjw0dg-2000.inc1.devtunnels.ms'].includes(window.location.hostname);
const isNxt = ['nxtwabachat.optigoapps.com'].includes(window.location.hostname);
const isLocalWeb = ["wabachat.web"].includes(window.location.hostname);

const API_BASE_URL = isLocal ?
    process.env.REACT_APP_API_DEVELOPMENT_URL :
    isLocalWeb ? process.env.REACT_APP_API_WEB_DEVELOPMENT_URL :
        isNxt ? process.env.REACT_APP_API_NXT_PRODUCTION_URL :
            process.env.REACT_APP_API_PRODUCTION_URL;

const BASE_URL = API_BASE_URL;
const MEDIA_BASE_URL = process.env.REACT_APP_MEDIA_BASE_URL;

export const APIURL = `${BASE_URL}/report`;
export const MEDIAAPIURL = MEDIA_BASE_URL;
export const MESSAGEAPIURL = `${BASE_URL}/whatsapp/chat/send`;
export const MESSAGEAPIURLBULK = `${BASE_URL}/whatsapp/chat/send-bulk`;
export const GETCONVERSATIONURL = `${BASE_URL}/report`;
export const LOGOUTAPI = `${BASE_URL}/whatsapp/chat/logout`;
export const UPLOADMEDIA = MEDIA_BASE_URL;
export const SAVEPLAYERID = `${BASE_URL}/report`;
export const MEDIARETRIEVED = `${BASE_URL}/whatsapp/media/retrieved`;


// ✅ Updated function to skip credentials if missing
export const getHeaders = () => {
    let credentials = GetCredentialsFromCookie();
    const version = "v2";

    if (!credentials) {
        const sessionToken = JSON.parse(sessionStorage.getItem("token"));
        if (sessionToken) {
            credentials = {
                yc: sessionToken.yearcode || sessionToken.yc,
                sv: sessionToken.sv,
            };
        }
    }

    const headers = {
        Version: version,
        sp: "16",
        whatsappNumber: "622385334300738",
    };

    if (credentials) {
        headers.Yearcode = credentials.yc || credentials.yearcode;
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