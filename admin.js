/* =====================================================
   EDU CENTER
   ADMIN SYSTEM
   VERSION 3
   TEACHER SCHEDULE SYSTEM
===================================================== */


/* =====================================================
   GLOBAL DATA
===================================================== */

let teachersCache = [];

let editingTeacherId = null;


/* =====================================================
   SUPABASE CHECK
===================================================== */

function supabaseReady() {

    return (
        typeof supabaseClient !== "undefined" &&
        supabaseClient &&
        supabaseClient.auth
    );

}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    text,
    type = "success"
) {

    const box =
        document.getElementById(
            "adminMessage"
        );

    if (!box) {
        return;
    }

    box.textContent = text;

    box.style.color =
        type === "error"
            ? "#ff9999"
            : "#9be09e";

    box.style.borderColor =
        type === "error"
            ? "rgba(255,70,70,.2)"
            : "rgba(80,200,90,.2)";

    box.classList.add("show");

    setTimeout(
        function () {

            box.classList.remove("show");

        },
        3500
    );

}


/* =====================================================
   AUTH CHECK
===================================================== */

async function checkAdminAccess() {

    if (!supabaseReady()) {

        window.location.href =
            "admin-login.html";

        return false;

    }

    try {

        const {
            data: {
                session
            }
        } =
            await supabaseClient
                .auth
                .getSession();

        if (!session) {

            window.location.href =
                "admin-login.html";

            return false;

        }

        const {
            data: profile,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select("full_name, role")
                .eq("id", session.user.id)
                .maybeSingle();

        if (error) {
            throw error;
        }

        if (
            !profile ||
            profile.role !== "manager"
        ) {

            await supabaseClient
                .auth
                .signOut();

            window.location.href =
                "admin-login.html";

            return false;

        }

        const welcome =
            document.getElementById(
                "welcomeText"
            );

        if (welcome) {

            welcome.textContent =
                "مرحبًا " +
                (
                    profile.full_name ||
                    "مدير الموقع"
                ) +
                " — تحكم في EDU CENTER";

        }

        const email =
            document.getElementById(
                "adminEmailDisplay"
            );

        if (email) {

            email.textContent =
                session.user.email ||
                "غير متاح";

        }

        return true;

    } catch (error) {

        console.error(
            "Admin Access Error:",
            error
        );

        window.location.href =
            "admin-login.html";

        return false;

    }

}


/* =====================================================
   NAVIGATION
===================================================== */

function setupNavigation() {

    const links =
        document.querySelectorAll(
            ".side-link[data-section]"
        );

    const sections =
        document.querySelectorAll(
            ".admin-section"
        );

    links.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    const sectionName =
                        link.dataset.section;

                    links.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );

                    link.classList.add(
                        "active"
                    );

                    sections.forEach(
                        function (section) {

                            section.classList.remove(
                                "active"
                            );

                        }
                    );

                    const target =
                        document.getElementById(
                            "section-" +
                            sectionName
                        );

                    if (target) {

                        target.classList.add(
                            "active"
                        );

                    }

                    closeMobileSidebar();

                }
            );

        }
    );


    document
        .querySelectorAll(
            "[data-open-section]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const name =
                            button.dataset
                                .openSection;

                        const targetLink =
                            document.querySelector(
                                `[data-section="${name}"]`
                            );

                        if (targetLink) {

                            targetLink.click();

                        }

                    }
                );

            }
        );

}


/* =====================================================
   MOBILE SIDEBAR
===================================================== */

function closeMobileSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }

    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }

    document.body.classList.remove(
        "sidebar-open"
    );

}


/* =====================================================
   LOGOUT
===================================================== */

function setupLogout() {

    const button =
        document.getElementById(
            "adminLogout"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async function () {

            button.disabled = true;

            try {

                await supabaseClient
                    .auth
                    .signOut();

                window.location.href =
                    "admin-login.html";

            } catch (error) {

                console.error(
                    "Logout Error:",
                    error
                );

                button.disabled = false;

            }

        }
    );

}


/* =====================================================
   SCHEDULE DATA
===================================================== */

const SCHEDULE_STORAGE_VERSION = 1;


/*
    الشكل الذي سيتم تخزينه داخل teachers.schedule:

    {
        "version": 1,
        "items": [
            {
                "stage": "أولى إعدادي",
                "day": "السبت",
                "start": "17:00",
                "end": "19:00",
                "status": "available"
            }
        ]
    }
*/


function normalizeScheduleItem(item) {

    return {

        stage:
            String(
                item?.stage || ""
            ).trim(),

        day:
            String(
                item?.day || ""
            ).trim(),

        start:
            String(
                item?.start || ""
            ).trim(),

        end:
            String(
                item?.end || ""
            ).trim(),

        status:
            [
                "available",
                "full",
                "stopped"
            ].includes(item?.status)
                ? item.status
                : "available"

    };

}


