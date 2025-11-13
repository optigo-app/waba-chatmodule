import { GetCredentialsFromCookie } from "../../utils/FetchToken";
import { useNavigate } from "react-router-dom";

const isLocal = ["localhost", "nzen", '7afbf14fb357.ngrok-free.app'].includes(window.location.hostname);

// export const APIURL = isLocal ? "http://nextjswhatsapp.web/api/report" : "https://livenx.optigoapps.com/api/report";
// export const MEDIAAPIURL = "https://messagingapi.charteredinfo.com/v19.0/622385334300738/Media/";
// export const MESSAGEAPIURL = isLocal ? "http://nextjswhatsapp.web/api/chat/send" : "https://nxt01.optigoapps.com/api/chat/send";
// export const GETCONVERSATIONURL = isLocal ? "http://newnextjs.web/api/report" : "https://livenx.optigoapps.com/api/report";
// export const UPLOADMEDIA = isLocal ? "http://nextjswhatsapp.web/api/media/upload" : "https://nxt01.optigoapps.com/api/media/upload";
// export const SAVEPLAYERID = isLocal ? "http://newnextjs.web/api/report" : "https://livenx.optigoapps.com/api/report";

// export const APIURL = isLocal ? "http://nextjswhatsapp.web/api/report" : "https://livenx.optigoapps.com/api/report";
// export const MEDIAAPIURL = "https://messagingapi.charteredinfo.com/v19.0/622385334300738/Media/";
// export const MESSAGEAPIURL = isLocal ? "http://192.168.1.71:8000/api/chat/send" : "https://nxt01.optigoapps.com/api/chat/send";
// export const GETCONVERSATIONURL = isLocal ? "http://newnextjs.web/api/report" : "https://livenx.optigoapps.com/api/report";
// export const UPLOADMEDIA = isLocal ? "http://nextjswhatsapp.web/api/media/upload" : "https://nxt01.optigoapps.com/api/media/upload";
// export const SAVEPLAYERID = isLocal ? "http://newnextjs.web/api/report" : "https://livenx.optigoapps.com/api/report";

export const APIURL = isLocal ? "http://192.168.1.71:3001/api/report" : "https://nxtapi.optigoapps.com/api/report";
export const MEDIAAPIURL = "https://crmapp.mpillarapi.com/api/meta/v19.0/622385334300738/Media/";
export const MESSAGEAPIURL = isLocal ? "http://192.168.1.71:3001/api/whatsapp/chat/send" : "https://nxtapi.optigoapps.com/api/whatsapp/chat/send";
export const MESSAGEAPIURLBULK = isLocal ? "http://192.168.1.71:3001/api/whatsapp/chat/send-bulk" : "https://nxtapi.optigoapps.com/api/whatsapp/chat/send-bulk";
export const GETCONVERSATIONURL = isLocal ? "http://192.168.1.71:3001/api/report" : "https://nxtapi.optigoapps.com/api/report";
export const LOGOUTAPI = isLocal ? "http://192.168.1.71:3001/api/whatsapp/chat/logout" : "https://nxtapi.optigoapps.com/api/whatsapp/chat/logout";
// export const UPLOADMEDIA = isLocal ? "http://nextjswhatsapp.web/api/media/upload" : "https://nxtapi.optigoapps.com/api/media/upload";
export const UPLOADMEDIA = "https://crmapp.mpillarapi.com/api/meta/v19.0/622385334300738/Media/";
export const SAVEPLAYERID = isLocal ? "http://192.168.1.71:3001/api/report" : "https://nxtapi.optigoapps.com/api/report";

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