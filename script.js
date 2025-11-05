// Dados de controle
let totalRenda = 0;
let totalGastos = 0;
let totalGanhoMes = 0;
let totalGastoMes = 0;
let categorias = {}; // Armazena os gastos por categoria para o gráfico de pizza
let graficoPizza;

function limparTabela() {
  const tabela = document.getElementById('tabela-financeira').getElementsByTagName('tbody')[0];
  tabela.innerHTML = ''; // Limpa todas as linhas da tabela
}

// Função para importar os dados de um arquivo JSON
function importarDados(event) {
  const arquivo = document.getElementById('importar-arquivo').files[0];
  
  if (arquivo) {
    const leitor = new FileReader();
    
    leitor.onload = function(e) {
      const dados = JSON.parse(e.target.result);

      // Limpa os dados atuais
      limparTabela();

      // Restaura os dados financeiros
      totalRenda = dados.totalRenda;
      totalGastos = dados.totalGastos;
      totalGanhoMes = dados.totalGanhoMes;
      totalGastoMes = dados.totalGastoMes;
      categorias = dados.categorias;
      
      // Atualiza o saldo
      atualizarSaldo();
      atualizarGrafico();

      // Restaura as transações
      dados.transacoes.forEach(transacao => {
        adicionarNaTabela(transacao.tipo, transacao.valor, transacao.data, transacao.descricao, transacao.tags);
      });
    };

    leitor.readAsText(arquivo);
  }
}

// Atualiza os valores do saldo
function atualizarSaldo() {
  const saldo = totalRenda - totalGastos;
  document.getElementById('saldo').innerText = saldo.toFixed(2);
  document.getElementById('total-ganho-mes').innerText = totalGanhoMes.toFixed(2);
  document.getElementById('total-gasto-mes').innerText = totalGastoMes.toFixed(2);
}

// Adiciona uma transação (renda ou gasto)
function adicionarTransacao(tipo) {
  const valor = parseFloat(document.getElementById('valor').value.trim());
  const descricao = document.getElementById('descricao').value.trim();
  const data = document.getElementById('data').value;
  const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());

  if (!isNaN(valor) && valor > 0 && descricao && data) {
    if (tipo === 'Renda') {
      totalRenda += valor;
      totalGanhoMes += valor;
    } else {
      totalGastos += valor;
      totalGastoMes += valor;

      // Atualiza as categorias para o gráfico
      tags.forEach(tag => {
        if (!categorias[tag]) categorias[tag] = 0;
        categorias[tag] += valor;
      });
    }

    adicionarNaTabela(tipo, valor, data, descricao, tags);
    atualizarSaldo();
    atualizarGrafico();
    limparCampos();
  } else {
    alert("Por favor, insira valores válidos em todos os campos.");
  }
}

// Adiciona uma linha na tabela
function adicionarNaTabela(tipo, valor, data, descricao, tags) {
  const tabela = document.getElementById('tabela-financeira').getElementsByTagName('tbody')[0];
  const novaLinha = tabela.insertRow();

  novaLinha.innerHTML = `
    <td>${tipo}</td>
    <td>${valor.toFixed(2)}</td>
    <td>${data}</td>
    <td>${descricao}</td>
    <td>${tags.join(', ')}</td>
    <td><button onclick="excluirTransacao(this, '${tipo}', ${valor}, '${tags}')">Excluir</button></td>
  `;
}

// Exclui uma transação e atualiza os valores
function excluirTransacao(botao, tipo, valor, tags) {
  const linha = botao.parentElement.parentElement;
  linha.parentElement.removeChild(linha);

  if (tipo === 'Renda') {
    totalRenda -= valor;
    totalGanhoMes -= valor;
  } else {
    totalGastos -= valor;
    totalGastoMes -= valor;

    tags.split(',').forEach(tag => {
      if (categorias[tag]) categorias[tag] -= valor;
      if (categorias[tag] <= 0) delete categorias[tag];
    });
  }

  atualizarSaldo();
  atualizarGrafico();
}