function parseSchedule(value) {

    if (!value) {

        return {
            isStructured: true,
            items: []
        };

    }


    if (
        typeof value === "object" &&
        Array.isArray(value.items)
    ) {

        return {

            isStructured: true,

            items:
                value.items.map(
                    normalizeScheduleItem
                )

        };

    }


    const text =
        String(value).trim();


    if (!text) {

        return {
            isStructured: true,
            items: []
        };

    }


    try {

        const parsed =
            JSON.parse(text);

        if (
            parsed &&
            Array.isArray(
                parsed.items
            )
        ) {

            return {

                isStructured: true,

                items:
                    parsed.items.map(
                        normalizeScheduleItem
                    )

            };

        }

    } catch (error) {

        /*
         * قد يكون جدولًا قديمًا
         * مكتوبًا كنص.
         */

    }


    return {

        isStructured: false,

        text: text,

        items: []

    };

}


function serializeSchedule(items) {

    return JSON.stringify({

        version:
            SCHEDULE_STORAGE_VERSION,

        items:
            items.map(
                normalizeScheduleItem
            )

    });

}


/* =====================================================
   SCHEDULE UI STYLE
===================================================== */

function injectScheduleStyles() {

    if (
        document.getElementById(
            "scheduleManagerStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "scheduleManagerStyles";


    style.textContent = `

        .schedule-manager {
            margin-top: 12px;
            padding: 18px;
            border-radius: 18px;
            border: 1px solid rgba(216,180,90,.14);
            background: rgba(255,255,255,.025);
        }

        .schedule-manager-title {
            color: #d8b45a;
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 14px;
        }

        .schedule-rows {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .schedule-row {
            display: grid;
            grid-template-columns:
                minmax(130px, 1.2fr)
                minmax(110px, 1fr)
                100px
                100px
                minmax(120px, 1fr)
                42px;
            gap: 8px;
            align-items: center;
            padding: 10px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,.07);
            background: rgba(0,0,0,.18);
        }

        .schedule-row input,
        .schedule-row select {
            width: 100%;
            min-width: 0;
            padding: 10px 11px;
            border-radius: 10px;
            border: 1px solid rgba(216,180,90,.13);
            background: rgba(255,255,255,.045);
            color: #fff;
            outline: none;
            font-family: inherit;
        }

        .schedule-row input:focus,
        .schedule-row select:focus {
            border-color: rgba(216,180,90,.55);
        }

        .schedule-row select option {
            background: #151515;
            color: #fff;
        }

        .schedule-remove {
            width: 38px;
            height: 38px;
            border: 0;
            border-radius: 10px;
            cursor: pointer;
            color: #ff9999;
            background: rgba(255,70,70,.08);
            border: 1px solid rgba(255,70,70,.14);
            font-size: 17px;
        }

        .schedule-remove:hover {
            background: rgba(255,70,70,.16);
        }

        .schedule-add {
            margin-top: 12px;
            border: 1px solid rgba(216,180,90,.22);
            background: rgba(216,180,90,.06);
            color: #d8b45a;
            border-radius: 11px;
            padding: 10px 15px;
            cursor: pointer;
            font-family: inherit;
            font-weight: 700;
        }

        .schedule-add:hover {
            background: rgba(216,180,90,.11);
        }

        .schedule-empty {
            color: rgba(255,255,255,.45);
            font-size: 13px;
            padding: 10px 0;
        }

        .schedule-legacy {
            margin-top: 10px;
            padding: 12px;
            border-radius: 12px;
            color: rgba(255,255,255,.6);
            background: rgba(255,190,70,.04);
            border: 1px solid rgba(255,190,70,.1);
            font-size: 13px;
            line-height: 1.8;
            white-space: pre-line;
        }

        @media (max-width: 800px) {

            .schedule-row {
                grid-template-columns: 1fr 1fr;
            }

            .schedule-row input,
            .schedule-row select {
                width: 100%;
            }

            .schedule-remove {
                width: 100%;
            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =====================================================
   SCHEDULE MANAGER
===================================================== */

function setupScheduleManager() {

    const textarea =
        document.getElementById(
            "teacherSchedule"
        );


    if (!textarea) {
        return;
    }


    injectScheduleStyles();


    /*
     * نخفي textarea القديمة.
     * ونستخدمها كحقل تخزين داخلي
     * حتى يظل admin.html متوافقًا.
     */

    textarea.style.display =
        "none";


    const manager =
        document.createElement(
            "div"
        );


    manager.className =
        "schedule-manager";


    manager.id =
        "scheduleManager";


    manager.innerHTML = `

        <div class="schedule-manager-title">
            جدول الحصص
        </div>

        <div
            class="schedule-rows"
            id="scheduleRows"
        ></div>

        <button
            type="button"
            class="schedule-add"
            id="addScheduleRow"
        >
            + إضافة حصة
        </button>

    `;


    textarea.parentNode.insertBefore(
        manager,
        textarea.nextSibling
    );


    const addButton =
        document.getElementById(
            "addScheduleRow"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            function () {

                addScheduleRow();

            }
        );

    }


    renderScheduleRows(
        []
    );

}


/* =====================================================
   ADD SCHEDULE ROW
===================================================== */

function addScheduleRow(
    item = null
) {

    const container =
        document.getElementById(
            "scheduleRows"
        );


    if (!container) {
        return;
    }


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "schedule-row";


    const normalized =
        normalizeScheduleItem(
            item || {}
        );


    row.innerHTML = `

        <input
            type="text"
            class="schedule-stage"
            placeholder="المرحلة"
            value="${escapeAttribute(
                normalized.stage
            )}"
        >

        <select
            class="schedule-day"
        >

            <option value="">اليوم</option>
            <option value="السبت">السبت</option>
            <option value="الأحد">الأحد</option>
            <option value="الاثنين">الاثنين</option>
            <option value="الثلاثاء">الثلاثاء</option>
            <option value="الأربعاء">الأربعاء</option>
            <option value="الخميس">الخميس</option>
            <option value="الجمعة">الجمعة</option>

        </select>

        <input
            type="time"
            class="schedule-start"
            value="${escapeAttribute(
                normalized.start
            )}"
        >

        <input
            type="time"
            class="schedule-end"
            value="${escapeAttribute(
                normalized.end
            )}"
        >

        <select
            class="schedule-status"
        >

            <option value="available">
                🟢 متاحة
            </option>

            <option value="full">
                🔴 مكتملة
            </option>

            <option value="stopped">
                🟡 متوقفة
            </option>

        </select>

        <button
            type="button"
            class="schedule-remove"
            title="حذف الحصة"
        >
            ×
        </button>

    `;


    const day =
        row.querySelector(
            ".schedule-day"
        );


    const status =
        row.querySelector(
            ".schedule-status"
        );


    day.value =
        normalized.day || "";


    status.value =
        normalized.status ||
        "available";


    const removeButton =
        row.querySelector(
            ".schedule-remove"
        );


    removeButton.addEventListener(
        "click",
        function () {

            row.remove();

            syncScheduleTextarea();

            updateScheduleEmptyState();

        }
    );


    row.querySelectorAll(
        "input, select"
    ).forEach(
        function (element) {

            element.addEventListener(
                "input",
                syncScheduleTextarea
            );

            element.addEventListener(
                "change",
                syncScheduleTextarea
            );

        }
    );


    container.appendChild(
        row
    );


    updateScheduleEmptyState();

    syncScheduleTextarea();

}


/* =====================================================
   ESCAPE ATTRIBUTE
===================================================== */

function escapeAttribute(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}


/* =====================================================
   READ SCHEDULE ROWS
===================================================== */

function readScheduleRows() {

    const container =
        document.getElementById(
            "scheduleRows"
        );


    if (!container) {
        return [];
    }


    const rows =
        container.querySelectorAll(
            ".schedule-row"
        );


    const items = [];


    rows.forEach(
        function (row) {

            const stage =
                row.querySelector(
                    ".schedule-stage"
                )?.value.trim() || "";


            const day =
                row.querySelector(
                    ".schedule-day"
                )?.value.trim() || "";


            const start =
                row.querySelector(
                    ".schedule-start"
                )?.value.trim() || "";


            const end =
                row.querySelector(
                    ".schedule-end"
                )?.value.trim() || "";


            const status =
                row.querySelector(
                    ".schedule-status"
                )?.value || "available";


            /*
             * لا نحفظ الصف الفارغ.
             */

            if (
                stage ||
                day ||
                start ||
                end
            ) {

                items.push({

                    stage,

                    day,

                    start,

                    end,

                    status

                });

            }

        }
    );


    return items;

}


/* =====================================================
   SYNC SCHEDULE TEXTAREA
===================================================== */

function syncScheduleTextarea() {

    const textarea =
        document.getElementById(
            "teacherSchedule"
        );


    if (!textarea) {
        return;
    }


    const items =
        readScheduleRows();


    textarea.value =
        items.length
            ? serializeSchedule(items)
            : "";

}


/* =====================================================
   EMPTY STATE
===================================================== */

function updateScheduleEmptyState() {

    const container =
        document.getElementById(
            "scheduleRows"
        );


    if (!container) {
        return;
    }


    const existing =
        container.querySelector(
            ".schedule-empty"
        );


    const rows =
        container.querySelectorAll(
            ".schedule-row"
        );


    if (rows.length === 0) {

        if (!existing) {

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "schedule-empty";

            empty.textContent =
                "لم تتم إضافة أي حصة بعد.";

            container.appendChild(
                empty
            );

        }

    } else if (existing) {

        existing.remove();

    }

}


/* =====================================================
   RENDER SCHEDULE ROWS
===================================================== */

function renderScheduleRows(
    items
) {

    const container =
        document.getElementById(
            "scheduleRows"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        items &&
        items.length
    ) {

        items.forEach(
            function (item) {

                addScheduleRow(
                    item
                );

            }
        );

    }


    updateScheduleEmptyState();

    syncScheduleTextarea();

}


/* =====================================================
   LOAD SCHEDULE INTO FORM
===================================================== */

function loadScheduleIntoForm(
    value
) {

    const result =
        parseSchedule(
            value
        );


    const container =
        document.getElementById(
            "scheduleRows"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (result.isStructured) {

        renderScheduleRows(
            result.items
        );

        return;

    }


    /*
     * جدول قديم كنص.
     *
     * نحافظ عليه داخل textarea
     * حتى لا تضيع البيانات.
     */

    const textarea =
        document.getElementById(
            "teacherSchedule"
        );


    if (textarea) {

        textarea.value =
            result.text || "";

    }


    const legacy =
        document.createElement(
            "div"
        );


    legacy.className =
        "schedule-legacy";


    legacy.textContent =
        "يوجد جدول قديم محفوظ كنص. يمكنك إنشاء جدول جديد باستخدام زر «إضافة حصة»، ولن يتم حذف النص القديم تلقائيًا.";


    container.appendChild(
        legacy
    );


    updateScheduleEmptyState();

}


/* =====================================================
   LOAD TEACHERS
===================================================== */

async function loadTeachers() {

    const tbody =
        document.getElementById(
            "teachersTableBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="5"
                style="text-align:center;"
            >
                جاري تحميل المدرسين...
            </td>

        </tr>

    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("teachers")
                .select("*")
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


        if (error) {
            throw error;
        }


        teachersCache =
            data || [];


        renderTeachers(
            teachersCache
        );


        updateTeacherStats(
            teachersCache
        );


    } catch (error) {

        console.error(
            "Load Teachers Error:",
            error
        );


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        color:#ff9999;
                        padding:30px;
                    "
                >
                    حدث خطأ أثناء تحميل المدرسين.
                </td>

            </tr>

        `;

    }

}


