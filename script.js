/**
 * نظام إدارة المصروفات والدخل الشخصي - الإصدار 3.0
 * ملف التحكم الأساسي (script.js)
 * متوافق بنسبة 100% مع وثيقة PRD
 */

// ==========================================
// 1. دليل الربط وحارس الجلسة (PRD Lines 49-66)
// ==========================================
const currentUser = localStorage.getItem('activeUser');
if (!currentUser) {
    window.location.href = 'login.html';
}

// 2. مفتاح التخزين المستقل للمستخدم الحالي
const USER_STORAGE_KEY = `transactions_${currentUser}`;

// 3. جلب البيانات الخاصة بالمستخدم الحالي فقط
let transactions = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || [];

// 4. حفظ البيانات الخاصة بالمستخدم الحالي فقط
function saveTransactions() {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(transactions));
}

// 5. دالة تسجيل الخروج
function logout() {
    localStorage.removeItem('activeUser');
    window.location.href = 'login.html';
}

// ==========================================
// 2. معايير العملة وتنسيق المبالغ (PRD Lines 16-19)
// ==========================================
function formatYER(amount) {
    return Number(amount).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ر.ي';
}

// ==========================================
// التصنيفات المالية المعتمدة والأيقونات
// ==========================================
const CATEGORIES = {
    income: [
        { name: 'راتب', icon: 'fa-money-bill-wave', color: 'emerald' },
        { name: 'عمل حر', icon: 'fa-laptop-code', color: 'blue' },
        { name: 'استثمارات وأرباح', icon: 'fa-chart-line', color: 'teal' },
        { name: 'تحويلات وهدايا', icon: 'fa-gift', color: 'purple' },
        { name: 'بيع مقتنيات', icon: 'fa-tags', color: 'indigo' },
        { name: 'أخرى', icon: 'fa-plus', color: 'slate' }
    ],
    expense: [
        { name: 'مواد غذائية', icon: 'fa-basket-shopping', color: 'amber' },
        { name: 'فواتير وكهرباء', icon: 'fa-bolt', color: 'yellow' },
        { name: 'إيجار وسكن', icon: 'fa-house', color: 'purple' },
        { name: 'مواصلات', icon: 'fa-car', color: 'cyan' },
        { name: 'تحويلات ومحافظ محلية', icon: 'fa-building-columns', color: 'sky' },
        { name: 'صحة وعلاج', icon: 'fa-heart-pulse', color: 'rose' },
        { name: 'تعليم ودورات', icon: 'fa-graduation-cap', color: 'blue' },
        { name: 'تسوق وملابس', icon: 'fa-bag-shopping', color: 'pink' },
        { name: 'مطاعم وكافيهات', icon: 'fa-utensils', color: 'orange' },
        { name: 'صيانة وترميم', icon: 'fa-screwdriver-wrench', color: 'stone' },
        { name: 'أخرى', icon: 'fa-circle-question', color: 'slate' }
    ]
};

// خريطة أيقونات التصنيفات للوصول السريع
const CATEGORY_MAP = {};
[...CATEGORIES.income, ...CATEGORIES.expense].forEach(cat => {
    CATEGORY_MAP[cat.name] = cat;
});

// متغيرات الرسوم البيانية لـ Chart.js
let categoryPieChartInstance = null;
let monthlyBarChartInstance = null;

// معرف العملية الجاري حذفها حالياً
let pendingDeleteId = null;

// ==========================================
// نظام الإشعارات العائمة
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
        success: 'bg-emerald-600 text-white border-emerald-500',
        error: 'bg-rose-600 text-white border-rose-500',
        info: 'bg-blue-600 text-white border-blue-500',
        warning: 'bg-amber-600 text-white border-amber-500'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-circle-xmark',
        info: 'fa-circle-info',
        warning: 'fa-triangle-exclamation'
    };

    toast.className = `toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium ${bgColors[type] || bgColors.info} pointer-events-auto`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.info} text-lg"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-leave');
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

// ==========================================
// تهيئة معلومات المستخدم والشريط العلوي
// ==========================================
function setupUserInfo() {
    let fullName = currentUser;
    try {
        const users = JSON.parse(localStorage.getItem('app_users')) || {};
        if (users[currentUser] && users[currentUser].fullName) {
            fullName = users[currentUser].fullName;
        }
    } catch (e) {
        console.warn('تعذر قراءة ملف المستخدمين:', e);
    }

    const firstChar = fullName.trim().charAt(0) || 'م';
    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userFullName');
    const handleEl = document.getElementById('userHandle');
    const greetingNameEl = document.getElementById('greetingName');
    const exportFileEl = document.getElementById('exportFileName');

    if (avatarEl) avatarEl.textContent = firstChar;
    if (nameEl) nameEl.textContent = fullName;
    if (handleEl) handleEl.textContent = `@${currentUser}`;
    if (greetingNameEl) greetingNameEl.textContent = fullName;
    if (exportFileEl) exportFileEl.textContent = `masareefi_backup_${currentUser}.json`;

    // تاريخ اليوم بالعربية
    const todayEl = document.getElementById('todayDateText');
    if (todayEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const nowArabic = new Date().toLocaleDateString('ar-YE', options);
        todayEl.innerHTML = `<i class="fa-regular fa-calendar-days text-blue-400"></i> <span>اليوم: ${nowArabic}</span>`;
    }
}

