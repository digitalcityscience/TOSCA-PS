import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { MongoClient } from 'mongodb'

dotenv.config()

const port = process.env.PORT || 3000
const app = express()
const jsonParser = bodyParser.json()
app.use(cors())

const client = new MongoClient(process.env.MONGO_CONNECTION_STRING)
const dbname = 'molg_data'

app.get('/', async (req, res) => {
  res.send('TOSCA API');
});

app.get('/masterplans', async (req, res) => {
  await client.connect()

  try {
    const result = await client.db(dbname).collection('masterplans').find({}).toArray()
    res.json(result)
  } catch (err) {
    res.status(400).send('Error fetching masterplans')
  }
})

app.post('/masterplans', jsonParser, async (req, res) => {
  await client.connect()

  const document = {
    title: req.body.title,
    layerName: req.body.layerName,
    created: new Date()
  }

  console.log(document)

  try {
    await client.db(dbname).collection('masterplans').insertOne(document)
    res.status(204).send()
  } catch (err) {
    res.status(400).send('Error creating masterplans')
  }
})

app.get('/publicreviews', async (req, res) => {
  await client.connect()

  try {
    const result = await client.db(dbname).collection('publicreviews').find({}).toArray()
    res.json(result)
  } catch (err) {
    res.status(400).send('Error fetching public reviews')
  }
})

app.post('/publicreviews', jsonParser, async (req, res) => {
  await client.connect()

  let startDate, endDate;

  try {
    startDate = new Date(req.body.startDate);
    endDate = new Date(req.body.startDate);
    endDate.setDate(endDate.getDate() + 30);
  } catch (err) {
    res.status(400).send(`Error parsing date: ${req.body.startDate}`)
  }

  const document = {
    masterplan: req.body.masterplan,
    layerName: req.body.layerName,
    startDate,
    endDate,
    created: new Date()
  }

  console.log(document)

  try {
    await client.db(dbname).collection('publicreviews').insertOne(document)
    res.status(204).send()
  } catch (err) {
    res.status(400).send('Error creating public review')
  }
})


// start listening
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
