import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchCustomerLists = async (page = 1, pageSize = 20, searchTerm = "", userId) => {
    try {
        const body = {
            "con": "{\"id\":\"\",\"mode\":\"wa_customer_list_chat\",\"appuserid\":\"${userId}\"}",
            "p": "{\"Page\":${page},\"PageSize\":${pageSize},\"SearchTerm\": \"${searchTerm}\"}",
            "f": "WhatsApp Chat ( Customer List )",
        };

        const response = await CommonAPI(body);
        const data = response?.Data;

        // Handle special error shape: Data.rd[0].stat === 0 (not a normal list)
        const rd0 = data?.rd?.[0];
        if (rd0 && typeof rd0.stat !== 'undefined' && rd0.stat === 0) {
            let msg = rd0.stat_msg || 'Something went wrong';
            if (typeof msg === 'string') {
                msg = msg.replace(/^"|"$/g, '');
            }
            throw new Error(msg);
        }

        if (data) {
            return {
                data: data?.rd || [],
                total: data?.total || data?.rd?.length || 0,
                currentPage: page,
                hasMore: data?.rd?.length === pageSize
            };
        }

        return {
            data: [],
            total: 0,
            currentPage: page,
            hasMore: false
        };
    } catch (error) {   
        console.error('Error:', error);
        return {
            data: [],
            total: 0,
            currentPage: page,
            hasMore: false
        };
    }
};