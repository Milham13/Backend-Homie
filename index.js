const express = require('express')
const mysql = require("mysql2");
const cors = require("cors")
const multer = require('multer');

const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

const app = express()
const port = 4000

app.use(express.json());
app.use(cors());

const con = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "",
    database: "nodejsdb"
})

con.connect(function(err){
    if (err) {
        console.log("Error in connection");
    } else {
        console.log("Connected");
    }
})

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

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/getPesanan', (req, res) => {
    const sql = "SELECT * FROM pesanan";
    con.query(sql, (err, result) => {
        if (err) return res.json({Error: "Get pesanan eror in sql"});
        return res .json({Status: "Success", Result: result})
    })
  })

app.get('/get/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM pesanan where id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({Error: "Get pesanan eror in sql"});
        return res .json({Status: "Success", Result: result})
    })
})

app.put("/update/:id", (req, res) => {
    const userId = req.params.id;
    const q ="UPDATE pesanan SET `nama` = ?, `email` = ?, `alamat` = ?, `harga` = ?, `nomor_telfon` = ? WHERE id = ?";

    const values = [
    req.body.nama,
    req.body.email,
    req.body.alamat,
    req.body.harga,
    req.body.nomor_telfon,
    ];

    con.query(q, [...values,userId], (err, data) =>{
        if (err) return res.send(err);
        return res.json(data);
    });
});

app.delete("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "Delete FROM pesanan WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({Error: "Delete pesanan eror in sql"});
        return res .json({Status: "Success"})
    })
})

app.get('/pesananCount', (req, res) =>{
    const sql = "Select count(id) as pesanan from pesanan";
    con.query(sql, (err, result) =>{
        if (err) return res.json({Error: "Error in running query"});
        return res.json(result);
    })
})

app.get('/harga', (req, res) =>{
    const sql = "Select sum(harga) as sumOfHarga from pesanan";
    con.query(sql, (err, result) =>{
        if (err) return res.json({Error: "Error in running query"});
        return res.json(result);
    })
})

app.post('/create', (req, res) => {
    const nama = req.body.nama;
    const email = req.body.email;
    const alamat = req.body.alamat;
    const harga = req.body.harga;
    const nomor_telfon = req.body.nomor_telfon;

    con.query("INSERT INTO pesanan (nama, email, alamat, harga, nomor_telfon) VALUES (?, ?, ?, ?, ?)", [nama, email, alamat, harga, nomor_telfon],
        (err, result) => {
            if (result) {
                res.send(result);
            } else {
                res.send({message: "ENTER CORRECT DETAILS!"})
            }
        }
    )
})

//Endpoint untuk Pendapatan
app.get('/totalPendapatan', (req, res) => {
    const sql = "SELECT SUM(harga) AS totalPendapatan FROM pesanan";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error in SQL query" });
        return res.json({ Status: "Success", Result: result[0].totalPendapatan });
    });
});

app.get('/hash', (req, res) =>{
    bcrypt.hash ("1111", 10, (err, hash) =>{
        if (err) return res.json({Error: "Error in hashing kataSandi"});
        const values = [
            hash
        ]
        return res.json({result: hash});
    })
})

app.post('/login', (req, res) =>{
    const sql = "SELECT * FROM users Where email = ?";
    con.query(sql, [req.body.email], (err, result)=>{
        if (err) return res.json({Status: "Error", Error: "Error in runnig query"});
        if (result.length > 0) {
            bcrypt.compare(req.body.kataSandi.toString(), result[0].katasandi, (err, response)=> {
                if(err) return res.json({Error: "katasandi error"});
                if(response) {
                    const token = jwt.sign({role:"admin"}, "jwt-secret-key", {expiresIn: '1d'});
                    return res.json({Status: "Berhasil", Token: token})
                } else {
                    return res.json ({Status: "Error", Error: "Email atau Katasandi salah"});
                }
            })
        } else {
            return res.json ({Status: "Error", Error: "Email atau Katasandi salah"});
        }
    })
})

app.post('/daftar', async(req, res) =>{
    const sql = "INSERT INTO users (`nama`,`nomorHp`,`email`,`katasandi`) VALUES (?)";
    await bcrypt.hash(req.body.kataSandi, 10, (err, hash) => {
        if(err) return res.json({Error: "Error in hashing kataSandi", err});
        const values = [
            req.body.nama,
            req.body.nomorHp,
            req.body.email,
            hash,
        ]
        con.query(sql, [values], (err, result)=>{
            if (err) return res.json({Error: "Error query", err});
            return res.json({Status: "Success"});
        })
    })
})

//Endpoint untuk Pesanan Harian
app.get('/pesananHarian', (req, res) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const sql = "SELECT COUNT(*) AS totalPesanan FROM pesanan WHERE created_at BETWEEN ? AND ?";
    con.query(sql, [startOfDay, endOfDay], (err, result) => {
        if (err) return res.json({ Error: "Error in SQL query" });
        return res.json({ Status: "Success", Result: result[0].totalPesanan });
    });
});

// Endpoint untuk mendapatkan profil pengguna
app.get('/profile/:id', (req, res) => {
    const userId = req.params.id;
    const sql = "SELECT nama, nomorHp, email FROM users WHERE id = ?";
    con.query(sql, [userId], (err, result) => {
        if (err) return res.json({ Error: "Error in running query" });
        return res.json({ Status: "Success", Result: result[0] });
    });
});

// Endpoint untuk memperbarui profil pengguna
app.put('/profile/:id', (req, res) => {
    const userId = req.params.id;
    const { nama, nomorHp, email } = req.body;
    const sql = "UPDATE users SET nama = ?, nomorHp = ?, email = ? WHERE id = ?";
    con.query(sql, [nama, nomorHp, email, userId], (err, result) => {
        if (err) return res.json({ Error: "Error in running query" });
        return res.json({ Status: "Success", Result: result });
    });
});

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})