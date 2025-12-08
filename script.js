let expenses = [];
let pieChart, barChart, lineChart;

// Demo data สำหรับกรณีที่ไม่ใช้ database
const DEMO_DATA = [
    { id: 1, description: 'Groceries', amount: 85.50, category: 'Food', date: '2024-11-28' },
    { id: 2, description: 'Gas', amount: 45.00, category: 'Transportation', date: '2024-11-27' },
    { id: 3, description: 'Netflix', amount: 15.99, category: 'Entertainment', date: '2024-11-25' },
    { id: 4, description: 'Restaurant', amount: 62.30, category: 'Food', date: '2024-11-20' },
    { id: 5, description: 'Electric Bill', amount: 120.00, category: 'Utilities', date: '2024-11-15' },
    { id: 6, description: 'Coffee Shop', amount: 12.50, category: 'Food', date: '2024-11-26' },
    { id: 7, description: 'Uber', amount: 18.00, category: 'Transportation', date: '2024-11-24' }
];

function isSupabaseAvailable() {
    return supabase !== null && typeof supabase !== 'undefined' && typeof supabase.from === 'function';
}

async function init() {
    document.getElementById('date').valueAsDate = new Date();
    
    if (!isSupabaseAvailable()) {
        console.log('📦 Using demo data (database not configured)');
        expenses = [...DEMO_DATA];
        updateUI();
        return;
    }
    
    await loadExpenses();
}

async function loadExpenses() {
    if (!isSupabaseAvailable()) {
        expenses = [...DEMO_DATA];
        updateUI();
        return;
    }

    try {
        showLoading(true);
        
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        expenses = data || [];
        console.log('✅ Loaded', expenses.length, 'expenses from database');
        updateUI();
    } catch (error) {
        console.error('❌ Database error:', error.message);
        expenses = [...DEMO_DATA];
        updateUI();
        
        // แสดง alert เฉพาะครั้งแรก
        if (!window.alertShown) {
            alert('Cannot connect to database. Using demo data.\n\nTo use real database:\n1. Set USE_SUPABASE = true in config.js\n2. Add your Supabase credentials');
            window.alertShown = true;
        }
    } finally {
        showLoading(false);
    }
}

async function addExpense() {
    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    if (!description || !amount || amount <= 0) {
        alert('Please enter a valid description and amount');
        return;
    }

    const newExpense = {
        description,
        amount,
        category,
        date
    };

    // ถ้าไม่มี database ให้เพิ่มใน memory
    if (!isSupabaseAvailable()) {
        newExpense.id = Date.now();
        expenses.unshift(newExpense);
        
        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('date').valueAsDate = new Date();
        
        updateUI();
        console.log('✅ Added expense (demo mode)');
        return;
    }

    // เพิ่มเข้า database
    try {
        showLoading(true);

        const { data, error } = await supabase
            .from('expenses')
            .insert([newExpense])
            .select();

        if (error) throw error;

        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('date').valueAsDate = new Date();

        console.log('✅ Added expense to database');
        await loadExpenses();
    } catch (error) {
        console.error('❌ Error adding expense:', error);
        alert('Failed to add expense: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }

    // ถ้าไม่มี database ให้ลบใน memory
    if (!isSupabaseAvailable()) {
        expenses = expenses.filter(exp => exp.id !== id);
        updateUI();
        console.log('✅ Deleted expense (demo mode)');
        return;
    }

    // ลบจาก database
    try {
        showLoading(true);

        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log('✅ Deleted expense from database');
        await loadExpenses();
    } catch (error) {
        console.error('❌ Error deleting expense:', error);
        alert('Failed to delete expense: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'block' : 'none';
    }
}

function filterExpenses() {
    updateUI();
}

function sortExpenses() {
    updateUI();
}

function getFilteredExpenses() {
    const filterPeriod = document.getElementById('filterPeriod').value;
    const now = new Date();
    
    let filtered = [...expenses];

    if (filterPeriod !== 'all') {
        const days = parseInt(filterPeriod);
        filtered = filtered.filter(exp => {
            const expDate = new Date(exp.date);
            const diffTime = now - expDate;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays <= days;
        });
    }

    const sortBy = document.getElementById('sortBy').value;
    filtered.sort((a, b) => {
        if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'amount') return b.amount - a.amount;
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        return 0;
    });

    return filtered;
}

function updateCharts(filtered) {
    const byCategory = {};
    filtered.forEach(exp => {
        byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
    });

    const categories = Object.keys(byCategory);
    const amounts = Object.values(byCategory);

    if (categories.length === 0) {
        return;
    }

    const colors = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(201, 203, 207, 0.8)'
    ];

    if (pieChart) pieChart.destroy();
    if (barChart) barChart.destroy();
    if (lineChart) lineChart.destroy();

    // PIE CHART
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': $' + context.parsed.toFixed(2);
                        }
                    }
                }
            }
        }
    });

    // BAR CHART
    const barCtx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Amount ($)',
                data: amounts,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Amount: $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });

    // LINE CHART
    const expensesByDate = {};
    filtered.forEach(exp => {
        const date = exp.date;
        expensesByDate[date] = (expensesByDate[date] || 0) + exp.amount;
    });

    const sortedDates = Object.keys(expensesByDate).sort();
    const dateLabels = sortedDates.map(d => {
        const date = new Date(d);
        return (date.getMonth() + 1) + '/' + date.getDate();
    });
    const dateAmounts = sortedDates.map(d => expensesByDate[d]);

    const lineCtx = document.getElementById('lineChart').getContext('2d');
    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: [{
                label: 'Daily Expenses',
                data: dateAmounts,
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Amount: $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

function updateUI() {
    const filtered = getFilteredExpenses();
    
    const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('totalExpenses').textContent = `$${total.toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = filtered.length;

    const byCategory = {};
    filtered.forEach(exp => {
        byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
    });

    if (Object.keys(byCategory).length > 0) {
        const topCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0][0];
        document.getElementById('topCategory').textContent = topCat;
    } else {
        document.getElementById('topCategory').textContent = 'N/A';
    }

    const breakdownDiv = document.getElementById('categoryBreakdown');
    if (Object.keys(byCategory).length === 0) {
        breakdownDiv.innerHTML = '<p class="no-expenses">No expenses yet</p>';
    } else {
        breakdownDiv.innerHTML = Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amount]) => `
                <div class="category-item">
                    <div class="category-header">
                        <span class="category-name">${cat}</span>
                        <span class="category-amount">$${amount.toFixed(2)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(amount / total) * 100}%"></div>
                    </div>
                </div>
            `).join('');
    }

    const listDiv = document.getElementById('expenseList');
    if (filtered.length === 0) {
        listDiv.innerHTML = '<p class="no-expenses">No expenses to display</p>';
    } else {
        listDiv.innerHTML = filtered.map(exp => {
            const expDate = new Date(exp.date);
            const dateStr = expDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            return `
                <div class="expense-item">
                    <div class="expense-details">
                        <h3>${exp.description}</h3>
                        <div class="expense-meta">
                            <span class="badge">${exp.category}</span>
                            <span class="expense-date">${dateStr}</span>
                        </div>
                    </div>
                    <div class="expense-right">
                        <span class="expense-amount">$${exp.amount.toFixed(2)}</span>
                        <button class="delete-btn" onclick="deleteExpense(${exp.id})">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateCharts(filtered);
}

// เริ่มต้นเมื่อหน้าเว็บโหลดเสร็จ
init();