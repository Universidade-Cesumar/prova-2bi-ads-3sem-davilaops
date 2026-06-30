/**
 * Testes unitários da função validarRetirada(estoqueAtual, quantidadeRetirada)
 *
 * Como o projeto é vanilla JS (sem bundler/test runner configurado),
 * este arquivo pode ser executado diretamente com Node:
 *
 *   node __tests__/validarRetirada.test.js
 *
 * Ele reimplementa a mesma lógica de main.js para fins de teste isolado
 * (sem depender do DOM do navegador).
 */

function validarRetirada(estoqueAtual, quantidadeRetirada) {
  const estoque  = Number(estoqueAtual);
  const retirada = Number(quantidadeRetirada);

  if (Number.isNaN(estoque) || Number.isNaN(retirada)) return false;
  if (retirada <= 0) return false;
  if (retirada > estoque) return false;

  return true;
}

const casos = [
  // [estoqueAtual, quantidadeRetirada, esperado, descrição]
  [10, 5,    true,  'retirada parcial válida'],
  [10, 10,   true,  'retirada exata do total em estoque'],
  [5,  10,   false, 'retirada maior que o estoque deve ser bloqueada'],
  [5,  -3,   false, 'retirada negativa deve ser bloqueada'],
  [5,  0,    false, 'retirada igual a zero deve ser bloqueada'],
  [0,  1,    false, 'retirar de estoque zerado deve ser bloqueado'],
  [10, 'abc',false, 'valor não numérico deve ser bloqueado'],
  ['x', 5,   false, 'estoque não numérico deve ser bloqueado'],
  [10, '5',  true,  'string numérica válida deve ser aceita'],
  [100, 100, true,  'retirada total de estoque grande'],
];

let passou = 0;
let falhou = 0;

console.log('Executando testes de validarRetirada()\n');

casos.forEach(([estoque, retirada, esperado, descricao], i) => {
  const resultado = validarRetirada(estoque, retirada);
  const ok = resultado === esperado;

  if (ok) {
    passou++;
    console.log(`✅ Teste ${i + 1}: ${descricao}`);
  } else {
    falhou++;
    console.log(`❌ Teste ${i + 1}: ${descricao}`);
    console.log(`   esperado=${esperado} | recebido=${resultado} | entrada=(${estoque}, ${retirada})`);
  }
});

console.log(`\nResultado final: ${passou} passaram, ${falhou} falharam.`);

if (falhou > 0) {
  process.exitCode = 1;
}