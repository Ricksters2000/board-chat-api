require('dotenv').config();
const {PutObjectCommand} = require('@aws-sdk/client-s3');
const fs = require('fs');

const handleProfileGet = (db) => (req, res) => {
    const {id} = req.params;

    db('users').where('id', id)
        .then(user => {
            if(user.length) 
                res.json({...user[0], image: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${user[0].image}`});
            else
                res.status(400).json('user not found');
        })
        .catch(err => res.status(404).json('error getting user'));
}

const handleProfileUpdate = (db, s3Client) => (req, res) => {
    const {id} = req.params;
    const {name, color, email, prevEmail} = req.body;
    const image = req.file?.destination ? req.file.destination+req.file.filename : '';

    uploadImage(image, s3Client)
        .then(data => {
            const userOptions = {name, color}
            if(data !== 'no image')
                userOptions['image'] = image;
            db('login').where({email: prevEmail}).update({email})
                .then(resp => {
                    if(resp) {
                        db('users').where({id}).update(userOptions).then(r => res.json('success')).catch(err => res.status(400).json('error updating email'))
                    } else {
                        console.log(prevEmail);
                        res.status(400).json('unable to update user');
                    }
                }).catch(err => {
                    console.log(name, email, image)
                    console.log('error updating user', err)
                    res.status(400).json('error updating user')
                })
        }).catch(err => res.status(400).json(err))
    
}

const handleProfileWin = (db) => (req, res) => {
    const {id} = req.params;
    
    db('users').returning('wins').where({id}).increment({wins: 1})
        .then(userWins => {
            if(userWins.length > 0)
                res.json(userWins[0])
            else
                res.status(401).json('user not found')
        }).catch(err => res.status(400).json(err))
}

const handleProfileUpdateImage = (req, res, db) => {
    const {id} = req.params;
    const image = getImageDest(req.file);
    console.log(req, req.file, id)
    db('users').where({id}).update({image})
        .then(resp => {
            if(resp) {
                res.json('success')
            } else {
                res.status(400).json('unable to update user')
            }
        }).catch(err => res.status(400).json('error updating user'))
}

const handleTempImage = (req, res) => {
    const image = getImageDest(req.file);
    res.json(process.env.HOST+ '/' + image);
}

const uploadImage = (file, s3Client) => {
    if(!file)
        return Promise.resolve('no image');
    // const file = req.file.destination + req.file.filename;
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

const getImageDest = (file) => file.destination.replace('public','') + file.filename;

module.exports = {
    handleProfileGet,
    handleProfileUpdate,
    handleProfileWin,
    handleProfileUpdateImage,
    handleTempImage
}