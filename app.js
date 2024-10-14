// Get DOM elements
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const transactionsEl = document.getElementById('transactions');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const addIncomeBtn = document.getElementById('addIncome');
const addExpenseBtn = document.getElementById('addExpense');

let transactions = [];

// Add event listeners to the income and expense buttons
addIncomeBtn.addEventListener('click', function () {
    addTransaction('income');
});

addExpenseBtn.addEventListener('click', function () {
    addTransaction('expense');
});

// Initialize Chart.js
let pieChart;
let monthlyChart;
let cumulativeChart;

// Fetch transactions from the server
async function fetchTransactions() {
    const res = await fetch('http://localhost:port/transactions'); // Backend URL
    const data = await res.json();
    transactions = data;
    console.log("Fetched transactions:", transactions);
    updateValues();
    transactions.forEach(addTransactionDOM);
}

// Add transaction function (modified to send data to the server)
async function addTransaction(type) {
    if (descriptionInput.value.trim() === '' || amountInput.value.trim() === '' || dateInput.value.trim() === '') {
        alert('Please enter a description, amount, and date');
        return;
    }

    const amountValue = type === 'income' ? +amountInput.value : -Math.abs(amountInput.value);
    const transaction = {
        description: descriptionInput.value,
        amount: amountValue,
        date: dateInput.value,
        type: type
    };

    console.log("Adding transaction:", transaction); // Debugging statement

    const res = await fetch('http://localhost:port/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
    });

    const data = await res.json();
    transactions.push(data);
    addTransactionDOM(data);
    updateValues();
    descriptionInput.value = '';
    amountInput.value = '';
    dateInput.value = '';
}

// Remove transaction by ID (modified to delete from server)
async function removeTransaction(id) {
    console.log("Removing transaction with ID:", id); // Debugging statement

    await fetch(`http://localhost:port/transactions/${id}`, {
        method: 'DELETE'
    });

    transactions = transactions.filter(transaction => transaction.id !== id);
    init();
}

// Update values and charts
function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);

    const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => acc + item, 0)
        .toFixed(2);
    const expense = (amounts
        .filter(item => item < 0)
        .reduce((acc, item) => acc + item, 0) * -1)
        .toFixed(2);

    balanceEl.innerText = `$${total}`;
    incomeEl.innerText = `+$${income}`;
    expenseEl.innerText = `-$${expense}`;

    createPieChart(income, expense);
    const monthlyData = getMonthlyData();
    createMonthlyChart(monthlyData);
    const cumulativeData = getCumulativeData(monthlyData);
    createCumulativeChart(cumulativeData);
}

// Add transaction to DOM
function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement('li');

    // Parse the transaction date as a Date object and format it
    const dateObj = new Date(transaction.date); 
    const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString() : "Invalid date";

    item.classList.add(transaction.amount < 0 ? 'expense' : 'income');
    item.innerHTML = `
        ${transaction.description} (${formattedDate})
        <span>${sign}$${Math.abs(transaction.amount)}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
    `;

    transactionsEl.appendChild(item);
}


// Initialize the app
function init() {
    transactionsEl.innerHTML = '';
    fetchTransactions(); // Fetch transactions from the server on initialization
}

// Chart.js functions for creating charts
function createPieChart(income, expense) {
    console.log("Creating Pie Chart with Income:", income, "and Expense:", expense); // Log chart data

    const ctx = document.getElementById('myChart').getContext('2d');
    if (pieChart) pieChart.destroy(); // Destroy previous chart if exists

    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Income vs Expenses',
                data: [income, expense],
                backgroundColor: ['#28a745', '#dc3545'],
                borderColor: ['#28a745', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createMonthlyChart(monthlyData) {
    console.log("Creating Monthly Chart with Data:", monthlyData); // Log chart data

    const ctx = document.getElementById('monthlyChart').getContext('2d');
    if (monthlyChart) monthlyChart.destroy();

    const months = Object.keys(monthlyData);
    const incomes = months.map(month => monthlyData[month].income);
    const expenses = months.map(month => monthlyData[month].expense);

    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomes,
                    backgroundColor: '#28a745',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expenses,
                    backgroundColor: '#dc3545',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createCumulativeChart(cumulativeData) {
    console.log("Creating Cumulative Chart with Data:", cumulativeData); // Log chart data

    const ctx = document.getElementById('cumulativeChart').getContext('2d');
    if (cumulativeChart) cumulativeChart.destroy();

    const months = Object.keys(cumulativeData);
    const cumulativeIncomes = months.map(month => cumulativeData[month].cumulativeIncome);
    const cumulativeExpenses = months.map(month => cumulativeData[month].cumulativeExpense);
    const cumulativeBalances = months.map(month => cumulativeData[month].balance);

    cumulativeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Cumulative Income',
                    data: cumulativeIncomes,
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderColor: '#28a745',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Cumulative Expenses',
                    data: cumulativeExpenses,
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    borderColor: '#dc3545',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Balance',
                    data: cumulativeBalances,
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderColor: '#007bff',
                    borderWidth: 2,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Group transactions by month
// Group transactions by month
function getMonthlyData() {
    const monthlyData = {};

    transactions.forEach(transaction => {
        // Parse the transaction date as a Date object
        const dateObj = new Date(transaction.date); // Convert date string to Date object

        if (!isNaN(dateObj.getTime())) { // Ensure the date is valid
            const month = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

            if (!monthlyData[month]) {
                monthlyData[month] = { income: 0, expense: 0 };
            }

            if (transaction.amount > 0) {
                monthlyData[month].income += transaction.amount;
            } else {
                monthlyData[month].expense += Math.abs(transaction.amount);
            }
        } else {
            console.log("Invalid date for transaction:", transaction); // Log invalid dates if they exist
        }
    });

    console.log("Monthly data:", monthlyData); // Log monthly data for debugging
    return monthlyData;
}

// Get cumulative data for income, expenses, and balance
function getCumulativeData(monthlyData) {
    let cumulativeIncome = 0;
    let cumulativeExpense = 0;
    let cumulativeBalance = 0;
    const cumulativeData = {};

    Object.keys(monthlyData).forEach(month => {
        const income = monthlyData[month].income;
        const expense = monthlyData[month].expense;

        cumulativeIncome += income;
        cumulativeExpense += expense;
        cumulativeBalance = cumulativeIncome - cumulativeExpense;

        cumulativeData[month] = {
            cumulativeIncome,
            cumulativeExpense,
            balance: cumulativeBalance
        };
    });

    console.log("Cumulative data:", cumulativeData); // Log cumulative data for debugging
    return cumulativeData;
}


// Initialize the app
init();