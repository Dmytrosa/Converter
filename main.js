const UnitsInfo = require("./units.json")
const http = require('http');
const { type } = require("os");
const url = require('url');

const keysListForConvert = new Set(["distance", "unit", "value", "convertTo"]);

const server = http.createServer((req, res) => {
  const reqUrl = url.parse(req.url, true);

  if (reqUrl.pathname === '/convert' && req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        const result = convertDistance(requestData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid JSON data');
      }
    });
    req.on('error', (error) => {
      console.error(`Помилка при відправці запиту: ${error.message}`);
    });
  }
  else if (reqUrl.pathname === '/convert_delete' && req.method === 'DELETE') {
    handleDeleteRequest(req, res)
  }
  else if ( reqUrl.pathname === '/units' && req.method === 'GET' ) {
    handleGetUnitsRequest(res);
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

function handleGetUnitsRequest(res) {
  const units = UnitsInfo;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ units }));
}

function handleDeleteRequest(req, res) {
  const reqUrl = url.parse(req.url, true);
  const unitToDelete = reqUrl.query.unit;

  if (!unitToDelete) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Unit parameter is required');
  } else {
    deleteUnit(unitToDelete, res);
  }
}

function deleteUnit(unitToDelete, res) {
  const units = UnitsInfo;
  const normalizedUnitToDelete = unitToDelete.toLowerCase();

  if (!(normalizedUnitToDelete in units)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Unit not found');
  } else {
    delete units[normalizedUnitToDelete];
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Unit deleted successfully');
  }
}


//Function helper for validator to throw ex
function throwJSONError(str) { throw new Error(str) }

//Function to check an object
function requestJSONValidator(objForTest, keysList) {
  let result = true;
  for (const key in objForTest) {
    if (!keysList.has(key)) {
      result = false;
    }
    if (typeof objForTest[key] === 'object') {
      result = result && requestJSONValidator(objForTest[key], keysList);
    }
  }
  return result;
}

//Function helper
function checkInputTypeAndThrowEx(data, type, message) {
  if (typeof (data) !== type) { throwJSONError(message) }
}

////Function object validator 2 way
function checkerConvertingData(data) {
  if (requestJSONValidator(data, keysListForConvert) === false) { throwJSONError('Invalid request structure') }

  // TODO: Подумати як зробити автоматичний перебір та валідацію
  checkInputTypeAndThrowEx(data.distance, "object", 'Invalid structure')
  checkInputTypeAndThrowEx(data.distance.unit, "string", 'Invalid data')
  checkInputTypeAndThrowEx(data.distance.value, "number", 'Invalid data')
  checkInputTypeAndThrowEx(data.convertTo, "string", 'Invalid data')
}

//Function for converting units
function convertDistance(data) {
  const units = UnitsInfo

  checkerConvertingData(data)

  const fromUnit = data.distance.unit.toLowerCase();
  const toUnit = data.convertTo.toLowerCase();

  if (!(fromUnit in units) || !(toUnit in units)) {
    throw new Error('Invalid units');
  }

  const fromValue = data.distance.value;
  const toValue = fromValue * (units[fromUnit] / units[toUnit]);

  return {
    unit: toUnit,
    value: parseFloat(toValue.toFixed(2)),
  };
}

////////////////////////////////////////////////

//Server listening
server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