// ==========================================
// حساب وتحديث بطاقات الملخص المالي
// ==========================================
function updateSummaryCards() {
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    transactions.forEach(tx => {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') {
            totalIncome += amt;
            incomeCount++;
        } else if (tx.type === 'expense') {
            totalExpense += amt;
            expenseCount++;
        }
    });

    const netBalance = totalIncome - totalExpense;

    // عناصر واجهة المستخدم
    const balanceEl = document.getElementById('totalBalanceAmount');
    const incomeEl = document.getElementById('totalIncomeAmount');
    const expenseEl = document.getElementById('totalExpenseAmount');
    const balanceStatusBadge = document.getElementById('balanceStatusBadge');
    const incomeCountBadge = document.getElementById('incomeCountBadge');
    const expenseCountBadge = document.getElementById('expenseCountBadge');
    const exportCountBadge = document.getElementById('exportCountBadge');
    const totalTxCountVal = document.getElementById('totalTxCountVal');
    const savingsRateVal = document.getElementById('savingsRateVal');

    if (balanceEl) balanceEl.textContent = formatYER(netBalance);
    if (incomeEl) incomeEl.textContent = `+ ${formatYER(totalIncome)}`;
    if (expenseEl) expenseEl.textContent = `- ${formatYER(totalExpense)}`;

    if (incomeCountBadge) incomeCountBadge.textContent = `${incomeCount} عملية (+)`;
    if (expenseCountBadge) expenseCountBadge.textContent = `${expenseCount} عملية (-)`;
    if (exportCountBadge) exportCountBadge.textContent = `${transactions.length} عملية مسجلة`;
    if (totalTxCountVal) totalTxCountVal.textContent = `${transactions.length} حركة`;

    // تحديث حالة الرصيد
    if (balanceStatusBadge) {
        if (netBalance > 0) {
            balanceStatusBadge.textContent = 'فائض مالي ممتاز';
            balanceStatusBadge.className = 'text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
        } else if (netBalance === 0) {
            balanceStatusBadge.textContent = 'الرصيد متوازن';
            balanceStatusBadge.className = 'text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300';
        } else {
            balanceStatusBadge.textContent = 'عجز مالي - مطلوب ترشيد';
            balanceStatusBadge.className = 'text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300';
        }
    }

    // حساب نسبة التوفير
    if (savingsRateVal) {
        if (totalIncome > 0) {
            const rate = Math.round((netBalance / totalIncome) * 100);
            savingsRateVal.textContent = `${rate}%`;
            savingsRateVal.className = rate >= 0 ? 'text-base font-bold text-emerald-600 font-mono' : 'text-base font-bold text-rose-600 font-mono';
        } else {
            savingsRateVal.textContent = '0%';
            savingsRateVal.className = 'text-base font-bold text-slate-500 font-mono';
        }
    }
}

