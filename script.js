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

// Variables globales para almacenar los datos y la selección actual
let allData = {}; // Objeto que contendrá los datos estructurados por año
let selectedYear = "2024";      // Año por defecto
let selectedSection = "publicaciones";  // Sección por defecto

document.addEventListener("DOMContentLoaded", function () {
  fetchData();
  setupYearTabs();
  setupSectionTabs();
  setupGlobalFilter();
});

// Cargar datos desde el Apps Script
function fetchData() {
  fetch("https://script.google.com/macros/s/AKfycbzVk9KCtqXClMZxR4-R-6lFsk5pvcV0jbtYjEnglJClOGeRY3kLytfwQ43vWy48c85V/exec/exec)
    .then(response => response.json())
    .then(data => {
      allData = data;  // Se espera que el JSON tenga { "2024": { publicaciones: [...], salidas: [...], apoyo: [...] }, "2025": { ... } }
      updateContent();
    })
    .catch(error => console.error("Error al cargar los datos:", error));
}

// Configurar pestañas de año
function setupYearTabs() {
  document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", function () {
      document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");
      selectedYear = this.getAttribute("data-year");
      updateContent();
    });
  });
}

// Configurar pestañas secundarias de secciones
function setupSectionTabs() {
  document.querySelectorAll(".sub-tab-button").forEach(button => {
    button.addEventListener("click", function () {
      document.querySelectorAll(".sub-tab-button").forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");
      selectedSection = this.getAttribute("data-section");
      updateContent();
    });
  });
}

// Configurar el filtro global en la sección de Salidas
function setupGlobalFilter() {
  const globalFilter = document.getElementById("globalFilter");
  if (globalFilter) {
    globalFilter.addEventListener("change", function () {
      updateContent();
    });
  }
}

// Actualiza el contenido (muestra la sección y renderiza los gráficos) según el año y la sección seleccionados
function updateContent() {
  // Mostrar solo la sección correspondiente
  document.querySelectorAll(".sub-tabcontent").forEach(div => {
    div.style.display = "none";
  });
  document.getElementById(selectedSection).style.display = "block";

  const data = allData[selectedYear];
  if (!data || !data[selectedSection]) {
    console.error("No hay datos para:", selectedYear, selectedSection);
    return;
  }

  // Según la sección, se llaman a las funciones de renderizado correspondientes
  if (selectedSection === "publicaciones") {
    renderPublicacionesCharts(data.publicaciones);
  } else if (selectedSection === "salidas") {
    renderSalidasCharts(data.salidas);
  } else if (selectedSection === "apoyo") {
    renderApoyoCharts(data.apoyo);
  }
}

// ====================
// Renderización de gráficos para cada sección
// ====================

// Sección Publicaciones
function renderPublicacionesCharts(publicaciones) {
  // Gráfico 1: Auspicios por Facultad
  const pubGroup = transformAndSortData(publicaciones, "Facultad", value => value.trim().toUpperCase());
  renderBarChart("facultadChart", {
    title: 'Publicaciones por Facultad',
    xTitle: 'Facultad',
    yTitle: 'Número de Auspicios',
    labels: pubGroup.labels,
    values: pubGroup.values,
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    borderColor: 'rgba(75, 192, 192, 1)',
    rotation: 0,
    datasetLabel: 'Publicaciones'
  });

  // Gráfico 2: Auspicios por Departamento
  const deptGroup = transformAndSortData(publicaciones, "Dpto.", value => value.trim().toUpperCase());
  renderBarChart("departamentoChart", {
    title: 'Publicaciones por Departamento',
    xTitle: 'Departamento',
    yTitle: 'Número de Auspicios',
    labels: deptGroup.labels,
    values: deptGroup.values,
    //backgroundColor: 'rgba(75, 192, 192, 0.2)',
    //borderColor: 'rgba(75, 192, 192, 1)',
    rotation: 0,
    datasetLabel: 'Publicaciones'
  });

  // Gráfico 3: Artículos en Cuartiles Q1 y Q2
  const cuartilesQ1Q2 = publicaciones.filter(item => item.Quartil === 'Q1' || item.Quartil === 'Q2');
  const cuartilesCount = transformAndSortData(cuartilesQ1Q2, 'Quartil', value => value.trim().toUpperCase());
  renderBarChart("cuartilesChart", {
    title: 'Número de Artículos en Q1 y Q2',
    xTitle: 'Cuartil de la Revista',
    yTitle: 'Número de Artículos',
    labels: cuartilesCount.labels,
    values: cuartilesCount.values,
    backgroundColor: ['rgba(255, 159, 64, 0.2)', 'rgba(75, 192, 192, 0.2)'],
    borderColor: ['rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)'],
    rotation: 0,
    datasetLabel: 'Artículos en Cuartiles'
  });
}

