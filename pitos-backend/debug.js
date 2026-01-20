
try {
  console.log('Loading sharp...');
  require('sharp');
  console.log('Sharp loaded.');
  
  console.log('Loading tesseract.js...');
  const Tesseract = require('tesseract.js');
  console.log('Tesseract loaded.');
  
  if (typeof Tesseract.createWorker !== 'function' && typeof require('tesseract.js').createWorker !== 'function') {
      console.log('createWorker NOT found on default export or module');
  } else {
      console.log('createWorker found');
  }

} catch (e) {
  console.error('Error:', e);
}
