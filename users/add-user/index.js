const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const xray_helper = require('./lib/xray_helper');
const lambda_helper = require('./lib/lambda_helper');
const uuid = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Received context:', JSON.stringify(context, null, 2));
    const segment = AWSXRay.getSegment();

    try {
        /*
        () => addNewUser(event) instead of addNewUser(event) to be able to call the function inside xray_helper
        when function has parameters
        */
        let data = await xray_helper.trace('Add New User', segment, () => addNewUser(event), null);
        let options = {
            annotations: {
                fullName: data.Attributes.FullName,
                id: data.Attributes.id
            }
        };
        await xray_helper.trace('Publish SNS New User', segment, () => publishSns(data), options);
        return lambda_helper.api_return(200, data);
    } catch (err) {
        return lambda_helper.api_return(500, err);
    }

};

const addNewUser = async (event) => {
    let data;
    try {
        const id = uuid.v4();
        let expression = '';
        let values = {};
        let i = 0;
        const dbpayload = JSON.parse(event.body);

        Object.keys(dbpayload).forEach(function (key) {
            i++;
            expression += ' ' + key + ' = :' + i + ',';
            values[':' + i] = dbpayload[key];
        });

        let params = {
            TableName: process.env.TABLE_NAME,
            Key: {
                id: id
            },
            // remove the trailing ',' from the update expression added by the forEach loop
            UpdateExpression: 'set ' + expression.slice(0, -1),
            ExpressionAttributeValues: values,
            ReturnValues: "ALL_NEW"
        };
        data = await dynamodb.update(params).promise();
    } catch (err) {
        throw err;
    }
    return data;
}

const publishSns = async (data) => {
    try {
        const msg = {
            TopicArn: process.env.TOPIC_NAME,
            Message: JSON.stringify({
                operation: "notify_new_name",
                details: {
                    id: data.Attributes.id,
                    name: data.Attributes.FullName ? data.Attributes.FullName : "N/A"
                }
            }),
            MessageAttributes: {
                "Status": { "DataType": "String", "StringValue": "Success" }
            }
        };
        await sns.publish(msg).promise();
    } catch (err) {
        throw err;
    }
}