import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchAllTagsApi = async (userId) => {
    try {
        const body = {
            "con": "{\"id\":\"\",\"mode\":\"wa_list_tags\",\"appuserid\":\"${userId}\"}",
            "p": ``,
            "f": "WhatsApp Chat ( List Tags )"
        }
        const response = await CommonAPI(body);
        const data = response?.Data;

        // Handle special error shape: Data.rd[0].stat === 0
        const rd0 = data?.rd?.[0];
        if (rd0 && typeof rd0.stat !== 'undefined' && rd0.stat === 0) {
            let msg = rd0.stat_msg || 'Something went wrong';
            if (typeof msg === 'string') {
                msg = msg.replace(/^"|"$/g, '');
            }
            throw new Error(msg);
        }

        if (data) {
            return data;
        }
        return null;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}