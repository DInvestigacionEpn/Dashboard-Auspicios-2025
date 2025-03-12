const facultadAbreviaturas = {
  "FACULTAD DE CIENCIAS": "FC",
  "FACULTAD DE CIENCIAS ADMINISTRATIVAS": "FCA",
  "FACULTAD DE GEOLOGÍA Y PETRÓLEOS": "FGP",
  "FACULTAD DE INGENIERÍA CIVIL Y AMBIENTAL": "FICA",
  "FACULTAD DE INGENIERÍA ELÉCTRICA Y ELECTRÓNICA": "FIEE",
  "FACULTAD DE INGENIERIA ELÉCTRICA Y ELECTRÓNICA": "FIEE",
  "FACULTAD DE INGENIERÍA ELÉCTRICA  Y ELECTRÓNICA": "FIEE",
  "FACULTAD DE INGENIERÍA DE ELÉCTRICA Y ELECTRÓNICA": "FIEE",
  "FACULTAD DE INGENIERÍA EN SISTEMAS": "FIS",
  "FACULTAD DE INGENIERIA EN SISTEMAS": "FIS",
  "FACULTAD DE INGENIERIA DE SISTEMAS": "FIS",
  "FACULTAD DE INGENIERÍA DE SISTEMAS": "FIS",
  "FACULTAD DE INGENIERÍA MECÁNICA": "FIM",
  "FACULTAD DE INGENIERÍA QUÍMICA Y AGROINDUSTRIA": "FIQA",
  "ESCUELA DE FORMACIÓN DE TECNÓLOGOS": "ESFOT",
  "IG": "IG",
  "DEPARTAMENTO DE FORMACIÓN BÁSICA": "DFB"
  // Agrega aquí las demás facultades que necesites
};

let allData = {}; // Almacena los datos de ambos años
let selectedYear = "2024"; // Año por defecto
let selectedSection = "publicaciones"; // Sección por defecto

document.addEventListener("DOMContentLoaded", function () {
  fetchData();

  // Evento para cambiar de año
  document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", function () {
      document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");

      selectedYear = this.getAttribute("data-year");
      updateCharts();
    });
  });
// URL de la API (reemplaza por la tuya)
const API_URL = 'https://script.google.com/macros/s/AKfycbw2YLz63oPa35m2yal4gMdpUwMd6ls5q9PYLG3XBnj7nY6aQC90oayNaKMkrTcO8dPl/exec';
// Cargar datos y renderizar gráficos individualmente
fetchAPI(API_URL)
  .then(data => {
    // --- Sección Publicaciones ---
    const publicaciones = data.publicaciones;

    //Gráfico de distribucion por facultad
    const pubGroup = transformAndSortData(publicaciones, "Facultad", value => value.trim().toUpperCase());
    const pubLabels = pubGroup.labels;
    const pubValues = pubGroup.values;
    renderBarChart('facultadChart', {
      title: 'Auspicios por Facultad',
      xTitle: 'Facultad',
      yTitle: 'Número de Auspicios',
      labels: pubLabels,
      values: pubValues,
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      rotation: 0
    });

    // Gráfico de Distribución por Departamento
    const departamentoData = transformAndSortData(publicaciones, 'Dpto.', value => value.trim().toUpperCase());
    const departamentoLabels = departamentoData.labels;
    const departamentoValues = departamentoData.values;
    renderBarChart('departamentoChart', {
      title: 'Auspicios por Departamento',
      xTitle: 'Departamento',
      yTitle: 'Número de Auspicios',
      labels: departamentoLabels,
      values: departamentoValues,
      backgroundColor: 'rgba(153, 102, 255, 0.2)',
      borderColor: 'rgb(175, 73, 252)',
      rotation: 0
    });

    // Gráfico de Artículos en Cuartiles Q1 y Q2
    const cuartilesQ1Q2 = publicaciones.filter(item => item.Quartil === 'Q1' || item.Quartil === 'Q2');
    const cuartilesCount = transformAndSortData(cuartilesQ1Q2, 'Quartil', value => value.trim().toUpperCase());
    const cuartilesLabels = cuartilesCount.labels;
    const cuartilesValues = cuartilesCount.values;
    renderBarChart('cuartilesChart', {
      title: 'Número de Artículos en Q1 y Q2',
      xTitle: 'Cuartil de la Revista',
      yTitle: 'Número de Auspicios',
      labels: cuartilesLabels,
      values: cuartilesValues,
      backgroundColor: ['rgba(255, 159, 64, 0.2)', 'rgba(75, 192, 192, 0.2)'],
      borderColor: ['rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)']
    });
    // --- Sección Salidas ---
    // Ejemplo: Filtrar por Tipo de Auspicio y agrupar por "Facultad"
    // Aquí podríamos dejar la data original y luego usar filtros dinámicos si se requiere.
    const salidas = data.salidas;
    /*
    // Por defecto, usar todos los registros de salidas para agrupar por "Facultad"
    const salGroup = transformAndSortData(salidas, "Facultad");
    const salLabels = salGroup.labels;
    const salValues = salGroup.values;
    
    renderBarChart('salidasChart', {
      title: 'Salidas al Exterior por Facultad',
      xTitle: 'Facultad',
      yTitle: 'Número de Salidas',
      labels: salLabels,
      values: salValues,
      datasetLabel: 'Salidas',
      backgroundColor: 'rgba(255, 159, 64, 0.2)',
      borderColor: 'rgba(255, 159, 64, 1)'
    });*/

    originalSalidas = data.salidas;
    updateFilteredCharts();

    // --- Sección Apoyo ---
    // Ejemplo: Contar apoyos por "Facultad"
    const apoyo = data.apoyo;
    /*
    const apoyoGroup = transformAndSortData(apoyo, "Facultad");
    const apoyoLabels = apoyoGroup.labels;
    const apoyoValues = apoyoGroup.values;
    renderBarChart('apoyoChart', {
      title: 'Apoyo Económico por Facultad',
      xTitle: 'Facultad',
      yTitle: 'Número de Apoyos',
      labels: apoyoLabels,
      values: apoyoValues,
      datasetLabel: 'Apoyos',
      backgroundColor: 'rgba(153, 102, 255, 0.2)',
      borderColor: 'rgba(153, 102, 255, 1)'
    });*/
  })
  .catch(error => console.error("Error al cargar los datos:", error));

