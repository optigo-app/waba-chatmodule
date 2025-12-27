import { saveToken } from "../InitialApi/SaveToken";

export const savePlayerId = async (SocketId, userId, id) => {

    try {
        const body = {
            "con": "{\"id\":\"\",\"mode\":\"wa_save_device_tok\",\"appuserid\":\"${userId}\"}",
            "p": "{\"UserId\": ${id},\"SocketId\":\"${SocketId}\"}",
            "f": "Agent Information ( Save Device Token )"
        }
        const response = await saveToken(body);
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
};