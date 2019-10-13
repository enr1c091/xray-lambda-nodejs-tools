const AWSXRay = require('aws-xray-sdk-core');

const trace = (name, segment, fn, options) => {
    return new Promise((resolve, reject) => {
        const f = async (subsegment) => {
            subsegment = parseSubsegmentOptions(subsegment, options);
            try {
                const data = await fn();
                subsegment.addAnnotation('STATUS', 'SUCCESS');
                subsegment.close();
                resolve(data);
            } catch (error) {
                subsegment.addAnnotation('STATUS', 'FAILED');
                subsegment.close(error);
                reject(error)
            }
        }
        AWSXRay.captureAsyncFunc(name, f, segment);
    });
}

const parseSubsegmentOptions = (subsegment, options) => {
    if (!options)
        return subsegment;

    const annot = options.annotations !== undefined ? options.annotations : {};
    const meta = options.metadata !== undefined ? options.metadata : {};
    Object.keys(annot).forEach(k => {
        subsegment.addAnnotation(k, annot[k])
    });
    Object.keys(meta).forEach(k => {
        subsegment.addMetadata(k, meta[k])
    });
    return subsegment;
}

exports.trace = trace;