/* =====================================================
   RENDER TEACHERS
===================================================== */

function renderTeachers(
    teachers
) {

    const tbody =
        document.getElementById(
            "teachersTableBody"
        );


    if (!tbody) {
        return;
    }


    if (
        !teachers ||
        teachers.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >
                    لا يوجد مدرسين حتى الآن.
                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML = "";


    teachers.forEach(
        function (teacher) {

            const row =
                document.createElement(
                    "tr"
                );


            const imageCell =
                document.createElement(
                    "td"
                );


            if (teacher.image_url) {

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    teacher.image_url;


                image.alt =
                    teacher.name ||
                    "مدرس";


                image.className =
                    "teacher-thumb";


                image.loading =
                    "lazy";


                image.onerror =
                    function () {

                        image.remove();

                        const placeholder =
                            document.createElement(
                                "div"
                            );

                        placeholder.className =
                            "teacher-placeholder";

                        placeholder.textContent =
                            "👨‍🏫";

                        imageCell.appendChild(
                            placeholder
                        );

                    };


                imageCell.appendChild(
                    image
                );

            } else {

                const placeholder =
                    document.createElement(
                        "div"
                    );


                placeholder.className =
                    "teacher-placeholder";


                placeholder.textContent =
                    "👨‍🏫";


                imageCell.appendChild(
                    placeholder
                );

            }


            const nameCell =
                document.createElement(
                    "td"
                );


            nameCell.textContent =
                teacher.name ||
                "بدون اسم";


            const subjectCell =
                document.createElement(
                    "td"
                );


            subjectCell.textContent =
                teacher.subject ||
                "غير محدد";


            const statusCell =
                document.createElement(
                    "td"
                );


            const status =
                document.createElement(
                    "span"
                );


            status.className =
                teacher.active
                    ? "status active"
                    : "status inactive";


            status.textContent =
                teacher.active
                    ? "نشط"
                    : "مخفي";


            statusCell.appendChild(
                status
            );


            const actionsCell =
                document.createElement(
                    "td"
                );


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "actions";


            const edit =
                document.createElement(
                    "button"
                );


            edit.type =
                "button";


            edit.className =
                "small-btn edit";


            edit.textContent =
                "تعديل";


            edit.addEventListener(
                "click",
                function () {

                    editTeacher(
                        teacher.id
                    );

                }
            );


            const remove =
                document.createElement(
                    "button"
                );


            remove.type =
                "button";


            remove.className =
                "small-btn delete";


            remove.textContent =
                "حذف";


            remove.addEventListener(
                "click",
                function () {

                    deleteTeacher(
                        teacher.id
                    );

                }
            );


            actions.appendChild(
                edit
            );


            actions.appendChild(
                remove
            );


            actionsCell.appendChild(
                actions
            );


            row.appendChild(
                imageCell
            );


            row.appendChild(
                nameCell
            );


            row.appendChild(
                subjectCell
            );


            row.appendChild(
                statusCell
            );


            row.appendChild(
                actionsCell
            );


            tbody.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   TEACHER STATS
===================================================== */

function updateTeacherStats(
    teachers
) {

    const total =
        document.getElementById(
            "statTeachers"
        );


    const active =
        document.getElementById(
            "statActiveTeachers"
        );


    if (total) {

        total.textContent =
            teachers.length;

    }


    if (active) {

        active.textContent =
            teachers.filter(
                function (teacher) {

                    return (
                        teacher.active === true
                    );

                }
            ).length;

    }

}


/* =====================================================
   IMAGE PREVIEW
===================================================== */

function setupImagePreview() {

    const input =
        document.getElementById(
            "teacherImage"
        );


    const preview =
        document.getElementById(
            "teacherImagePreview"
        );


    if (!input || !preview) {
        return;
    }


    input.addEventListener(
        "input",
        function () {

            const url =
                input.value.trim();


            if (!url) {

                preview.style.display =
                    "none";

                preview.removeAttribute(
                    "src"
                );

                return;

            }


            preview.src =
                url;


            preview.style.display =
                "block";


            preview.onerror =
                function () {

                    preview.style.display =
                        "none";

                };

        }
    );

}


/* =====================================================
   TEACHER FORM
===================================================== */

function setupTeacherForm() {

    const form =
        document.getElementById(
            "teacherForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /*
             * قبل الحفظ:
             * نحدث textarea بالمواعيد الحالية.
             */

            syncScheduleTextarea();


            const name =
                document
                    .getElementById(
                        "teacherName"
                    )
                    .value
                    .trim();


            const subject =
                document
                    .getElementById(
                        "teacherSubject"
                    )
                    .value
                    .trim();


            const image_url =
                document
                    .getElementById(
                        "teacherImage"
                    )
                    .value
                    .trim();


            const description =
                document
                    .getElementById(
                        "teacherDescription"
                    )
                    .value
                    .trim();


            const schedule =
                document
                    .getElementById(
                        "teacherSchedule"
                    )
                    .value
                    .trim();


            const active =
                document
                    .getElementById(
                        "teacherActive"
                    )
                    .value === "true";


            const pricePrep1 =
                Number(
                    document
                        .getElementById(
                            "pricePrep1"
                        )
                        .value
                );


            const pricePrep2 =
                Number(
                    document
                        .getElementById(
                            "pricePrep2"
                        )
                        .value
                );


            const pricePrep3 =
                Number(
                    document
                        .getElementById(
                            "pricePrep3"
                        )
                        .value
                );


            const priceSec1 =
                Number(
                    document
                        .getElementById(
                            "priceSec1"
                        )
                        .value
                );


            const priceSec2 =
                Number(
                    document
                        .getElementById(
                            "priceSec2"
                        )
                        .value
                );


            if (!name) {

                showMessage(
                    "اكتب اسم المدرس.",
                    "error"
                );

                return;

            }


            const payload = {

                name,

                subject:
                    subject || null,

                image_url:
                    image_url || null,

                description:
                    description || null,

                schedule:
                    schedule || null,

                active,

                prep1_price:
                    Number.isFinite(pricePrep1)
                        ? pricePrep1
                        : 200,

                prep2_price:
                    Number.isFinite(pricePrep2)
                        ? pricePrep2
                        : 200,

                prep3_price:
                    Number.isFinite(pricePrep3)
                        ? pricePrep3
                        : 250,

                sec1_price:
                    Number.isFinite(priceSec1)
                        ? priceSec1
                        : 300,

                sec2_price:
                    Number.isFinite(priceSec2)
                        ? priceSec2
                        : 400,

                updated_at:
                    new Date().toISOString()

            };


            const saveButton =
                document.getElementById(
                    "teacherSaveBtn"
                );


            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "جاري الحفظ...";

            }


            try {

                if (editingTeacherId) {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("teachers")
                            .update(payload)
                            .eq(
                                "id",
                                editingTeacherId
                            );


                    if (error) {
                        throw error;
                    }


                    showMessage(
                        "تم تعديل بيانات المدرس والمواعيد بنجاح."
                    );

                } else {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("teachers")
                            .insert(
                                payload
                            );


                    if (error) {
                        throw error;
                    }


                    showMessage(
                        "تم إضافة المدرس والمواعيد بنجاح."
                    );

                }


                resetTeacherForm();


                await loadTeachers();


            } catch (error) {

                console.error(
                    "Save Teacher Error:",
                    error
                );


                showMessage(
                    "حدث خطأ أثناء الحفظ: " +
                    (
                        error.message ||
                        "تعذر حفظ المدرس."
                    ),
                    "error"
                );


            } finally {

                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "حفظ المدرس";

                }

            }

        }
    );

}


/* =====================================================
   EDIT TEACHER
===================================================== */

function editTeacher(
    id
) {

    const teacher =
        teachersCache.find(
            function (item) {

                return String(
                    item.id
                ) === String(id);

            }
        );


    if (!teacher) {

        showMessage(
            "لم يتم العثور على المدرس.",
            "error"
        );

        return;

    }


    editingTeacherId =
        teacher.id;


    const title =
        document.getElementById(
            "teacherFormTitle"
        );


    if (title) {

        title.textContent =
            "تعديل بيانات المدرس";

    }


    const teacherId =
        document.getElementById(
            "teacherId"
        );


    if (teacherId) {

        teacherId.value =
            teacher.id;

    }


    document.getElementById(
        "teacherName"
    ).value =
        teacher.name || "";


    document.getElementById(
        "teacherSubject"
    ).value =
        teacher.subject || "";


    document.getElementById(
        "teacherImage"
    ).value =
        teacher.image_url || "";


    document.getElementById(
        "teacherDescription"
    ).value =
        teacher.description || "";


    document.getElementById(
        "teacherActive"
    ).value =
        teacher.active
            ? "true"
            : "false";


    document.getElementById(
        "pricePrep1"
    ).value =
        teacher.prep1_price ??
        200;


    document.getElementById(
        "pricePrep2"
    ).value =
        teacher.prep2_price ??
        200;


    document.getElementById(
        "pricePrep3"
    ).value =
        teacher.prep3_price ??
        250;


    document.getElementById(
        "priceSec1"
    ).value =
        teacher.sec1_price ??
        300;


    document.getElementById(
        "priceSec2"
    ).value =
        teacher.sec2_price ??
        400;


    /*
     * تحميل جدول الحصص.
     */

    loadScheduleIntoForm(
        teacher.schedule
    );


    const preview =
        document.getElementById(
            "teacherImagePreview"
        );


    if (
        preview &&
        teacher.image_url
    ) {

        preview.src =
            teacher.image_url;

        preview.style.display =
            "block";

    } else if (preview) {

        preview.style.display =
            "none";

    }


    const cancelButton =
        document.getElementById(
            "cancelTeacherEdit"
        );


    if (cancelButton) {

        cancelButton.classList.remove(
            "hidden"
        );

    }


    const panel =
        document.getElementById(
            "teacherFormPanel"
        );


    if (panel) {

        panel.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });

    }

}