// Atualiza o gráfico de pizza
function atualizarGrafico() {
  const ctx = document.getElementById('graficoPizza').getContext('2d');
  const labels = Object.keys(categorias);
  const valores = Object.values(categorias);

  if (graficoPizza) graficoPizza.destroy();

  graficoPizza = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: valores,
        backgroundColor: gerarCores(labels.length),
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        }
      }
    }
  });
}

// Gera cores aleatórias
function gerarCores(quantidade) {
  const cores = [];
  for (let i = 0; i < quantidade; i++) {
    const cor = `hsl(${Math.random() * 360}, 70%, 70%)`;
    cores.push(cor);
  }
  return cores;
}

// Limpa os campos do formulário
function limparCampos() {
  document.getElementById('descricao').value = '';
  document.getElementById('valor').value = '';
  document.getElementById('data').value = '';
  document.getElementById('tags').value = '';
}

// Função para ordenar a tabela com base no critério selecionado
function ordenarTabela() {
  const criterio = document.getElementById('ordenar-por').value;
  const tabela = document.getElementById('tabela-financeira').getElementsByTagName('tbody')[0];
  const linhas = Array.from(tabela.rows);

  linhas.sort((a, b) => {
    const valorA = a.cells[criterioParaIndice(criterio)].innerText;
    const valorB = b.cells[criterioParaIndice(criterio)].innerText;

    // Ordenação por valor precisa ser numérica
    if (criterio === 'valor') {
      return parseFloat(valorA) - parseFloat(valorB);
    }
    // Ordenação por data precisa ser tratada como data
    else if (criterio === 'data') {
      return new Date(valorA) - new Date(valorB);
    }
    // Para texto (tipo, descrição, etc.)
    else {
      return valorA.localeCompare(valorB);
    }
  });

  // Reorganiza as linhas na tabela
  tabela.innerHTML = '';
  linhas.forEach(linha => tabela.appendChild(linha));
}

// Converte o critério em índice da coluna
function criterioParaIndice(criterio) {
  switch (criterio) {
    case 'tipo':
      return 0;
    case 'valor':
      return 1;
    case 'data':
      return 2;
    case 'descricao':
      return 3;
    default:
      return 0;
  }
}

// Função para ordenar a tabela com base no critério selecionado
function ordenarTabela() {
  const criterio = document.getElementById('ordenar-por').value;
  const tabela = document.getElementById('tabela-financeira').getElementsByTagName('tbody')[0];
  const linhas = Array.from(tabela.rows);

  linhas.sort((a, b) => {
    const valorA = a.cells[criterioParaIndice(criterio)].innerText;
    const valorB = b.cells[criterioParaIndice(criterio)].innerText;

    // Ordenação por valor precisa ser numérica
    if (criterio === 'valor') {
      return parseFloat(valorA) - parseFloat(valorB);
    }
    // Ordenação por data precisa ser tratada como data
    else if (criterio === 'data') {
      return new Date(valorA) - new Date(valorB);
    }
    // Para texto (tipo, descrição, etc.)
    else {
      return valorA.localeCompare(valorB);
    }
  });

  // Reorganiza as linhas na tabela
  tabela.innerHTML = '';
  linhas.forEach(linha => tabela.appendChild(linha));
}

// Converte o critério em índice da coluna
function criterioParaIndice(criterio) {
  switch (criterio) {
    case 'tipo':
      return 0;
    case 'valor':
      return 1;
    case 'data':
      return 2;
    case 'descricao':
      return 3;
    default:
      return 0;
  }
}

// Filtra a tabela com base nas tags fornecidas e no tipo de transação (Renda/Gasto)
function filtrarTabela() {
  const filtroTipo = document.getElementById('filtro-tipo').value.toLowerCase();
  const tabela = document.getElementById('tabela-financeira').getElementsByTagName('tbody')[0];
  const linhas = tabela.rows;

  for (let i = 0; i < linhas.length; i++) {
    const tipoLinha = linhas[i].cells[0].innerText.toLowerCase(); // Tipo da linha (renda/gasto)
    const tagsLinha = linhas[i].cells[4].innerText.split(',').map(tag => tag.trim().toLowerCase()); // Tags da linha
    
    // Verifica se o tipo corresponde (ou se o filtro é "todos")
    const correspondeTipo = filtroTipo === 'todos' || tipoLinha === filtroTipo;

    // Exibe a linha somente se ambos os filtros forem atendidos
    
    if (correspondeTipo) {
      linhas[i].style.display = ''; // Exibe a linha
    } else {
      linhas[i].style.display = 'none'; // Oculta a linha
    }
    
  }

  // Ordenar a tabela após filtrar (se necessário)
  ordenarTabela();
}

