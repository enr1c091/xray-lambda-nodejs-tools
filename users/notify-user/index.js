const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const xray_helper = require('./lib/xray_helper');

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Received context:', JSON.stringify(context, null, 2));
    const segment = AWSXRay.getSegment();

    try {
        const record = JSON.parse(event.Records[0].Sns.Message);
        let options = {
            annotations: {
                id: record['details']['id']
            }
        };
        return await xray_helper.trace('Subscribe SNS New User', segment, () => getUser(record), options);
    } catch (err) {
        throw err;
    }
};

const getUser = async (record) => {
    console.log('New user inserted with id ', record['details']['id']);
    return JSON.stringify(record);
}