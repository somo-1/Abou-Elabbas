document.addEventListener("DOMContentLoaded", function () {

    // ==============================
    // MOBILE MENU
    // ==============================

    const menuToggle =
        document.getElementById("menuToggle");

    const navLinks =
        document.getElementById("mainNav") ||
        document.getElementById("navLinks");


    if (menuToggle && navLinks) {

        // منع تكرار الـ Event Listener
        if (!menuToggle.dataset.menuReady) {

            menuToggle.dataset.menuReady = "true";


            menuToggle.addEventListener(
                "click",
                function () {

                    navLinks.classList.toggle(
                        "mobile-active"
                    );

                }
            );


            // ==============================
            // CLOSE MENU AFTER CLICK
            // ==============================

            const navItems =
                navLinks.querySelectorAll("a");


            navItems.forEach(function (item) {

                item.addEventListener(
                    "click",
                    function () {

                        navLinks.classList.remove(
                            "mobile-active"
                        );

                    }
                );

            });

        }

    }


    // ==============================
    // CURRENT YEAR
    // ==============================

    const footerCopy =
        document.querySelector(".footer-copy");


    if (footerCopy) {

        footerCopy.textContent =
            "© " +
            new Date().getFullYear() +
            " EDU CENTER — جميع الحقوق محفوظة";

    }


    // ==============================
    // UPDATE YEAR BY ID
    // ==============================

    const currentYear =
        document.getElementById("currentYear");


    if (currentYear) {

        currentYear.textContent =
            new Date().getFullYear();

    }


    // ==============================
    // SCROLL ANIMATION
    // ==============================

    const animatedElements =
        document.querySelectorAll(
            ".feature-card, .teacher-card, .section-heading, .cta-card"
        );


    if (
        animatedElements.length &&
        "IntersectionObserver" in window
    ) {

        const observer =
            new IntersectionObserver(
                function (entries) {

                    entries.forEach(
                        function (entry) {

                            if (
                                entry.isIntersecting
                            ) {

                                entry.target.classList.add(
                                    "show"
                                );

                                observer.unobserve(
                                    entry.target
                                );

                            }

                        }
                    );

                },
                {
                    threshold: 0.12
                }
            );


        animatedElements.forEach(
            function (element) {

                observer.observe(
                    element
                );

            }
        );

    }


    // ==============================
    // SUPABASE AUTH STATE
    // ==============================

    if (
        typeof supabaseClient !== "undefined" &&
        supabaseClient &&
        supabaseClient.auth
    ) {

        supabaseClient.auth.onAuthStateChange(
            function (event) {

                console.log(
                    "Auth Event:",
                    event
                );

            }
        );

    }

});
/* =========================================
   MOBILE MENU
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    const menuToggle = document.getElementById("menuToggle");
    const mobileMenu = document.getElementById("mobileMenu");

    if (!menuToggle || !mobileMenu) {
        return;
    }

    menuToggle.addEventListener("click", function () {

        const isOpen = mobileMenu.classList.toggle("open");

        menuToggle.classList.toggle("active", isOpen);

        menuToggle.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );

    });


    /* إغلاق القائمة بعد الضغط على أي رابط */

    const mobileLinks =
        mobileMenu.querySelectorAll("a");

    mobileLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            mobileMenu.classList.remove("open");

            menuToggle.classList.remove("active");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });


    /* إغلاق القائمة عند الضغط خارجها */

    document.addEventListener("click", function (event) {

        const clickedInsideMenu =
            mobileMenu.contains(event.target);

        const clickedToggle =
            menuToggle.contains(event.target);

        if (!clickedInsideMenu && !clickedToggle) {

            mobileMenu.classList.remove("open");

            menuToggle.classList.remove("active");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    });


    /* عند الرجوع للشاشة الكبيرة */

    window.addEventListener("resize", function () {

        if (window.innerWidth > 850) {

            mobileMenu.classList.remove("open");

            menuToggle.classList.remove("active");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    });

});
