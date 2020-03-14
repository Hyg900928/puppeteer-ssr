const ssr = require('./ssr');
const isBot = require('isbot');


const seoMiddleWare = () => {
  return (req, res, next) => {
    const UA = req.headers['user-agent'];
    const isStaticDir = req.url.indexOf('static/') > -1;
    // console.log('url', req.url);
    if(!isStaticDir){
      // 生成本地访问链接
      // const requestUrl = 'http://localhost:'+listenPort+req.url;
      const requestUrl = 'https://www.heyungao.com'+req.url;
      // const requestUrl = 'https://juejin.im'+req.url;
      (async () => {
        try{
          var results = await ssr(requestUrl);
          // console.log('results:', results);
          res.send(results.html);
        }catch(e){
          console.log('ssr failed', e);
          res.status(500).send('Server error');
        }
      })();
      return;
    }

    next()
  }
};


module.exports = seoMiddleWare;