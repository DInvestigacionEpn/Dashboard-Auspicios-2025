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
  "DEPARTAMENTO DE FORMACIÓN BÁSICA": "DFB",
  "DEPARTAMENTO DE CIENCIAS SOCIALES": "DCS"
};

// Variables globales para almacenar los datos y la selección actual
let allData = {}; // Objeto que tiene los datos estructurados por año
let selectedYear = "2024";      // Año por defecto
let selectedSection = "publicaciones";  // Sección por defecto

document.addEventListener("DOMContentLoaded", function () {
  fetchData();
  setupYearTabs();
});

const sectionsByYear = {
  "2024": ["publicaciones", "salidas", "apoyo"],
  "2025": ["publicaciones", "inscripciones", "salidas", "apoyo", "salidasNacionales", "resumen"],
};

// Cargar datos desde el Apps Script
function fetchData() {
  fetch("https://script.google.com/macros/s/AKfycbzVk9KCtqXClMZxR4-R-6lFsk5pvcV0jbtYjEnglJClOGeRY3kLytfwQ43vWy48c85V/exec")
    .then(response => response.json())
    .then(data => {
      // Filtrar publicaciones con "SI" en la aprobación
      Object.keys(data).forEach(anio => {
        if (data[anio].publicaciones) {
          data[anio].publicaciones = data[anio].publicaciones.filter(pub =>
            pub["Aprobación"]?.toString().trim().toUpperCase() === "SI"
          );
        }
      });
      allData = data;
      updateContent();
    })
    .catch(error => console.error("Error al cargar los datos:", error));
}

// Configurar pestañas de año
function setupYearTabs() {
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.addEventListener("click", function () {
      selectedYear = this.getAttribute("data-year");
      document.querySelectorAll(".tab-button").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      selectedSection = null;
      updateContent();
      // IMPORTANTE
      renderSubTabs();
    });
  });

}

// 3. Generar y configurar subpestañas
function renderSubTabs() {
  const container = document.getElementById("subTabs");
  container.innerHTML = "";
  const yearSections = sectionsByYear[selectedYear] || [];
  console.log("Subsecciones para el año", selectedYear, yearSections); // debug
  yearSections.forEach(section => {
    const btn = document.createElement("button");
    btn.className = "sub-tab-button";
    btn.setAttribute("data-section", section);
    const names = {
      publicaciones: "Publicaciones",
      salidas: "Salidas al Exterior",
      apoyo: "Apoyo Económico",
      inscripciones: "Inscripciones",
      salidasNacionales: "Salidas Nacionales",
      resumen: "Resumen"
    };
    btn.textContent = names[section] || section;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sub-tab-button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSection = section;
      updateContent();
    });
    container.appendChild(btn);
  });
  // Si no hay sección seleccionada o es inválida, elige la primera
  if (!selectedSection || !yearSections.includes(selectedSection)) {
    selectedSection = yearSections[0];
  }
  container.querySelector(`[data-section="${selectedSection}"]`)?.classList.add("active");
}

// 4. Actualizar contenido y gráficos
function updateContent() {
  // Generar subpestañas
  const availableSections = sectionsByYear[selectedYear] || [];
  if (!selectedSection || !availableSections.includes(selectedSection)) {
    selectedSection = availableSections[0];  // Primera sección válida
  }
  renderSubTabs();

  // Mostrar solo la sección activa
  document.querySelectorAll(".sub-tabcontent").forEach(div => div.style.display = "none");
  const sectionEl = document.getElementById(selectedSection);
  if (!sectionEl) return console.error("Sección no encontrada:", selectedSection);
  sectionEl.style.display = "block";

  // Limpiar mensajes previos
  sectionEl.querySelectorAll("p.no-data-msg").forEach(p => p.remove());
  clearCharts();

  // Condición especial para la sección 'resumen'
  if (selectedSection === "resumen") {
    sectionEl.querySelectorAll("canvas").forEach(c => c.style.display = "none");
    renderResumenTabla(
      allData[selectedYear]?.publicaciones || [],
      allData[selectedYear]?.inscripciones || []
    );
    renderResumenDepartamentoTabla(
    allData[selectedYear]?.publicaciones || [],
    allData[selectedYear]?.inscripciones || []
  );
    return;
  }

  // Obtener datos de la sección seleccionada
  const data = allData[selectedYear]?.[selectedSection];
  if (!Array.isArray(data) || data.length === 0) {
    // Mostrar mensaje de no datos, pero sin eliminar el HTML structure
    sectionEl.querySelectorAll("canvas").forEach(c => c.style.display = "none");
    const msg = document.createElement("p");
    msg.textContent = "No hay datos disponibles.";
    msg.className = "no-data-msg";
    sectionEl.appendChild(msg);
    return;
  }

  // Asegurar que canvas estén visibles
  sectionEl.querySelectorAll("canvas").forEach(c => c.style.display = "block");

  // Llamada a la función de renderizado según sección
  switch (selectedSection) {
    case "publicaciones":
      renderPublicacionesCharts(data);
      break;
    case "salidas":
      renderSalidasCharts(data);
      break;
    case "apoyo":
      renderApoyoCharts(data);
      break;
    case "inscripciones":
      renderInscripcionesCharts(data);
      break;
    case "salidasNacionales":
      renderSalidasNacionalesCharts(data);
      break;
    default:
      console.error("Sección no reconocida:", selectedSection);
  }
}

