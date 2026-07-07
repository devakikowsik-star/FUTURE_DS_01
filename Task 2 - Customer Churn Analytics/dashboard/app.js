// Customer Retention & Churn Analytics Controller

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial State & Configuration
    let activeTab = "dashboard";
    let filteredData = [];
    
    // Store chart instances globally to destroy them before re-rendering
    let charts = {
        survival: null,
        cycle: null,
        reasons: null,
        plan: null
    };

    // Fallbacks in case dashboard_data.js fails to load
    const rawMetricsFallback = {
        raw_records_count: 2000,
        duplicates_removed: 50,
        invalid_dates_removed: 100,
        invalid_tenures_removed: 50,
        charges_imputed: 30,
        billing_cycles_imputed: 80,
        invalid_records_removed: 200,
        cleaned_records_count: 1800
    };

    const cleanedDataFallback = [
        { Customer_ID: "CUST-20001", Signup_Date: "2024-01-15", Plan_Type: "Basic", Billing_Cycle: "Monthly", Tenure_Months: 5, Monthly_Charges: 15.20, Churn_Status: "Yes", Churn_Reason: "Price", LTV: 76.00, Region: "North" },
        { Customer_ID: "CUST-20002", Signup_Date: "2024-01-20", Customer_ID: "CUST-20002", Plan_Type: "Standard", Billing_Cycle: "Annual", Tenure_Months: 18, Monthly_Charges: 38.50, Churn_Status: "No", Churn_Reason: "N/A", LTV: 693.00, Region: "South" },
        { Customer_ID: "CUST-20003", Signup_Date: "2024-02-10", Customer_ID: "CUST-20003", Plan_Type: "Premium", Billing_Cycle: "Monthly", Tenure_Months: 2, Monthly_Charges: 79.00, Churn_Status: "Yes", Churn_Reason: "Customer Support", LTV: 158.00, Region: "East" },
        { Customer_ID: "CUST-20004", Signup_Date: "2024-03-01", Customer_ID: "CUST-20004", Plan_Type: "Standard", Billing_Cycle: "Monthly", Tenure_Months: 12, Monthly_Charges: 40.00, Churn_Status: "No", Churn_Reason: "N/A", LTV: 480.00, Region: "West" }
    ];

    const rawDataPreviewFallback = [
        { Customer_ID: "CUST-20001", Signup_Date: "2024-01-15", Plan_Type: "Basic", Billing_Cycle: "Monthly", Tenure_Months: "5", Monthly_Charges: "15.20", Churn_Status: "Yes", Churn_Reason: "Price", Region: "North" },
        { Customer_ID: "CUST-20002", Signup_Date: "20/01/2024", Plan_Type: "standard", Billing_Cycle: "Annual", Tenure_Months: "18", Monthly_Charges: "38.50", Churn_Status: "No", Churn_Reason: "", Region: "south" },
        { Customer_ID: "CUST-20003", Signup_Date: "2024-02-10", Plan_Type: "Premium", Billing_Cycle: "", Tenure_Months: "-2", Monthly_Charges: "79.00", Churn_Status: "yes", Churn_Reason: "Customer Support", Region: "East" }
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
    const planSelect = document.getElementById("filter-plan");
    const cycleSelect = document.getElementById("filter-cycle");
    const resetFiltersBtn = document.getElementById("reset-filters");

    // KPI Elements
    const kpiChurn = document.getElementById("kpi-churn-val");
    const kpiMRR = document.getElementById("kpi-mrr-val");
    const kpiLTV = document.getElementById("kpi-ltv-val");
    const kpiActive = document.getElementById("kpi-active-val");
    const kpiTenureTrend = document.getElementById("kpi-ltv-trend");

    // 3. Tab Switching Setup
    tabItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetTab = item.getAttribute("data-tab");
            
            tabItems.forEach(el => el.classList.remove("active"));
            item.classList.add("active");
            
            tabContents.forEach(content => {
                content.classList.remove("active");
                if (content.id === targetTab) {
                    content.classList.add("active");
                }
            });

            activeTab = targetTab;
            updateHeaderTitles();
            
            if (activeTab === "insights") {
                filtersContainer.style.display = "none";
            } else {
                filtersContainer.style.display = "flex";
            }
        });
    });

    function updateHeaderTitles() {
        if (activeTab === "dashboard") {
            pageTitle.innerText = "Executive Churn Overview";
            pageSubtitle.innerText = "SaaS subscriber lifetime trends, cohort retention, and churn analysis.";
        } else if (activeTab === "pipeline") {
            pageTitle.innerText = "Pipeline & Cohort Curves";
            pageSubtitle.innerText = "Audit raw database transformations and explore customer survival rate dynamics.";
        } else if (activeTab === "insights") {
            pageTitle.innerText = "SaaS Retention Playbook";
            pageSubtitle.innerText = "Consultative strategy and actionable initiatives to reduce monthly subscriber churn.";
        }
    }

    // 4. Data Filter & Recalculation Engine
    function processData() {
        const selectedRegion = regionSelect.value;
        const selectedPlan = planSelect.value;
        const selectedCycle = cycleSelect.value;

        // Filter cleaned dataset
        filteredData = dataset.filter(row => {
            const regionMatch = selectedRegion === "All" || row.Region === selectedRegion;
            const planMatch = selectedPlan === "All" || row.Plan_Type === selectedPlan;
            const cycleMatch = selectedCycle === "All" || row.Billing_Cycle === selectedCycle;
            return regionMatch && planMatch && cycleMatch;
        });

        calculateKPIs();
        renderCharts();
    }

    function calculateKPIs() {
        let totalCustomers = filteredData.length;
        let churnedCount = 0;
        let activeCount = 0;
        let activeMRR = 0;
        let totalLTV = 0;
        let totalTenure = 0;

        filteredData.forEach(row => {
            totalLTV += row.LTV;
            totalTenure += row.Tenure_Months;
            
            if (row.Churn_Status === "Yes") {
                churnedCount++;
            } else {
                activeCount++;
                activeMRR += row.Monthly_Charges;
            }
        });

        const churnRate = totalCustomers > 0 ? (churnedCount / totalCustomers) * 100 : 0;
        const avgLTV = totalCustomers > 0 ? totalLTV / totalCustomers : 0;
        const avgTenure = totalCustomers > 0 ? totalTenure / totalCustomers : 0;

        // Update UI counters
        kpiChurn.innerText = churnRate.toFixed(1) + "%";
        kpiMRR.innerText = formatCurrency(activeMRR);
        kpiLTV.innerText = formatCurrency(avgLTV);
        kpiActive.innerText = activeCount.toLocaleString();
        
        kpiTenureTrend.innerHTML = `<i class="fa-solid fa-clock"></i> <span>Avg Tenure: ${avgTenure.toFixed(1)} Mos</span>`;
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

        // --- CHART 1: SURVIVAL RATE CURVE (Line Chart) ---
        // Dynamically compute survival curve for active filters
        const months = Array.from({length: 25}, (_, i) => i);
        const survivalRates = [];
        const totalCohort = filteredData.length;

        months.forEach(month => {
            const retained = filteredData.filter(row => row.Tenure_Months >= month).length;
            const rate = totalCohort > 0 ? (retained / totalCohort) * 100 : 0;
            survivalRates.push(rate.toFixed(1));
        });

        if (charts.survival) charts.survival.destroy();
        const survivalCtx = document.getElementById("survival-chart").getContext("2d");
        charts.survival = new Chart(survivalCtx, {
            type: 'line',
            data: {
                labels: months.map(m => `Month ${m}`),
                datasets: [{
                    label: 'Survival Rate (%)',
                    data: survivalRates,
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 3,
                    pointBackgroundColor: '#a855f7',
                    pointHoverRadius: 6
                }]
            },
            options: {
                ...chartOptions,
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textMuted, maxTicksLimit: 12 }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textMuted, font: { family: 'Inter' } },
                        min: 0,
                        max: 100
                    }
                },
                plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Retained: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });

        // --- CHART 2: CHURN BY BILLING CYCLE (Donut Chart) ---
        let monthlyChurn = 0;
        let annualChurn = 0;

        filteredData.forEach(row => {
            if (row.Churn_Status === "Yes") {
                if (row.Billing_Cycle === "Monthly") monthlyChurn++;
                else if (row.Billing_Cycle === "Annual") annualChurn++;
            }
        });

        if (charts.cycle) charts.cycle.destroy();
        const cycleCtx = document.getElementById("cycle-chart").getContext("2d");
        charts.cycle = new Chart(cycleCtx, {
            type: 'doughnut',
            data: {
                labels: ['Monthly Contracts', 'Annual Contracts'],
                datasets: [{
                    data: [monthlyChurn, annualChurn],
                    backgroundColor: ['#ec4899', '#3b82f6'],
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textMuted, font: { family: 'Inter', size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${context.raw} accounts (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });

        // --- CHART 3: DOMINANT CHURN REASONS (Horizontal Bar Chart) ---
        const reasonsCount = {};
        filteredData.forEach(row => {
            if (row.Churn_Status === "Yes") {
                reasonsCount[row.Churn_Reason] = (reasonsCount[row.Churn_Reason] || 0) + 1;
            }
        });

        const sortedReasons = Object.entries(reasonsCount)
            .sort((a, b) => b[1] - a[1]);

        if (charts.reasons) charts.reasons.destroy();
        const reasonsCtx = document.getElementById("reasons-chart").getContext("2d");
        charts.reasons = new Chart(reasonsCtx, {
            type: 'bar',
            data: {
                labels: sortedReasons.map(x => x[0]),
                datasets: [{
                    label: 'Cancellations',
                    data: sortedReasons.map(x => x[1]),
                    backgroundColor: 'rgba(236, 72, 153, 0.8)',
                    borderColor: '#ec4899',
                    borderWidth: 1,
                    borderRadius: 4,
                    barThickness: 15
                }]
            },
            options: {
                ...chartOptions,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: gridColor }, ticks: { color: textMuted } },
                    y: { grid: { display: false }, ticks: { color: textMuted } }
                }
            }
        });

        // --- CHART 4: CHURN RATE BY PLAN TYPE (Bar Chart) ---
        const planCustomers = { "Basic": 0, "Standard": 0, "Premium": 0 };
        const planChurns = { "Basic": 0, "Standard": 0, "Premium": 0 };

        filteredData.forEach(row => {
            if (row.Plan_Type in planCustomers) {
                planCustomers[row.Plan_Type]++;
                if (row.Churn_Status === "Yes") {
                    planChurns[row.Plan_Type]++;
                }
            }
        });

        const plans = ["Basic", "Standard", "Premium"];
        const planRates = plans.map(p => {
            const total = planCustomers[p];
            return total > 0 ? ((planChurns[p] / total) * 100).toFixed(1) : 0;
        });

        if (charts.plan) charts.plan.destroy();
        const planCtx = document.getElementById("plan-chart").getContext("2d");
        charts.plan = new Chart(planCtx, {
            type: 'bar',
            data: {
                labels: plans,
                datasets: [{
                    label: 'Churn Rate (%)',
                    data: planRates,
                    backgroundColor: ['#a855f7', '#ec4899', '#eab308'],
                    borderRadius: 4,
                    barThickness: 30
                }]
            },
            options: {
                ...chartOptions,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: textMuted } },
                    y: { grid: { color: gridColor }, ticks: { color: textMuted }, min: 0, max: 100 }
                }
            }
        });
    }

    // 6. Data Pipeline Tab Population
    function populatePipelineTab() {
        document.getElementById("audit-raw-count").innerText = metrics.raw_records_count.toLocaleString();
        document.getElementById("audit-dupes").innerText = metrics.duplicates_removed.toLocaleString();
        document.getElementById("audit-dates").innerText = metrics.invalid_dates_removed.toLocaleString();
        document.getElementById("audit-tenures").innerText = metrics.invalid_tenures_removed.toLocaleString();
        document.getElementById("audit-imputed").innerText = metrics.charges_imputed.toLocaleString();
        document.getElementById("audit-cleaned-count").innerText = metrics.cleaned_records_count.toLocaleString();

        // Render Raw Data Table
        const rawTableBody = document.querySelector("#raw-data-table tbody");
        rawTableBody.innerHTML = "";
        
        rawPreview.slice(0, 15).forEach(row => {
            const tr = document.createElement("tr");

            let dateHtml = row.Signup_Date;
            if (!row.Signup_Date || row.Signup_Date === "INVALID_DATE") {
                dateHtml = `<span class="anomaly-badge">Bad Date</span>`;
            } else if (row.Signup_Date.includes("/")) {
                dateHtml = `<span class="imputed-badge" style="background-color:hsla(35, 100%, 50%, 0.15); color:orange; border-color:orange;">${row.Signup_Date}</span>`;
            }

            let tenureHtml = row.Tenure_Months;
            if (!row.Tenure_Months || parseInt(row.Tenure_Months) < 0) {
                tenureHtml = `<span class="anomaly-badge">${row.Tenure_Months || "Empty"}</span>`;
            }

            let chargesHtml = row.Monthly_Charges;
            if (!row.Monthly_Charges || parseFloat(row.Monthly_Charges) <= 0) {
                chargesHtml = `<span class="anomaly-badge">${row.Monthly_Charges || "Empty"}</span>`;
            }

            tr.innerHTML = `
                <td>${row.Customer_ID}</td>
                <td>${dateHtml}</td>
                <td>${row.Plan_Type}</td>
                <td>${row.Billing_Cycle || '<span class="anomaly-badge">Missing</span>'}</td>
                <td>${tenureHtml}</td>
                <td>$${chargesHtml}</td>
                <td>${row.Churn_Status}</td>
                <td>${row.Region}</td>
            `;
            rawTableBody.appendChild(tr);
        });

        // Render Cleaned Data Table
        const cleanTableBody = document.querySelector("#cleaned-data-table tbody");
        cleanTableBody.innerHTML = "";

        dataset.slice(0, 15).forEach(row => {
            const tr = document.createElement("tr");

            let chargesHtml = `$${row.Monthly_Charges.toFixed(2)}`;
            const isImputed = rawPreview.some(raw => raw.Customer_ID === row.Customer_ID && (!raw.Monthly_Charges || parseFloat(raw.Monthly_Charges) <= 0));
            if (isImputed) {
                chargesHtml = `<span class="imputed-badge" title="Imputed">${chargesHtml}</span>`;
            }

            tr.innerHTML = `
                <td><strong>${row.Customer_ID}</strong></td>
                <td>${row.Signup_Date}</td>
                <td>${row.Plan_Type}</td>
                <td>${row.Billing_Cycle}</td>
                <td>${row.Tenure_Months}</td>
                <td>${chargesHtml}</td>
                <td><span style="color:${row.Churn_Status === 'Yes' ? 'var(--danger)' : 'var(--success)'}; font-weight:600;">${row.Churn_Status}</span></td>
                <td>${row.Churn_Reason}</td>
                <td>$${row.LTV.toFixed(2)}</td>
                <td>${row.Region}</td>
            `;
            cleanTableBody.appendChild(tr);
        });
    }

    // 7. Client-side CSV Export
    function exportCleanedCSV() {
        const headers = ["Customer_ID", "Signup_Date", "Plan_Type", "Billing_Cycle", "Tenure_Months", "Monthly_Charges", "Churn_Status", "Churn_Reason", "LTV", "Region"];
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += headers.join(",") + "\n";
        
        dataset.forEach(row => {
            const line = headers.map(header => {
                let cell = row[header];
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
        link.setAttribute("download", "cleaned_customer_churn_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    document.getElementById("download-csv").addEventListener("click", exportCleanedCSV);

    // 8. Event Listeners for Filters
    regionSelect.addEventListener("change", processData);
    planSelect.addEventListener("change", processData);
    cycleSelect.addEventListener("change", processData);

    resetFiltersBtn.addEventListener("click", () => {
        regionSelect.value = "All";
        planSelect.value = "All";
        cycleSelect.value = "All";
        processData();
    });

    // 9. Startup Initialization
    processData();
    populatePipelineTab();
});
