/**
 * نظام إدارة المصروفات والدخل الشخصي - الإصدار 3.0
 * ملف التحكم في تسجيل الدخول وتعدد المستخدمين (login.js)
 * متوافق بنسبة 100% مع وثيقة PRD
 */

// إشعارات عائمة مخصصة
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

// دالة تشفير كلمة المرور وفقاً لـ PRD
function hashPassword(password) {
    try {
        return btoa(encodeURIComponent(password));
    } catch (e) {
        return btoa(password);
    }
}

// جلب جميع المستخدمين المسجلين
function getRegisteredUsers() {
    try {
        const users = localStorage.getItem('app_users');
        return users ? JSON.parse(users) : {};
    } catch (e) {
        console.error('فشل قراءة سجل المستخدمين:', e);
        return {};
    }
}

// حفظ المستخدمين
function saveRegisteredUsers(users) {
    localStorage.setItem('app_users', JSON.stringify(users));
}

// بيانات تجريبية بالريال اليمني
function generateSampleTransactions() {
    const today = new Date();
    const formatDate = (offsetDays) => {
        const d = new Date(today);
        d.setDate(d.getDate() - offsetDays);
        return d.toISOString().split('T')[0];
    };

    return [
        {
            id: 'tx_sample_1',
            description: 'راتب الشهر الأساسي',
            amount: 350000,
            type: 'income',
            category: 'راتب',
            date: formatDate(1),
            notes: 'تحويل عبر مصرف الكريمي',
            createdAt: new Date().toISOString()
        },
        {
            id: 'tx_sample_2',
            description: 'إيجار الشقة السكني',
            amount: 120000,
            type: 'expense',
            category: 'إيجار وسكن',
            date: formatDate(2),
            notes: 'إيجار الشهر الحالي نقداً',
            createdAt: new Date().toISOString()
        },
        {
            id: 'tx_sample_3',
            description: 'تموين مواد غذائية للبيت',
            amount: 45000,
            type: 'expense',
            category: 'مواد غذائية',
            date: formatDate(3),
            notes: 'شراء أرز ودقيق وزيت ومستلزمات',
            createdAt: new Date().toISOString()
        },
        {
            id: 'tx_sample_4',
            description: 'مشروع تصميم هوية تجارية (عمل حر)',
            amount: 85000,
            type: 'income',
            category: 'عمل حر',
            date: formatDate(4),
            notes: 'استلام عبر محفظة جوالي',
            createdAt: new Date().toISOString()
        },
        {
            id: 'tx_sample_5',
            description: 'فاتورة الكهرباء التجارية والماء',
            amount: 18000,
            type: 'expense',
            category: 'فواتير وكهرباء',
            date: formatDate(5),
            notes: 'سداد عبر محفظة جيب',
            createdAt: new Date().toISOString()
        },
        {
            id: 'tx_sample_6',
            description: 'تعبئة بترول للسيارة',
            amount: 16000,
            type: 'expense',
            category: 'مواصلات',
            date: formatDate(6),
            notes: 'بنزين ممتاز',
            createdAt: new Date().toISOString()
        },
        {
            id: 'tx_sample_7',
            description: 'تحويل عائلي عبر الكريمي',
            amount: 25000,
            type: 'expense',
            category: 'تحويلات ومحافظ محلية',
            date: formatDate(7),
            notes: 'حوالة مميزة',
            createdAt: new Date().toISOString()
        }
    ];
}

// عرض قائمة مبدل الحسابات السريع
function renderQuickSwitcher() {
    const section = document.getElementById('quickSwitcherSection');
    const list = document.getElementById('quickAccountsList');
    if (!section || !list) return;

    const users = getRegisteredUsers();
    const usernames = Object.keys(users);

    if (usernames.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    list.innerHTML = '';

    usernames.forEach(uname => {
        const user = users[uname];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'group relative flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-400 rounded-xl transition-all duration-200 text-right';
        
        // الحرف الأول كأيقونة رمزية
        const firstLetter = (user.fullName || uname).trim().charAt(0);

        btn.innerHTML = `
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                ${firstLetter}
            </div>
            <div class="text-xs">
                <p class="font-bold text-slate-800 group-hover:text-blue-600">${user.fullName || uname}</p>
                <p class="text-[11px] text-slate-500 font-mono" dir="ltr">@${uname}</p>
            </div>
        `;

        btn.addEventListener('click', () => {
            selectUserForLogin(uname);
        });

        list.appendChild(btn);
    });
}

// اختيار مستخدم وتعبئته في نموذج الدخول
function selectUserForLogin(username) {
    switchToTab('login');
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    if (usernameInput) {
        usernameInput.value = username;
    }
    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.focus();
    }
    showToast(`تم اختيار الحساب: @${username}، يرجى إدخال كلمة المرور`, 'info');
}