// ==========================================
// بناء وتحديث الرسوم البيانية (Chart.js)
// ==========================================
function updateCharts() {
    // 1. حساب المصروفات حسب التصنيف
    const expensesByCategory = {};
    let totalExpenseAmount = 0;

    transactions.forEach(tx => {
        if (tx.type === 'expense') {
            const cat = tx.category || 'أخرى';
            const amt = Number(tx.amount) || 0;
            expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amt;
            totalExpenseAmount += amt;
        }
    });

    const categoryLabels = Object.keys(expensesByCategory);
    const categoryData = Object.values(expensesByCategory);

    // معرفة أعلى بند صرف
    const topExpenseCategoryVal = document.getElementById('topExpenseCategoryVal');
    if (topExpenseCategoryVal) {
        if (categoryLabels.length > 0) {
            let maxCat = categoryLabels[0];
            let maxAmt = expensesByCategory[maxCat];
            categoryLabels.forEach(cat => {
                if (expensesByCategory[cat] > maxAmt) {
                    maxCat = cat;
                    maxAmt = expensesByCategory[cat];
                }
            });
            topExpenseCategoryVal.textContent = `${maxCat} (${formatYER(maxAmt)})`;
        } else {
            topExpenseCategoryVal.textContent = 'لا توجد مصاريف';
        }
    }

    // قائمة ملخص التصنيفات أسفل المخطط الدائري
    const summaryList = document.getElementById('categorySummaryList');
    if (summaryList) {
        if (categoryLabels.length === 0) {
            summaryList.innerHTML = '<p class="text-slate-500 text-center py-2">لا توجد مصروفات مسجلة لعرضها</p>';
        } else {
            // ترتيب التصنيفات من الأعلى صرفاً للأدنى
            const sortedCats = [...categoryLabels].sort((a, b) => expensesByCategory[b] - expensesByCategory[a]);
            summaryList.innerHTML = sortedCats.map(cat => {
                const amt = expensesByCategory[cat];
                const pct = totalExpenseAmount > 0 ? Math.round((amt / totalExpenseAmount) * 100) : 0;
                const icon = CATEGORY_MAP[cat]?.icon || 'fa-tag';
                return `
                    <div class="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-0">
                        <span class="flex items-center gap-1.5 text-slate-700 font-medium">
                            <i class="fa-solid ${icon} text-slate-400 text-xs w-4 text-center"></i>
                            <span>${cat}</span>
                        </span>
                        <div class="flex items-center gap-2">
                            <span class="text-rose-600 font-mono font-bold">${formatYER(amt)}</span>
                            <span class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">${pct}%</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // التحقق من توفر مكتبة Chart.js
    if (typeof Chart === 'undefined') {
        console.warn('مكتبة Chart.js غير متوفرة أو لم تكتمل عملية تحميلها بعد.');
        return;
    }
    const piePalette = [
        '#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
        '#06b6d4', '#ec4899', '#14b8a6', '#64748b', '#eab308'
    ];

    // رسم / تحديث مخطط الدونت (Doughnut Chart)
    const pieCanvas = document.getElementById('categoryPieChart');
    if (pieCanvas) {
        if (categoryPieChartInstance) {
            categoryPieChartInstance.destroy();
        }

        if (categoryLabels.length === 0) {
            // رسم حالة فارغة
            categoryPieChartInstance = new Chart(pieCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['لا توجد مصاريف'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#e2e8f0'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    },
                    cutout: '72%'
                }
            });
        } else {
            categoryPieChartInstance = new Chart(pieCanvas, {
                type: 'doughnut',
                data: {
                    labels: categoryLabels,
                    datasets: [{
                        data: categoryData,
                        backgroundColor: piePalette.slice(0, categoryLabels.length),
                        borderColor: '#ffffff',
                        borderWidth: 2,
                        hoverOffset: 6
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
                            rtl: true,
                            bodyFont: { family: 'Cairo' },
                            titleFont: { family: 'Cairo' },
                            callbacks: {
                                label: function(context) {
                                    const val = context.raw || 0;
                                    const pct = totalExpenseAmount > 0 ? Math.round((val / totalExpenseAmount) * 100) : 0;
                                    return ` ${formatYER(val)} (${pct}%)`;
                                }
                            }
                        }
                    },
                    cutout: '68%'
                }
            });
        }
    }

    // 2. تجميع البيانات شهرياً لمخطط الأعمدة (Monthly Bar Chart)
    const monthlyData = {};
    transactions.forEach(tx => {
        const dateStr = tx.date || (tx.createdAt ? tx.createdAt.split('T')[0] : '');
        if (!dateStr) return;
        const monthKey = dateStr.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') {
            monthlyData[monthKey].income += amt;
        } else if (tx.type === 'expense') {
            monthlyData[monthKey].expense += amt;
        }
    });

    let months = Object.keys(monthlyData).sort();
    if (months.length === 0) {
        const curMonth = new Date().toISOString().substring(0, 7);
        months = [curMonth];
        monthlyData[curMonth] = { income: 0, expense: 0 };
    }

    // عرض آخر 6 أشهر
    if (months.length > 6) {
        months = months.slice(months.length - 6);
    }

    const monthLabelsArabic = months.map(m => {
        const [year, month] = m.split('-');
        const dateObj = new Date(year, parseInt(month) - 1, 1);
        return dateObj.toLocaleDateString('ar-YE', { month: 'short', year: 'numeric' });
    });

    const incomeBars = months.map(m => monthlyData[m]?.income || 0);
    const expenseBars = months.map(m => monthlyData[m]?.expense || 0);

    const barCanvas = document.getElementById('monthlyBarChart');
    if (barCanvas) {
        if (monthlyBarChartInstance) {
            monthlyBarChartInstance.destroy();
        }

        monthlyBarChartInstance = new Chart(barCanvas, {
            type: 'bar',
            data: {
                labels: monthLabelsArabic,
                datasets: [
                    {
                        label: 'الدخل (+)',
                        data: incomeBars,
                        backgroundColor: '#059669',
                        borderRadius: 6,
                        barPercentage: 0.6,
                        categoryPercentage: 0.8
                    },
                    {
                        label: 'المصروفات (-)',
                        data: expenseBars,
                        backgroundColor: '#e11d48',
                        borderRadius: 6,
                        barPercentage: 0.6,
                        categoryPercentage: 0.8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        rtl: true,
                        bodyFont: { family: 'Cairo' },
                        titleFont: { family: 'Cairo' },
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${formatYER(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { family: 'Cairo' } }
                    },
                    y: {
                        grid: { color: '#e2e8f0' },
                        ticks: {
                            color: '#64748b',
                            font: { family: 'Cairo' },
                            callback: function(val) {
                                if (val >= 1000000) return (val / 1000000) + 'M ر.ي';
                                if (val >= 1000) return (val / 1000) + 'K ر.ي';
                                return val;
                            }
                        }
                    }
                }
            }
        });
    }
}

// ==========================================
// إدارة وعرض جدول العمليات المالية مع الفلترة
// ==========================================
function renderTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    const mobileList = document.getElementById('transactionsMobileList');
    const emptyState = document.getElementById('emptyStateContainer');
    const countEl = document.getElementById('filteredResultsCount');
    if (!tbody && !mobileList) return;

    // قراءة قيم الفلاتر
    const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const filterType = document.getElementById('filterTypeSelect')?.value || 'all';
    const filterCat = document.getElementById('filterCategorySelect')?.value || 'all';
    const filterTime = document.getElementById('filterTimeSelect')?.value || 'all';

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    // فلترة العمليات
    let filtered = transactions.filter(tx => {
        // فلتر النوع
        if (filterType !== 'all' && tx.type !== filterType) {
            return false;
        }

        // فلتر التصنيف
        if (filterCat !== 'all' && tx.category !== filterCat) {
            return false;
        }

        // فلتر البحث النصي
        if (searchVal) {
            const desc = (tx.description || '').toLowerCase();
            const cat = (tx.category || '').toLowerCase();
            const notes = (tx.notes || '').toLowerCase();
            const amountStr = String(tx.amount || '');
            if (!desc.includes(searchVal) && !cat.includes(searchVal) && !notes.includes(searchVal) && !amountStr.includes(searchVal)) {
                return false;
            }
        }

        // فلتر الفترة الزمنية
        if (filterTime !== 'all' && tx.date) {
            const txDate = new Date(tx.date);
            if (filterTime === 'this_month') {
                if (txDate.getFullYear() !== curYear || txDate.getMonth() !== curMonth) {
                    return false;
                }
            } else if (filterTime === 'this_year') {
                if (txDate.getFullYear() !== curYear) {
                    return false;
                }
            } else if (filterTime === 'last_7_days') {
                const diffTime = Math.abs(now - txDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 7) {
                    return false;
                }
            }
        }

        return true;
    });

    // الترتيب: الأحدث أولاً (حسب التاريخ والمعرف)
    filtered.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0);
        const dateB = new Date(b.date || b.createdAt || 0);
        return dateB - dateA;
    });

    if (countEl) {
        countEl.textContent = `عرض ${filtered.length} من إجمالي ${transactions.length} عملية مسجلة في مصاريفي`;
    }

    if (filtered.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (mobileList) mobileList.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // 1. توليد صفوف الجدول للشاشات الكبيرة والمتوسطة
    if (tbody) {
        tbody.innerHTML = filtered.map(tx => {
            const isIncome = tx.type === 'income';
            const typeBadge = isIncome
                ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-arrow-down-left"></i> دخل وارد (+)</span>`
                : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><i class="fa-solid fa-arrow-up-right"></i> مصروف صادر (-)</span>`;

            const catInfo = CATEGORY_MAP[tx.category] || { icon: 'fa-tag', color: 'slate' };
            const formattedAmount = (isIncome ? '+ ' : '- ') + formatYER(tx.amount);
            const amountClass = isIncome ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold';

            return `
                <tr class="hover:bg-slate-50 transition group">
                    <!-- النوع -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                        ${typeBadge}
                    </td>

                    <!-- البيان والوصف والملاحظات -->
                    <td class="py-3.5 px-4">
                        <div class="font-bold text-slate-800 text-xs">${escapeHtml(tx.description)}</div>
                        ${tx.notes ? `<div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium"><i class="fa-solid fa-comment-dots text-[10px] text-blue-600"></i> ${escapeHtml(tx.notes)}</div>` : ''}
                    </td>

                    <!-- التصنيف -->
                    <td class="py-3.5 px-4 whitespace-nowrap">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <i class="fa-solid ${catInfo.icon} text-blue-600 text-xs"></i>
                            ${escapeHtml(tx.category || 'أخرى')}
                        </span>
                    </td>

                    <!-- التاريخ -->
                    <td class="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px] font-medium" dir="ltr">
                        ${tx.date || '-'}
                    </td>

                    <!-- المبلغ بالريال اليمني -->
                    <td class="py-3.5 px-4 whitespace-nowrap font-mono text-sm ${amountClass}">
                        ${formattedAmount}
                    </td>

                    <!-- الإجراءات (تعديل / حذف) -->
                    <td class="py-3.5 px-4 whitespace-nowrap text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            <button onclick="openEditModal('${tx.id}')" title="تعديل العملية"
                                    class="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 border border-slate-200 transition">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button onclick="confirmDelete('${tx.id}')" title="حذف العملية"
                                    class="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 border border-slate-200 transition">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 2. توليد بطاقات أنيقة مخصصة لهواتف Android و iPhone
    if (mobileList) {
        mobileList.innerHTML = filtered.map(tx => {
            const isIncome = tx.type === 'income';
            const catInfo = CATEGORY_MAP[tx.category] || { icon: 'fa-tag', color: 'slate' };
            const formattedAmount = (isIncome ? '+ ' : '- ') + formatYER(tx.amount);
            const amountClass = isIncome ? 'text-emerald-600' : 'text-rose-600';
            const typeLabel = isIncome ? 'دخل وارد (+)' : 'مصروف صادر (-)';
            const typeBadgeClass = isIncome ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200';

            return `
                <div class="glass-panel rounded-2xl p-3.5 bg-white border border-slate-200 shadow-xs flex flex-col gap-2.5">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-xl ${isIncome ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'} flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                                <i class="fa-solid ${catInfo.icon}"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-900 text-xs leading-snug">${escapeHtml(tx.description)}</h4>
                                <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                    <span>${escapeHtml(tx.category || 'أخرى')}</span>
                                    <span>•</span>
                                    <span dir="ltr" class="font-mono text-[10px]">${tx.date || '-'}</span>
                                </span>
                            </div>
                        </div>
                        <div class="text-left font-mono font-bold text-sm ${amountClass} whitespace-nowrap">
                            ${formattedAmount}
                        </div>
                    </div>
                    ${tx.notes ? `
                        <div class="text-[11px] text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1 border border-slate-100 flex items-center gap-1.5">
                            <i class="fa-solid fa-comment-dots text-blue-600 text-[10px]"></i>
                            <span class="truncate">${escapeHtml(tx.notes)}</span>
                        </div>
                    ` : ''}
                    <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${typeBadgeClass} border">
                            ${typeLabel}
                        </span>
                        <div class="flex items-center gap-1.5">
                            <button onclick="openEditModal('${tx.id}')" title="تعديل العملية"
                                    class="px-2.5 py-1 rounded-lg bg-slate-100 active:bg-blue-100 text-slate-600 active:text-blue-700 border border-slate-200 text-xs font-bold flex items-center gap-1">
                                <i class="fa-solid fa-pen-to-square text-[10px]"></i>
                                <span>تعديل</span>
                            </button>
                            <button onclick="confirmDelete('${tx.id}')" title="حذف العملية"
                                    class="px-2.5 py-1 rounded-lg bg-slate-100 active:bg-rose-100 text-slate-600 active:text-rose-700 border border-slate-200 text-xs font-bold flex items-center gap-1">
                                <i class="fa-solid fa-trash-can text-[10px]"></i>
                                <span>حذف</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// أداة لمنع ثغرات XSS
function escapeHtml(string) {
    if (!string) return '';
    return String(string)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================
// تحديث قوائم التصنيفات في الفلتر والنموذج
// ==========================================
function populateCategoryOptions(selectedType = 'expense', activeCatValue = '') {
    const modalCategorySelect = document.getElementById('txCategory');
    if (modalCategorySelect) {
        const catList = CATEGORIES[selectedType] || CATEGORIES.expense;
        modalCategorySelect.innerHTML = catList.map(cat => `
            <option value="${cat.name}" ${cat.name === activeCatValue ? 'selected' : ''}>
                ${cat.name}
            </option>
        `).join('');
    }
}

function populateFilterCategories() {
    const filterCategorySelect = document.getElementById('filterCategorySelect');
    if (!filterCategorySelect) return;

    // استخراج التصنيفات الفريدة الموجودة
    const uniqueCats = new Set();
    transactions.forEach(tx => {
        if (tx.category) uniqueCats.add(tx.category);
    });

    let html = '<option value="all">جميع التصنيفات</option>';
    uniqueCats.forEach(cat => {
        html += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
    });
    filterCategorySelect.innerHTML = html;
}

// ==========================================
// إدارة نافذة الإضافة والتعديل (Transaction Modal)
// ==========================================
function openAddModal() {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');
    const modalTitle = document.getElementById('modalTitle');
    const editingId = document.getElementById('editingTransactionId');
    const dateInput = document.getElementById('txDate');
    const preview = document.getElementById('amountFormattedPreview');

    if (form) form.reset();
    if (editingId) editingId.value = '';
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fa-solid fa-circle-plus text-blue-500"></i> <span>إضافة عملية مالية جديدة</span>';
    }
    if (preview) preview.textContent = '';

    // تعيين التاريخ الافتراضي اليوم
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // افتراضياً مصروف
    const expenseRadio = document.querySelector('input[name="txType"][value="expense"]');
    if (expenseRadio) expenseRadio.checked = true;
    populateCategoryOptions('expense');

    if (modal) modal.classList.remove('hidden');
}

function openEditModal(txId) {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) {
        showToast('لم يتم العثور على العملية المطلوبة', 'error');
        return;
    }

    const modal = document.getElementById('transactionModal');
    const modalTitle = document.getElementById('modalTitle');
    const editingId = document.getElementById('editingTransactionId');
    const descInput = document.getElementById('txDescription');
    const amountInput = document.getElementById('txAmount');
    const dateInput = document.getElementById('txDate');
    const notesInput = document.getElementById('txNotes');
    const preview = document.getElementById('amountFormattedPreview');

    if (editingId) editingId.value = tx.id;
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square text-amber-500"></i> <span>تعديل الحركة المالية</span>';
    }
    if (descInput) descInput.value = tx.description || '';
    if (amountInput) {
        amountInput.value = tx.amount || '';
        if (preview) preview.textContent = `= ${formatYER(tx.amount)}`;
    }
    if (dateInput) dateInput.value = tx.date || '';
    if (notesInput) notesInput.value = tx.notes || '';

    const typeRadio = document.querySelector(`input[name="txType"][value="${tx.type}"]`);
    if (typeRadio) typeRadio.checked = true;

    populateCategoryOptions(tx.type, tx.category);

    if (modal) modal.classList.remove('hidden');
}

function closeTransactionModal() {
    const modal = document.getElementById('transactionModal');
    if (modal) modal.classList.add('hidden');
}

// ==========================================
// إدارة الحذف مع نافذة التأكيد
// ==========================================
function confirmDelete(txId) {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    pendingDeleteId = txId;
    const modal = document.getElementById('deleteConfirmModal');
    const details = document.getElementById('deleteConfirmDetails');

    if (details) {
        details.textContent = `سيتم حذف: "${tx.description}" بمبلغ ${formatYER(tx.amount)}`;
    }

    if (modal) modal.classList.remove('hidden');
}

function cancelDelete() {
    pendingDeleteId = null;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.classList.add('hidden');
}

function executeDelete() {
    if (!pendingDeleteId) return;

    transactions = transactions.filter(t => t.id !== pendingDeleteId);
    saveTransactions();

    cancelDelete();
    refreshAllUI();
    showToast('تم حذف العملية وتحديث الرصيد والرسوم البيانية بنجاح', 'success');
}

// ==========================================
// نظام النسخ الاحتياطي والاستيراد (PRD Section 4)
// ==========================================
function openBackupModal() {
    const modal = document.getElementById('backupModal');
    if (modal) modal.classList.remove('hidden');
}

function closeBackupModal() {
    const modal = document.getElementById('backupModal');
    if (modal) modal.classList.add('hidden');
}

// زر تصدير البيانات (Export JSON) -> masareefi_backup_${activeUser}.json
function exportTransactionsJSON() {
    if (transactions.length === 0) {
        showToast('لا توجد عمليات لتصديرها، سجلك فارغ حالياً', 'warning');
        return;
    }

    const exportPayload = {
        app: 'مصاريفي',
        version: '3.0',
        user: currentUser,
        currency: 'YER',
        exportedAt: new Date().toISOString(),
        transactionsCount: transactions.length,
        transactions: transactions
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `masareefi_backup_${currentUser}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(`تم تصدير ملف النسخة الاحتياطية (masareefi_backup_${currentUser}.json) بنجاح`, 'success');
}

// زر استيراد البيانات (Import JSON)
function importTransactionsJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            let importedTransactions = [];

            if (Array.isArray(parsed)) {
                importedTransactions = parsed;
            } else if (parsed && Array.isArray(parsed.transactions)) {
                importedTransactions = parsed.transactions;
            } else {
                throw new Error('تنسيق ملف النسخة الاحتياطية غير متوافق');
            }

            // تنظيف والتحقق من صحة الحركات
            const validTx = importedTransactions.map((tx, idx) => ({
                id: tx.id || `imported_${Date.now()}_${idx}`,
                description: tx.description || 'عملية مستوردة',
                amount: Math.max(1, Math.round(Number(tx.amount) || 0)),
                type: (tx.type === 'income') ? 'income' : 'expense',
                category: tx.category || 'أخرى',
                date: tx.date || new Date().toISOString().split('T')[0],
                notes: tx.notes || '',
                createdAt: tx.createdAt || new Date().toISOString()
            }));

            transactions = validTx;
            saveTransactions();
            refreshAllUI();
            closeBackupModal();
            showToast(`تم استعادة ${validTx.length} عملية بنجاح!`, 'success');

        } catch (err) {
            console.error('خطأ في استيراد الملف:', err);
            showToast('فشل قراءة الملف! تأكد من أنه ملف JSON سليم تم تصديره من النظام', 'error');
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// تحميل بيانات تجريبية بالريال اليمني
function loadSampleData() {
    const today = new Date();
    const formatDate = (offset) => {
        const d = new Date(today);
        d.setDate(d.getDate() - offset);
        return d.toISOString().split('T')[0];
    };

    const samples = [
        { id: 's_1', description: 'راتب الوظيفة الأساسي', amount: 380000, type: 'income', category: 'راتب', date: formatDate(1), notes: 'تحويل عبر الكريمي كاش', createdAt: new Date().toISOString() },
        { id: 's_2', description: 'إيجار المنزل الشهري', amount: 130000, type: 'expense', category: 'إيجار وسكن', date: formatDate(2), notes: 'سداد نقدي لمالك العمارة', createdAt: new Date().toISOString() },
        { id: 's_3', description: 'تموين أسري ومواد غذائية', amount: 55000, type: 'expense', category: 'مواد غذائية', date: formatDate(3), notes: 'أرز، زيت، سكر، تموينات', createdAt: new Date().toISOString() },
        { id: 's_4', description: 'أتعاب برمجة متجر إلكتروني', amount: 120000, type: 'income', category: 'عمل حر', date: formatDate(4), notes: 'حوالة عبر محفظة جوالي', createdAt: new Date().toISOString() },
        { id: 's_5', description: 'فاتورة كهرباء الطاقة والمياه', amount: 22000, type: 'expense', category: 'فواتير وكهرباء', date: formatDate(5), notes: 'سداد إلكتروني عبر جيب', createdAt: new Date().toISOString() },
        { id: 's_6', description: 'بترول للسيارة وتغيير زيت', amount: 24000, type: 'expense', category: 'مواصلات', date: formatDate(6), notes: 'محطة العاصمة', createdAt: new Date().toISOString() },
        { id: 's_7', description: 'تحويل للأهل في القرية', amount: 40000, type: 'expense', category: 'تحويلات ومحافظ محلية', date: formatDate(8), notes: 'حوالة صرافة الكريمي مميز', createdAt: new Date().toISOString() },
        { id: 's_8', description: 'شراء أدوية ومستلزمات صيدلية', amount: 14000, type: 'expense', category: 'صحة وعلاج', date: formatDate(10), notes: 'صيدلية النور', createdAt: new Date().toISOString() },
        { id: 's_9', description: 'استشارة فنية متخصصة', amount: 35000, type: 'income', category: 'عمل حر', date: formatDate(12), notes: 'استلام نقدي', createdAt: new Date().toISOString() },
        { id: 's_10', description: 'عشاء عائلي نهاية الأسبوع', amount: 19000, type: 'expense', category: 'مطاعم وكافيهات', date: formatDate(14), notes: 'مطاعم الشيباني', createdAt: new Date().toISOString() }
    ];

    transactions = samples;
    saveTransactions();
    refreshAllUI();
    closeBackupModal();
    showToast('تم تحميل 10 عمليات تجريبية واقعية بالريال اليمني بنجاح!', 'success');
}

// مسح كافة العمليات الحالية
function clearAllTransactions() {
    if (confirm('تحذير: هل أنت متأكد من مسح كافة العمليات المالية لحسابك نهائياً؟')) {
        transactions = [];
        saveTransactions();
        refreshAllUI();
        closeBackupModal();
        showToast('تم مسح سجل العمليات بالكامل', 'info');
    }
}

// ==========================================
// تحديث شامل لكافة عناصر الواجهة
// ==========================================
function refreshAllUI() {
    updateSummaryCards();
    updateCharts();
    populateFilterCategories();
    renderTransactionsTable();
}

// ==========================================
// تهيئة الأحداث والتفاعلات عند تحميل الصفحة
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. إعداد المستخدم والعناوين
    setupUserInfo();

    // 2. تحديث الواجهة والبيانات
    refreshAllUI();

    // 3. أزرار الفتح والإغلاق للنوافذ
    const quickAddBtn = document.getElementById('quickAddBtn');
    const mobileFabBtn = document.getElementById('mobileFabBtn');
    const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
    const closeTxModalBtn = document.getElementById('closeTransactionModalBtn');
    const cancelTxModalBtn = document.getElementById('cancelTransactionModalBtn');

    if (quickAddBtn) quickAddBtn.addEventListener('click', openAddModal);
    if (mobileFabBtn) mobileFabBtn.addEventListener('click', openAddModal);
    if (emptyStateAddBtn) emptyStateAddBtn.addEventListener('click', openAddModal);
    if (closeTxModalBtn) closeTxModalBtn.addEventListener('click', closeTransactionModal);
    if (cancelTxModalBtn) cancelTxModalBtn.addEventListener('click', closeTransactionModal);

    // أزرار نافذة النسخ الاحتياطي
    const openBackupBtn = document.getElementById('openBackupModalBtn');
    const closeBackupBtn = document.getElementById('closeBackupModalBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const triggerImportBtn = document.getElementById('triggerImportBtn');
    const importFileInput = document.getElementById('importFileInput');
    const loadSampleBtn = document.getElementById('loadSampleDataBtn');
    const clearAllBtn = document.getElementById('clearAllTxBtn');

    if (openBackupBtn) openBackupBtn.addEventListener('click', openBackupModal);
    if (closeBackupBtn) closeBackupBtn.addEventListener('click', closeBackupModal);
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportTransactionsJSON);
    if (triggerImportBtn && importFileInput) {
        triggerImportBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', importTransactionsJSON);
    }
    if (loadSampleBtn) loadSampleBtn.addEventListener('click', loadSampleData);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllTransactions);

    // أزرار الحذف
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const executeDeleteBtn = document.getElementById('executeDeleteBtn');
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', cancelDelete);
    if (executeDeleteBtn) executeDeleteBtn.addEventListener('click', executeDelete);

    // زر الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('هل تريد بالتأكيد تسجيل الخروج؟')) {
                logout();
            }
        });
    }

    // زر طباعة التقرير المالي
    const printBtn = document.getElementById('printReportBtn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // تغيير نوع العملية داخل النموذج (دخل / مصروف) لتحديث التصنيفات المتاحة
    const typeRadios = document.querySelectorAll('input[name="txType"]');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            populateCategoryOptions(e.target.value);
        });
    });

    // معاينة حية لتنسيق المبلغ بالريال اليمني
    const amountInput = document.getElementById('txAmount');
    const previewEl = document.getElementById('amountFormattedPreview');
    if (amountInput && previewEl) {
        amountInput.addEventListener('input', () => {
            const val = Number(amountInput.value);
            if (val > 0) {
                previewEl.textContent = `= ${formatYER(val)}`;
            } else {
                previewEl.textContent = '';
            }
        });
    }

    // معالجة إرسال نموذج العملية المالية (إضافة أو تعديل)
    const txForm = document.getElementById('transactionForm');
    if (txForm) {
        txForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const editingId = document.getElementById('editingTransactionId').value;
            const type = document.querySelector('input[name="txType"]:checked')?.value || 'expense';
            const desc = document.getElementById('txDescription').value.trim();
            const amount = Math.max(1, Math.round(Number(document.getElementById('txAmount').value)));
            const category = document.getElementById('txCategory').value;
            const date = document.getElementById('txDate').value || new Date().toISOString().split('T')[0];
            const notes = document.getElementById('txNotes').value.trim();

            if (!desc) {
                showToast('يرجى إدخال وصف العملية', 'warning');
                return;
            }

            if (!amount || amount <= 0) {
                showToast('المبلغ بالريال اليمني يجب أن يكون أكبر من صفر', 'warning');
                return;
            }

            if (editingId) {
                // تعديل عملية موجودة
                const index = transactions.findIndex(t => t.id === editingId);
                if (index !== -1) {
                    transactions[index] = {
                        ...transactions[index],
                        type,
                        description: desc,
                        amount,
                        category,
                        date,
                        notes,
                        updatedAt: new Date().toISOString()
                    };
                    showToast('تم تحديث العملية المالية بنجاح', 'success');
                }
            } else {
                // إضافة عملية جديدة
                const newTx = {
                    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                    type,
                    description: desc,
                    amount,
                    category,
                    date,
                    notes,
                    createdAt: new Date().toISOString()
                };
                transactions.unshift(newTx);
                showToast('تمت إضافة العملية المالية بالريال اليمني بنجاح', 'success');
            }

            saveTransactions();
            closeTransactionModal();
            refreshAllUI();
        });
    }

    // أحداث الفلاتر والبحث في الجدول
    const searchInput = document.getElementById('searchInput');
    const filterTypeSelect = document.getElementById('filterTypeSelect');
    const filterCategorySelect = document.getElementById('filterCategorySelect');
    const filterTimeSelect = document.getElementById('filterTimeSelect');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    if (searchInput) searchInput.addEventListener('input', renderTransactionsTable);
    if (filterTypeSelect) filterTypeSelect.addEventListener('change', renderTransactionsTable);
    if (filterCategorySelect) filterCategorySelect.addEventListener('change', renderTransactionsTable);
    if (filterTimeSelect) filterTimeSelect.addEventListener('change', renderTransactionsTable);

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (filterTypeSelect) filterTypeSelect.value = 'all';
            if (filterCategorySelect) filterCategorySelect.value = 'all';
            if (filterTimeSelect) filterTimeSelect.value = 'all';
            renderTransactionsTable();
            showToast('تمت إعادة تعيين جميع الفلاتر', 'info');
        });
    }

    // إغلاق النوافذ عند الضغط على زر ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTransactionModal();
            closeBackupModal();
            cancelDelete();
        }
    });
});

// تصدير الدوال الأساسية لـ window للاستدعاء السلس من HTML
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.confirmDelete = confirmDelete;
window.logout = logout;
window.formatYER = formatYER;

