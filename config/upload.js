const multer = require('multer');     
const path = require('path');         

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/admin/uploads'));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname;
    cb(null, name);
  },
});

const upload = multer({ storage: storage });

const uploadMultiple = upload.fields([{name:'images',maxCount:4}])
const uploadSingle = upload.single("image")

module.exports = {upload, uploadMultiple, uploadSingle};