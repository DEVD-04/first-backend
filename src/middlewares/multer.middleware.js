import multer from "multer";

const storage = multer.diskStorage({    //using diskstorage to hold the data 
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)   //using original name given by user, not good practice, as same name can create conflict, but it stays very small time in server, once it uploaded in cloudinary it is unlinked
    }
  })
  // this func will return the localfilepath
  export const upload = multer({ storage, })