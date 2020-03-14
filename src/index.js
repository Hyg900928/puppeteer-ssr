const express = require('express');
const ssrMiddleWare = require('./seoMiddleWare');

const app = express();
const port = 8000;


app.use(ssrMiddleWare());


app.listen(port, () => {
  console.log('server start success')
});
