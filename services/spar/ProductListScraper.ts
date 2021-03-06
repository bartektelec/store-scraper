import puppeteer from 'puppeteer';
import Product from '../../interfaces/Product';

const getProductList = async (
  page: puppeteer.Page,
  category: Record<'href' | 'name' | 'parentCategory', string>
) => {
  await page.goto(category.href);
  await page.waitForSelector('.ws-product-view');

  async function loadFullPage() {
    await page.waitForTimeout(500);
    const button = await page.$('.ws-product-view__footer>.ws-button');
    if (button) {
      console.log('loading more items');
      await button.click();
      await loadFullPage();
    } else {
      return;
    }
  }

  await loadFullPage();

  console.log('getting list of products from spar ' + category.href);

  const rawData: Product[] = await page.evaluate(category => {
    const articles = Array.from(
      document.querySelectorAll(
        '.ws-product-vertical'
      ) as NodeListOf<HTMLAnchorElement>
    ).map(article => {
      const title = (article.querySelector(
        '.ws-product-vertical__title'
      ) as HTMLDivElement).innerText?.trim();
      const subtitle = (article.querySelector(
        '.ws-product-vertical__subtitle'
      ) as HTMLParagraphElement)?.innerText?.trim();
      const price = (article.querySelector(
        '.ws-product-vertical__price'
      ) as HTMLDivElement).innerText
        ?.trim()
        .replace('kr ', '')
        .replace(',', '.');

      const unitData = (article.querySelector(
        '.ws-product-vertical__price-unit'
      ) as HTMLParagraphElement)?.innerText
        ?.trim()
        .replace('kr ', '')
        .replace(',', '.')
        .split('/');

      const floatPrice = parseFloat(price || '0');
      const floatUnitPrice = unitData ? parseFloat(unitData[0]) : null;
      const unit = unitData ? unitData[1] : null;
      const qty = floatUnitPrice
        ? parseFloat((floatPrice / floatUnitPrice).toFixed(2))
        : null;
      return {
        title,
        subtitle,
        tags: [category.name, category.parentCategory],
        price: {
          price: floatPrice,
          unitPrice: floatUnitPrice,
          unit,
          qty,
        },
      };
    });

    return articles;
  }, category);

  console.log(
    `Found ${rawData.length} products in ${category.href} on spar.no`
  );
  return rawData;
};

export default getProductList;
