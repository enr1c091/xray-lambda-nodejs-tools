const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const xray_helper = require('./lib/xray_helper');
const lambda_helper = require('./lib/lambda_helper');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Received context:', JSON.stringify(context, null, 2));
    const segment = AWSXRay.getSegment();

    let options = {};
    options.annotations = {
        annot1: "curioso sou eu",
        annot2: "quem leu se fodeu"
    }
    options.metadata = {
        metinha: "13 confirma"
    }

    try {
        let data = await xray_helper.trace('Get Users', segment, getUsers, options);
        return lambda_helper.api_return(200, data);
    } catch (err) {
        return lambda_helper.api_return(500, err);
    }
};

const getUsers = async () => {
    let data;
    try {
        let params = {
            TableName: process.env.TABLE_NAME
        };
        data = await dynamodb.scan(params).promise();
    } catch (err) {
        throw err;
    }
    return data;
};

