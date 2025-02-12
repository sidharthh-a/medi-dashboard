document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "http://127.0.0.1:5000/predict"; // Your Flask API
    let tableBody = document.getElementById("table-body");
    let drugFilter = document.getElementById("drug-filter");
    let chartContainer = document.getElementById("chart-container");
    let toggleChartsButton = document.getElementById("toggle-charts");
    let toggleLegendButton = document.getElementById("toggle-legend");
    let legendContainer = document.getElementById("legend-container");
    let legendList = document.getElementById("legend-list");
    let spendingChart, barChart, pieChart;

    chartContainer.style.display = "none"; // Hide charts initially
    legendContainer.style.display = "none"; // Hide legend initially

    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            let labels = []; // Years
            let datasets = []; // Drug spending data
            let totalSpendingData = {}; // Data for pie chart
            let legendItems = [];

            Object.keys(data).forEach((drug, index) => {
                let years = data[drug].years;
                let totalSpending = data[drug].total_spending;
                let color = getRandomColor();
                
                if (index === 0) labels = years; // Set years only once
                
                // Populate Table
                years.forEach((year, i) => {
                    let row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${drug}</td>
                        <td>${year}</td>
                        <td>$${totalSpending[i].toFixed(2)}</td>
                        <td>$${data[drug].avg_spending[i].toFixed(2)}</td>
                    `;
                    tableBody.appendChild(row);
                });

                // Add dataset for Line & Bar Charts
                datasets.push({
                    label: drug,
                    data: totalSpending,
                    borderColor: color,
                    backgroundColor: color,
                    fill: false,
                    borderWidth: 3,
                    pointRadius: 5
                });

                // Populate Filter Dropdown
                let option = document.createElement("option");
                option.value = drug;
                option.textContent = drug;
                drugFilter.appendChild(option);

                // Aggregate data for Pie Chart
                totalSpendingData[drug] = totalSpending.reduce((a, b) => a + b, 0);

                // Create Legend Item
                legendItems.push(`<li style="color: ${color};">${drug}</li>`);
            });

            // Toggle charts visibility
            toggleChartsButton.addEventListener("click", function () {
                if (chartContainer.style.display === "none") {
                    chartContainer.style.display = "block";
                    renderLineChart(labels, datasets);
                    renderBarChart(labels, datasets);
                    renderPieChart(totalSpendingData);
                    toggleChartsButton.textContent = "Hide Charts";
                } else {
                    chartContainer.style.display = "none";
                    toggleChartsButton.textContent = "Show Charts";
                }
            });

            // Toggle legend visibility inside chart container
            let legendButton = document.createElement("button");
            legendButton.textContent = "Show More";
            legendButton.id = "chart-legend-toggle";
            chartContainer.appendChild(legendButton);
            chartContainer.appendChild(legendContainer);

            legendButton.addEventListener("click", function () {
                if (legendContainer.style.display === "none") {
                    legendContainer.style.display = "block";
                    legendList.innerHTML = legendItems.join(" ");
                    legendButton.textContent = "Hide More";
                } else {
                    legendContainer.style.display = "none";
                    legendButton.textContent = "Show More";
                }
            });

            // Filter Functionality
            drugFilter.addEventListener("change", function () {
                filterTable(this.value);
            });
        })
        .catch(error => console.error("Error fetching data:", error));

    function renderLineChart(labels, datasets) {
        let ctx = document.getElementById("spendingChart").getContext("2d");
        spendingChart = new Chart(ctx, {
            type: "line",
            data: { labels: labels, datasets: datasets },
            options: { responsive: true, scales: { y: { title: { display: true, text: "Total Spending ($)" } } } }
        });
    }

    function renderBarChart(labels, datasets) {
        let ctx = document.getElementById("barChart").getContext("2d");
        barChart = new Chart(ctx, {
            type: "bar",
            data: { labels: labels, datasets: datasets },
            options: { responsive: true, scales: { y: { title: { display: true, text: "Total Spending ($)" } } } }
        });
    }

    function renderPieChart(data) {
        let ctx = document.getElementById("pieChart").getContext("2d");
        pieChart = new Chart(ctx, {
            type: "pie",
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: Object.keys(data).map(() => getRandomColor())
                }]
            },
            options: { responsive: true }
        });
    }

    function filterTable(selectedDrug) {
        let rows = tableBody.getElementsByTagName("tr");
        for (let row of rows) {
            let drugName = row.cells[0].textContent;
            row.style.display = (selectedDrug === "all" || drugName === selectedDrug) ? "" : "none";
        }
    }

    function getRandomColor() {
        return `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`;
    }
});
    