/* =====================================================
   RESET TEACHER FORM
===================================================== */

function resetTeacherForm() {

    editingTeacherId =
        null;


    const form =
        document.getElementById(
            "teacherForm"
        );


    if (form) {
        form.reset();
    }


    const title =
        document.getElementById(
            "teacherFormTitle"
        );


    if (title) {

        title.textContent =
            "إضافة مدرس جديد";

    }


    const teacherId =
        document.getElementById(
            "teacherId"
        );


    if (teacherId) {

        teacherId.value =
            "";

    }


    document.getElementById(
        "pricePrep1"
    ).value =
        200;


    document.getElementById(
        "pricePrep2"
    ).value =
        200;


    document.getElementById(
        "pricePrep3"
    ).value =
        250;


    document.getElementById(
        "priceSec1"
    ).value =
        300;


    document.getElementById(
        "priceSec2"
    ).value =
        400;


    const active =
        document.getElementById(
            "teacherActive"
        );


    if (active) {

        active.value =
            "true";

    }


    const textarea =
        document.getElementById(
            "teacherSchedule"
        );


    if (textarea) {

        textarea.value =
            "";

    }


    const rows =
        document.getElementById(
            "scheduleRows"
        );


    if (rows) {

        rows.innerHTML = "";

        updateScheduleEmptyState();

    }


    const preview =
        document.getElementById(
            "teacherImagePreview"
        );


    if (preview) {

        preview.style.display =
            "none";

        preview.removeAttribute(
            "src"
        );

    }


    const cancelButton =
        document.getElementById(
            "cancelTeacherEdit"
        );


    if (cancelButton) {

        cancelButton.classList.add(
            "hidden"
        );

    }

}


