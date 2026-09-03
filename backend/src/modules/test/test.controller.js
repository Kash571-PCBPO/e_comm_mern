const testService = require('./test.service');

const create = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      const error = new Error('message field is required');
      error.statusCode = 400;
      throw error;
    }
    const entry = await testService.createEntry(message);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const entries = await testService.getAllEntries();
    res.status(200).json({ success: true, count: entries.length, data: entries });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const entry = await testService.getEntryById(req.params.id);
    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      const error = new Error('message field is required');
      error.statusCode = 400;
      throw error;
    }
    const entry = await testService.updateEntry(req.params.id, message);
    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await testService.deleteEntry(req.params.id);
    res.status(200).json({ success: true, message: 'Entry deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, getAll, getOne, update, remove };
