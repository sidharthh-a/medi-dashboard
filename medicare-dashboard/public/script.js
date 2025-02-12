// Global variable to store the data
let medicareData = [];
let recordsPerPage = 10;

async function fetchData() {
    document.getElementById("loading").style.display = "block";
    document.getElementById("error-message").style.display = "none";

    try {
        const response = await fetch('/api/medicare-data');
        if (!response.ok) throw new Error("Failed to fetch data");

        medicareData = await response.json();
        document.getElementById("loading").style.display = "none";
        
        renderDashboard();
        initializeCharts();
        setupEventListeners();
        setupFilterListeners()

    } catch (error) {
        document.getElementById("loading").style.display = "none";
        document.getElementById("error-message").style.display = "block";
        document.getElementById("error-message").textContent = error.message;
    }
}

function renderDashboard() {
    renderTable();
    updateSummaryStats();
}

function renderTable(filteredData = medicareData.slice(0, recordsPerPage)) {
    const tableBody = document.querySelector("#medicare-table tbody");
    tableBody.innerHTML = "";

    filteredData.forEach(item => {
        const spendingTier = getSpendingTier(item.total_spending);
        const row = `
            <tr>
                <td>${item.brand_name}</td>
                <td>${item.generic_name}</td>
                <td>${item.manufacturer_name}</td>
                <td>
                    $${item.total_spending.toLocaleString()}
                    <span class="spending-badge ${spendingTier.class}">${spendingTier.label}</span>
                </td>
                <td>${item.total_claims.toLocaleString()}</td>
                <td>${item.beneficiary_count.toLocaleString()}</td>
                <td>$${item.avg_spending_per_dose.toFixed(2)}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

function setupRecordsPerPageListener() {
    document.getElementById("records-per-page").addEventListener("change", (e) => {
        recordsPerPage = parseInt(e.target.value, 10);
        renderTable();
    });
}

function getSpendingTier(spending) {
    if (spending > 1000000000) {
        return { label: 'High', class: 'high-tier' };
    } else if (spending > 500000000) {
        return { label: 'Medium', class: 'medium-tier' };
    }
    return { label: 'Low', class: 'low-tier' };
}

function updateSummaryStats() {
    const totalSpending = medicareData.reduce((sum, item) => sum + item.total_spending, 0);
    const totalClaims = medicareData.reduce((sum, item) => sum + item.total_claims, 0);
    const avgSpending = totalSpending / medicareData.length;

    document.getElementById('total-spending').textContent = `$${totalSpending.toLocaleString()}`;
    document.getElementById('total-claims').textContent = totalClaims.toLocaleString();
    document.getElementById('avg-spending').textContent = `$${avgSpending.toFixed(2)}`;
}

function initializeCharts() {
    
    const topSpendingCtx = document.getElementById('spending-chart').getContext('2d');

// Ensure only distinct medications are selected
const uniqueMedications = new Map();
medicareData.forEach(item => {
    if (!uniqueMedications.has(item.brand_name) || uniqueMedications.get(item.brand_name).total_spending < item.total_spending) {
        uniqueMedications.set(item.brand_name, item);
    }
});

// Get the top 5 by spending
const topSpendingData = [...uniqueMedications.values()]
    .sort((a, b) => b.total_spending - a.total_spending)
    .slice(0, 5);

new Chart(topSpendingCtx, {
    type: 'bar',
    data: {
        labels: topSpendingData.map(d => d.brand_name),
        datasets: [{
            label: 'Total Spending ($)',
            data: topSpendingData.map(d => d.total_spending),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: value => '$' + value.toLocaleString()
                }
            }
        }
    }
});

    const claimsCtx = document.getElementById('claims-chart').getContext('2d');
    const claimsData = processClaimsData();
    
    new Chart(claimsCtx, {
        type: 'pie',
        data: {
            labels: claimsData.labels,
            datasets: [{
                data: claimsData.values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Add Beneficiary Distribution Chart
    const beneficiaryCtx = document.getElementById('beneficiary-chart').getContext('2d');
    const beneficiaryData = processBeneficiaryData();
    
    new Chart(beneficiaryCtx, {
        type: 'doughnut',
        data: {
            labels: beneficiaryData.labels,
            datasets: [{
                data: beneficiaryData.values,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function processClaimsData() {
    const sortedClaims = [...medicareData]
        .sort((a, b) => b.total_claims - a.total_claims)
        .slice(0, 3);
    
    return {
        labels: sortedClaims.map(item => item.brand_name),
        values: sortedClaims.map(item => item.total_claims)
    };
}

function processBeneficiaryData() {
    const sortedBeneficiaries = [...medicareData]
        .sort((a, b) => b.beneficiary_count - a.beneficiary_count)
        .slice(0, 3);
    
    return {
        labels: sortedBeneficiaries.map(item => item.brand_name),
        values: sortedBeneficiaries.map(item => item.beneficiary_count)
    };
}

// Enhanced filter functionality
function setupFilterListeners() {
    const minSpending = document.getElementById('min-spending');
    const maxSpending = document.getElementById('max-spending');
    const sortSelect = document.getElementById('sort-select');

    function applyFilters() {
        let filteredData = [...medicareData];

        // Apply spending range filter
        if (minSpending.value) {
            filteredData = filteredData.filter(item => 
                item.total_spending >= parseFloat(minSpending.value)
            );
        }
        if (maxSpending.value) {
            filteredData = filteredData.filter(item => 
                item.total_spending <= parseFloat(maxSpending.value)
            );
        }

        // Apply sorting
        const sortColumn = sortSelect.value;
        filteredData.sort((a, b) => b[sortColumn] - a[sortColumn]);

        renderTable(filteredData.slice(0, 10));
    }

    minSpending.addEventListener('input', applyFilters);
    maxSpending.addEventListener('input', applyFilters);
    sortSelect.addEventListener('change', applyFilters);
}

function setupEventListeners() {
    // Search functionality
    document.getElementById('search-input').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredData = medicareData.filter(item => 
            item.brand_name.toLowerCase().includes(searchTerm) ||
            item.generic_name.toLowerCase().includes(searchTerm)
        ).slice(0, recordsPerPage);
        renderTable(filteredData);
    });

    // Sorting functionality
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.column;
            const isAsc = header.classList.contains('sort-asc');
            
            // Reset all headers
            document.querySelectorAll('.sortable').forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            
            // Sort data
            medicareData.sort((a, b) => {
                return isAsc 
                    ? b[column] - a[column]
                    : a[column] - b[column];
            });
            
            header.classList.add(isAsc ? 'sort-desc' : 'sort-asc');
            renderTable(medicareData.slice(0, 10));
        });
    });
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setupRecordsPerPageListener();
});