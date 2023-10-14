const pup = require("puppeteer");

const baseUrl = "https://www.carrefour.com.br/busca/Bravecto";
let currentPage = 1;

const getProdutoValorVendedor = async (page) => {
  try {
    await page.waitForSelector(
      ".carrefourbr-carrefour-components-0-x-currencyInteger"
    );
    const valorInteiro = await page.$eval(
      ".carrefourbr-carrefour-components-0-x-currencyInteger",
      (el) => el.innerHTML
    );

    await page.waitForSelector(
      ".carrefourbr-carrefour-components-0-x-currencyFraction"
    );
    const valorFracao = await page.$eval(
      ".carrefourbr-carrefour-components-0-x-currencyFraction",
      (el) => el.innerHTML
    );

    let linkVendedor;
    let linkVendedor2;

    linkVendedor2 = await page.waitForSelector(
      ".carrefourbr-carrefour-components-0-x-sellerLink"
    );

    if (linkVendedor2) {
      linkVendedor = await page.evaluate(
        (el) => el.innerText || el.innerHTML,
        linkVendedor2
      );
    } else {
      console.error(
        "Não foi possível encontrar o link do vendedor com nenhum dos seletores."
      );
      linkVendedor = "Não informado";
    }
    await page.waitForSelector(".vtex-store-components-3-x-productBrand");

    const produto = await page.$eval(
      ".vtex-store-components-3-x-productBrand",
      (el) => el.innerText
    );

    return {
      valorInteiro,
      valorFracao,
      linkVendedor,
      produto,
    };
  } catch (error) {
    linkVendedorEl = await page.waitForSelector(
      ".carrefourbr-carrefour-components-0-x-carrefourSeller.b.f5"
    );
    throw Error(error);
  }
};

const getAbout = async () => {
  const browser = await pup.launch({ headless: false });
  const page = await browser.newPage();
  const itens = [];
  while (true) {
    const url = `${baseUrl}?page=${currentPage}`;
    await page.goto(url);

    await page.waitForSelector(
      ".vtex-product-summary-2-x-container.vtex-product-summary-2-x-containerNormal.overflow-hidden.br3.h-100.w-100.flex.flex-column.justify-between.center.tc > a"
    );

    const links = await page.$$eval(
      ".vtex-product-summary-2-x-container.vtex-product-summary-2-x-containerNormal.overflow-hidden.br3.h-100.w-100.flex.flex-column.justify-between.center.tc > a",
      (elements) => elements.map((element) => element.href)
    );

    for (const link of links) {
      let resultadoValor;
      let vendedorValor;
      let produtoNome;
      try {
        await page.goto(link, { waitUntil: "networkidle2" });

        const itemOffSelector =
          ".vtex-rich-text-0-x-heading.vtex-rich-text-0-x-heading--text-not-found.t-heading-1.vtex-rich-text-0-x-headingLevel1.vtex-rich-text-0-x-headingLevel1--text-not-found.vtex-rich-text-0-x-heading-level-1";

        const itemOff = await page.$(itemOffSelector);

        if (itemOff) {
          console.log("Item não disponível. Pulando para o próximo item.");
          await page.goBack();
          continue;
        }

        const { valorInteiro, valorFracao, linkVendedor, produto } =
          await getProdutoValorVendedor(page);
        resultadoValor = `${valorInteiro},${valorFracao}`;
        vendedorValor = `${linkVendedor}`;
        produtoNome = `${produto}`;
      } catch (error) {
        console.error(`Erro ao coletar informações do item ${link}`);
        resultadoValor = "item indisponível";
        vendedorValor = "vendedor indisponível";
        produtoNome = "item indisponível";
      }
      const itensDoCatalogo = {
        produto: produtoNome,
        preco: resultadoValor,
        vendedor: vendedorValor,
        link,
      };

      itens.push(itensDoCatalogo);
      console.log(itens.length);

      await page.goBack();
    }

    console.log(itens.length);

    const nextPageUrl = `${baseUrl}?page=${currentPage + 1}`;
    await page.goto(nextPageUrl, {
      waitUntil: "networkidle2",
    });

    const stopPage = await page
      .waitForSelector(
        ".lh-copy.vtex-rich-text-0-x-paragraph.vtex-rich-text-0-x-paragraph--carrousel-title",
        { timeout: 10000 }
      )
      .then(() => true)
      .catch(() => false);

    if (stopPage) {
      break;
    }

    currentPage++;
  }

  await browser.close();
  return itens;
};

module.exports = getAbout;
