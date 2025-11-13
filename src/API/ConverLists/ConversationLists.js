import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchConversationLists = async (page = 1, pageSize = 20, userId, search = "") => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"wa_list_conv\",\"appuserid\":\"${userId}\"}`,
            "p": `{\"Page\":${page},\"PageSize\":${pageSize},\"SearchTerm\": \"${search}\"}`,
            "f": "Chat ( List Conversation )",
        };
        const response = await CommonAPI(body);
        if (response?.Data) {
            return {
                data: response?.Data || [],
                total: response?.Data?.total || response?.Data?.length || 0,
                currentPage: page,
                hasMore: response?.Data?.length === pageSize
            };
        } else {
            return {
                data: [],
                total: 0,
                currentPage: page,
                hasMore: false
            };
        }
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