import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'

dotenv.config()

const port = process.env.PORT || 3000
const app = express()
const jsonParser = bodyParser.json()
app.use(cors())

const client = new MongoClient(process.env.MONGO_CONNECTION_STRING)
const dbname = 'molg_data'

app.get('/', async (req, res) => {
  res.send('TOSCA API')
})

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
    molgId: req.body.molgId,
    layerName: req.body.layerName,
    created: new Date()
  }

  try {
    await client.db(dbname).collection('masterplans').insertOne(document)
    res.status(204).send()
  } catch (err) {
    res.status(400).send('Error creating masterplans')
  }
})

app.get('/publicreviews', async (req, res) => {
  await client.connect()

  let query = {}

  if (req.query.valid === 'now') {
    const now = new Date()

    query = {
      startDate: { $lt: now },
      endDate: { $gt: now }
    }
  }

  try {
    const result = await client.db(dbname).collection('publicreviews')
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'masterplans',
            localField: 'masterplanId',
            foreignField: '_id',
            as: 'masterplan'
          }
        }
      ])
      .toArray()
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
    return
  }

  // check that masterplan exists
  try {
    if (!await client.db(dbname).collection('masterplans').findOne({ _id: ObjectId(req.body.masterplanId) })) {
      throw new Error()
    }
  } catch (err) {
    res.status(404).send(`Error: masterplan with ID ${req.body.masterplanId} not found`)
    return
  }

  const document = {
    masterplanId: ObjectId(req.body.masterplanId),
    startDate,
    endDate,
    created: new Date()
  }

  try {
    await client.db(dbname).collection('publicreviews').insertOne(document)
    res.status(204).send()
  } catch (err) {
    res.status(400).send('Error creating public review')
  }
})

app.get('/publicreviews/:id/objections', async (req, res) => {
  await client.connect()

  try {
    const result = await client.db(dbname).collection('objections').find({
      publicReviewId: ObjectId(req.params.id)
    }).toArray()
    res.json(result)
  } catch (err) {
    res.status(400).send('Error fetching objections')
  }
})

app.post('/publicreviews/:id/objections', jsonParser, async (req, res) => {
  await client.connect()

  // check that public review exists
  try {
    if (!await client.db(dbname).collection('publicreviews').findOne({ _id: ObjectId(req.params.id) })) {
      throw new Error()
    }
  } catch (err) {
    res.status(404).send(`Error: public review with ID ${req.params.id} not found`)
    return
  }

  const document = {
    publicReviewId: ObjectId(req.params.id),
    person: req.body.person,
    category: req.body.category,
    comment: req.body.comment,
    created: new Date()
  }

  try {
    await client.db(dbname).collection('objections').insertOne(document)
    res.status(204).send()
  } catch (err) {
    res.status(400).send('Error creating objection')
  }
})

app.delete('/', async (req, res) => {
  await client.connect()

  client.db(dbname).collection('masterplans').deleteMany({})
  client.db(dbname).collection('publicreviews').deleteMany({})
})


// start listening
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
