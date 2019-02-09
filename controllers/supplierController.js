const Airtable = require('airtable');
const data = require('./dataController.js');

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);
const TABLE = base('suppliers');
const VIEW = 'Main View';
const LIMIT = 10;


exports.displaySupplier = async (req, res) => {
  let id = req.params.id;
  const supplier = await data.getSupplierById(TABLE, id);
  res.render('supplier', { supplier });
}