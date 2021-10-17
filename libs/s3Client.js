const { S3Client } = require("@aws-sdk/client-s3");
const {PutObjectCommand, DeleteObjectCommand} = require('@aws-sdk/client-s3');
const fs = require('fs');
// Set the AWS Region.
const REGION = "us-east-1"; //e.g. "us-east-1"
// Create an Amazon S3 service client object.
const s3Client = new S3Client({ region: REGION });

const uploadFile = (file) => {
    if(!file)
        return Promise.resolve(null);
    const fileStream = fs.createReadStream(file);
    console.log('key:', file)
    // Set the parameters
    const uploadParams = {
        Bucket: process.env.S3_BUCKET,
        // Add the required 'Key' parameter using the 'path' module.
        Key: file,
        // Add the required 'Body' parameter
        Body: fileStream,
        ACL: 'public-read'
    };
    
    return s3Client.send(new PutObjectCommand(uploadParams))
        .then(data => {
            return data;
        }).catch(err => Promise.reject('error uploading image'))
}

const deleteFile = (file) => {
    if(!file) return;

    const bucketParams = {
        Bucket: process.env.S3_BUCKET,
        Key: file
    }

    s3Client.send(new DeleteObjectCommand(bucketParams));
}

module.exports = {
    s3Client,
    uploadFile,
    deleteFile
};