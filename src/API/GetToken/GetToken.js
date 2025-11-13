import { CommonAPI1 } from "../InitialApi/CommonApi1";

export const getToken = async (companyCode) => {

    try {
        const body = {
            "con": "{\"id\":\"\",\"mode\":\"gettokenbycompanycode\",\"appuserid\":\"\"}",
            "p": `{\"companycode\":\"${companyCode}\"}`,
            "f": "Gettoken By Company Code (ConversionDetail)"
        }

        const response = await CommonAPI1(body);
        if (response?.Data) {
            return response?.Data;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
};