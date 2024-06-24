const multer = require('multer');

// Konfigurasi penyimpanan
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })

// Endpoint untuk upload gambar
app.post('/uploadProfilePicture', upload.single('profilePicture'), (req, res) => {
  const userId = req.body.userId;
  const profilePicture = req.file.path;

  const sql = "UPDATE users SET profilePicture = ? WHERE id = ?";
  con.query(sql, [profilePicture, userId], (err, result) => {
    if (err) return res.json({ Error: "Error in running query" });
    return res.json({ Status: "Success", Result: result });
  });
});