// ------------------------------
// Manejo del Filtro Global para gráficos que usan "Tipo de Auspicio"

function updateFilteredCharts() {
  const filterValue = document.getElementById('globalFilter').value.trim(); // Elimina espacios en blanco
  let filteredData = originalSalidas;  // Usamos los datos originales

  if (filterValue !== "todos") {
    filteredData = originalSalidas.filter(item =>
      item['Tipo de Auspicio']?.trim().toUpperCase() === filterValue.toUpperCase()
    );
  }

  // Verificar si hay datos después del filtrado
  if (filteredData.length === 0) {
    console.warn("No hay datos para el filtro seleccionado:", filterValue);
    // Opcional: Mostrar un mensaje en el gráfico
    renderBarChart('tipoAuspicioChart', {
      title: 'Distribución Tipo de Auspicio vs. Facultad',
      xTitle: 'Facultad',
      yTitle: 'Número de Salidas',
      labels: ['No hay datos'],
      values: [0],
      datasetLabel: 'Salidas',
      backgroundColor: 'rgba(200, 200, 200, 0.2)',
      borderColor: 'rgba(200, 200, 200, 1)'
    });
    return;
  }
  const groupedData = transformAndSortData(filteredData, "Facultad", value => value.trim().toUpperCase());

  // Redibujar el gráfico con datos filtrados
  renderBarChart('tipoAuspicioFacultadChart', {
    title: 'Salidas al exterior por Facultad',
    xTitle: 'Facultad',
    yTitle: 'Número de Salidas',
    labels: groupedData.labels,
    values: groupedData.values,
    datasetLabel: 'Salidas',
    backgroundColor: 'rgba(64, 255, 74, 0.2)',
    borderColor: 'rgb(64, 255, 77)'
  });

  const groupedData2 = transformAndSortData(filteredData, "Dpto.", value => value.trim().toUpperCase());

  // Redibujar el gráfico con datos filtrados
  renderBarChart('tipoAuspicioDptoChart', {
    title: 'Salidas al exterior por Departamento',
    xTitle: 'Departamento',
    yTitle: 'Número de Salidas',
    labels: groupedData2.labels,
    values: groupedData2.values,
    datasetLabel: 'Salidas',
    backgroundColor: 'rgba(67, 64, 255, 0.2)',
    borderColor: 'rgb(93, 64, 255)'
  });

  const groupedData3 = transformAndSortData(filteredData, "País del evento", value => value.trim().toUpperCase());

  // Redibujar el gráfico con datos filtrados
  renderBarChart('tipoAuspicioPaisChart', {
    title: 'Salidas al exterior por País',
    xTitle: 'País',
    yTitle: 'Número de Salidas',
    labels: groupedData3.labels,
    values: groupedData3.values,
    datasetLabel: 'Salidas',
    backgroundColor: 'rgba(255, 64, 147, 0.2)',
    borderColor: 'rgb(255, 64, 109)'
  });
}
document.getElementById('globalFilter').addEventListener('change', updateFilteredCharts);

