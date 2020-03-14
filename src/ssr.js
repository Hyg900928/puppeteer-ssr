const puppeteer = require('puppeteer');
const Cacheman = require('cacheman');
const md5 = require('md5');

let browserWSEndpoint = null;
let allInstances = [];


const FilecCache = new Cacheman('htmls', {
  // 缓存3个小时
  ttl: 60 * 60 * 3,
  engine: 'file',
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
      ignoreHTTPSErrors: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
    });
    browserWSEndpoint = await browser.wsEndpoint();
  }
  const page = await browser.newPage();

  // 1. 监听网络请求
  await page.setRequestInterception(true);

  page.on('request', req => {

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
    await page.goto(url, {waitUntil: 'networkidle2', timeout: 5000});
  } catch (e) {
    console.log(e)
  }

  const html = await page.content(); // 获取HTML结构
  await page.close();
  await browser.close();


  const ttRenderMs = Date.now() - start;
  console.info(`Headless rendered page in: ${ttRenderMs}ms`);
  let results = {
    html
  };

  // 写入缓存
  await FilecCache.set(urlMd5, results);
  return results;
};

module.exports = ssr;