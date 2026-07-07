// Business Sales Performance Analytics Controller

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial State & Configuration
    let activeTab = "dashboard";
    let filteredData = [];
    
    // Store chart instances globally to destroy them before re-rendering
    let charts = {
        trend: null,
        category: null,
        products: null,
        region: null
    };

    // Fallback data in case dashboard_data.js fails to load
    const rawMetricsFallback = {
        raw_records_count: 2000,
        duplicates_removed: 50,
        invalid_dates_removed: 90,
        invalid_quantities_removed: 80,
        prices_imputed: 40,
        invalid_records_removed: 170,
        cleaned_records_count: 1830
    };

    const cleanedDataFallback = [
        { Transaction_ID: "TXN-10001", Date: "2025-01-15", Customer_ID: "CUST-1001", Segment: "Consumer", Product_Name: "Pro Laptop 15", Category: "Technology", Quantity: 2, Unit_Price: 1200.0, Revenue: 2400.0, Cost: 1680.0, Profit: 720.0, Region: "North" },
        { Transaction_ID: "TXN-10002", Date: "2025-01-20", Customer_ID: "CUST-1002", Segment: "Corporate", Product_Name: "Ergonomic Chair", Category: "Furniture", Quantity: 5, Unit_Price: 250.0, Revenue: 1250.0, Cost: 812.5, Profit: 437.5, Region: "South" },
        { Transaction_ID: "TXN-10003", Date: "2025-02-10", Customer_ID: "CUST-1003", Segment: "Home Office", Product_Name: "Gel Pens (Pack of 12)", Category: "Office Supplies", Quantity: 20, Unit_Price: 15.0, Revenue: 300.0, Cost: 90.0, Profit: 210.0, Region: "East" },
        { Transaction_ID: "TXN-10004", Date: "2025-02-14", Customer_ID: "CUST-1004", Segment: "Consumer", Product_Name: "UltraWide Monitor 34", Category: "Technology", Quantity: 1, Unit_Price: 400.0, Revenue: 400.0, Cost: 288.0, Profit: 112.0, Region: "West" }
    ];

    const rawDataPreviewFallback = [
        { Transaction_ID: "TXN-10001", Date: "2025-01-15", Customer_ID: "CUST-1001", Segment: "Consumer", Product_Name: "Pro Laptop 15", Category: "Technology", Quantity: "2", Unit_Price: "1200.00", Cost_Percentage: "0.7", Region: "North" },
        { Transaction_ID: "TXN-10002", Date: "20/01/2025", Customer_ID: "CUST-1002", Segment: "Corporate", Product_Name: "Ergonomic Chair", Category: "furniture", Quantity: "5", Unit_Price: "250.00", Cost_Percentage: "0.65", Region: "south" },
        { Transaction_ID: "TXN-10003", Date: "2025-02-10", Customer_ID: "CUST-1003", Segment: "Home Office", Product_Name: "Gel Pens (Pack of 12)", Category: "Office Supplies", Quantity: "-20", Unit_Price: "", Cost_Percentage: "0.3", Region: "East" }
    ];

    // Check availability of global variables from dashboard_data.js
    const dataset = typeof CLEANED_DATA !== 'undefined' ? CLEANED_DATA : cleanedDataFallback;
    const metrics = typeof RAW_METRICS !== 'undefined' ? RAW_METRICS : rawMetricsFallback;
    const rawPreview = typeof RAW_DATA_PREVIEW !== 'undefined' ? RAW_DATA_PREVIEW : rawDataPreviewFallback;

    // 2. DOM Elements
    const tabItems = document.querySelectorAll(".nav-menu .nav-item");
    const tabContents = document.querySelectorAll(".tab-content");
    const pageTitle = document.getElementById("page-title");
    const pageSubtitle = document.getElementById("page-subtitle");
    const filtersContainer = document.getElementById("filters-container");
    
    // Filter Elements
    const regionSelect = document.getElementById("filter-region");
    const categorySelect = document.getElementById("filter-category");
    const segmentSelect = document.getElementById("filter-segment");
    const resetFiltersBtn = document.getElementById("reset-filters");

    // KPI Elements
    const kpiRevenue = document.getElementById("kpi-revenue-val");
    const kpiProfit = document.getElementById("kpi-profit-val");
    const kpiMargin = document.getElementById("kpi-margin-val");
    const kpiOrders = document.getElementById("kpi-orders-val");

    // 3. Tab Switching Setup
    tabItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetTab = item.getAttribute("data-tab");
            
            // Toggle active menu item
            tabItems.forEach(el => el.classList.remove("active"));
            item.classList.add("active");
            
            // Toggle active tab content
            tabContents.forEach(content => {
                content.classList.remove("active");
                if (content.id === targetTab) {
                    content.classList.add("active");
                }
            });

            activeTab = targetTab;
            updateHeaderTitles();
            
            // Hide or show filters panel depending on the tab
            if (activeTab === "insights") {
                filtersContainer.style.display = "none";
            } else {
                filtersContainer.style.display = "flex";
            }
        });
    });

    function updateHeaderTitles() {
        if (activeTab === "dashboard") {
            pageTitle.innerText = "Executive Sales Overview";
            pageSubtitle.innerText = "Interactive analysis of business sales performance, profit margins, and trends.";
        } else if (activeTab === "pipeline") {
            pageTitle.innerText = "Data Pipeline & Audit";
            pageSubtitle.innerText = "Trace the transformation of raw records into high-fidelity, analysis-ready business data.";
        } else if (activeTab === "insights") {
            pageTitle.innerText = "Strategic Insights & Advice";
            pageSubtitle.innerText = "Derived executive recommendations to optimize operations, pricing, and regional growth.";
        }
    }

    // 4. Data Filter & Recalculation Engine
    function processData() {
        const selectedRegion = regionSelect.value;
        const selectedCategory = categorySelect.value;
        const selectedSegment = segmentSelect.value;

        // Filter cleaned dataset
        filteredData = dataset.filter(row => {
            const regionMatch = selectedRegion === "All" || row.Region === selectedRegion;
            const categoryMatch = selectedCategory === "All" || row.Category === selectedCategory;
            const segmentMatch = selectedSegment === "All" || row.Segment === selectedSegment;
            return regionMatch && categoryMatch && segmentMatch;
        });

        calculateKPIs();
        renderCharts();
    }

    function calculateKPIs() {
        let totalRevenue = 0;
        let totalProfit = 0;
        let totalQty = 0;

        filteredData.forEach(row => {
            totalRevenue += row.Revenue;
            totalProfit += row.Profit;
            totalQty += row.Quantity;
        });

        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        // Update UI counters with nice number formatting
        kpiRevenue.innerText = formatCurrency(totalRevenue);
        kpiProfit.innerText = formatCurrency(totalProfit);
        kpiMargin.innerText = profitMargin.toFixed(1) + "%";
        kpiOrders.innerText = totalQty.toLocaleString();
    }

    function formatCurrency(val) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    }

    // 5. Chart.js Visualization Engine
    function renderCharts() {
        // Chart options templates for dark theme
        const gridColor = "rgba(255, 255, 255, 0.05)";
        const textMuted = "#94a3b8";
        
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textMuted,
                        font: { family: 'Inter', size: 11 }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textMuted, font: { family: 'Inter' } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textMuted, font: { family: 'Inter' } }
                }
            }
        };

        // --- CHART 1: MONTHLY TRENDS (Line Chart) ---
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyRevenue = Array(12).fill(0);
        const monthlyProfit = Array(12).fill(0);

        filteredData.forEach(row => {
            const dateObj = new Date(row.Date);
            const monthIdx = dateObj.getMonth(); // 0-11
            if (monthIdx >= 0 && monthIdx < 12) {
                monthlyRevenue[monthIdx] += row.Revenue;
                monthlyProfit[monthIdx] += row.Profit;
            }
        });

        if (charts.trend) charts.trend.destroy();
        const trendCtx = document.getElementById("trend-chart").getContext("2d");
        charts.trend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Revenue ($)',
                        data: monthlyRevenue,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 3,
                        pointBackgroundColor: '#6366f1'
                    },
                    {
                        label: 'Net Profit ($)',
                        data: monthlyProfit,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2,
                        pointBackgroundColor: '#10b981'
                    }
                ]
            },
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label.split(' ')[0] + ': ' + formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });

        // --- CHART 2: CATEGORY SHARE (Donut Chart) ---
        const categoryData = { "Technology": 0, "Furniture": 0, "Office Supplies": 0 };
        filteredData.forEach(row => {
            if (row.Category in categoryData) {
                categoryData[row.Category] += row.Revenue;
            }
        });

        if (charts.category) charts.category.destroy();
        const catCtx = document.getElementById("category-chart").getContext("2d");
        charts.category = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: ['#6366f1', '#06b6d4', '#f43f5e'],
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textMuted,
                            padding: 15,
                            font: { family: 'Inter', size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                return context.label + ': ' + formatCurrency(context.raw) + ' (' + percentage + '%)';
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });

        // --- CHART 3: TOP PRODUCTS (Horizontal Bar Chart) ---
        const productSales = {};
        filteredData.forEach(row => {
            productSales[row.Product_Name] = (productSales[row.Product_Name] || 0) + row.Revenue;
        });

        // Sort products by revenue descending and slice Top 5
        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (charts.products) charts.products.destroy();
        const prodCtx = document.getElementById("products-chart").getContext("2d");
        charts.products = new Chart(prodCtx, {
            type: 'bar',
            data: {
                labels: topProducts.map(x => x[0]),
                datasets: [{
                    label: 'Revenue ($)',
                    data: topProducts.map(x => x[1]),
                    backgroundColor: 'rgba(6, 182, 212, 0.85)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    borderRadius: 5,
                    barThickness: 15
                }]
            },
            options: {
                ...chartOptions,
                indexAxis: 'y', // Makes it horizontal
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textMuted, font: { family: 'Inter' } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: textMuted, font: { family: 'Inter', size: 10 } }
                    }
                }
            }
        });

        // --- CHART 4: REGIONAL SALES VS PROFIT (Double Bar Chart) ---
        const regionsList = ["North", "South", "East", "West"];
        const regionalRevenue = Array(4).fill(0);
        const regionalProfit = Array(4).fill(0);

        filteredData.forEach(row => {
            const idx = regionsList.indexOf(row.Region);
            if (idx >= 0) {
                regionalRevenue[idx] += row.Revenue;
                regionalProfit[idx] += row.Profit;
            }
        });

        if (charts.region) charts.region.destroy();
        const regionCtx = document.getElementById("region-chart").getContext("2d");
        charts.region = new Chart(regionCtx, {
            type: 'bar',
            data: {
                labels: regionsList,
                datasets: [
                    {
                        label: 'Total Revenue ($)',
                        data: regionalRevenue,
                        backgroundColor: '#6366f1',
                        borderRadius: 4,
                        barThickness: 20
                    },
                    {
                        label: 'Net Profit ($)',
                        data: regionalProfit,
                        backgroundColor: '#10b981',
                        borderRadius: 4,
                        barThickness: 20
                    }
                ]
            },
            options: {
                ...chartOptions,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textMuted, font: { family: 'Inter' } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textMuted, font: { family: 'Inter' } }
                    }
                }
            }
        });
    }

    // 6. Data Pipeline Tab Population & Highlighting
    function populatePipelineTab() {
        // Step 6.1: Update Stats Cards
        document.getElementById("audit-raw-count").innerText = metrics.raw_records_count.toLocaleString();
        document.getElementById("audit-dupes").innerText = metrics.duplicates_removed.toLocaleString();
        document.getElementById("audit-dates").innerText = metrics.invalid_dates_removed.toLocaleString();
        document.getElementById("audit-qtys").innerText = metrics.invalid_quantities_removed.toLocaleString();
        document.getElementById("audit-imputed").innerText = metrics.prices_imputed.toLocaleString();
        document.getElementById("audit-cleaned-count").innerText = metrics.cleaned_records_count.toLocaleString();

        // Step 6.2: Render Raw Data Table (first 15 rows)
        const rawTableBody = document.querySelector("#raw-data-table tbody");
        rawTableBody.innerHTML = "";
        
        const rawSubset = rawPreview.slice(0, 15);
        rawSubset.forEach(row => {
            const tr = document.createElement("tr");

            // Format date showing issues
            let dateHtml = row.Date;
            if (!row.Date || row.Date === "INVALID_DATE") {
                dateHtml = `<span class="anomaly-badge">Missing/Bad</span>`;
            } else if (row.Date.includes("/")) {
                dateHtml = `<span class="imputed-badge" style="background-color:hsla(35, 100%, 50%, 0.15); color:orange; border-color:orange;">${row.Date}</span>`;
            }

            // Format category showing issues
            let categoryHtml = row.Category;
            if (row.Category !== "Technology" && row.Category !== "Furniture" && row.Category !== "Office Supplies") {
                categoryHtml = `<span class="imputed-badge" style="background-color:hsla(35, 100%, 50%, 0.15); color:orange; border-color:orange;">${row.Category}</span>`;
            }

            // Format quantity showing issues
            let qtyHtml = row.Quantity;
            if (!row.Quantity || parseInt(row.Quantity) <= 0) {
                qtyHtml = `<span class="anomaly-badge">${row.Quantity || "Empty"}</span>`;
            }

            // Format price showing issues
            let priceHtml = row.Unit_Price;
            if (!row.Unit_Price || parseFloat(row.Unit_Price) <= 0) {
                priceHtml = `<span class="anomaly-badge">${row.Unit_Price === "" ? "Missing" : row.Unit_Price}</span>`;
            }

            tr.innerHTML = `
                <td>${row.Transaction_ID}</td>
                <td>${dateHtml}</td>
                <td>${row.Customer_ID}</td>
                <td style="max-width: 150px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${row.Product_Name}</td>
                <td>${categoryHtml}</td>
                <td>${qtyHtml}</td>
                <td>${priceHtml}</td>
                <td>${row.Region}</td>
            `;
            rawTableBody.appendChild(tr);
        });

        // Step 6.3: Render Cleaned Data Table (first 15 rows)
        const cleanTableBody = document.querySelector("#cleaned-data-table tbody");
        cleanTableBody.innerHTML = "";

        const cleanSubset = dataset.slice(0, 15);
        cleanSubset.forEach(row => {
            const tr = document.createElement("tr");

            // Let's cross check if this row had pricing issue or date issue in the raw set to add a badge.
            // (We will approximate this by showing standard formatted values, but highlighting if price looks imputed).
            let priceHtml = `$${row.Unit_Price.toFixed(2)}`;
            
            // Check if price matches average/default prices
            // (Simple demonstration check)
            const isImputed = rawPreview.some(raw => raw.Transaction_ID === row.Transaction_ID && (raw.Unit_Price === "" || parseFloat(raw.Unit_Price) <= 0));
            if (isImputed) {
                priceHtml = `<span class="imputed-badge" title="Imputed using product average">${priceHtml}</span>`;
            }

            tr.innerHTML = `
                <td><strong>${row.Transaction_ID}</strong></td>
                <td>${row.Date}</td>
                <td style="max-width: 150px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${row.Product_Name}</td>
                <td>${row.Category}</td>
                <td>${row.Quantity}</td>
                <td>${priceHtml}</td>
                <td>$${row.Revenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td>$${row.Cost.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td><strong style="color:var(--success)">$${row.Profit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</strong></td>
                <td>${row.Region}</td>
            `;
            cleanTableBody.appendChild(tr);
        });
    }

    // 7. Client-side CSV Download
    function exportCleanedCSV() {
        const headers = ["Transaction_ID", "Date", "Customer_ID", "Segment", "Product_Name", "Category", "Quantity", "Unit_Price", "Revenue", "Cost", "Profit", "Region"];
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += headers.join(",") + "\n";
        
        dataset.forEach(row => {
            const line = headers.map(header => {
                let cell = row[header];
                // Escape commas and quotes in string fields
                if (typeof cell === 'string') {
                    if (cell.includes(',') || cell.includes('"')) {
                        cell = `"${cell.replace(/"/g, '""')}"`;
                    }
                }
                return cell;
            });
            csvContent += line.join(",") + "\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "cleaned_sales_performance_data.csv");
        document.body.appendChild(link); // Required for FF
        link.click();
        document.body.removeChild(link);
    }

    document.getElementById("download-csv").addEventListener("click", exportCleanedCSV);

    // 8. Event Listeners for Filters
    regionSelect.addEventListener("change", processData);
    categorySelect.addEventListener("change", processData);
    segmentSelect.addEventListener("change", processData);

    resetFiltersBtn.addEventListener("click", () => {
        regionSelect.value = "All";
        categorySelect.value = "All";
        segmentSelect.value = "All";
        processData();
    });

    // 9. Startup Initialization
    processData();
    populatePipelineTab();
});
