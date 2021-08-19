const multer = require('multer');

const imageFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        // cb(new Error('Please upload only images'), false);
        cb('Please upload only images', false);
    }
}

const imageUploads = multer({dest: 'public/uploads/images/', fileFilter: imageFilter});
const tempUploads = multer({dest: 'public/uploads/tmp/', fileFilter: imageFilter});

module.exports = {
    imageUploads,
    tempUploads
}