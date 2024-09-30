import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, _file, cb) {
      cb(null , "./public/temp")
    },
    filename: function (req, _file, cb) {
      
      cb(null, _file.originalname)
    }
  })
  
  export const upload = multer({ 
    storage,
 })