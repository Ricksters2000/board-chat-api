const multer = require('multer');

const errCheck = (uploadType, imageName) => (req, res, next) => {
    uploadType.single(imageName)(req, res, err => {
        if(err) {
            console.log('image error:', err.toString())
            res.status(500).json('Profile pic can only be an image');
        } else next();
    })
}

const imageFilter = (req, file, cb) => {
    console.log('checking image:', file);
    if(file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Please upload only images'));
        // cb('Please upload only images', false);
    }
}

const imageUploads = multer({dest: 'public/images/', fileFilter: imageFilter});
const tempUploads = multer({dest: 'public/tmp/', fileFilter: imageFilter});

// const next_f = (next) => console.log(next instanceof multer.MulterError

// const checkError = (req, res, next_f) => next();

module.exports = {
    imageUploads,
    tempUploads,
    errCheck
}