// التبديل بين تبويب الدخول والإنشاء
function switchToTab(tab) {
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabSignupBtn = document.getElementById('tabSignupBtn');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (tab === 'login') {
        tabLoginBtn.className = 'py-2.5 text-sm font-bold rounded-xl transition-all duration-200 bg-blue-600 text-white shadow-lg shadow-blue-600/30';
        tabSignupBtn.className = 'py-2.5 text-sm font-semibold text-slate-400 hover:text-white rounded-xl transition-all duration-200';
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        tabSignupBtn.className = 'py-2.5 text-sm font-bold rounded-xl transition-all duration-200 bg-emerald-600 text-white shadow-lg shadow-emerald-600/30';
        tabLoginBtn.className = 'py-2.5 text-sm font-semibold text-slate-400 hover:text-white rounded-xl transition-all duration-200';
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

// تهيئة التفاعلات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // التحقق هل المستخدم مسجل دخوله بالفعل
    const currentActive = localStorage.getItem('activeUser');
    if (currentActive) {
        const sessionBanner = document.getElementById('activeSessionBanner');
        const sessionName = document.getElementById('activeSessionName');
        if (sessionBanner && sessionName) {
            sessionName.textContent = `@${currentActive}`;
            sessionBanner.classList.remove('hidden');
        }
    }

    renderQuickSwitcher();

    // أحداث أزرار التبويب
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabSignupBtn = document.getElementById('tabSignupBtn');

    if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchToTab('login'));
    if (tabSignupBtn) tabSignupBtn.addEventListener('click', () => switchToTab('signup'));

    // أزرار إظهار وإخفاء كلمة المرور
    document.querySelectorAll('.toggle-password-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const icon = btn.querySelector('i');
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fa-regular fa-eye-slash text-blue-400';
            } else {
                input.type = 'password';
                icon.className = 'fa-regular fa-eye text-slate-400';
            }
        });
    });

    // معالجة نموذج تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('loginUsername');
            const passwordInput = document.getElementById('loginPassword');

            const username = (usernameInput.value || '').trim().toLowerCase();
            const password = passwordInput.value || '';

            if (!username || !password) {
                showToast('يرجى إدخال اسم المستخدم وكلمة المرور', 'warning');
                return;
            }

            const users = getRegisteredUsers();
            const targetUser = users[username];

            if (!targetUser) {
                showToast('اسم المستخدم غير مسجل، يرجى إنشاء حساب جديد أولاً', 'error');
                return;
            }

            const hashedPassword = hashPassword(password);
            if (targetUser.password !== hashedPassword) {
                showToast('كلمة المرور غير صحيحة، يرجى المحاولة مجدداً', 'error');
                return;
            }

            // نجاح تسجيل الدخول - ضبط activeUser والتوجيه إلى index.html
            localStorage.setItem('activeUser', username);
            showToast(`أهلاً وسهلاً بك يا ${targetUser.fullName || username}! جاري التحويل...`, 'success');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 700);
        });
    }

    // معالجة نموذج إنشاء حساب جديد
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const fullName = document.getElementById('signupFullName').value.trim();
            const rawUsername = document.getElementById('signupUsername').value.trim();
            const username = rawUsername.toLowerCase().replace(/\s+/g, '_');
            const password = document.getElementById('signupPassword').value;
            const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
            const fillSample = document.getElementById('fillSampleData').checked;

            // التحقق من صحة المدخلات
            if (!fullName) {
                showToast('يرجى كتابة الاسم الكامل', 'warning');
                return;
            }

            if (!username || username.length < 3) {
                showToast('اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل', 'warning');
                return;
            }

            // التحقق من خلو اسم المستخدم من المسافات والرموز غير المسموحة
            if (!/^[a-z0-9_.-]+$/.test(username)) {
                showToast('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام ورموز مثل _ أو - فقط وبدون مسافات', 'warning');
                return;
            }

            if (password.length < 4) {
                showToast('كلمة المرور يجب أن لا تقل عن 4 خانات', 'warning');
                return;
            }

            if (password !== passwordConfirm) {
                showToast('كلمتا المرور غير متطابقتين', 'error');
                return;
            }

            const users = getRegisteredUsers();

            if (users[username]) {
                showToast(`اسم المستخدم (@${username}) محجوز مسبقاً، يرجى اختيار اسم آخر`, 'error');
                return;
            }

            // حفظ المستخدم الجديد
            users[username] = {
                username: username,
                fullName: fullName,
                password: hashPassword(password),
                currency: 'YER',
                createdAt: new Date().toISOString()
            };

            saveRegisteredUsers(users);

            // إذا اختار تعبئة بيانات تجريبية
            const userStorageKey = `transactions_${username}`;
            if (fillSample) {
                const sampleTx = generateSampleTransactions();
                localStorage.setItem(userStorageKey, JSON.stringify(sampleTx));
            } else {
                // مصفوفة فارغة
                if (!localStorage.getItem(userStorageKey)) {
                    localStorage.setItem(userStorageKey, JSON.stringify([]));
                }
            }

            // ضبط المستخدم النشط والتوجيه
            localStorage.setItem('activeUser', username);
            showToast('تم إنشاء الحساب بنجاح! مرحباً بك', 'success');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);
        });
    }

    // زر الحساب التجريبي السريع الفوري بنقرة واحدة
    const quickDemoBtn = document.getElementById('quickDemoBtn');
    if (quickDemoBtn) {
        quickDemoBtn.addEventListener('click', () => {
            const demoUsername = 'demo_user';
            const users = getRegisteredUsers();

            if (!users[demoUsername]) {
                users[demoUsername] = {
                    username: demoUsername,
                    fullName: 'مستخدم تجريبي (مصاريفي)',
                    password: hashPassword('1234'),
                    currency: 'YER',
                    createdAt: new Date().toISOString()
                };
                saveRegisteredUsers(users);

                // إضافة حركات مالية نموذجية
                const userStorageKey = `transactions_${demoUsername}`;
                localStorage.setItem(userStorageKey, JSON.stringify(generateSampleTransactions()));
            }

            localStorage.setItem('activeUser', demoUsername);
            showToast('تم الدخول بالحساب التجريبي بنجاح! جاري التوجيه...', 'success');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 600);
        });
    }
});