function clearCharts() {
  document.querySelectorAll("canvas").forEach(canvas => {
    // Si existe un gráfico de Chart.js asociado, destrúyelo
    const chart = Chart.getChart(canvas);
    if (chart) {
      chart.destroy();
    }
    // Luego sí limpia el canvas
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

// ====================
// Renderización de gráficos para cada sección
// ====================

// Sección Publicaciones
function renderPublicacionesCharts(publicaciones) {
  // Gráfico 1: Auspicios por Facultad
  const pubGroup = transformAndSortData(publicaciones, "Facultad", value => value.trim().toUpperCase());
  renderBarChart("publicacionesFacultadChart", {
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
  renderBarChart("publicacionesDepartamentoChart", {
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
  renderBarChart("publicacionesCuartilesChart", {
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

  // Gráfico 4: Auspicios por Género
  const genderGroup = transformAndSortData(publicaciones, "Género", value => value.trim().toUpperCase());
  renderBarChart("publicacionesGeneroChart", {
    title: 'Publicaciones por Género',
    xTitle: 'Género',
    yTitle: 'Número de Auspicios',
    labels: ['Masculino', 'Femenino'],
    values: genderGroup.values,
    backgroundColor: ['rgba(64, 137, 255, 0.2)', 'rgba(192, 75, 169, 0.21)'],
    borderColor: ['rgb(67, 110, 254)', 'rgb(192, 43, 159)'],
    rotation: 0,
    datasetLabel: 'Publicaciones'
  });

  // --- Gráfico 5: Publicaciones por Mes ---
  const conteoPorMes = Array(12).fill(0);
  publicaciones.forEach(pub => {
    let fechaRaw = String(pub["Fecha del informe"] || "");
    if (fechaRaw.includes("T")) fechaRaw = fechaRaw.split("T")[0];
    // Parseamos como fecha local para evitar desfase de huso horario
    const [anio, mes, dia] = fechaRaw.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia); // ← mes - 1 porque enero = 0
    if (isNaN(fecha)) {
      console.warn("⚠️ Fecha inválida:", pub["Fecha del informe"]);
      return;
    }
    const mesIndex = fecha.getMonth(); // 0 - enero, 1 - febrero, ...
    conteoPorMes[mesIndex]++;
  });
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  //Filtrar meses con al menos 1 publicación
  const paresFiltrados = conteoPorMes
    .map((valor, idx) => [idx, valor])
    .filter(([_, valor]) => valor > 0);
  const labelsMeses = paresFiltrados.map(([idx]) =>
    meses[idx].charAt(0).toUpperCase() + meses[idx].slice(1)
  );
  const valoresMeses = paresFiltrados.map(([_, valor]) => valor);
  renderBarChart("publicacionesPorMesChart", {
    title: "Publicaciones por Mes",
    xTitle: "Mes",
    yTitle: "Número de publicaciones",
    labels: labelsMeses,
    values: valoresMeses,
    backgroundColor: "rgba(255, 206, 86, 0.2)",
    borderColor: "rgba(255, 206, 86, 1)",
    datasetLabel: "Publicaciones"
  });

  let labels, values;
  // --- Gráfico 6: Monto total por Facultad ---
  const montoPorFacultad = {};
  publicaciones.forEach((pub) => {
    const facultad = pub["Facultad"]?.trim().toUpperCase();
    const valor = parseFloat(pub["Valor referencial DI"]) || 0;
    if (facultad) {
      montoPorFacultad[facultad] = (montoPorFacultad[facultad] || 0) + valor;
    }
  });

  ({ labels, values } = transformAndSortData(publicaciones,"Facultad",
  f => f.trim().toUpperCase(),pub => parseFloat(pub["Valor referencial DI"]) || 0));

  renderBarChart("publicacionesMontoFacultadChart", {
    title: "Valor Referencial Total por Facultad",
    xTitle: "Facultad",
    yTitle: "Valor en USD",
    labels: labels,
    values: values,
    backgroundColor: "rgba(54, 162, 235, 0.2)",
    borderColor: "rgba(54, 162, 235, 1)",
    datasetLabel: "Valor USD",
    options: {
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 0 } },
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => "$" + value.toLocaleString()
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.y;
              return `${ctx.dataset.label}: $${v.toLocaleString()}`;
            }
          }
        }
      }
    }
  });

  // --- Gráfico 7: Monto total por Departmento ---
  ({ labels, values } = transformAndSortData(publicaciones,"Dpto.",f => f.trim().toUpperCase(),
  pub => parseFloat(pub["Valor referencial DI"]) || 0));
  renderBarChart("publicacionesMontoDptoChart", {
    title: "Valor Referencial Total por Departamento",
    xTitle: "Facultad",
    yTitle: "Valor en USD",
    labels: labels,
    values: values,
    backgroundColor: "rgba(54, 162, 235, 0.2)",
    borderColor: "rgba(54, 162, 235, 1)",
    datasetLabel: "Valor USD",
    options: {
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 0 } },
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => "$" + value.toLocaleString()
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.y;
              return `${ctx.dataset.label}: $${v.toLocaleString()}`;
            }
          }
        }
      }
    }
  });

  // --- Gráfico 8: Monto total por Persona (horizontal) ---
  const montoPorPersona = {};

  publicaciones.forEach((pub) => {
    const nombreCompleto = pub["Apellidos y Nombres"]?.trim();
    const valor = parseFloat(pub["Valor referencial DI"]) || 0;
    if (nombreCompleto) {
      montoPorPersona[nombreCompleto] = (montoPorPersona[nombreCompleto] || 0) + valor;
    }
  });
  const personasOrdenadas = Object.entries(montoPorPersona)
    .sort((a, b) => b[1] - a[1]);
  const personasLabels = personasOrdenadas.map(entry => entry[0]);
  const personasValores = personasOrdenadas.map(entry => entry[1]);

  renderHorizontalBarChart("publicacionesMontoPersonaChart", {
    title: "Valor Referencial por Persona",
    xTitle: "Valor en USD",
    yTitle: "Persona",
    labels: personasLabels,
    values: personasValores,
    backgroundColor: "rgba(255, 99, 132, 0.2)",
    borderColor: "rgba(255, 99, 132, 1)",
    datasetLabel: "Valor USD",
    currency: true,      // para formatear con $
  });

  // --- Gráfico 9: Monto total por mes (horizontal) ---
  const montoPorMes = {};
  publicaciones.forEach(pub => {
    const fechaStr = pub["Fecha del informe"];
    const valor = parseFloat(pub["Valor referencial DI"]) || 0;
    if (fechaStr) {
      const fecha = new Date(fechaStr);
      if (!isNaN(fecha)) {
        // Obtener mes en formato "Año-Mes" para evitar problemas de orden (e.g. "2025-06")
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        montoPorMes[mesKey] = (montoPorMes[mesKey] || 0) + valor;
      }
    }
  });
  const mesesOrdenados = Object.entries(montoPorMes).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  const mesesLabels = mesesOrdenados.map(([mes]) => {
    const [anio, mesNum] = mes.split('-');
    const fecha = new Date(anio, parseInt(mesNum, 10) - 1);
    return fecha.toLocaleDateString('es-ES', { month: 'short' });
  });
  const mesesValores = mesesOrdenados.map(entry => entry[1]);
  // Renderizamos gráfico vertical
  renderHorizontalBarChart("publicacionesMontoMesChart", {
    title: "Valor Referencial Total por Mes",
    xTitle: "Monto en USD",
    yTitle: "Mes",
    labels: mesesLabels,
    values: mesesValores,
    backgroundColor: "rgba(54, 162, 235, 0.7)",
    borderColor: "rgba(54, 162, 235, 1)",
    datasetLabel: "Valor USD",
    currency: true,
  });
}

