const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 3000


const admin = require("firebase-admin");

const serviceAccount = require("./firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// Create a MongoClient with a MongoClientOptions object to set the Stable API version









// middleware
app.use(express.json());
app.use(cors());

const verifyFBToken =async (req,res,next)=>{
// console.log(req.headers.authorization)
const token = req.headers.authorization;
if(!token){
  return res.status(401).send({message:'Unauthorized access'})
}
try{
  const idToken = token.split(' ')[1];
  const decoded = await admin.auth().verifyIdToken(idToken)
  req.decoded_email = decoded.email;
  next()

}
catch(error){
  return res.status(401).send({message:'Unauthorized access'})

}
 
}




const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.DB_PASSWORD}@cluster0.7n9qtku.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

const db = client.db('Assignment-11')
const userCollection = db.collection('users')
// user related apis
app.post('/users', async(req,res)=>{
  const user = req.body;
  user.role = 'customer';
  user.status = 'active';
  user.createdAt = new Date();
  const result = await userCollection.insertOne(user)
  res.send(result)
})
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('ASSIGNMENT 11 IS RUNNING')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
