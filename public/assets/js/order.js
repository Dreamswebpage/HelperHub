// Order Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const orderForm = document.getElementById('orderForm');
    const steps = document.querySelectorAll('.form-step');
    const nextStepButtons = document.querySelectorAll('.next-step');
    const prevStepButtons = document.querySelectorAll('.prev-step');
    const calculatePriceBtn = document.getElementById('calculatePrice');
    const submitOrderBtn = document.getElementById('submitOrder');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('documentFile');
    const filePreview = document.getElementById('filePreview');
    const priceModal = document.getElementById('priceModal');
    const modalClose = document.querySelector('.modal-close');
    const modalBack = document.getElementById('modalBack');
    const modalProceed = document.getElementById('modalProceed');
    
    // Order data storage
    let orderData = {
        service: 'document',
        urgency: 'standard',
        pages: 1,
        deadline: '',
        fileType: 'docx',
        instructions: '',
        name: '',
        email: '',
        phone: '',
        college: '',
        address: '',
        newsletter: false,
        terms: false
    };
    
    // Price configuration
    const priceConfig = {
        services: {
            'document': { base: 2, unit: 'page' },
            'data-entry': { base: 150, unit: 'hour' },
            'thesis': { base: 5, unit: 'page' },
            'business': { base: 3, unit: 'page' },
            'book': { base: 10000, unit: 'book' },
            'multilingual': { base: 4, unit: 'page' }
        },
        urgencyMultiplier: {
            'standard': 1.0,
            'express': 1.25,
            'urgent': 1.5
        },
        taxRate: 0.18 // 18% GST
    };
    
    // Service names mapping
    const serviceNames = {
        'document': 'Document Typing',
        'data-entry': 'Data Entry',
        'thesis': 'Thesis Typing',
        'business': 'Business Documents',
        'book': 'Book Typing',
        'multilingual': 'Multilingual Typing'
    };
    
    // Format names mapping
    const formatNames = {
        'docx': 'Microsoft Word',
        'pdf': 'PDF Document',
        'google-docs': 'Google Docs',
        'txt': 'Plain Text'
    };
    
    // Initialize flatpickr for datepicker
    if (document.getElementById('deadline')) {
        flatpickr('#deadline', {
            minDate: 'today',
            dateFormat: 'Y-m-d',
            disable: [
                function(date) {
                    // Disable weekends
                    return (date.getDay() === 0 || date.getDay() === 6);
                }
            ]
        });
    }
    
    // Step Navigation
    nextStepButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = this.closest('.form-step');
            const nextStepId = this.getAttribute('data-next');
            const nextStep = document.getElementById(nextStepId);
            
            // Validate current step before proceeding
            if (validateStep(currentStep.id)) {
                currentStep.classList.remove('active');
                nextStep.classList.add('active');
                updateOrderSummary();
            }
        });
    });
    
    prevStepButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = this.closest('.form-step');
            const prevStepId = this.getAttribute('data-prev');
            const prevStep = document.getElementById(prevStepId);
            
            currentStep.classList.remove('active');
            prevStep.classList.add('active');
        });
    });
    
    // Form Input Handlers
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('change', function() {
            updateOrderData(this);
        });
        
        input.addEventListener('input', function() {
            updateOrderData(this);
        });
    });
    
    // File Upload Handling
    if (uploadArea && fileInput) {
        // Click on upload area
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#4361ee';
            uploadArea.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#e9ecef';
            uploadArea.style.backgroundColor = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#e9ecef';
            uploadArea.style.backgroundColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }
    
    // Calculate Price Button
    if (calculatePriceBtn) {
        calculatePriceBtn.addEventListener('click', showPriceCalculation);
    }
    
    // Modal Controls
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            priceModal.classList.remove('active');
        });
    }
    
    if (modalBack) {
        modalBack.addEventListener('click', () => {
            priceModal.classList.remove('active');
        });
    }
    
    if (modalProceed) {
        modalProceed.addEventListener('click', () => {
            priceModal.classList.remove('active');
            document.getElementById('step3').classList.remove('active');
            document.getElementById('step4').classList.add('active');
            updateOrderSummary();
        });
    }
    
    // Form Submission
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processOrderSubmission();
        });
    }
    
    // Functions
    function validateStep(stepId) {
        let isValid = true;
        
        switch(stepId) {
            case 'step1':
                // Service selection is always valid (has default)
                break;
                
            case 'step2':
                const pagesInput = document.getElementById('pages');
                if (!pagesInput.value || parseInt(pagesInput.value) < 1) {
                    showNotification('Please enter a valid number of pages', 'error');
                    isValid = false;
                }
                break;
                
            case 'step3':
                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim();
                const phone = document.getElementById('phone').value.trim();
                
                if (!name) {
                    showNotification('Please enter your name', 'error');
                    isValid = false;
                } else if (!email || !validateEmail(email)) {
                    showNotification('Please enter a valid email address', 'error');
                    isValid = false;
                } else if (!phone || !validatePhone(phone)) {
                    showNotification('Please enter a valid 10-digit phone number', 'error');
                    isValid = false;
                }
                break;
        }
        
        return isValid;
    }
    
    function updateOrderData(input) {
        const name = input.name;
        const value = input.type === 'checkbox' ? input.checked : input.value;
        
        orderData[name] = value;
        
        // If updating pages, ensure minimum value
        if (name === 'pages' && value < 1) {
            orderData[name] = 1;
            input.value = 1;
        }
    }
    
    function handleFileUpload(file) {
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            showNotification('File size exceeds 10MB limit', 'error');
            return;
        }
        
        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            showNotification('Invalid file type. Please upload PDF, JPG, or PNG files.', 'error');
            return;
        }
        
        // Display file preview
        filePreview.innerHTML = `
            <div class="file-preview-item">
                <i class="fas fa-file-pdf"></i>
                <div class="file-info">
                    <strong>${file.name}</strong>
                    <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button class="file-remove" onclick="removeFile()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add remove file function to global scope
        window.removeFile = function() {
            filePreview.innerHTML = '';
            fileInput.value = '';
        };
    }
    
    function calculatePrice() {
        const service = orderData.service;
        const urgency = orderData.urgency;
        const pages = parseInt(orderData.pages) || 1;
        
        if (!priceConfig.services[service]) {
            return {
                base: 0,
                urgencyCharge: 0,
                tax: 0,
                total: 0
            };
        }
        
        const basePrice = priceConfig.services[service].base;
        let subtotal = 0;
        
        if (service === 'data-entry') {
            // Data entry is per hour
            subtotal = basePrice;
        } else if (service === 'book') {
            // Book is fixed price
            subtotal = basePrice;
        } else {
            // Other services are per page
            subtotal = basePrice * pages;
        }
        
        // Apply urgency multiplier
        const urgencyMultiplier = priceConfig.urgencyMultiplier[urgency] || 1.0;
        const urgencyCharge = subtotal * (urgencyMultiplier - 1);
        subtotal *= urgencyMultiplier;
        
        // Calculate tax
        const tax = subtotal * priceConfig.taxRate;
        const total = subtotal + tax;
        
        return {
            base: basePrice * (service === 'data-entry' || service === 'book' ? 1 : pages),
            urgencyCharge,
            tax,
            total,
            subtotal
        };
    }
    
    function showPriceCalculation() {
        // First validate step 3
        if (!validateStep('step3')) {
            return;
        }
        
        const prices = calculatePrice();
        
        // Update modal with calculated prices
        const modal = document.querySelector('.price-breakdown');
        if (modal) {
            const service = orderData.service;
            const unit = priceConfig.services[service]?.unit || 'page';
            const unitText = unit === 'page' ? 'page' : (unit === 'hour' ? 'hour' : 'book');
            
            modal.innerHTML = `
                <div class="price-item">
                    <span>Base Price (${orderData.pages} ${unitText} × ₹${priceConfig.services[service].base}):</span>
                    <span>₹${prices.base.toFixed(2)}</span>
                </div>
                <div class="price-item">
                    <span>Urgency Charge (${orderData.urgency}):</span>
                    <span>₹${prices.urgencyCharge.toFixed(2)}</span>
                </div>
                <div class="price-item">
                    <span>GST (18%):</span>
                    <span>₹${prices.tax.toFixed(2)}</span>
                </div>
                <div class="price-divider"></div>
                <div class="price-item total">
                    <span>Total Amount:</span>
                    <span>₹${prices.total.toFixed(2)}</span>
                </div>
            `;
        }
        
        // Show modal
        priceModal.classList.add('active');
    }
    
    function updateOrderSummary() {
        const prices = calculatePrice();
        
        // Update summary elements
        document.getElementById('summary-service').textContent = serviceNames[orderData.service] || orderData.service;
        document.getElementById('summary-pages').textContent = orderData.pages;
        document.getElementById('summary-urgency').textContent = orderData.urgency.charAt(0).toUpperCase() + orderData.urgency.slice(1);
        document.getElementById('summary-deadline').textContent = orderData.deadline || 'ASAP';
        document.getElementById('summary-format').textContent = formatNames[orderData.fileType] || orderData.fileType;
        document.getElementById('summary-total').textContent = `₹${prices.total.toFixed(2)}`;
        
        // Update contact info
        document.getElementById('summary-name').textContent = orderData.name;
        document.getElementById('summary-email').textContent = orderData.email;
        document.getElementById('summary-phone').textContent = orderData.phone;
    }
    
    async function processOrderSubmission() {
        // Validate terms agreement
        if (!orderData.terms) {
            showNotification('Please agree to the terms and conditions', 'error');
            return;
        }
        
        // Show loading state
        const formLoading = document.getElementById('formLoading');
        const steps = document.querySelectorAll('.form-step');
        
        steps.forEach(step => step.style.display = 'none');
        formLoading.style.display = 'block';
        
        try {
            // Create order object
            const order = {
                ...orderData,
                orderId: 'TS-' + Date.now().toString().slice(-8),
                status: 'pending',
                createdAt: new Date().toISOString(),
                price: calculatePrice().total
            };
            
            // Save order to localStorage for demo purposes
            // In production, this would be sent to your backend
            localStorage.setItem('currentOrder', JSON.stringify(order));
            
            // If paying online, redirect to checkout
            if (document.getElementById('pay-online')?.checked) {
                // In production, call your Netlify function to create Razorpay order
                // For demo, simulate API call
                setTimeout(() => {
                    window.location.href = `/checkout.html?order_id=${order.orderId}&amount=${order.price}`;
                }, 1000);
            } else {
                // Pay later option
                setTimeout(() => {
                    showNotification('Order placed successfully! You will pay after delivery.', 'success');
                    // Reset form
                    orderForm.reset();
                    // Go back to step 1
                    document.querySelectorAll('.form-step').forEach(step => {
                        step.style.display = 'none';
                        step.classList.remove('active');
                    });
                    document.getElementById('step1').style.display = 'block';
                    document.getElementById('step1').classList.add('active');
                    formLoading.style.display = 'none';
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error submitting order:', error);
            showNotification('Error submitting order. Please try again.', 'error');
            formLoading.style.display = 'none';
            document.querySelector('.form-step.active').style.display = 'block';
        }
    }
    
    // URL parameter handling for pre-selecting service
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    if (serviceParam && document.getElementById(`service-${serviceParam}`)) {
        document.getElementById(`service-${serviceParam}`).checked = true;
        updateOrderData(document.getElementById(`service-${serviceParam}`));
    }
});