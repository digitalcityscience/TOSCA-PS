import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import multer from 'multer'
import { GridFsStorage } from 'multer-gridfs-storage'
import { MongoClient, ObjectId } from 'mongodb'

dotenv.config()

const port = process.env.PORT || 3000
const app = express()
app.use(cors())

const client = new MongoClient(process.env.MONGO_CONNECTION_STRING)
const db = client.db('molg_data')

const jsonParser = bodyParser.json()
const uploadParser = multer({
  storage: new GridFsStorage({ db })
})

app.get('/', async (req, res) => {
  res.send('TOSCA API')
})

app.get('/masterplans', async (req, res) => {
  try {
    const result = await db.collection('masterplans').find({}).toArray()
    res.json(result)
  } catch (err) {
    res.status(400).send('Error fetching masterplans')
  }
})

app.post('/masterplans', jsonParser, async (req, res) => {
  const document = {
    title: req.body.title,
    molgId: req.body.molgId,
    layerName: req.body.layerName,
    created: new Date()
  }

  try {
    const inserted = await db.collection('masterplans').insertOne(document)
    res.status(201).send(inserted)
  } catch (err) {
    res.status(400).send('Error creating masterplans')
  }
})

app.get('/publicreviews', async (req, res) => {
  let query = {}

  if (req.query.valid === 'now') {
    const now = new Date()

    query = {
      startDate: { $lt: now },
      endDate: { $gt: now }
    }
  }

  try {
    const result = await db.collection('publicreviews')
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
  let startDate, endDate;

  try {
    startDate = new Date(req.body.startDate);
    endDate = new Date(req.body.startDate);
    endDate.setDate(endDate.getDate() + 30);
  } catch (err) {
    res.status(400).send(`Error parsing date: ${req.body.startDate}`)
    return
  }

  // check if masterplan exists
  if (!await db.collection('masterplans').findOne({ _id: ObjectId(req.body.masterplanId) })) {
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
    const inserted = await db.collection('publicreviews').insertOne(document)
    res.status(201).send(inserted)
  } catch (err) {
    res.status(400).send('Error creating public review')
  }
})

app.get('/publicreviews/:id/objections', async (req, res) => {
  await client.connect()

  try {
    const result = await db.collection('objections').find({
      publicReviewId: ObjectId(req.params.id)
    }).toArray()
    res.json(result)
  } catch (err) {
    res.status(400).send('Error fetching objections')
  }
})

app.post('/publicreviews/:id/objections', jsonParser, async (req, res) => {
  // check if public review exists
  if (!await db.collection('publicreviews').findOne({ _id: ObjectId(req.params.id) })) {
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
    const inserted = await db.collection('objections').insertOne(document)
    res.status(201).send(inserted)
  } catch (err) {
    res.status(400).send('Error creating objection')
  }
})

app.post('/objections/:id/attachments', uploadParser.single('attachment'), async (req, res) => {
  try {
    await db.collection('objections').updateOne(
      { _id: ObjectId(req.params.id) },
      { $set: { attachmentId: req.file.id } }
    )
  } catch (err) {
    res.status(404).send(`Error: objection with ID ${req.params.id} not found`)
    return
  }

  res.status(201).send()
})

app.delete('/', async (req, res) => {
  db.collection('masterplans').deleteMany({})
  db.collection('publicreviews').deleteMany({})
  db.collection('objections').deleteMany({})
})


// start listening
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