// Sección Inscripciones
function renderInscripcionesCharts(inscripciones) {
  // Gráfico 1: Auspicios por Facultad
  const pubGroup = transformAndSortData(inscripciones, "Facultad", value => value.trim().toUpperCase());
  renderBarChart("inscripcionesFacultadChart", {
    title: 'Inscripciones por Facultad',
    xTitle: 'Facultad',
    yTitle: 'Número de Inscripciones',
    labels: pubGroup.labels,
    values: pubGroup.values,
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    borderColor: 'rgba(75, 192, 192, 1)',
    rotation: 0,
    datasetLabel: 'Inscripciones'
  });

  // Gráfico 2: Auspicios por Departamento
  const deptGroup = transformAndSortData(inscripciones, "Dpto.", value => value.trim().toUpperCase());
  renderBarChart("inscripcionesDptoChart", {
    title: 'Inscripciones por Departamento',
    xTitle: 'Departamento',
    yTitle: 'Número de Inscripciones',
    labels: deptGroup.labels,
    values: deptGroup.values,
    rotation: 0,
    datasetLabel: 'Inscripciones'
  });

  // Gráfico 3: Auspicios por tipo
  const tipoGroup = transformAndSortData(inscripciones, 'Tipo de salida', value => value.trim().toUpperCase());
  console.log(tipoGroup);
  renderBarChart("inscripcionesTipoChart", {
    title: 'Tipo de auspicio en Inscripciones',
    xTitle: 'Tipo de auspicio',
    yTitle: 'Número de Inscripciones',
    labels: tipoGroup.labels,
    values: tipoGroup.values,
    backgroundColor: ['rgba(255, 159, 64, 0.2)', 'rgba(75, 192, 192, 0.2)'],
    borderColor: ['rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)'],
    rotation: 0,
    datasetLabel: 'Inscripciones'
  });

  // Gráfico 4: Auspicios por Género
  const genderGroup = transformAndSortData(inscripciones, "Género", value => value.trim().toUpperCase());
  renderBarChart("inscripcionesGeneroChart", {
    title: 'Inscripciones por Género',
    xTitle: 'Género',
    yTitle: 'Número de Inscripciones',
    labels: ['Masculino', 'Femenino'],
    values: genderGroup.values,
    backgroundColor: ['rgba(64, 137, 255, 0.2)', 'rgba(192, 75, 169, 0.21)'],
    borderColor: ['rgb(67, 110, 254)', 'rgb(192, 43, 159)'],
    rotation: 0,
    datasetLabel: 'Inscripciones'
  });

  /**************************/
    // --- Gráfico 5: Inscripciones por Mes ---
  const conteoPorMes = Array(12).fill(0);
  inscripciones.forEach(pub => {
    let fechaRaw = String(pub["Fecha del informe"] || "");
    if (fechaRaw.includes("T")) fechaRaw = fechaRaw.split("T")[0];
    // Parseamos como fecha local para evitar desfase de huso horario
    const [anio, mes, dia] = fechaRaw.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia); // ← mes - 1 porque enero = 0
    if (isNaN(fecha)) {
      console.warn("⚠️ Fecha inválida:", pub["Fecha del informe"]);
      return;
    }
    const mesIndex = fecha.getMonth(); // 0 - enero, 1 - febrero, ...
    conteoPorMes[mesIndex]++;
  });
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  //Filtrar meses con al menos 1 publicación
  const paresFiltrados = conteoPorMes
    .map((valor, idx) => [idx, valor])
    .filter(([_, valor]) => valor > 0);
  const labelsMeses = paresFiltrados.map(([idx]) =>
    meses[idx].charAt(0).toUpperCase() + meses[idx].slice(1)
  );
  const valoresMeses = paresFiltrados.map(([_, valor]) => valor);
  renderBarChart("inscripcionesPorMesChart", {
    title: "Inscripciones por Mes",
    xTitle: "Mes",
    yTitle: "Número de Inscripciones",
    labels: labelsMeses,
    values: valoresMeses,
    backgroundColor: "rgba(255, 206, 86, 0.2)",
    borderColor: "rgba(255, 206, 86, 1)",
    datasetLabel: "Inscripciones"
  });

  // --- Gráfico 6: Monto total por Facultad ---
  const montoPorFacultad = {};
  inscripciones.forEach((pub) => {
    const facultad = pub["Facultad"]?.trim().toUpperCase();
    const valor = parseFloat(pub["Valor referencial DI"]) || 0;
    if (facultad) {
      montoPorFacultad[facultad] = (montoPorFacultad[facultad] || 0) + valor;
    }
  });
  const facLabels = Object.keys(montoPorFacultad);
  const facValores = facLabels.map(label => montoPorFacultad[label]);
  renderBarChart("inscripcionesMontoFacultadChart", {
    title: "Valor Referencial Total por Facultad",
    xTitle: "Facultad",
    yTitle: "Valor en USD",
    labels: facLabels,
    values: facValores,
    backgroundColor: "rgba(54, 162, 235, 0.2)",
    borderColor: "rgba(54, 162, 235, 1)",
    datasetLabel: "Valor USD",
    options: {
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 0 } },
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => "$" + value.toLocaleString()
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.y;
              return `${ctx.dataset.label}: $${v.toLocaleString()}`;
            }
          }
        }
      }
    }
  });

  // --- Gráfico 7: Monto total por Departmento ---
  const montoPorDepartamento = {};
  inscripciones.forEach((pub) => {
    const departamento = pub["Dpto."]?.trim().toUpperCase();
    const valor = parseFloat(pub["Valor referencial DI"]) || 0;
    if (departamento) {
      montoPorDepartamento[departamento] = (montoPorDepartamento[departamento] || 0) + valor;
    }
  });
  const dptoLabels = Object.keys(montoPorDepartamento);
  const dptoValores = dptoLabels.map(label => montoPorDepartamento[label]);
  renderBarChart("inscripcionesMontoDptoChart", {
    title: "Valor Referencial Total por Departamento",
    xTitle: "Facultad",
    yTitle: "Valor en USD",
    labels: dptoLabels,
    values: dptoValores,
    backgroundColor: "rgba(54, 162, 235, 0.2)",
    borderColor: "rgba(54, 162, 235, 1)",
    datasetLabel: "Valor USD",
    options: {
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 0 } },
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => "$" + value.toLocaleString()
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.y;
              return `${ctx.dataset.label}: $${v.toLocaleString()}`;
            }
          }
        }
      }
    }
  });

  // --- Gráfico 8: Monto total por Persona (horizontal) ---
  const montoPorPersona = {};
  inscripciones.forEach((pub) => {
    const nombreCompleto = pub["Apellidos y Nombres"]?.trim();
    const valor = parseFloat(pub["Valor referencial DI"]) || 0;
    if (nombreCompleto) {
      montoPorPersona[nombreCompleto] = (montoPorPersona[nombreCompleto] || 0) + valor;
    }
  });
  const personasOrdenadas = Object.entries(montoPorPersona)
    .sort((a, b) => b[1] - a[1]);
  const personasLabels = personasOrdenadas.map(entry => entry[0]);
  const personasValores = personasOrdenadas.map(entry => entry[1]);

  renderHorizontalBarChart("inscripcionesMontoPersonaChart", {
    title: "Valor Referencial por Persona",
    xTitle: "Valor en USD",
    yTitle: "Persona",
    labels: personasLabels,
    values: personasValores,
    backgroundColor: "rgba(255, 99, 132, 0.2)",
    borderColor: "rgba(255, 99, 132, 1)",
    datasetLabel: "Valor USD",
    currency: true,      // para formatear con $
  });

  // --- Gráfico 9: Monto total por mes (horizontal) ---
  const montoPorMes = {};
  inscripciones.forEach(pub => {
    const fechaStr = pub["Fecha del informe"];
    const valor = parseFloat(pub["Valor referencial DI"]) || 0;
    if (fechaStr) {
      const fecha = new Date(fechaStr);
      if (!isNaN(fecha)) {
        // Obtener mes en formato "Año-Mes" para evitar problemas de orden (e.g. "2025-06")
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        montoPorMes[mesKey] = (montoPorMes[mesKey] || 0) + valor;
      }
    }
  });
  const mesesOrdenados = Object.entries(montoPorMes).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  const mesesLabels = mesesOrdenados.map(([mes]) => {
    const [anio, mesNum] = mes.split('-');
    const fecha = new Date(anio, parseInt(mesNum, 10) - 1);
    return fecha.toLocaleDateString('es-ES', { month: 'short' });
  });
  const mesesValores = mesesOrdenados.map(entry => entry[1]);
  // Renderizamos gráfico vertical
  renderHorizontalBarChart("inscripcionesMontoMesChart", {
    title: "Valor Referencial Total por Mes",
    xTitle: "Monto en USD",
    yTitle: "Mes",
    labels: mesesLabels,
    values: mesesValores,
    backgroundColor: "rgba(54, 162, 235, 0.7)",
    borderColor: "rgba(54, 162, 235, 1)",
    datasetLabel: "Valor USD",
    currency: true,
  });
}

