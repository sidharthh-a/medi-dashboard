// Data structure
const drugData = [
    { name: "ATOMOXETINE", tier: 2 },
    { name: "PAROXETINE", tier: 2 },
    { name: "AZATHIOPRINE", tier: 2 },
    { name: "NORETHINDRONE ACETATE", tier: 2 },
    { name: "INDOMETHACIN", tier: 2 },
    { name: "OMEPRAZOLE", tier: 1 },
    { name: "FUROSEMIDE", tier: 1 },
    { name: "ALENDRONATE SODIUM", tier: 1 },
    { name: "FUROSEMIDE", tier: 1 },
    { name: "METFORMIN", tier: 1 },
    { name: "EPINASTINE HYDROCHLORIDE", tier: 3 },
    { name: "COLCHICINE", tier: 3 },
    { name: "DESVENLAFAXINE", tier: 3 },
    { name: "PROGESTERONE", tier: 3 },
    { name: "CYPROHEPTADINE HYDROCHLORIDE", tier: 3 },
    { name: "COLISTIMETHATE", tier: 4 },
    { name: "POLYMYXIN B", tier: 4 },
    { name: "NORETHINDRONE ACETATE & ETHINYL ESTRADIOL", tier: 4 },
    { name: "ISIBLOOM", tier: 4 },
    { name: "LORYNA", tier: 4 },
    { name: "NERLYNX", tier: 5 },
    { name: "NITISINONE", tier: 5 },
    { name: "TYMLOS", tier: 5 },
    { name: "AMBRISENTAN", tier: 5 },
    { name: "XERMELO", tier: 5 }
];

// Chart configuration and state
let currentChart = null;
const chartColors = {
    tier1: 'rgba(34, 197, 94, 0.7)',  // Green
    tier2: 'rgba(59, 130, 246, 0.7)', // Blue
    tier3: 'rgba(234, 179, 8, 0.7)',  // Yellow
    tier4: 'rgba(249, 115, 22, 0.7)', // Orange
    tier5: 'rgba(239, 68, 68, 0.7)'   // Red
};

// Utility functions
const getColorByTier = (tier) => {
    return chartColors[`tier${tier}`] || 'rgba(156, 163, 175, 0.7)';
};

const formatNumber = (number) => {
    return Number.isInteger(number) ? number : number.toFixed(1);
};

const calculateStats = (data) => {
    const stats = {
        totalDrugs: data.length,
        averageTier: data.reduce((sum, drug) => sum + drug.tier, 0) / data.length,
        tierDistribution: {},
        mostCommonTier: 0,
        highestTier: Math.max(...data.map(drug => drug.tier)),
        lowestTier: Math.min(...data.map(drug => drug.tier))
    };

    // Calculate tier distribution
    data.forEach(drug => {
        stats.tierDistribution[drug.tier] = (stats.tierDistribution[drug.tier] || 0) + 1;
    });

    // Find most common tier
    stats.mostCommonTier = Object.entries(stats.tierDistribution)
        .sort((a, b) => b[1] - a[1])[0][0];

    return stats;
};

// Chart creation and update functions
const createBarChart = (data, ctx) => {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(drug => drug.name),
            datasets: [{
                label: 'Drug Tier Level',
                data: data.map(drug => drug.tier),
                backgroundColor: data.map(drug => getColorByTier(drug.tier)),
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: (tooltipItems) => {
                            return tooltipItems[0].label;
                        },
                        label: (context) => {
                            return `Tier: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: (value) => `Tier ${value}`
                    },
                    title: {
                        display: true,
                        text: 'Tier Level'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
};

const createPieChart = (data, ctx) => {
    const tierCounts = {};
    data.forEach(drug => {
        tierCounts[drug.tier] = (tierCounts[drug.tier] || 0) + 1;
    });

    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(tierCounts).map(tier => `Tier ${tier}`),
            datasets: [{
                data: Object.values(tierCounts),
                backgroundColor: Object.keys(tierCounts).map(tier => getColorByTier(tier)),
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const percentage = ((context.raw / data.length) * 100).toFixed(1);
                            return `${context.raw} drugs (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
};

// UI update functions
const updateStats = (data) => {
    const stats = calculateStats(data);
    
    document.getElementById('totalDrugs').textContent = stats.totalDrugs;
    document.getElementById('avgTier').textContent = formatNumber(stats.averageTier);
    document.getElementById('commonTier').textContent = stats.mostCommonTier;
    
    // Update distribution cards if they exist
    Object.entries(stats.tierDistribution).forEach(([tier, count]) => {
        const element = document.getElementById(`tier${tier}Count`);
        if (element) {
            element.textContent = count;
        }
    });
};

const updateChart = () => {
    const ctx = document.getElementById('drugChart').getContext('2d');
    const chartType = document.getElementById('chartType').value;
    const sortBy = document.getElementById('sortBy').value;
    const filterTier = document.getElementById('filterTier').value;

    // Filter and sort data
    let processedData = [...drugData];
    
    if (filterTier !== 'all') {
        processedData = processedData.filter(drug => drug.tier === parseInt(filterTier));
    }

    processedData.sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        }
        return a.tier - b.tier;
    });

    // Destroy existing chart if it exists
    if (currentChart) {
        currentChart.destroy();
    }

    // Create new chart based on selected type
    if (chartType === 'bar') {
        currentChart = createBarChart(processedData, ctx);
    } else if (chartType === 'pie') {
        currentChart = createPieChart(processedData, ctx);
    }

    // Update statistics
    updateStats(processedData);
};

// Search functionality
const setupSearch = () => {
    const searchInput = document.getElementById('searchDrug');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredData = drugData.filter(drug => 
                drug.name.toLowerCase().includes(searchTerm)
            );
            updateChart(filteredData);
        });
    }
};

// Event listeners
const setupEventListeners = () => {
    const controls = ['chartType', 'sortBy', 'filterTier'];
    controls.forEach(controlId => {
        const element = document.getElementById(controlId);
        if (element) {
            element.addEventListener('change', updateChart);
        }
    });
};

// Initialize the dashboard
const initializeDashboard = () => {
    setupEventListeners();
    setupSearch();
    updateChart();
};

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);