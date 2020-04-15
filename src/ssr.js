const puppeteer = require('puppeteer');
const Cacheman = require('cacheman');
const md5 = require('md5');

let browserWSEndpoint = null;

const FilecCache = new Cacheman('htmls', {
  // 缓存3个小时
  ttl: 60 * 60 * 3,
  port: 6379,
  host: '127.0.0.1',
  password: '111111',
  engine: 'redis',
});

const ssr = async (url) => {
  const start = Date.now();
  let browser = null;
  let urlMd5 = md5(url);

  // 是否命中缓存
  const hitByCache = await FilecCache.get(urlMd5);

  if(hitByCache){
    return hitByCache;
  }
  if(browserWSEndpoint){
    try{
      browser = await puppeteer.connect({browserWSEndpoint});
    }catch(e){

      // 可能失败
      browserWSEndpoint = null;
      browser = null;
    }
  }

  if(!browserWSEndpoint){
    browser = await puppeteer.launch({
      headless: true,

      // 导航期间是否忽略HTTPS错误, 默认false
      ignoreHTTPSErrors: true,

      // 去沙盒环境运行
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
    });

    // 保存websocket 断点,以便后面可以直接连接浏览器
    browserWSEndpoint = await browser.wsEndpoint();
  }
  const page = await browser.newPage();

  // 1. 监听网络请求
  await page.setRequestInterception(true);

  page.on('request', req => {
    // console.log('url::resouceType', req.url(), '::::', req.resourceType());
    // 2. 忽略不必要的请求，如图片，视频样式等等
    const whitelist = ['document', 'script', 'xhr', 'fetch'];
    const blacklist = ['v5kf.com', 'analytics'];
    if (!whitelist.includes(req.resourceType())) {
      return req.abort();
    }

    // 忽略第三方js
    if (blacklist.find(regex => req.url().match(regex))) {
      return req.abort();
    }

    // 3. 其它请求正常继续
    req.continue();
  });
  try {
    // networkidle0 在 500ms 内没有任何网络连接
    // networkidle2 在 500ms 内网络连接个数不超过 2 个
    await page.goto(url, {waitUntil: 'networkidle0', timeout: 120000});
  } catch (e) {
    console.log(e)
  }

  // 获取HTML结构
  const html = await page.content();
  await page.close();

  // 抓取时间
  const renderTime = Date.now() - start;

  console.info(`Headless rendered page in: ${renderTime}ms`);
  let results = {
    html
  };

  // 写入缓存
  await FilecCache.set(urlMd5, results, (err, value) => {
    if(err) throw err;
  });
  return results;
};

module.exports = ssr;