// Sección Salidas
function renderSalidasCharts(salidas) {
  const filteredSalidas = salidas;
  // Gráfico 1: Salidas por Facultad
  const groupFac = transformAndSortData(filteredSalidas, "Facultad", value => value.trim().toUpperCase());
  renderBarChart("salidasFacultadChart", {
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
  renderBarChart("salidasDptoChart", {
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
  renderBarChart("salidasPaisChart", {
    title: 'Salidas al exterior por País',
    xTitle: 'País',
    yTitle: 'Número de Salidas',
    labels: groupPais.labels,
    values: groupPais.values,
    //backgroundColor: 'rgba(255, 64, 147, 0.2)',
    //borderColor: 'rgb(255, 64, 109)',
    rotation: 0,
    datasetLabel: 'Salidas'
  });

  // Gráfico 4: Salidas por Género
  const genderGroup = transformAndSortData(filteredSalidas, "Género", value => value.trim().toUpperCase());
  renderBarChart("salidasGeneroChart", {
    title: 'Salidas al exterior por Género',
    xTitle: 'Género',
    yTitle: 'Número de Salidas',
    labels: ['Masculino', 'Femenino'],
    values: genderGroup.values,
    backgroundColor: ['rgba(64, 137, 255, 0.2)', 'rgba(192, 75, 169, 0.21)'],
    borderColor: ['rgb(67, 110, 254)', 'rgb(192, 43, 159)'],
    rotation: 0,
    datasetLabel: 'Salidas'
  });
}

// Sección Apoyo Económico
function renderApoyoCharts(apoyo) {
  // Gráfico 1: Apoyo Económico por Facultad
  const groupApoyo = transformAndSortData(apoyo, "Facultad", value => value.trim().toUpperCase());
  renderBarChart("apoyoFacultadChart", {
    title: 'Apoyo Económico por Facultad',
    xTitle: 'Facultad',
    yTitle: 'Número de Apoyos',
    labels: groupApoyo.labels,
    values: groupApoyo.values,
    backgroundColor: 'rgba(153, 102, 255, 0.2)',
    borderColor: 'rgba(153, 102, 255, 1)',
    rotation: 0,
    datasetLabel: 'Apoyo Económico'
  });

  // Gráfico 2: Apoyo Económico por Departamento
  const groupDpto = transformAndSortData(apoyo, "Dpto.", value => value.trim().toUpperCase());
  renderBarChart("apoyoDptoChart", {
    title: 'Apoyo Económico por Departamento',
    xTitle: 'Departamento',
    yTitle: 'Número de Apoyos',
    labels: groupDpto.labels,
    values: groupDpto.values,
    backgroundColor: 'rgba(67, 64, 255, 0.2)',
    borderColor: 'rgb(93, 64, 255)',
    rotation: 0,
    datasetLabel: 'Apoyo Económico'
  });

  // Gráfico 3: Apoyo Económico por País
  const groupPais = transformAndSortData(apoyo, "País del evento", value => value.trim().toUpperCase());
  renderBarChart("apoyoPaisChart", {
    title: 'Apoyo Económico por País',
    xTitle: 'País',
    yTitle: 'Número de Apoyos',
    labels: groupPais.labels,
    values: groupPais.values,
    //backgroundColor: 'rgba(255, 64, 147, 0.2)',
    //borderColor: 'rgb(255, 64, 109)',
    rotation: 0,
    datasetLabel: 'Apoyo Económico'
  });

  // Gráfico 4: Apoyo Económico por Género
  const genderGroup = transformAndSortData(apoyo, "Género", value => value.trim().toUpperCase());
  renderBarChart("apoyoGeneroChart", {
    title: 'Apoyo Económico por Género',
    xTitle: 'Género',
    yTitle: 'Número de Apoyos',
    labels: ['Masculino', 'Femenino'],
    values: genderGroup.values,
    backgroundColor: ['rgba(64, 137, 255, 0.2)', 'rgba(192, 75, 169, 0.21)'],
    borderColor: ['rgb(67, 110, 254)', 'rgb(192, 43, 159)'],
    rotation: 0,
    datasetLabel: 'Apoyo Económico'
  });
}

// Sección Salidas Nacionales
function renderSalidasNacionalesCharts(salidasNacionales) {
  const groupApoyo = transformAndSortData(salidasNacionales, "Facultad", value => value.trim().toUpperCase());
  renderBarChart("salidasNacionalesFacultadChart", {
    title: 'Salidas Nacionales por Facultad',
    xTitle: 'Facultad',
    yTitle: 'Número de Salidas',
    labels: groupApoyo.labels,
    values: groupApoyo.values,
    backgroundColor: 'rgba(153, 102, 255, 0.2)',
    borderColor: 'rgba(153, 102, 255, 1)',
    rotation: 0,
    datasetLabel: 'Salidas Nacionales'
  });

  // Gráfico 2: Salidas Nacionales por Departamento
  const groupDpto = transformAndSortData(salidasNacionales, "Dpto.", value => value.trim().toUpperCase());
  renderBarChart("salidasNacionalesDptoChart", {
    title: 'Salidas Nacionales por Departamento',
    xTitle: 'Departamento',
    yTitle: 'Número de Salidas',
    labels: groupDpto.labels,
    values: groupDpto.values,
    backgroundColor: 'rgba(67, 64, 255, 0.2)',
    borderColor: 'rgb(93, 64, 255)',
    rotation: 0,
    datasetLabel: 'Salidas Nacionales'
  });

  // Gráfico 3: Salidas Nacionales por Ciudad
  const groupPais = transformAndSortData(salidasNacionales, "Ciudad del evento", value => value.trim().toUpperCase());
  renderBarChart("salidasNacionalesCiudadChart", {
    title: 'Salidas Nacionales por Ciudad',
    xTitle: 'Ciudad',
    yTitle: 'Número de Salidas',
    labels: groupPais.labels,
    values: groupPais.values,
    //backgroundColor: 'rgba(255, 64, 147, 0.2)',
    //borderColor: 'rgb(255, 64, 109)',
    rotation: 0,
    datasetLabel: 'Salidas Nacionales'
  });

  // Gráfico 4: Salidas Nacionales por Género
  const genderGroup = transformAndSortData(salidasNacionales, "Género", value => value.trim().toUpperCase());
  renderBarChart("salidasNacionalesGeneroChart", {
    title: 'Salidas Nacionales por Género',
    xTitle: 'Género',
    yTitle: 'Número de Salidas',
    labels: ['Masculino', 'Femenino'],
    values: genderGroup.values,
    backgroundColor: ['rgba(64, 137, 255, 0.2)', 'rgba(192, 75, 169, 0.21)'],
    borderColor: ['rgb(67, 110, 254)', 'rgb(192, 43, 159)'],
    rotation: 0,
    datasetLabel: 'Salidas Nacionales'
  });
}

// Sección Resumen
function renderResumenTabla(publicaciones, inscripciones) {
  const container = document.getElementById("resumenContainer");
  container.innerHTML = ""; // Limpiar contenido previo

  function construirResumen(campo) {
    const resumen = {};

    inscripciones.forEach((item) => {
      const key = item[campo]?.trim().toUpperCase();
      const valor = parseFloat(item["Valor referencial DI"]) || 0;
      if (!resumen[key]) resumen[key] = { inscCount: 0, inscValor: 0, pubCount: 0, pubValor: 0 };
      resumen[key].inscCount += 1;
      resumen[key].inscValor += valor;
    });

    publicaciones.forEach((item) => {
      const key = item[campo]?.trim().toUpperCase();
      const valor = parseFloat(item["Valor referencial DI"]) || 0;
      if (!resumen[key]) resumen[key] = { inscCount: 0, inscValor: 0, pubCount: 0, pubValor: 0 };
      resumen[key].pubCount += 1;
      resumen[key].pubValor += valor;
    });

    return Object.entries(resumen)
      .map(([key, datos]) => ({
        key,
        ...datos,
        total: datos.inscValor + datos.pubValor
      }))
      .sort((a, b) => b.total - a.total); // Orden descendente
  }

  function crearTabla(data, labelColumna) {
    const table = document.createElement("table");
    table.className = "resumen-table";

    table.innerHTML += `
      <thead>
        <tr>
          <th>${labelColumna}</th>
          <th>INSCRIPCIONES</th>
          <th>MONTO</th>
          <th>PUBLICACIONES</th>
          <th>MONTO</th>
          <th>TOTAL</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    data.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.key}</td>
        <td>${row.inscCount}</td>
        <td>$${row.inscValor.toFixed(2)}</td>
        <td>${row.pubCount}</td>
        <td>$${row.pubValor.toFixed(2)}</td>
        <td><strong>$${row.total.toFixed(2)}</strong></td>
      `;
      tbody.appendChild(tr);
    });

    container.appendChild(table);
  }

  // Construir y mostrar tablas ordenadas
  const resumenFacultad = construirResumen("Facultad");
  const resumenDepartamento = construirResumen("Dpto.");

  const title = document.createElement("h3");
  title.textContent = "Resumen por Facultad";
  container.appendChild(title);

  crearTabla(resumenFacultad, "FACULTAD");
  const title2 = document.createElement("h3");
  title2.textContent = "Resumen por Departamento";
  container.appendChild(title2);
  crearTabla(resumenDepartamento, "DEPARTAMENTO");
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
function transformAndSortData(data, key, normalizeFn, getValueFn = () => 1) {
  const result = {};
  data.forEach(item => {
    const rawKey = item[key];
    if (!rawKey) return;
    const normalized = normalizeFn(rawKey);
    const value = getValueFn(item);
    result[normalized] = (result[normalized] || 0) + value;
  });
  const labels = Object.keys(result);
  const sortedLabels = labels.sort((a, b) => result[b] - result[a]);
  const sortedValues = sortedLabels.map(label => result[label]);
  console.log(sortedLabels, sortedValues);
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

function countByGender(data) {
  const genderCount = { M: 0, F: 0 };
  data.forEach(item => {
    const gender = item["Género"];
    if (gender === "M" || gender === "F") {
      genderCount[gender]++;
    }
  });
  return genderCount;
}

// Función para cambiar de año
function changeYear(year) {
  selectedYear = year;
  renderCharts();
}

// Función para renderizar el gráfico de barras
function renderBarChart(canvasId, config) {
  console.log("Renderizando gráfico:", canvasId, config);
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`Canvas '${canvasId}' no encontrado.`);
    return;
  }
  const ctx = canvas.getContext("2d");

  // Destruye instancia previa si existe
  const existingChart = Chart.getChart(canvas);
  if (existingChart) existingChart.destroy();

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

function renderHorizontalBarChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return console.warn(`Canvas '${canvasId}' no encontrado.`);
  const ctx = canvas.getContext("2d");

  // Destruye instancia previa si existe
  Chart.getChart(canvas)?.destroy();

  // 1. Calcula altura del canvas en función del número de etiquetas
  const alturaPorFila = 30;
  const alturaMin = 300;
  const alturaMax = 800;
  const alturaCalculada = Math.max(
    Math.min(config.labels.length * alturaPorFila, alturaMax),
    alturaMin
  );

  // 2. Estilos del canvas
  canvas.style.width = "100%";
  canvas.style.height = `${alturaCalculada}px`;
  canvas.style.display = "block";
  canvas.style.padding = "0";
  canvas.style.margin = "0";

  // 3. Estilos del contenedor para evitar espacio en blanco
  const cont = canvas.parentElement;
  if (cont) {
    cont.style.padding = "0";
    cont.style.margin = "0";
    cont.style.overflow = "hidden";
  }

  // 4. Escalado para nitidez
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = alturaCalculada * dpr;
  ctx.scale(dpr, dpr);

  // 5. Genera etiquetas abreviadas para el eje Y
  const abreviar = label => {
    const partes = label.trim().split(/\s+/);
    const apellido = partes[0] || "";
    const nombre = partes[2] || partes[1] || "";
    return `${apellido} ${nombre}`;
  };
  const labelsY = config.labels.map(abreviar);

  // 6. Renderiza el gráfico
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labelsY,
      datasets: [{
        label: config.datasetLabel,
        data: config.values,
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
        borderWidth: config.borderWidth || 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: config.title,
          font: { size: 16, weight: 'bold' },
          padding: { bottom: 10 }
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => {
              const idx = items[0].dataIndex;
              return config.labels[idx]; // nombre completo
            },
            label: ctx => {
              const v = ctx.parsed.x;
              return `${config.datasetLabel}: ${config.currency ? '$' : ''}${v.toLocaleString()}`;
            }
          }
        },
        datalabels: {
          color: 'black',
          anchor: 'end',
          align: 'right',
          formatter: val => config.currency ? `$${val.toLocaleString()}` : val
        }
      },
      scales: {
        x: {
          title: { display: true, text: config.xTitle, font: { weight: 'bold' } },
          beginAtZero: true,
          ticks: {
            callback: v => config.currency ? `$${v.toLocaleString()}` : v
          }
        },
        y: {
          title: { display: true, text: config.yTitle, font: { weight: 'bold' } },
          ticks: {
            autoSkip: false,
            font: { size: 12 },
            maxRotation: 0,
            minRotation: 0
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
