const apigw_return = async (status_code, data) => {
    console.log(status_code, data)
    return {
        statusCode: status_code,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(data)
    }
};

exports.api_return = apigw_return;
