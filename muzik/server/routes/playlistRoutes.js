import express from 'express'
import {
  getAllPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addItemToPlaylist,
  removeItemFromPlaylist,
} from '../controllers/playlistController.js'

const router = express.Router()

router.get('/', getAllPlaylists)
router.get('/:id', getPlaylistById)
router.post('/', createPlaylist)
router.put('/:id', updatePlaylist)
router.delete('/:id', deletePlaylist)
router.post('/:playlist_id/items', addItemToPlaylist)
router.delete('/:playlist_id/items/:item_id', removeItemFromPlaylist)

export default router