/* =====================================================
   DELETE TEACHER
===================================================== */

async function deleteTeacher(
    id
) {

    const teacher =
        teachersCache.find(
            function (item) {

                return String(
                    item.id
                ) === String(id);

            }
        );


    const teacherName =
        teacher?.name ||
        "هذا المدرس";


    const confirmed =
        confirm(
            "هل أنت متأكد من حذف " +
            teacherName +
            "؟\n\nلا يمكن التراجع عن الحذف."
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("teachers")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        showMessage(
            "تم حذف المدرس بنجاح."
        );


        if (
            editingTeacherId &&
            String(editingTeacherId) ===
            String(id)
        ) {

            resetTeacherForm();

        }


        await loadTeachers();


    } catch (error) {

        console.error(
            "Delete Teacher Error:",
            error
        );


        showMessage(
            "تعذر حذف المدرس: " +
            (
                error.message ||
                "خطأ غير معروف"
            ),
            "error"
        );

    }

}


/* =====================================================
   SITE SETTINGS HELPERS
===================================================== */

async function getSiteSetting(
    key
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("site_settings")
            .select(
                "id, setting_key, setting_value"
            )
            .eq(
                "setting_key",
                key
            )
            .maybeSingle();


    if (error) {
        throw error;
    }


    return data;

}


