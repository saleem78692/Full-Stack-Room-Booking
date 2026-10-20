const navbar = document.getElementById("navbar");
const sticky = navbar.offsetTop;

window.addEventListener("scroll", () => {

    if(window.pageYOffset > sticky){
        navbar.classList.add("sticky");
    }else{
        navbar.classList.remove("sticky");
    }

});



const filterButtons = document.querySelectorAll(".room-filter");
const roomCards = document.querySelectorAll(".room-item");

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        // Active Button
        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        const filterValue = button.getAttribute("data-filter");

        roomCards.forEach(card => {

            if (filterValue === "all" || card.dataset.filter === filterValue) {

                card.style.display = "block";

                setTimeout(() => {
                    card.style.opacity = "1";
                    card.style.transform = "scale(1)";
                }, 100);

            } else {

                card.style.opacity = "0";
                card.style.transform = "scale(.8)";

                setTimeout(() => {
                    card.style.display = "none";
                }, 300);

            }

        });

    });

});


// Swiper Slider
const gallery = document.querySelector(".gallerySwiper");

if (gallery) {
    const swiper = new Swiper(".gallerySwiper", {

        loop: true,

        speed: 800,

        spaceBetween: 30,

        grabCursor: true,

        centeredSlides: false,

        autoplay: {

            delay: 3000,

            disableOnInteraction: false,

        },

        pagination: {

            el: ".swiper-pagination",

            clickable: true,

        },

        navigation: {

            nextEl: ".swiper-button-next",

            prevEl: ".swiper-button-prev",

        },

        breakpoints: {

            0: {

                slidesPerView: 1,

            },

            576: {

                slidesPerView: 1,

            },

            768: {

                slidesPerView: 2,

            },

            992: {

                slidesPerView: 3,

            },

            1200: {

                slidesPerView: 3,

            }

        }
    });

    gallery.addEventListener("mouseenter", () => {
        swiper.autoplay.stop();
    });

    gallery.addEventListener("mouseleave", () => {
        swiper.autoplay.start();
    });
}
// GLightbox

const lightbox = GLightbox({

    selector: ".glightbox",

    touchNavigation: true,

    loop: true,

    zoomable: true,

    autoplayVideos: true,

    openEffect: "zoom",
    closeEffect: "fade"

});


// Sweet Aert
document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const successMsg = urlParams.get("success");
    const errorMsg = urlParams.get("error");

    if (successMsg) {
      Swal.fire({
        title: "Success!",
        text: successMsg,
        icon: "success",
        confirmButtonText: "OK",
        timer: 3500,
        timerProgressBar: true,
      });
      window.history.replaceState({}, document.title, "/");
    }

    if (errorMsg) {
      Swal.fire({
        title: "Oops...",
        text: errorMsg,
        icon: "error",
        confirmButtonText: "OK",
      });
      window.history.replaceState({}, document.title, "/");
    }
  });


//  Review Slider     
document.addEventListener("DOMContentLoaded", function () {

    const track = document.getElementById("testimonialTrack");
    const prevBtn = document.getElementById("testimonialPrev");
    const nextBtn = document.getElementById("testimonialNext");
    const dotsContainer = document.getElementById("testimonialDots");

    if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

    const slides = Array.from(
        track.querySelectorAll(".testimonial-slide")
    );

    if (slides.length === 0) {
        document.querySelector(".testimonial-controls").style.display = "none";
        return;
    }

    let currentIndex = 0;
    let visibleSlides = 3;
    let autoSlide;

    function getVisibleSlides() {
        if (window.innerWidth <= 575) return 1;
        if (window.innerWidth <= 991) return 2;
        return 3;
    }

    function getMaxIndex() {
        return Math.max(0, slides.length - visibleSlides);
    }

    function createDots() {
        dotsContainer.innerHTML = "";

        const totalDots = getMaxIndex() + 1;

        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement("button");

            dot.type = "button";
            dot.className = "testimonial-dot";
            dot.setAttribute("aria-label", "Go to review " + (i + 1));

            dot.addEventListener("click", function () {
                currentIndex = i;
                updateSlider();
                restartAutoSlide();
            });

            dotsContainer.appendChild(dot);
        }
    }

    function updateSlider() {
        visibleSlides = getVisibleSlides();

        currentIndex = Math.min(currentIndex, getMaxIndex());

        const slideWidth = 100 / visibleSlides;

        track.style.transform =
            `translateX(-${currentIndex * slideWidth}%)`;

        const dots = dotsContainer.querySelectorAll(".testimonial-dot");

        dots.forEach((dot, index) => {
            dot.classList.toggle("active", index === currentIndex);
        });

        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === getMaxIndex();

        prevBtn.style.opacity = prevBtn.disabled ? "0.5" : "1";
        nextBtn.style.opacity = nextBtn.disabled ? "0.5" : "1";
    }

    function nextSlide() {
        currentIndex =
            currentIndex >= getMaxIndex() ? 0 : currentIndex + 1;

        updateSlider();
    }

    function prevSlide() {
        currentIndex =
            currentIndex <= 0 ? getMaxIndex() : currentIndex - 1;

        updateSlider();
    }

    function startAutoSlide() {
        stopAutoSlide();

        if (slides.length > visibleSlides) {
            autoSlide = setInterval(nextSlide, 4000);
        }
    }

    function stopAutoSlide() {
        clearInterval(autoSlide);
    }

    function restartAutoSlide() {
        startAutoSlide();
    }

    prevBtn.addEventListener("click", function () {
        prevSlide();
        restartAutoSlide();
    });

    nextBtn.addEventListener("click", function () {
        nextSlide();
        restartAutoSlide();
    });

    const slider = document.querySelector(".testimonial-slider");

    slider.addEventListener("mouseenter", stopAutoSlide);
    slider.addEventListener("mouseleave", startAutoSlide);

    let resizeTimer;

    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(function () {
            visibleSlides = getVisibleSlides();
            createDots();
            updateSlider();
            startAutoSlide();
        }, 150);
    });

    visibleSlides = getVisibleSlides();
    createDots();
    updateSlider();
    startAutoSlide();

});
