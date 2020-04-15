const ssr = require('./ssr');


const seoMiddleWare = () => {
  return async (req, res, next) => {
    const isStaticDir = req.url.indexOf('static/') > -1;
    if(!isStaticDir){
      // 生成本地访问链接
      const requestUrl = 'https://www.cunxin.com'+req.url;
      try{
        var results = await ssr(requestUrl);
        res.send(results.html);
      }catch(e){
        console.log('ssr failed', e);
        res.status(500).send('Server error');
      }
      return;
    }

    next()
  }
};


module.exports = seoMiddleWare;