// Filtra a tabela com base nas tags fornecidas e no tipo de transação (Renda/Gasto)
// Filtra a tabela com base nos critérios fornecidos
function filtrarTabela() {
  const filtroTags = document.getElementById('filtro-tags').value.split(',').map(tag => tag.trim().toLowerCase());
  const filtroTipo = document.getElementById('filtro-tipo').value.toLowerCase();
  const filtroOpcao = document.getElementById('filtro-opcao').value; // Critério de filtro
  const tabela = document.getElementById('tabela-financeira').getElementsByTagName('tbody')[0];
  const linhas = tabela.rows;

  for (let i = 0; i < linhas.length; i++) {
    const tipoLinha = linhas[i].cells[0].innerText.toLowerCase(); // Tipo da linha (renda/gasto)
    const tagsLinha = linhas[i].cells[4].innerText.split(',').map(tag => tag.trim().toLowerCase()); // Tags da linha

    // Verifica se as tags fornecidas correspondem às tags da linha
    const correspondeTags = filtroTags.length === 0 || filtroTags.every(tag => tagsLinha.includes(tag));
    
    // Verifica se o tipo corresponde (ou se o filtro é "todos")
    const correspondeTipo = filtroTipo === 'todos' || tipoLinha === filtroTipo;

    // Aplica o filtro com base no critério selecionado
    let exibir = false;
    if (filtroOpcao === 'tags') {
      exibir = correspondeTags;
    } else if (filtroOpcao === 'tipo') {
      exibir = correspondeTipo;
    } else if (filtroOpcao === 'ambos') {
      exibir = correspondeTags && correspondeTipo;
    }

    // Exibe ou oculta a linha com base na lógica
    linhas[i].style.display = exibir ? '' : 'none';
  }

  // Ordenar a tabela após filtrar (se necessário)
  ordenarTabela();
}

// Limpa os filtros e exibe todas as linhas
function limparFiltros() {
  document.getElementById('filtro-tags').value = '';
  document.getElementById('filtro-tipo').value = 'todos';
  document.getElementById('filtro-opcao').value = 'ambos';
  filtrarTabela();
}

// Atualiza a interface (opcional, para esconder campos não usados)
function atualizarInterface() {
  const filtroOpcao = document.getElementById('filtro-opcao').value;
  const filtroTags = document.getElementById('filtro-tags');
  const filtroTipo = document.getElementById('filtro-tipo');
}

// Função para exportar os dados da tabela para um arquivo JSON
function exportarDados() {
  const dados = {
    totalRenda: totalRenda,
    totalGastos: totalGastos,
    totalGanhoMes: totalGanhoMes,
    totalGastoMes: totalGastoMes,
    categorias: categorias,
    transacoes: []
  };

  const tabela = document.getElementById('tabela-financeira').getElementsByTagName('tbody')[0];
  const linhas = tabela.rows;

  for (let i = 0; i < linhas.length; i++) {
    const tipo = linhas[i].cells[0].innerText;
    const valor = parseFloat(linhas[i].cells[1].innerText);
    const data = linhas[i].cells[2].innerText;
    const descricao = linhas[i].cells[3].innerText;
    const tags = linhas[i].cells[4].innerText.split(',').map(tag => tag.trim());

    dados.transacoes.push({ tipo, valor, data, descricao, tags });
  }

  const json = JSON.stringify(dados, null, 2);

  // Cria um link para o arquivo JSON
  const link = document.createElement('a');
  link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(json);
  link.download = 'dados_financeiros.json';
  link.click();
}