async function saveSiteSetting(
    key,
    value
) {

    const {
        error
    } =
        await supabaseClient
            .from("site_settings")
            .upsert(
                {
                    setting_key:
                        key,

                    setting_value:
                        value,

                    updated_at:
                        new Date().toISOString()

                },
                {
                    onConflict:
                        "setting_key"
                }
            );


    if (error) {
        throw error;
    }

}


/* =====================================================
   CONTACT SETTINGS
===================================================== */

async function loadContactSettings() {

    try {

        const data =
            await getSiteSetting(
                "contact"
            );


        if (!data) {
            return;
        }


        const values =
            data.setting_value || {};


        const fields = {

            contactTitle:
                values.title,

            contactEmail:
                values.email,

            contactPhone:
                values.phone,

            contactWhatsapp:
                values.whatsapp,

            contactDescription:
                values.description,

            contactButton:
                values.button ||
                "تواصل معنا"

        };


        Object.keys(fields)
            .forEach(
                function (id) {

                    const element =
                        document.getElementById(
                            id
                        );


                    if (
                        element &&
                        fields[id] !== undefined &&
                        fields[id] !== null
                    ) {

                        element.value =
                            fields[id];

                    }

                }
            );


    } catch (error) {

        console.error(
            "Load Contact Settings Error:",
            error
        );


        showMessage(
            "تعذر تحميل بيانات التواصل.",
            "error"
        );

    }

}


