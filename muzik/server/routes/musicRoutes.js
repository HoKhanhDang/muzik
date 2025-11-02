import express from 'express'
import {
  getAllMusic,
  getMusicById,
  createMusic,
  updateMusic,
  deleteMusic,
} from '../controllers/musicController.js'

const router = express.Router()

router.get('/', getAllMusic)
router.get('/:id', getMusicById)
router.post('/', createMusic)
router.put('/:id', updateMusic)
router.delete('/:id', deleteMusic)

export default router

