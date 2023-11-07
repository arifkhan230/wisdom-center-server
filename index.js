const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;


app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// wisdom-center
// 27wtw6g9396ocNp1



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cwfli1i.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const categoryCollection = client.db('libraryDb').collection('category');
const bookCollection = client.db('libraryDb').collection('books');
const borrowedBookCollection = client.db('libraryDb').collection('borrowedBooks');



async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });


        // jwt related api
        app.post('/jwt',async(req,res)=>{
            const user = req.body;
            const token = jwt.sign(user,process.env.SECRET_ACCESS_TOKEN, {expiresIn: '1h'})
            res
            .cookie('token', token, {
                httpOnly: true,
                secure: false
            })
            .send({success: true})
        })


        // get related api
        app.get('/books-category', async (req, res) => {
            const result = await categoryCollection.find().toArray();
            // console.log(result)
            res.send(result)
        })

        app.get('/books', async (req, res) => {
            const category = req.query.category;
            let query = {}
            if (category) {
                query.category = category
            }

            const result = await bookCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/books/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookCollection.findOne(query);
            res.send(result);
        })

        // all --> /user/borrowed-book
        // email ---> /user/borrowed-book?email=abc@gmail.com

        app.get('/user/borrowed-book', async (req, res) => {
            const email = req.query.email;

            let query = {}
            if (email) {
                query.email = email
            }
            const result = await borrowedBookCollection.find(query).toArray();
            res.send(result)
        })

        // post related api

        app.post('/add-book', async (req, res) => {
            const book = req.body;
            const result = await bookCollection.insertOne(book);
            res.send(result)
        })

        app.post('/user/borrowed-book', async (req, res) => {
            const borrowedBook = req.body;
            const result = await borrowedBookCollection.insertOne(borrowedBook);
            res.send(result)

        })

        // update related api
        // decreasing quantity
        app.patch('/books/:id', async (req, res) => {
            const updateQuantity = req.body.quantity;
            // console.log(updateQuantity)
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            console.log(query)
            const updateDoc = {
                $set: {
                    quantity: parseInt(updateQuantity) - 1
                }
            }
            // console.log(updateDoc)
            const result = await bookCollection.updateOne(query, updateDoc)
            res.send(result)
        })

        // upgrading quantity
        app.patch('/book/:id', async (req, res) => {
            const updateQuantity = req.body.quantity;
            // console.log(updateQuantity)
            const id = req.params.id;
            console.log(id)
            const query = { _id: new ObjectId(id) }
            // console.log(query)
            const updateDoc = {
                $set: {
                    quantity: updateQuantity
                }
            }
            // console.log(updateDoc)
            const result = await bookCollection.updateOne(query, updateDoc)
            res.send(result)
        })

        app.put('/books/:id', async (req, res) => {
            const updateBook = req.body;
            const id = req.params.id;
            console.log(id)
            const filter = { _id: new ObjectId(id)}
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    name: updateBook.name,
                    author: updateBook.author,
                    quantity: updateBook.quantity,
                    rating: updateBook.rating,
                    image: updateBook.image,
                    description: updateBook.description,
                    category: updateBook.category
                }
            }
            console.log(updateDoc, id, filter)
            const result = await bookCollection.updateOne(filter,updateDoc,options)
            res.send(result)
        })
        


        // delete related api 

        app.delete('/user/borrowed-book/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: id };
            const result = await borrowedBookCollection.deleteOne(query);
            res.send(result);
        })



        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Wisdom center server is running')
})

app.listen(port, () => {
    console.log(`Wisdom center app listening on port ${port}`)
})