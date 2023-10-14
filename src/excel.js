const getAbout = require("./index.js");
const ExcelJS = require("exceljs");

let contagem = 0; 

async function criarPlanilha() {
  const workbook = new ExcelJS.Workbook();
  const itens = await getAbout();
  const nomeArquivo = `itens_carrefour_bravecto_${contagem}.xlsx`; 
  const worksheet = workbook.addWorksheet("itens_carrefour_bravecto");

  worksheet.columns = [
    { header: "produto", key: "produto", width: 20 },
    { header: "preco", key: "preco", width: 10 },
    { header: "vendedor", key: "vendedor", width: 10 },
    { header: "link", key: "link", width: 10 },
  ];
  
  itens.forEach((item) => {
    worksheet.addRow(item);
  });

  await workbook.xlsx.writeFile(nomeArquivo);
  contagem++; 
}

criarPlanilha().catch((err) => {
  console.error("Erro ao criar a planilha:", err);
});
