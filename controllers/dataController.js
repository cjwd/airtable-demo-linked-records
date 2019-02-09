/**
 * Get all records
 */
exports.getAirtableRecords = (table, view, limit = 24) => {
  let records = [];
  return new Promise((resolve, reject) => {
    // Cache results if called already
    if (records.length > 0) {
      resolve(records);
    }

    const processPage = (partialRecords, fetchNextPage) => {
      records = [...records, ...partialRecords];
      fetchNextPage();
    };

    const processRecords = (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(records);
    };

    table.select({
      view,
      pageSize: limit
    }).eachPage(processPage, processRecords);
  });
};


exports.getSupplierById = (table, id) => {
  return new Promise((resolve, reject) => {
    const processRecord = (err, record) => {
      if (err) {
        reject(err);
        return;
      }

      const id = { id:record.id };
      const fields = record.fields;
      record = {...id, ...fields};
      resolve(record);
    };

    table.find(id, processRecord);
  });

}
