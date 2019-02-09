const Airtable = require('airtable');
const data = require('./dataController.js');

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);
const TABLE = base('inventory');
const VIEW = 'Main View';
const LIMIT = 10;

let records = [];


const getProducts = async (page) => {
  records = [];
  const products = await data.getAirtableRecords(TABLE, VIEW, LIMIT);

  const count = products.length,
        pages = Math.ceil(count / LIMIT),
        offset = (page * LIMIT) - LIMIT;

  return products.map( product => {
    return {
      id: product.getId(),
      name: product.get('name'),
      qty: product.get('qty_in_stock'),
      pages
    }
  }).slice(offset, LIMIT*page);
}

/**
 * Get products with their suppliers
 */
const getProductsAndSuppliers = async (page) => {
  const products = await data.getAirtableRecords(TABLE, VIEW, LIMIT);

  const count = products.length,
        pages = Math.ceil(count / LIMIT),
        offset = (page * LIMIT) - LIMIT;

  return products.map( product => {
    return {
      id: product.getId(),
      name: product.get('name'),
      qty: product.get('qty_in_stock'),
      pages,
      suppliers: product.get('suppliers'),
    }
  }).slice(offset, LIMIT*page);
}

const getSupplierById = (id) => {
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

    base('suppliers').find(id, processRecord);
  });

}

/**
 * Replace supplier ids in product with
 * actual supplier information
 * @param {*} product
 */
const hydrateSuppliers = async (product) => {
  let supplierIds = product.suppliers;
  let supplierDetails = [];
  for( const id of supplierIds) {
    supplierDetails.push(await getSupplierById(id))
  }

  product.suppliers = supplierDetails;
  return product;
}

const getUniqueSuppliers = (products) => {
  let allsuppliers = [];
  for( let i = 0; i < products.length; i++) {
    products[i].suppliers.map( supplier => allsuppliers.push(supplier));
  }

  const suppliers = allsuppliers.filter(function(obj, index, self) {
    return index === self.findIndex(function(t) {
      return t['id'] === obj['id']
    });
  });

  return suppliers;
}

exports.displayProductsWithSuppliers = async (req, res) => {
  let page = req.params.page || req.query.page || 1;
  getProductsAndSuppliers(page)
    .then( async (products) => {
      const hydratedProducts = [];

      for(const product of products) {
        hydratedProducts.push(await hydrateSuppliers(product));
      }

      const suppliers = getUniqueSuppliers(hydratedProducts);

      res.render('index', { products: hydratedProducts, page, count: products.length, suppliers });
    });
}


exports.displayProducts = async (req, res) => {
  let page = req.params.page || req.query.page || 1;
  getProducts(page).then( products => {
    res.render('index', { products, page, count: products.length, });
  });
}

const filterProducts = (products, supplierId) => {

  function filterById(product) {
    let ids = product.suppliers;
    if(ids.includes(supplierId)) {
      return true;
    }
    return false;
  }

  let filteredProducts = products.filter(filterById);

  return filteredProducts;
}


exports.filterBySupplier = async (req, res) => {
  let supplier = req.body.supplier,
      page = req.params.page || req.query.page || 1;

  getProductsAndSuppliers(page)
  .then( async (products) => {
    let filteredProducts = filterProducts(products, supplier),
        allHydratedProducts = [],
        filteredHydratedProducts = [];

    for(const product of filteredProducts) {
      filteredHydratedProducts.push(await hydrateSuppliers(product));
    }

    for(const unfilteredProduct of products) {
      try {
        allHydratedProducts.push(await hydrateSuppliers(unfilteredProduct));
      } catch (error) {
        console.error(error)
      }
    }

    const suppliers = getUniqueSuppliers(allHydratedProducts);

    res.render('index', { products: filteredHydratedProducts, page, count: products.length, suppliers });
  });

}