// Sección Salidas
function renderSalidasCharts(salidas) {
  // Obtener el valor del filtro global para Tipo de Auspicio
  const filterValue = document.getElementById("globalFilter").value;
  let filteredSalidas = salidas;
  if (filterValue !== "todos") {
    filteredSalidas = salidas.filter(item =>
      item["Tipo de Auspicio"] &&
      item["Tipo de Auspicio"].trim().toUpperCase() === filterValue.toUpperCase()
    );
  }

  // Gráfico 1: Salidas por Facultad
  const groupFac = transformAndSortData(filteredSalidas, "Facultad", value => value.trim().toUpperCase());
  renderBarChart("tipoAuspicioFacultadChart", {
    title: 'Salidas al exterior por Facultad',
    xTitle: 'Facultad',
    yTitle: 'Número de Salidas',
    labels: groupFac.labels,
    values: groupFac.values,
    backgroundColor: 'rgba(64, 255, 74, 0.2)',
    borderColor: 'rgb(64, 255, 77)',
    rotation: 0,
    datasetLabel: 'Salidas'
  });

  // Gráfico 2: Salidas por Departamento
  const groupDpto = transformAndSortData(filteredSalidas, "Dpto.", value => value.trim().toUpperCase());
  renderBarChart("tipoAuspicioDptoChart", {
    title: 'Salidas al exterior por Departamento',
    xTitle: 'Departamento',
    yTitle: 'Número de Salidas',
    labels: groupDpto.labels,
    values: groupDpto.values,
    backgroundColor: 'rgba(67, 64, 255, 0.2)',
    borderColor: 'rgb(93, 64, 255)',
    rotation: 0,
    datasetLabel: 'Salidas'
  });

  // Gráfico 3: Salidas por País
  const groupPais = transformAndSortData(filteredSalidas, "País del evento", value => value.trim().toUpperCase());
  renderBarChart("tipoAuspicioPaisChart", {
    title: 'Salidas por País',
    xTitle: 'País',
    yTitle: 'Número de Salidas',
    labels: groupPais.labels,
    values: groupPais.values,
    //backgroundColor: 'rgba(255, 64, 147, 0.2)',
    //borderColor: 'rgb(255, 64, 109)',
    rotation: 0,
    datasetLabel: 'Salidas'
  });
}

// Sección Apoyo Económico
function renderApoyoCharts(apoyo) {
  const groupApoyo = transformAndSortData(apoyo, "Tipo de Apoyo", value => value.trim().toUpperCase());
  renderBarChart("apoyoChart", {
    title: 'Apoyo Económico por Tipo',
    xTitle: 'Tipo de Apoyo',
    yTitle: 'Número de Apoyos',
    labels: groupApoyo.labels,
    values: groupApoyo.values,
    backgroundColor: 'rgba(153, 102, 255, 0.2)',
    borderColor: 'rgba(153, 102, 255, 1)',
    rotation: 0,
    datasetLabel: 'Apoyos'
  });
}
/**************************FUNCIONES********************************** */

/** 
 * transformAndSortData(data, key):
 * transforma, cuenta y ordena los datos de mayor a menor.
 * @param {Array} data - Array de objetos.
 * @param {String} key - Clave por la que agrupar.
 * @param {Function} [normalizeFn] - Función de normalización opcional.
 * @returns {Object} Objeto con { labels, values }.
 */