/* =====================================================
   SAVE CONTACT
===================================================== */

function setupContactForm() {

    const form =
        document.getElementById(
            "contactForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const saveButton =
                form.querySelector(
                    'button[type="submit"]'
                );


            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "جاري الحفظ...";

            }


            try {

                const payload = {

                    title:
                        document
                            .getElementById(
                                "contactTitle"
                            )
                            .value
                            .trim(),

                    email:
                        document
                            .getElementById(
                                "contactEmail"
                            )
                            .value
                            .trim(),

                    phone:
                        document
                            .getElementById(
                                "contactPhone"
                            )
                            .value
                            .trim(),

                    whatsapp:
                        document
                            .getElementById(
                                "contactWhatsapp"
                            )
                            .value
                            .trim(),

                    description:
                        document
                            .getElementById(
                                "contactDescription"
                            )
                            .value
                            .trim(),

                    button:
                        document
                            .getElementById(
                                "contactButton"
                            )
                            .value
                            .trim()

                };


                await saveSiteSetting(
                    "contact",
                    payload
                );


                showMessage(
                    "تم حفظ بيانات التواصل بنجاح."
                );


            } catch (error) {

                console.error(
                    "Save Contact Error:",
                    error
                );


                showMessage(
                    "تعذر حفظ بيانات التواصل: " +
                    (
                        error.message ||
                        "خطأ غير معروف"
                    ),
                    "error"
                );


            } finally {

                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "حفظ بيانات التواصل";

                }

            }

        }
    );

}


/* =====================================================
   HOMEPAGE SETTINGS
===================================================== */

async function loadHomepageSettings() {

    try {

        const data =
            await getSiteSetting(
                "homepage"
            );


        if (!data) {
            return;
        }


        const values =
            data.setting_value || {};


        const fields = {

            heroBadge:
                values.hero_badge,

            heroTitle:
                values.hero_title,

            heroDescription:
                values.hero_description,

            heroCardTitle:
                values.hero_card_title,

            heroCardDescription:
                values.hero_card_description

        };


        Object.keys(fields)
            .forEach(
                function (id) {

                    const element =
                        document.getElementById(
                            id
                        );


                    if (
                        element &&
                        fields[id] !== undefined &&
                        fields[id] !== null
                    ) {

                        element.value =
                            fields[id];

                    }

                }
            );


    } catch (error) {

        console.error(
            "Load Homepage Settings Error:",
            error
        );


        showMessage(
            "تعذر تحميل إعدادات الصفحة الرئيسية.",
            "error"
        );

    }

}


