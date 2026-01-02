// Main JavaScript for Typing Services Website

document.addEventListener('DOMContentLoaded', function() {

    /* ================= MOBILE MENU ================= */
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            if (navLinks.style.display === 'flex') {
                navLinks.style.flexDirection = 'column';
            }
        });
    }

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLinks.style.display = 'flex';
            navLinks.style.flexDirection = 'row';
        } else {
            navLinks.style.display = 'none';
        }
    });

    /* ================= ACTIVE NAV ================= */
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref.includes(currentPage)) {
            link.classList.add('active');
        }
    });

    /* ===================================================
       🔥 ADMIN → USER SERVICE SYNC (MAIN FIX)
    =================================================== */
    const servicesContainer = document.getElementById('servicesContainer');
    if (!servicesContainer) return;

    const services = JSON.parse(localStorage.getItem('typingServices') || '[]');
    servicesContainer.innerHTML = '';

    if (services.length === 0) {
        servicesContainer.innerHTML = `
            <p style="text-align:center;">No services available.</p>
        `;
        return;
    }

    services
        .filter(s => s.status === 'active')
        .forEach(service => {
            servicesContainer.innerHTML += `
                <div class="service-item">
                    <div class="service-icon">
                        <i class="fas fa-tasks"></i>
                    </div>

                    <div class="service-details">
                        <h3>${service.name}</h3>
                        <p class="service-description">${service.description}</p>

                        <div class="service-pricing">
                            <div class="price-item">
                                <span class="price-label">Price</span>
                                <span class="price-amount">
                                    ₹${service.price}/${service.unit}
                                </span>
                            </div>

                            <div class="price-item">
                                <span class="price-label">Delivery</span>
                                <span class="price-amount">
                                    ${service.deliveryTime} hours
                                </span>
                            </div>
                        </div>

                        <a href="/order.html?service=${encodeURIComponent(service.name)}"
                           class="btn btn-primary">
                            Order Now
                        </a>
                    </div>
                </div>
            `;
        });
});
