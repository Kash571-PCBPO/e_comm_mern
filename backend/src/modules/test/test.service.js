const Test = require('./test.model');

const createEntry = async (message) => {
  const entry = await Test.create({ message });
  return entry;
};

const getAllEntries = async () => {
  return Test.find().sort({ createdAt: -1 });
};

const getEntryById = async (id) => {
  const entry = await Test.findById(id);
  if (!entry) {
    const error = new Error('Entry not found');
    error.statusCode = 404;
    throw error;
  }
  return entry;
};

const updateEntry = async (id, message) => {
  const entry = await Test.findByIdAndUpdate(
    id,
    { message },
    { new: true, runValidators: true }
  );
  if (!entry) {
    const error = new Error('Entry not found');
    error.statusCode = 404;
    throw error;
  }
  return entry;
};

const deleteEntry = async (id) => {
  const entry = await Test.findByIdAndDelete(id);
  if (!entry) {
    const error = new Error('Entry not found');
    error.statusCode = 404;
    throw error;
  }
  return entry;
};

module.exports = {
  createEntry,
  getAllEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
};