/* =====================================================
   SAVE HOMEPAGE
===================================================== */

function setupHomepageForm() {

    const form =
        document.getElementById(
            "homepageForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const saveButton =
                form.querySelector(
                    'button[type="submit"]'
                );


            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "جاري الحفظ...";

            }


            try {

                const payload = {

                    hero_badge:
                        document
                            .getElementById(
                                "heroBadge"
                            )
                            .value
                            .trim(),

                    hero_title:
                        document
                            .getElementById(
                                "heroTitle"
                            )
                            .value
                            .trim(),

                    hero_description:
                        document
                            .getElementById(
                                "heroDescription"
                            )
                            .value
                            .trim(),

                    hero_card_title:
                        document
                            .getElementById(
                                "heroCardTitle"
                            )
                            .value
                            .trim(),

                    hero_card_description:
                        document
                            .getElementById(
                                "heroCardDescription"
                            )
                            .value
                            .trim()

                };


                await saveSiteSetting(
                    "homepage",
                    payload
                );


                showMessage(
                    "تم حفظ إعدادات الصفحة الرئيسية."
                );


            } catch (error) {

                console.error(
                    "Save Homepage Error:",
                    error
                );


                showMessage(
                    "تعذر حفظ إعدادات الصفحة: " +
                    (
                        error.message ||
                        "خطأ غير معروف"
                    ),
                    "error"
                );


            } finally {

                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "حفظ إعدادات الصفحة";

                }

            }

        }
    );

}


/* =====================================================
   SYSTEM STATUS
===================================================== */

async function checkSystemStatus() {

    const status =
        document.getElementById(
            "systemStatus"
        );


    const statUsers =
        document.getElementById(
            "statUsers"
        );


    const statContact =
        document.getElementById(
            "statContact"
        );


    if (!status) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("teachers")
                .select("id")
                .limit(1);


        if (error) {
            throw error;
        }


        status.textContent =
            "النظام متصل بـ Supabase ويعمل بشكل طبيعي.";


        status.style.color =
            "#86d891";


        if (statUsers) {

            statUsers.textContent =
                "متصل";

            statUsers.style.fontSize =
                "18px";

        }


        if (statContact) {

            try {

                const contact =
                    await getSiteSetting(
                        "contact"
                    );


                statContact.textContent =
                    contact
                        ? "✓"
                        : "—";


            } catch (contactError) {

                console.error(
                    contactError
                );

                statContact.textContent =
                    "—";

            }

        }


    } catch (error) {

        console.error(
            "System Status Error:",
            error
        );


        status.textContent =
            "يوجد خطأ في الاتصال بقاعدة البيانات.";


        status.style.color =
            "#ff9999";


        if (statUsers) {

            statUsers.textContent =
                "خطأ";

            statUsers.style.fontSize =
                "18px";

        }


        if (statContact) {

            statContact.textContent =
                "—";

        }

    }

}


/* =====================================================
   AUTH LISTENER
===================================================== */

function setupAuthListener() {

    if (!supabaseReady()) {
        return;
    }


    supabaseClient
        .auth
        .onAuthStateChange(
            function (event) {

                if (
                    event === "SIGNED_OUT"
                ) {

                    window.location.href =
                        "admin-login.html";

                }

            }
        );

}


/* =====================================================
   INIT
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const access =
            await checkAdminAccess();


        if (!access) {
            return;
        }


        setupNavigation();

        setupLogout();

        setupImagePreview();

        setupScheduleManager();

        setupTeacherForm();

        setupContactForm();

        setupHomepageForm();

        setupAuthListener();


        /* =============================================
           CANCEL EDIT
        ============================================== */

        const cancelButton =
            document.getElementById(
                "cancelTeacherEdit"
            );


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                function () {

                    resetTeacherForm();

                }
            );

        }


        /* =============================================
           REFRESH TEACHERS
        ============================================== */

        const refreshButton =
            document.getElementById(
                "refreshTeachers"
            );


        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                async function () {

                    refreshButton.disabled =
                        true;


                    refreshButton.textContent =
                        "جاري التحديث...";


                    try {

                        await loadTeachers();

                    } finally {

                        refreshButton.disabled =
                            false;

                        refreshButton.textContent =
                            "تحديث";

                    }

                }
            );

        }


        /* =============================================
           INITIAL LOAD
        ============================================== */

        await loadTeachers();

        await loadContactSettings();

        await loadHomepageSettings();

        await checkSystemStatus();

    }
);