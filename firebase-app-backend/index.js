const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { initializeApp } = require("firebase-admin/app");

const adminSdk = require("firebase-admin");
const serviceAccount = require("./firebase-auth.json");

initializeApp({
  credential: adminSdk.credential.cert(serviceAccount),
  databaseURL: "https://fir-auth-40d55-default-rtdb.firebaseio.com/",
});

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json

const checkClaim = async (req, res, next) => {
  let auth = req.headers.authorization;

  if (auth) {
    await adminSdk
      .auth()
      .verifyIdToken(auth)
      .then((decodeToken) => {
        if (!decodeToken.admin) {
          res.status(403).json({ message: "Yetkisiz işlem!" });
        }

        next();
      })
      .catch((err) => {
        res.status(500).json({ message: "Beklenmedik bir hata oluştu!" });
      });
  } else {
    next();
  }
};

app.use(checkClaim);

app.post("/setAdmin", async (req, res) => {
  const uid = req.body.uid;

  await adminSdk
    .auth()
    .setCustomUserClaims(uid, { admin: true })
    .then((r) => {});

  res.status(200).json({ message: "Kullanıcı admin yapıldı" });
});

app.post("/deleteUser", async (req, res) => {
  const uid = req.body.uid;

  await adminSdk
    .auth()
    .deleteUser(uid)
    .then((user) => {
      res
        .status(200)
        .json({ message: "Kullanıcı kaydı başarılı bir şekilde silindi." });
    })
    .catch((err) => {
      res.status(500).json({ message: "Beklenemdik bir hata oluştu." });
    });
});

app.get("/", async (req, res) => {
  let result;
  await adminSdk
    .auth()
    .listUsers()
    .then((res) => (result = res.users))
    .catch((err) => {
      res
        .status(500)
        .json({ message: "Merhaba beklenmedik bir hata ile karşılaşıldı" });
    });
  res.status(200).json(result);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
