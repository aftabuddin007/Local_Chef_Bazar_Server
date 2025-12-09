const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
const mealCollection = db.collection('meals')
const reviewCollection = db.collection('reviews')
const favoriteCollection = db.collection('favorites')
const orderCollection = db.collection('orders')
// user related apis
app.post('/users', async(req,res)=>{
  const user = req.body;
  user.role = 'customer';
  user.status = 'active';
  user.createdAt = new Date();
  const result = await userCollection.insertOne(user)
  res.send(result)
})
// get all meal
app.get('/meals', async (req,res)=>{
  const result = await mealCollection.find().toArray()
  res.send(result)
})
// meal-details
app.get('/meals/:id',async (req,res)=>{
  const {id}= req.params
   const result = await mealCollection.findOne({_id : new ObjectId(id)})
  res.send({
    success:true,
    result
  })
})
// add review
app.post('/reviews',async (req,res)=>{
  const review = req.body;
  // if (review.reviewerEmail !== req.decoded_email) {
  //   return res.status(403).send({ message: 'Forbidden' });
  // }
  review.date = new Date().toLocaleDateString();
  const result = await reviewCollection.insertOne(review);
  res.send({ success: true, message: 'Review submitted successfully!', result });

})
// get  review for a specific food
app.get('/reviews/:foodId',async (req,res)=>{
  const {foodId} = req.params;
  const reviews = await reviewCollection.find({foodId}).sort({date: -1}).toArray();
  res.send(reviews);

})
// get all review 
app.get('/reviews',async(req,res)=>{
  const result = await reviewCollection.find().toArray()
  res.send(result)
})
// favorite data
app.post('/favorites',async (req,res)=>{
  const { userEmail, mealId, mealName, chefId, chefName, price } = req.body;
const exists = await favoriteCollection.findOne({ userEmail, mealId });
 if (exists) {
    return res.status(400).send({ success: false, message: "Meal already in favorites" });
  }
const favorite = {
    userEmail,
    mealId,
    mealName,
    chefId,
    chefName,
    price,
    addedTime: new Date(),
  };
const result = await favoriteCollection.insertOne(favorite);
  res.send({ success: true, message: "Meal added to favorites", result });


})

// order data
app.post('/orders',async (req,res)=>{
  const order = req.body;
   order.paymentStatus = "Pending";
  order.orderStatus = "pending";
  order.orderTime = new Date().toLocaleTimeString
   const result = await orderCollection.insertOne(order);

  res.send({
    success: true,
    message: "Order placed successfully!",
    result
  });
})
// show order data 
app.get('/orders',async(req,res)=>{
  const query = {}
  const {email}=req.query;
  if(email){
    query.userEmail=email
  }
  const cursor = orderCollection.find(query)
  const result = await cursor.toArray()
  res.send(result)
})
// my review
// recent meal 6 card
app.get('/recent-meal',async(req,res)=>{
  const result = await mealCollection.find().sort({rating:'desc'}).limit(8).toArray()
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
