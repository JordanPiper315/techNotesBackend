const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')

// @desc get all notes
// @route get /notes
// @access private
const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find().lean()
  if (!notes?.length) {
    return res.status(400).json({ message: 'No notes found'})
  }
  // Add username to each note before sending the response 
  // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE 
  // You could also do this with a for...of loop
  const notesWithUser = await Promise.all(notes.map(async (note) => {
    const user = await User.findById(note.user).lean().exec()
    return { ...note, username: user.username }
  }))
  res.json(notesWithUser)
})
// @desc create note
// @route put /notes
// @access private
const createNewNote = asyncHandler(async (req, res) => {
  const { user, title, text } = req.body
  // confirm data
  if (!user || !title || !text) {
    return res.status(400).json({ message: 'All fields are required'})
  }
  //check for duplicate title
  const duplicate = await Note.findOne({ title }).lean().exec()
  if (duplicate) {
    return res.status(409).json({ message: 'Duplicate note title ' })
  }
  //create and stoe the new note
  const note = await Note.create({ user, title, text })
  if (note) {
    res.status(200).json({ message: `New note ${title} created`})
  } else {
    res.status(400).json({ message: 'Invalid note data received'})
  }
})
// @desc update note
// @route patch /notes
// @access private
const updateNote = asyncHandler(async (req, res) => {
  const { id, user, title, text, compeleted } = req.body
  // confirm data
  if (!id || !user || !title || !text || typeof compeleted !== 'boolean') {
    return res.status(400).json({ message: 'All fields are required'})
  }
  // confirm note exists
  const note = await Note.findById(id).exec()
  if (!note) {
    return res.status(400).json({ message: 'Note not found'})
  }
  // check for duplicate title
  const duplicate = await Note.findOne({ title }).lean().exec()
  //allow renaming of the original note
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: 'Duplicate note title ' })
  }
  note.user = user
  note.title = title
  note.text = text
  note.compeleted = compeleted
  const updatedNote = await note.save()
  res.json(`'${updateNote.title} updated'`)
})
// @desc delete note
// @route delete /notes
// @access private
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.body
  if (!id) {
    return res.status(400).json({ message: 'Note ID required'})
  }
  // check if note exists
  const note = await Note.findById(id).exec()
  if (!note) {
    return res.status(400).json({ message: 'Note not found'})
  }
  const result = await note.deleteNote()
  const reply = `Note '${result.titel}' with ID ${result._id} deleted`
  res.json(reply)
})

module.exports = {
  getAllNotes,
  createNewNote,
  updateNote,
  deleteNote
}