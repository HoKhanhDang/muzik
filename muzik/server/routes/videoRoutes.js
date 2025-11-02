import express from 'express'
import {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  getVideoIds,
} from '../controllers/videoController.js'

const router = express.Router()

router.get('/', getAllVideos)
router.get('/ids', getVideoIds)
router.get('/:id', getVideoById)
router.post('/', createVideo)
router.put('/:id', updateVideo)
router.delete('/:id', deleteVideo)

export default router

