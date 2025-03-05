fetch('https://script.google.com/macros/s/AKfycbw2YLz63oPa35m2yal4gMdpUwMd6ls5q9PYLG3XBnj7nY6aQC90oayNaKMkrTcO8dPl/exec')
  .then(response => response.json())
  .then(data => {
    // Gráfico de Distribución por Facultad
    const facultadData = countBy(data, 'Facultad');
    let facultadLabels = Object.keys(facultadData);
    let facultadValues = Object.values(facultadData);
    console.log(facultadLabels);

    // Combina labels y values en un array de objetos para facilitar la ordenación
    const facultadDataArray = facultadLabels.map((label, index) => {
        return { label: label, value: facultadValues[index] };
    });
    
    // Ordena el array por los valores (número de proyectos) de mayor a menor
    facultadDataArray.sort((a, b) => b.value - a.value);  // De mayor a menor
    
    // Extrae las etiquetas y los valores ordenados
    facultadLabels = facultadDataArray.map(item => item.label);
    facultadValues = facultadDataArray.map(item => item.value);

    const facultadChart = new Chart(document.getElementById('facultadChart'), {
      type: 'bar',
      data: {
        labels: facultadLabels,
        datasets: [{
          label: 'Auspicios por Facultad',
          data: facultadValues,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
              title: {
                display: true,
                text: 'Número de proyectos'
              },
              beginAtZero: true,
              ticks: {
                // Asegúrate de que los valores se muestren correctamente sin duplicarse
                stepSize: 1,  // Asegura que los pasos en el eje Y sean enteros
                callback: function(value) {
                  // Elimina comas y asegúrate de que los números se muestran como enteros
                  return value % 1 === 0 ? value : Math.round(value);  // Si el número tiene decimales, lo redondea
                }
              }
            },
            x:{
                ticks: {
                    callback: function(value, index, ticks) {
                        // Accede al label original usando el índice
                        let label = facultadLabels[index];
                        label = label.replace(/FACULTAD DE\s*/gi, '').trim();
                        // Si el label es muy largo, lo trunca
                        return label && label.length > 20 ? label.substring(0, 20) + "..." : label;
                      },
                      minRotation: 25
                },
                title:{
                    display: true,
                    text: 'Facultad'
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: 'Número de auspicios por Facultad',
                font:{
                    size: 16
                }
            }            
        }
      }
    });
    facultadChart.update();

    // Gráfico de Distribución por Departamento
    const departamentoData = countBy(data, 'Dpto.');
    const departamentoLabels = Object.keys(departamentoData);
    const departamentoValues = Object.values(departamentoData);

    new Chart(document.getElementById('departamentoChart'), {
      type: 'bar',
      data: {
        labels: departamentoLabels,
        datasets: [{
          label: 'Proyectos por Departamento',
          data: departamentoValues,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }]
      }
    });

    // Gráfico de Artículos en Cuartiles Q1 y Q2
    const cuartilesQ1Q2 = data.filter(item => item.Quartil === 'Q1' || item.Quartil === 'Q2');
    const cuartilesCount = countBy(cuartilesQ1Q2, 'Quartil');
    const cuartilesLabels = Object.keys(cuartilesCount);
    const cuartilesValues = Object.values(cuartilesCount);

    new Chart(document.getElementById('cuartilesChart'), {
      type: 'bar',
      data: {
        labels: cuartilesLabels,
        datasets: [{
          label: 'Cantidad de Artículos en Q1 y Q2',
          data: cuartilesValues,
          backgroundColor: ['rgba(255, 159, 64, 0.2)', 'rgba(75, 192, 192, 0.2)'],
          borderColor: ['rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)'],
          borderWidth: 1
        }]
      }
    });
  })
  .catch(error => console.error('Error al obtener los datos:', error));

// Función para contar ocurrencias de una propiedad
function countBy(array, key) {
  return array.reduce(function (result, item) {
    if (!result[item[key]]) {
      result[item[key]] = 0; // Si no existe la clave, inicializa en 0
    }
    result[item[key]]++; // Incrementa el conteo correctamente
    return result;
  }, {});
}