/**************************FUNCIONES********************************** */
/** 
 * transformAndSortData(data, key):
 * transforma, cuenta y ordena los datos de mayor a menor.
 * @param {Array} data - Array de objetos.
 * @param {String} key - Clave por la que agrupar.
 * @param {Function} [normalizeFn] - Función de normalización opcional.
 * @returns {Object} Objeto con { labels, values }.
 */
function transformAndSortData(data, key, normalizeFn) {
  // Contar ocurrencias por clave
  const countData = groupByKey(data, key, normalizeFn);
  // Convertir a arrays de labels y values
  const labels = Object.keys(countData);
  // Ordenar los labels de mayor a menor según los valores
  const sortedLabels = labels.sort((a, b) => countData[b] - countData[a]);
  const sortedValues = sortedLabels.map(label => countData[label]);
  return { labels: sortedLabels, values: sortedValues };
}
/** 
    * fetchAPI(url): Obtiene datos JSON desde la API.
    */
async function fetchAPI(url) {
  const response = await fetch(url);
  return response.json();
}

/**
 * groupByKey(data, key):
 * Agrupa un array de objetos contando la ocurrencia de cada valor en la propiedad "key".
 * Retorna un objeto con { [valor]: count }.
 * @param {Array} data - Array de objetos.
 * @param {String} key - La clave por la que se agruparán los datos.
 * @param {Function} [normalizeFn] - Función opcional para normalizar el valor (p.ej., v => v.trim().toUpperCase()).
 * @returns {Object} Un objeto con cada valor normalizado como clave y su cuenta.
 */
function groupByKey(data, key, normalizeFn) {
  return data.reduce((acc, obj) => {
    let val = obj[key];
    if(typeof val === 'string' && normalizeFn){
      val = normalizeFn(val);
    }
    if (val) {
      acc[val] = (acc[val] || 0) + 1;
    }
    return acc;
  }, {});
}

/**
 * filterByKey(data, key, value):
 * Filtra el array dejando solo los objetos donde obj[key] === value.
 */
function filterByKey(data, key, value) {
  return data.filter(item => item[key] === value);
}

/**
 * renderBarChart(canvasId, config):
 * Crea un gráfico de barras en el canvas con id "canvasId".
 * config es un objeto que debe incluir:
 *   - title: título del gráfico
 *   - xTitle: título del eje X
 *   - yTitle: título del eje Y
 *   - labels: array de etiquetas (x-axis)
 *   - values: array de valores (y-axis)
 *   - datasetLabel: etiqueta para el dataset
 *   - backgroundColor, borderColor, borderWidth: opciones visuales
 */
function renderBarChart(canvasId, config) {
  console.log("Renderizando gráfico:", canvasId, config);

  const ctx = document.getElementById(canvasId).getContext('2d');
  // Si hay un gráfico previo, destruirlo
  if (window[canvasId] instanceof Chart) {
    window[canvasId].destroy();
  }

  window[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: config.labels,
      datasets: [{
        label: config.datasetLabel,
        data: config.values,
        backgroundColor: config.backgroundColor || 'rgba(75, 192, 192, 0.2)',
        borderColor: config.borderColor || 'rgba(75, 192, 192, 1)',
        borderWidth: config.borderWidth || 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: config.title,
          font: { size: 16, weight: 'bold' },
          padding: { bottom: 28 }
        },
        legend: { display: false },
        datalabels: {
          color: 'black',
          anchor: 'end',
          align: 'top',
          formatter: value => value
        }
      },
      scales: {
        x: {
          ticks: {
            callback: function (value, index, ticks) {
              // Accede al label original usando el índice
              let label = config.labels[index];
              label = label.replace(/FACULTAD DE\s*/gi, '').trim();
              // Si el label es muy largo, lo trunca
              return label && label.length > 20 ? label.substring(0, 20) + "..." : label;
            },
            minRotation: config.rotation
          },
          title: {
            display: true,
            text: config.xTitle,
            font: { weight: 'bold' }
          }
        },
        y: {
          title: {
            display: true,
            text: config.yTitle,
            font: { weight: 'bold' }
          },
          ticks: {
            beginAtZero: true,
            stepSize: 1,
            callback: function (value) {
              // Elimina comas y asegúrate de que los números se muestran como enteros
              return value % 1 === 0 ? value : Math.round(value);  // Si el número tiene decimales, lo redondea
            }
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}