// Función para transformar y ordenar los datos
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
    if (typeof val === 'string' && normalizeFn) {
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
// Función para cambiar de año
function changeYear(year) {
  selectedYear = year;
  renderCharts();  // Vuelve a renderizar los gráficos con los datos del año seleccionado
}

// Función para renderizar el gráfico de barras
function renderBarChart(canvasId, config) {
  console.log("Renderizando gráfico:", canvasId, config);

  const ctx = document.getElementById(canvasId).getContext('2d');
  // Si hay un gráfico previo, destruirlo
  if (window[canvasId] instanceof Chart) {
    window[canvasId].destroy();
  }

  const { backgroundColors, borderColors } = generateColors(config.labels.length);
  window[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: config.labels,
      datasets: [{
        label: config.datasetLabel,
        data: config.values,
        backgroundColor: config.backgroundColor || backgroundColors,
        borderColor: config.borderColor || borderColors,
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
              // Si el label es muy largo, lo trunca
              return facultadAbreviaturas[label] || label;
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

// Función para generar colores aleatorios o de una paleta predefinida
function generateColors(count) {
  const colors = [
    'rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)',
    'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)'
  ];
  const borderColors = [
    'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'
  ];

  // Si hay más datos que colores predefinidos, se generan aleatorios
  while (colors.length < count) {
    let r = Math.floor(Math.random() * 255);
    let g = Math.floor(Math.random() * 255);
    let b = Math.floor(Math.random() * 255);
    colors.push(`rgba(${r}, ${g}, ${b}, 0.2)`);
    borderColors.push(`rgba(${r}, ${g}, ${b}, 1)`);
  }

  return { backgroundColors: colors.slice(0, count), borderColors: borderColors.slice(0, count) };
}

/*****************FUNCIONES DE DESCARGA****************************** */
function downloadChart(canvasId, fileName) {
  const canvas = document.getElementById(canvasId);

  // Crear un canvas temporal con las mismas dimensiones
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx = tempCanvas.getContext('2d');

  // Rellenar con fondo blanco
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Dibujar el canvas original sobre el fondo blanco
  ctx.drawImage(canvas, 0, 0);

  // Crear el enlace de descarga con el canvas temporal
  const link = document.createElement('a');
  link.href = tempCanvas.toDataURL('image/png');
  link.download = fileName + '.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadSectionAsPDF(sectionId, fileName) {
  if (typeof html2canvas === "undefined" || typeof window.jspdf === "undefined") {
    console.error("Asegúrate de haber incluido html2canvas y jsPDF.");
    return;
  }

  const section = document.getElementById(sectionId);

  // Ocultar solo los botones dentro de los gráficos
  const chartButtons = section.querySelectorAll("button");
  chartButtons.forEach(btn => btn.style.display = "none");

  html2canvas(section, { scale: 2, backgroundColor: "#ffffff" }).then(canvas => {
    const imgData = canvas.toDataURL("image/png");

    const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // Margen de 10mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > pageHeight - 20) {
      let remainingHeight = imgHeight;
      let canvasPosition = 0;

      while (remainingHeight > 0) {
        let sliceHeight = Math.min(remainingHeight, pageHeight - 20);
        let croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = canvas.width;
        croppedCanvas.height = (sliceHeight * canvas.width) / imgWidth;

        let ctx = croppedCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, canvasPosition, canvas.width, croppedCanvas.height, 0, 0, croppedCanvas.width, croppedCanvas.height);

        let imgDataPart = croppedCanvas.toDataURL("image/png");
        pdf.addImage(imgDataPart, "PNG", 10, 10, imgWidth, sliceHeight);

        remainingHeight -= sliceHeight;
        canvasPosition += croppedCanvas.height;

        if (remainingHeight > 0) pdf.addPage();
      }
    } else {
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    }

    // Restaurar la visibilidad de los botones dentro de los gráficos
    chartButtons.forEach(btn => btn.style.display = "inline-block");

    pdf.save(fileName + ".pdf");
  });
}


function downloadSectionAsExcel(sectionId, fileName) {
  if (typeof XLSX === "undefined") {
    console.error("Asegúrate de haber incluido la librería XLSX.");
    return;
  }
  
  let wb = XLSX.utils.book_new();
  document.querySelectorAll(`#${sectionId} canvas`).forEach((canvas, index) => {
    let chart = Chart.getChart(canvas);
    if (chart) {
      let data = [["Etiqueta", "Valor"]]; // Encabezados
      chart.data.labels.forEach((label, i) => {
        data.push([label, chart.data.datasets[0].data[i]]);
      });
      let ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Grafico_" + (index + 1));
    }
  });
  XLSX.writeFile(wb, fileName + ".xlsx");
}
