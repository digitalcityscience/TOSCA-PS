import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import multer from 'multer'
import fs from 'fs'
import { GridFsStorage } from 'multer-gridfs-storage'
import { GridFSBucket, MongoClient, ObjectId } from 'mongodb'
import { generateExport } from './export.js'

dotenv.config()

const port = process.env.PORT || 3000
const app = express()
app.use(cors())

const client = new MongoClient(process.env.MONGO_CONNECTION_STRING)
const db = client.db('molg_data')
const bucket = new GridFSBucket(db)

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

app.get('/masterplans/:id', async (req, res) => {
  const result = await db.collection('masterplans')
    .aggregate([
      {
        $match: { _id: new ObjectId(req.params.id) }
      },
      // get the objection counts
      {
        $lookup: {
          from: 'publicreviews',
          localField: '_id',
          foreignField: 'masterplanId',
          as: 'publicReviews'
        }
      },
      {
        $lookup: {
          from: 'objections',
          localField: 'publicReviews._id',
          foreignField: 'publicReviewId',
          as: 'objections',
        }
      },
      {
        $set: {
          'objectionsCount': { $size: '$objections' }
        }
      },
      {
        $unset: 'objections'
      }
    ])
    .next()

  res.json(result)
})

app.get('/masterplans/:id/export', async (req, res) => {
  try {
    const id = req.params.id
    const report = await db.collection('masterplans')
      .aggregate([
        {
          $match: { _id: new ObjectId(id) }
        },
        {
          $lookup: {
            from: 'publicreviews',
            localField: '_id',
            foreignField: 'masterplanId',
            as: 'publicReviews'
          }
        },
        {
          $lookup: {
            from: 'objections',
            localField: 'publicReviews._id',
            foreignField: 'publicReviewId',
            as: 'objections',
          }
        },
        {
          $lookup: {
            from: 'fs.files',
            localField: 'objections.attachmentId',
            foreignField: '_id',
            as: 'attachments',
          }
        }
      ])
      .next()

    const workdir = `export/dmp-${id}`

    fs.mkdirSync(workdir, { recursive: true })

    const zipfile = await generateExport(workdir, report, bucket)
    res.download(zipfile)

    // clean up
    fs.rmSync(workdir, { recursive: true })
  } catch (err) {
    res.status(400).send('Error generating export')
  }
})

app.delete('/masterplans/:id', async (req, res) => {
  try {
    await db.collection('masterplans').findOne({ _id: new ObjectId(req.params.id) })
  } catch (err) {
    res.status(404).send(`Error: masterplan with ID ${req.params.id} not found`)
    return
  }

  // find associated public reviews and objections and delete them
  const publicreviews = await db.collection('publicreviews').find({ masterplanId: new ObjectId(req.params.id) }).toArray()

  for (const publicreview of publicreviews) {
    await db.collection('objections').deleteMany({ publicReviewId: publicreview._id })
  }
  await db.collection('publicreviews').deleteMany({ masterplanId: new ObjectId(req.params.id) })

  // delete the masterplan
  await db.collection('masterplans').deleteOne({ _id: new ObjectId(req.params.id) })

  res.status(200).send()
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
        // get masterplans
        {
          $lookup: {
            from: 'masterplans',
            localField: 'masterplanId',
            foreignField: '_id',
            as: 'masterplan'
          }
        },
        // count objections
        {
          $lookup: {
            from: 'objections',
            localField: '_id',
            foreignField: 'publicReviewId',
            as: 'objections'
          }
        },
        {
          $set: {
            objectionsCount: { $size: '$objections' }
          }
        },
        {
          $unset: 'objections'
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
  if (!await db.collection('masterplans').findOne({ _id: new ObjectId(req.body.masterplanId) })) {
    res.status(404).send(`Error: masterplan with ID ${req.body.masterplanId} not found`)
    return
  }

  const document = {
    masterplanId: new ObjectId(req.body.masterplanId),
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
  try {
    const result = await db.collection('objections').find({
      publicReviewId: new ObjectId(req.params.id)
    }).toArray()
    res.json(result)
  } catch (err) {
    res.status(400).send('Error fetching objections')
  }
})

app.post('/publicreviews/:id/objections', jsonParser, async (req, res) => {
  // check if public review exists
  if (!await db.collection('publicreviews').findOne({ _id: new ObjectId(req.params.id) })) {
    res.status(404).send(`Error: public review with ID ${req.params.id} not found`)
    return
  }

  const document = {
    publicReviewId: new ObjectId(req.params.id),
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

app.post('/objections/:id/attachments', uploadParser.array('attachment'), async (req, res) => {
  try {
    for (const file of req.files) {
      await db.collection('objections').updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { attachmentId: file.id } }
      )
    }
  } catch (err) {
    res.status(404).send(`Error: objection with ID ${req.params.id} not found`)
    return
  }

  res.status(201).send()
})

// start listening
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
