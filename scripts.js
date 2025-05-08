document.addEventListener('DOMContentLoaded', function() {
    // Globális változók
    let exchangeData = {
        dates: [],
        eur: [],
        usd: [],
        ron: [], // D oszlop - Változás EUR-RON (%)
        huf: [], // E oszlop - Változás USD-RON (%)
        ext: [],  // F oszlop - EUR-RON/USD-RON arány
        g: []     // G oszlop - További adatok
    };
    
    // Diagram inicializálása
    const chartArea = document.getElementById('chartArea');
    const zoomInstructions = document.getElementById('zoomInstructions');
    let currentChart = null;
    let currentChartType = 'chart1'; // Az aktuális diagram típusa
    
    // Excel fájl automatikus betöltése
    function loadExcelFile() {
        fetch('Árfolyamadatok.xlsx')
            .then(response => response.arrayBuffer())
            .then(data => {
                try {
                    const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
                    
                    // Az első munkalap olvasása
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    
                    // A nyers adatokat olvassuk ki oszlopok szerint (A, B, C, D, E, F, G)
                    processExcelDataByColumns(firstSheet);
                    
                    // Első diagram megjelenítése
                    createExchangeRateChart();
                    
                    // Gombra kattintás eseménykezelők aktiválása
                    activateChartButtons();
                    
                } catch (error) {
                    console.error('Hiba történt a fájl beolvasása közben:', error);
                    chartArea.innerHTML = '<div class="loading">Hiba történt a fájl beolvasása közben!</div>';
                }
            })
            .catch(error => {
                console.error('Hiba történt a fájl betöltése közben:', error);
                chartArea.innerHTML = '<div class="loading">Hiba történt a fájl betöltése közben!</div>';
            });
    }
    
    // Excel adatok feldolgozása oszlopok szerint (A, B, C, D, E, F, G)
    function processExcelDataByColumns(worksheet) {
        // Adatok törlése
        exchangeData = {
            dates: [],
            eur: [],
            usd: [],
            ron: [], // D oszlop - Változás EUR-RON (%)
            huf: [], // E oszlop - Változás USD-RON (%)
            ext: [],  // F oszlop - EUR-RON/USD-RON arány
            g: []     // G oszlop - További adatok
        };
        
        // Maximális sor meghatározása
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const maxRow = range.e.r;
        
        // Az adatokat az A, B, C, D, E, F, G oszlopokból olvassuk ki
        for (let i = 1; i <= maxRow; i++) { // 1-től kezdjük, feltételezve hogy az első sor fejléc
            // Az A oszlop (0-ás index) - dátumok
            const cellA = worksheet[XLSX.utils.encode_cell({r: i, c: 0})];
            // A B oszlop (1-es index) - EUR-RON értékek
            const cellB = worksheet[XLSX.utils.encode_cell({r: i, c: 1})];
            // A C oszlop (2-es index) - USD-RON értékek
            const cellC = worksheet[XLSX.utils.encode_cell({r: i, c: 2})];
            // A D oszlop (3-as index) - Változás EUR-RON (%)
            const cellD = worksheet[XLSX.utils.encode_cell({r: i, c: 3})];
            // Az E oszlop (4-es index) - Változás USD-RON (%)
            const cellE = worksheet[XLSX.utils.encode_cell({r: i, c: 4})];
            // Az F oszlop (5-ös index) - EUR-RON/USD-RON arány
            const cellF = worksheet[XLSX.utils.encode_cell({r: i, c: 5})];
            // A G oszlop (6-os index) - További adatok
            const cellG = worksheet[XLSX.utils.encode_cell({r: i, c: 6})];
            
            // Ha nincs adat az adott sorban, akkor átugorjuk
            if (!cellA) continue;
            
            // Dátum formázott értékének használata közvetlenül az A oszlopból
            // Előnyben részesítjük a cellA.w értéket (formázott szöveg), ha létezik
            let dateValue = cellA.w || cellA.v;
            
            // Ha nincs értékelhető adat, átugorjuk
            if (dateValue === undefined || dateValue === null) {
                continue;
            }
            
            // Dátum hozzáadása az adatokhoz közvetlenül az A oszlopból (konvertálás nélkül)
            exchangeData.dates.push(String(dateValue));
            
            // B, C, D, E, F és G oszlop adatai, ha vannak
            exchangeData.eur.push(cellB ? parseFloat(cellB.v) || 0 : 0);
            exchangeData.usd.push(cellC ? parseFloat(cellC.v) || 0 : 0);
            
            // A D és E oszlop értékeit már százalékos formában tároljuk (pl. 0.01 → 1)
            exchangeData.ron.push(cellD ? parseFloat(cellD.v) * 100 || 0 : 0);
            exchangeData.huf.push(cellE ? parseFloat(cellE.v) * 100 || 0 : 0);
            
            // Az F oszlop adatai már százalékos formában (EUR-RON/USD-RON arány)
            exchangeData.ext.push(cellF ? parseFloat(cellF.v) * 100 || 0 : 0);
            
            // A G oszlop adatai szintén százalékos formában
            exchangeData.g.push(cellG ? parseFloat(cellG.v) * 100 || 0 : 0);
        }
        
        console.log('Betöltött adatok:', exchangeData);
    }
    
    // Váltó gombok eseménykezelőinek aktiválása
    function activateChartButtons() {
        const chartButtons = document.querySelectorAll('.chart-btn');
        
        chartButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Aktív gomb kiemelése
                chartButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Megfelelő diagram megjelenítése
                currentChartType = this.getAttribute('data-chart');
                
                if (currentChartType === 'chart1') {
                    createExchangeRateChart();
                    zoomInstructions.style.display = 'block';
                } else if (currentChartType === 'chart2') {
                    createSecondChart();
                    zoomInstructions.style.display = 'block';
                } else if (currentChartType === 'chart3') {
                    createBubbleChart();
                    zoomInstructions.style.display = 'none';
                } else if (currentChartType === 'chart4') {
                    createFourthChart();
                    zoomInstructions.style.display = 'block';
                }
            });
        });
    }
    
    // EUR-RON és USD-RON árfolyam diagram létrehozása (1. diagram)
    function createExchangeRateChart() {
        if (currentChart) {
            currentChart.destroy();
        }
        
        chartArea.innerHTML = '<canvas id="exchangeRateChart"></canvas>';
        const ctx = document.getElementById('exchangeRateChart').getContext('2d');
        
        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: exchangeData.dates,
                datasets: [
                    {
                        label: 'EUR-RON',
                        data: exchangeData.eur,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.2
                    },
                    {
                        label: 'USD-RON',
                        data: exchangeData.usd,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'EUR-RON és USD-RON árfolyam 2021.04.26 - 2025.04.24 között',
                        font: {
                            size: 18
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    },
                    // Zoom plugin beállítása
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x'
                        },
                        zoom: {
                            wheel: {
                                enabled: true
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                            drag: {
                                enabled: true,
                                backgroundColor: 'rgba(54, 162, 235, 0.2)'
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Dátum'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            maxTicksLimit: 15
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Árfolyam értékek'
                        },
                        ticks: {
                            stepSize: 0.2
                        }
                    }
                }
            }
        });
        
        // Zoom instrukciók megjelenítése
        zoomInstructions.style.display = 'block';
    }
    
    // Második diagram létrehozása a D és E oszlopok adataival
    function createSecondChart() {
        if (currentChart) {
            currentChart.destroy();
        }
        
        chartArea.innerHTML = '<canvas id="secondChart"></canvas>';
        const ctx = document.getElementById('secondChart').getContext('2d');
        
        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: exchangeData.dates,
                datasets: [
                    {
                        label: 'Változás EUR-RON (%)',
                        data: exchangeData.ron,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.2
                    },
                    {
                        label: 'Változás USD-RON (%)',
                        data: exchangeData.huf,
                        borderColor: 'rgb(153, 102, 255)',
                        backgroundColor: 'rgba(153, 102, 255, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Változás EUR-RON és USD-RON (%)',
                        font: {
                            size: 18
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(2) + '%';
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    },
                    // Zoom plugin beállítása
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x'
                        },
                        zoom: {
                            wheel: {
                                enabled: true
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                            drag: {
                                enabled: true,
                                backgroundColor: 'rgba(75, 192, 192, 0.2)'
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Dátum'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            maxTicksLimit: 15
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Változás (%)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        
        // Zoom instrukciók megjelenítése
        zoomInstructions.style.display = 'block';
    }
    
    // Negyedik diagram: F és G oszlop adatai százalékos formában
    function createFourthChart() {
        if (currentChart) {
            currentChart.destroy();
        }
        
        chartArea.innerHTML = '<canvas id="fourthChart"></canvas>';
        const ctx = document.getElementById('fourthChart').getContext('2d');
        
        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: exchangeData.dates,
                datasets: [
                    {
                        label: 'EUR-RON/USD-RON arány (%)',
                        data: exchangeData.ext,
                        borderColor: 'rgb(255, 159, 64)',
                        backgroundColor: 'rgba(255, 159, 64, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.2
                    },
                    {
                        label: ' USD-RON / EUR-RON arány (%)',
                        data: exchangeData.g,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'EUR-RON / USD-RON arány idő függvényben',
                        font: {
                            size: 18
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(2) + '%';
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    },
                    // Zoom plugin beállítása
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x'
                        },
                        zoom: {
                            wheel: {
                                enabled: true
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                            drag: {
                                enabled: true,
                                backgroundColor: 'rgba(255, 159, 64, 0.2)'
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Dátum'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            maxTicksLimit: 15
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'EUR-RON / USD-RON arány'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        
        // Zoom instrukciók megjelenítése
        zoomInstructions.style.display = 'block';
    }
    
    // Harmadik diagram: Bubble chart a kiugró értékekhez
    function createBubbleChart() {
        if (currentChart) {
            currentChart.destroy();
        }
        
        chartArea.innerHTML = '<canvas id="bubbleChart"></canvas>';
        const ctx = document.getElementById('bubbleChart').getContext('2d');
        
        // Adatok előkészítése a bubble charthoz
        const bubbleData = prepareBubbleData();
        
        // Dátum skála létrehozása
        const dateLabels = createDateScale();
        
        currentChart = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [
                    {
                        label: 'Pozitív EUR-RON változás (TOP 5)',
                        data: bubbleData.eurPositive,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1
                    },
                    {
                        label: 'Negatív EUR-RON változás (TOP 5)',
                        data: bubbleData.eurNegative,
                        backgroundColor: 'rgba(152, 223, 138, 0.7)', // Zöld
                        borderColor: 'rgb(152, 223, 138)',
                        borderWidth: 1
                    },
                    {
                        label: 'Pozitív USD-RON változás (TOP 5)',
                        data: bubbleData.usdPositive,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)', // Piros
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1
                    },
                    {
                        label: 'Negatív USD-RON változás (TOP 5)',
                        data: bubbleData.usdNegative,
                        backgroundColor: 'rgba(255, 187, 120, 0.7)', // Sárga
                        borderColor: 'rgb(255, 187, 120)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'TOP 5 legnagyobb árfolyamváltozás kategóriánként',
                        font: {
                            size: 18
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += '\n';
                                }
                                label += `Dátum: ${point.dateLabel}`;
                                label += `\nÉrték: ${point.y.toFixed(2)}%`;
                                label += `\nAbszolút változás: ${point.absValue.toFixed(2)}%`;
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: exchangeData.dates.length - 1,
                        title: {
                            display: true,
                            text: 'Időrendi sorrend (' + exchangeData.dates[0] + ' - ' + exchangeData.dates[exchangeData.dates.length - 1] + ')'
                        },
                        ticks: {
                            callback: function(value) {
                                // Első és utolsó dátum mindenképpen megjelenítése, valamint köztes dátumok
                                if (value === 0 || value === exchangeData.dates.length - 1) {
                                    return exchangeData.dates[value];
                                }
                                // Köztes dátumok megjelenítése
                                if (value % Math.ceil(exchangeData.dates.length / 20) === 0 && value < exchangeData.dates.length) {
                                    return exchangeData.dates[value];
                                }
                                return '';
                            },
                            maxRotation: 90,  // Függőlegesebb címkék, hogy ne fedjenek át
                            minRotation: 45,
                            font: {
                                size: 10  // Kisebb betűméret a dátumcímkékhez
                            }
                        }
                    },
                    y: {
                        display: true,
                        min: -2,  // Beállítjuk a minimális értéket
                        max: 2,   // Beállítjuk a maximális értéket
                        title: {
                            display: true,
                            text: 'Változás (%)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        
        // Harmadik diagramnál nincs zoom, ezért elrejtjük az instrukciókat
        zoomInstructions.style.display = 'none';
    }
    
    // Dátum skála létrehozása a diagramhoz
    function createDateScale() {
        // Kiválasztunk releváns dátumokat az időskálához
        const dateLabels = {};
        
        // Az első és utolsó dátum mindenképpen kerüljön bele
        dateLabels[0] = exchangeData.dates[0];
        dateLabels[exchangeData.dates.length - 1] = exchangeData.dates[exchangeData.dates.length - 1];
        
        // Köztes dátumok megjelenítése a tengelyen
        const step = Math.ceil(exchangeData.dates.length / 20);
        
        for (let i = step; i < exchangeData.dates.length - 1; i += step) {
            if (i < exchangeData.dates.length) {
                dateLabels[i] = exchangeData.dates[i];
            }
        }
        
        return dateLabels;
    }
    
    // Adatok előkészítése a bubble charthoz
    function prepareBubbleData() {
        let eurPositive = [];
        let eurNegative = [];
        let usdPositive = [];
        let usdNegative = [];
        
        // Ideiglenes tömbök a teljes adatkészlethez kategóriánként
        const allEurPositive = [];
        const allEurNegative = [];
        const allUsdPositive = [];
        const allUsdNegative = [];
        
        // Küszöbérték a kiugró értékek meghatározásához
        const thresholdPercent = 0.1;
        
        // Meghatározzuk a legnagyobb abszolút értéket a buborék méretezéshez
        let maxAbsValue = 0;
        for (let i = 0; i < exchangeData.dates.length; i++) {
            const eurValue = exchangeData.ron[i];
            const usdValue = exchangeData.huf[i];
            
            maxAbsValue = Math.max(maxAbsValue, Math.abs(eurValue), Math.abs(usdValue));
        }
        
        // A buborék méretezés maximuma
        const maxBubbleSize = 50;
        
        // Végigmegyünk az adatokon és kategóriákba soroljuk az értékeket
        for (let i = 0; i < exchangeData.dates.length; i++) {
            const eurValue = exchangeData.ron[i];
            const usdValue = exchangeData.huf[i];
            
            // EUR-RON értékek
            if (Math.abs(eurValue) >= thresholdPercent) {
                const bubbleSize = Math.pow(Math.abs(eurValue) / maxAbsValue, 0.5) * maxBubbleSize;
                
                const dataPoint = {
                    x: i,
                    y: eurValue,
                    r: bubbleSize + 10, // Minimum méret + dinamikus méret
                    dateLabel: exchangeData.dates[i],
                    absValue: Math.abs(eurValue)
                };
                
                if (eurValue >= 0) {
                    allEurPositive.push(dataPoint);
                } else {
                    allEurNegative.push(dataPoint);
                }
            }
            
            // USD-RON értékek
            if (Math.abs(usdValue) >= thresholdPercent) {
                const bubbleSize = Math.pow(Math.abs(usdValue) / maxAbsValue, 0.5) * maxBubbleSize;
                
                const dataPoint = {
                    x: i,
                    y: usdValue,
                    r: bubbleSize + 10, // Minimum méret + dinamikus méret
                    dateLabel: exchangeData.dates[i],
                    absValue: Math.abs(usdValue)
                };
                
                if (usdValue >= 0) {
                    allUsdPositive.push(dataPoint);
                } else {
                    allUsdNegative.push(dataPoint);
                }
            }
        }
        
        // Rendezzük az értékeket abszolút értékük szerint csökkenő sorrendben
        allEurPositive.sort((a, b) => b.absValue - a.absValue);
        allEurNegative.sort((a, b) => b.absValue - a.absValue);
        allUsdPositive.sort((a, b) => b.absValue - a.absValue);
        allUsdNegative.sort((a, b) => b.absValue - a.absValue);
        
        // Kiválasztjuk az 5 legnagyobb értéket minden kategóriában
        eurPositive = allEurPositive.slice(0, 5);
        eurNegative = allEurNegative.slice(0, 5);
        usdPositive = allUsdPositive.slice(0, 5);
        usdNegative = allUsdNegative.slice(0, 5);
        
        console.log("Az 5 legnagyobb pozitív EUR-RON változás:", eurPositive);
        console.log("Az 5 legnagyobb negatív EUR-RON változás:", eurNegative);
        console.log("Az 5 legnagyobb pozitív USD-RON változás:", usdPositive);
        console.log("Az 5 legnagyobb negatív USD-RON változás:", usdNegative);
        
        return {
            eurPositive,
            eurNegative,
            usdPositive,
            usdNegative
        };
    }
    
    // Automatikus betöltés indítása
    loadExcelFile();
}); 