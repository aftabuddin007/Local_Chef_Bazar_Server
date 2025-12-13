const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 3000
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

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
// admin token
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded_email; 
  const user = await userCollection.findOne({ email });

  if (user?.role !== "admin") {
    return res.status(403).send({ message: "Forbidden: Admins Only" });
  }

  next();
};
const db = client.db('Assignment-11')
const userCollection = db.collection('users')
const mealCollection = db.collection('meals')
const reviewCollection = db.collection('reviews')
const favoriteCollection = db.collection('favorites')
const orderCollection = db.collection('orders')
const requestCollection = db.collection('request')
const paymentOrderCollection = db.collection('payment')
// user related apis
app.post('/users', async(req,res)=>{
  const user = req.body;
  user.role = 'customer';
  user.status = 'active';
  user.createdAt = new Date();
  const result = await userCollection.insertOne(user)
  res.send(result)
})
// manage user show all user
app.get('/users',verifyFBToken, verifyAdmin,async (req,res)=>{
  const result = await userCollection.find().toArray()
  res.send(result)
})
app.patch('/users/:id',async(req,res)=>{
  const id = req.params.id;
  // console.log(id)
  const result = await userCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "fraud" } }
  )
  res.send(result)
})
// upload meal
app.post('/meals',verifyFBToken,async (req,res)=>{
  const email = req.decoded_email;
  const mealData = req.body;
  // console.log(mealData)
  // mealData.date = new Date().toLocaleDateString();
   

  const user = await userCollection.findOne({ email });

  
  if (user?.role === 'chef' && user?.status === 'fraud') {
    return res.status(403).send({
      message: 'Fraud chefs cannot create meals'
    });
  }
  const result  =await mealCollection.insertOne(mealData)
   res.send({
      success: true,
      message: "Meal added successfully!",
      result
    });
})
// fraud can't upload meal
// app.post('/meals', verifyFBToken,  async (req, res) => {
//   const email = req.decoded_email;

//   const user = await userCollection.findOne({ email });

//   if (user.status === "fraud") {
//     return res.status(403).send({ message: "Fraud chefs cannot create meals" });
//   }

  
// });

// get specific meal
 
app.get('/meal',async(req,res)=>{
  const query = {}
  const {email}=req.query;
  if(email){
    query.userEmail=email
  }
  const cursor = mealCollection.find(query)
  const result = await cursor.toArray()
  res.send(result)
})
// update meal details
app.put('/meals/:id',async (req,res)=>{
  const id = req.params.id;
  const updateData = req.body;
    const result = await mealCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
   if (result.matchedCount === 0) {
                return res.status(404).json({ message: "Meal not found" });
            }
  res.send(result)
})
// delete specific meal
app.delete('/meal/:id',async (req,res)=>{
  const id = req.params.id
  const query = {_id: new ObjectId(id)}
  const result = await mealCollection.deleteOne(query);
  res.send(result);
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
    addedTime: new Date().toLocaleDateString(),
  };
const result = await favoriteCollection.insertOne(favorite);
  res.send({ success: true, message: "Meal added to favorites", result });


})
// payment process
app.post('/create-checkout-session',async (req,res)=>{
  const paymentInfo = req.body;
  const amount = parseInt(paymentInfo.price) * 100;
  // console.log(paymentInfo)
  // res.send(paymentInfo)
  const session = await stripe.checkout.sessions.create({
    line_items:[
      {
        price_data:{
          currency:'usd',
          unit_amount: amount,
          product_data: {
          name: `Please pay for: ${paymentInfo.mealName}`
          }

        },
        quantity:paymentInfo?.quantity,
      },
    ],
    customer_email:paymentInfo?.email,
    mode:'payment',
    metadata: {
    mealId: paymentInfo.mealId,
    mealName: paymentInfo.mealName,
    price: paymentInfo.price,
    quantity: paymentInfo.quantity
    },
    success_url:`${process.env.CLIENT_DOMIAN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:`${process.env.CLIENT_DOMIAN}/dashboard/myOrder`
  })
  res.send({url:session.url})
})
// payment post
app.post('/payment-success',async(req,res)=>{
  const {sessionId}= req.body;
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  const order = await orderCollection.findOne({_id: new ObjectId(session.metadata.mealId),

  })
  const orderData = await paymentOrderCollection.findOne({
    transactionId:session.payment_intent,
  })
  // console.log(session)
  if(session.status === 'complete'&& !orderData ){

    const orderInfo = {
      mealId : session.metadata.mealId,
      transactionId:session.payment_intent,
      customer_email:session.customer_email,
      status:'pending',
      payment_status:session.payment_status,
      price:session.amount_total/100,
  
    }
    const result = await paymentOrderCollection.insertOne(orderInfo)
  }
  res.send(order)
})
// order data
app.post('/orders',verifyFBToken,async (req,res)=>{
  const email = req.decoded_email;
  const order = req.body;
   
   const user = await userCollection.findOne({ email });
if (user?.role === 'customer' && user?.status === 'fraud') {
    return res.status(403).send({
      message: 'Fraud users cannot place orders'
    });
  }
  order.paymentStatus = "Pending";
  order.orderStatus = "pending";
  order.orderTime = new Date().toLocaleTimeString()
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
// fraud can't order
// app.post('/order', verifyFBToken, async (req, res) => {
//   const email = req.decoded_email;

//   const user = await userCollection.findOne({ email });

//   if (user.status === "fraud") {
//     return res.status(403).send({ message: "Fraud users cannot place orders" });
//   }


// });

// my review for specific 
app.get('/reviews',async(req,res)=>{
  const query = {}
  const {email}=req.query;
  if(email){
    query.userEmail=email
  }
  const cursor = reviewCollection.find(query)
  const result = await cursor.toArray()
  res.send(result)
})
// delete review
app.delete('/reviews/:id',async (req,res)=>{
  const id = req.params.id
  const query = {_id: new ObjectId(id)}
  const result = await reviewCollection.deleteOne(query);
  res.send(result);
})
// update review

app.patch('/reviews/:id', async (req, res) => {
  const id = req.params.id;
  const updatedReview = req.body;

  const result = await reviewCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        date: new Date().toLocaleDateString()
      }
    }
  );

  res.send(result)
});
// my favorite for specific 
app.get('/favorites',async(req,res)=>{
  const query = {}
  const {email}=req.query;
  if(email){
    query.userEmail=email
  }
  const cursor = favoriteCollection.find(query)
  const result = await cursor.toArray()
  res.send(result)
})
// delete favorite meal
app.delete('/favorites/:id',async (req,res)=>{
  const id = req.params.id
  const query = {_id: new ObjectId(id)}
  const result = await favoriteCollection.deleteOne(query);
  res.send(result);
})
// my profile api
app.get('/users',async(req,res)=>{
  const query = {}
  const {email}=req.query;
  if(email){
    query.email = email
  }
  const cursor = userCollection.find(query)
  const result = await cursor.toArray()
  res.send(result)
})
//user request collection
app.post('/request',async(req,res)=>{
  const request = req.body;
  request.requestStatus = "pending"; 
  request.requestTime = new Date().toLocaleTimeString();
  const result = await requestCollection.insertOne(request)
    res.send({
    success: true,
    message: "Request sent successfully!",
    result
  });
}) 

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
