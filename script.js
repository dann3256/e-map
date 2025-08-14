document.addEventListener('DOMContentLoaded', () => {
    // ---- アプリケーションの状態管理 ----
    let state = {
        currentView: 'dashboard', // 現在表示している画面
        sales: { month: 350000 }, // 今月の売上（ダミーデータ）
        expenses: [], // 経費リスト
        selectedCategory: null // 選択中の経費カテゴリ
    };

    // ---- DOM要素の取得 ----
    const appContainer = document.getElementById('app-container');
    const headerTitle = document.getElementById('header-title');
    const navButtons = {
        dashboard: document.getElementById('nav-dashboard'),
        addExpense: document.getElementById('nav-add-expense'),
        report: document.getElementById('nav-report')
    };
    
    // ---- データの永続化 (localStorage) ----
    function saveData() {
        localStorage.setItem('appState', JSON.stringify(state));
    }

    function loadData() {
        const savedState = localStorage.getItem('appState');
        if (savedState) {
            state = JSON.parse(savedState);
        } else {
            // 初回利用時のダミーデータ
            state.expenses = [
                { date: '2025-08-10', amount: 32000, category: '材料費', memo: '野菜と肉' },
                { date: '2025-08-12', amount: 15000, category: '水道・光熱費', memo: '電気代' },
                { date: '2025-08-14', amount: 80000, category: '家賃', memo: '8月分' },
            ];
        }
    }

    // ---- 画面描画関数 ----

    // ① ダッシュボード画面の描画
    function renderDashboard() {
        const totalExpenses = state.expenses.reduce((sum, item) => sum + item.amount, 0);
        const profit = state.sales.month - totalExpenses;

        appContainer.innerHTML = `
            <div class="card">
                <div class="summary-grid">
                    <div class="summary-item">
                        <h3>今月の売上</h3>
                        <p>¥${state.sales.month.toLocaleString()}</p>
                    </div>
                    <div class="summary-item">
                        <h3>今月の経費</h3>
                        <p>¥${totalExpenses.toLocaleString()}</p>
                    </div>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <div class="summary-item" style="grid-column: 1 / -1;">
                    <h3>現在の利益</h3>
                    <p style="color: ${profit > 0 ? '#34C759' : '#FF3B30'}; font-size: 32px;">¥${profit.toLocaleString()}</p>
                </div>
            </div>
            <div class="card">
                <h3>利益の推移（イメージ）</h3>
                <div class="chart-container">
                    <canvas id="profitChart"></canvas>
                </div>
            </div>
        `;
        
        // グラフを描画
        const ctx = document.getElementById('profitChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['5月', '6月', '7月', '8月'],
                datasets: [{
                    label: '利益 (円)',
                    data: [120000, 190000, 150000, profit],
                    backgroundColor: 'rgba(0, 122, 255, 0.7)',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // ② 経費入力画面の描画
    function renderAddExpenseForm() {
        const categories = ['材料費', '人件費', '家賃', '水道・光熱費', '広告費', 'その他'];
        
        appContainer.innerHTML = `
            <div class="card">
                <form id="expense-form">
                    <div class="form-group">
                        <label for="amount">金額（円）</label>
                        <input type="number" id="amount" placeholder="例: 3500" required>
                    </div>
                    <div class="form-group">
                        <label>費用の種類</label>
                        <div class="category-buttons">
                            ${categories.map(cat => `<button type="button" class="category-button" data-category="${cat}">${cat}</button>`).join('')}
                        </div>
                    </div>
                     <div class="form-group">
                        <label for="date">日付</label>
                        <input type="date" id="date" value="${new Date().toISOString().slice(0,10)}" required>
                    </div>
                    <div class="form-group">
                        <label for="memo">メモ（任意）</label>
                        <input type="text" id="memo" placeholder="例: キャベツ、豚肉">
                    </div>
                    <button type="submit" class="submit-button">この内容で登録する</button>
                </form>
            </div>
        `;

        // カテゴリボタンのクリックイベント
        document.querySelectorAll('.category-button').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                state.selectedCategory = e.target.dataset.category;
            });
        });

        // フォームの送信イベント
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseInt(document.getElementById('amount').value);
            const date = document.getElementById('date').value;
            const memo = document.getElementById('memo').value;

            if (!amount || !state.selectedCategory || !date) {
                alert('金額、費用の種類、日付は必須です。');
                return;
            }

            state.expenses.push({ date, amount, category: state.selectedCategory, memo });
            state.selectedCategory = null;
            saveData();
            alert('経費を登録しました！');
            
            navigate('dashboard');
        });
    }

    // ③ レポート画面の描画
    function renderReport() {
        const totalExpenses = state.expenses.reduce((sum, item) => sum + item.amount, 0);
        
        const expensesByCategory = state.expenses.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
        }, {});

        appContainer.innerHTML = `
            <div class="card">
                <h3>月次サマリー（2025年8月）</h3>
                <div class="expense-list">
                    <div class="expense-list-item"><span>売上合計</span><strong>¥${state.sales.month.toLocaleString()}</strong></div>
                    <div class="expense-list-item"><span>経費合計</span><strong>¥${totalExpenses.toLocaleString()}</strong></div>
                    <div class="expense-list-item"><span>利益</span><strong style="font-size: 1.2em; color: var(--primary-color);">¥${(state.sales.month - totalExpenses).toLocaleString()}</strong></div>
                </div>
            </div>
            <div class="card">
                <h3>経費の内訳</h3>
                <div class="expense-list">
                    ${Object.entries(expensesByCategory).map(([category, amount]) => `
                        <div class="expense-list-item">
                            <span>${category}</span>
                            <strong>¥${amount.toLocaleString()}</strong>
                        </div>
                    `).join('')}
                </div>
            </div>
             <div class="card">
                <h3>確定申告用データ出力</h3>
                <p style="font-size: 14px; color: #555;">年間のデータを会計ソフトに取り込める形式（CSV）でダウンロードできます。</p>
                <button id="export-csv" class="submit-button" style="background-color: var(--primary-color); box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);">CSVをダウンロード</button>
            </div>
        `;
        
        document.getElementById('export-csv').addEventListener('click', exportCSV);
    }
    
    // ---- CSVエクスポート機能 ----
    function exportCSV() {
        let csvContent = "data:text/csv;charset=utf-8,日付,勘定科目,摘要,支払金額\n";
        state.expenses.forEach(item => {
            csvContent += `${item.date},${item.category},${item.memo},${item.amount}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "iizuka_e-chobo_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('CSVファイルをダウンロードしました。');
    }

    // ---- ナビゲーション制御 ----
    function navigate(view) {
        state.currentView = view;
        updateView();
        window.scrollTo(0, 0); // 画面遷移時にトップにスクロール
    }

    function updateView() {
        Object.values(navButtons).forEach(button => button.classList.remove('active'));

        switch (state.currentView) {
            case 'addExpense':
                headerTitle.textContent = '経費の入力';
                navButtons.addExpense.classList.add('active');
                renderAddExpenseForm();
                break;
            case 'report':
                headerTitle.textContent = 'レポートと申告';
                navButtons.report.classList.add('active');
                renderReport();
                break;
            case 'dashboard':
            default:
                headerTitle.textContent = 'ダッシュボード';
                navButtons.dashboard.classList.add('active');
                renderDashboard();
                break;
        }
    }

    // ---- イベントリスナーの設定 ----
    navButtons.dashboard.addEventListener('click', () => navigate('dashboard'));
    navButtons.addExpense.addEventListener('click', () => navigate('addExpense'));
    navButtons.report.addEventListener('click', () => navigate('report'));

    // ---- アプリケーションの初期化 ----
    loadData();
    updateView();
});