// Payment Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const orderIdElement = document.getElementById('orderId');
    const serviceTypeElement = document.getElementById('serviceType');
    const paymentAmountElement = document.getElementById('paymentAmount');
    const payAmountElement = document.getElementById('payAmount');
    const paymentMethods = document.querySelectorAll('.payment-method');
    const paymentForms = {
        razorpay: document.getElementById('razorpayForm'),
        upi: document.getElementById('upiForm')
    };
    const proceedPaymentBtn = document.getElementById('proceedPayment');
    const cancelPaymentBtn = document.getElementById('cancelPayment');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const paymentModal = document.getElementById('paymentModal');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');
    
    // Get order details from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let orderId = urlParams.get('order_id');
    let amount = urlParams.get('amount');
    
    // If no URL params, check localStorage
    if (!orderId) {
        const savedOrder = localStorage.getItem('currentOrder');
        if (savedOrder) {
            const order = JSON.parse(savedOrder);
            orderId = order.orderId;
            amount = order.price;
        }
    }
    
    // Update display with order details
    if (orderIdElement) orderIdElement.textContent = orderId || 'TS-2024-001';
    if (paymentAmountElement) {
        const displayAmount = amount ? `₹${parseFloat(amount).toFixed(2)}` : '₹2.36';
        paymentAmountElement.textContent = displayAmount;
    }
    if (payAmountElement) {
        const displayAmount = amount ? parseFloat(amount).toFixed(2) : '2.36';
        payAmountElement.textContent = displayAmount;
    }
    
    // Payment method selection
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // Remove active class from all methods
            paymentMethods.forEach(m => m.classList.remove('active'));
            // Add active class to clicked method
            this.classList.add('active');
            
            // Show corresponding form
            const methodType = this.getAttribute('data-method');
            Object.keys(paymentForms).forEach(key => {
                if (paymentForms[key]) {
                    paymentForms[key].style.display = key === methodType ? 'block' : 'none';
                }
            });
        });
    });
    
    // Cancel payment button
    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to cancel this payment?')) {
                window.location.href = '/order.html';
            }
        });
    }
    
    // Proceed to payment button
    if (proceedPaymentBtn) {
        proceedPaymentBtn.addEventListener('click', async function() {
            // Validate form if credit card is selected
            const activeMethod = document.querySelector('.payment-method.active');
            if (activeMethod && activeMethod.getAttribute('data-method') === 'razorpay') {
                if (!validateCreditCardForm()) {
                    return;
                }
            }
            
            // Show payment modal
            paymentModal.style.display = 'block';
        });
    }
    
    // Payment modal controls
    if (modalCancel) {
        modalCancel.addEventListener('click', function() {
            paymentModal.style.display = 'none';
        });
    }
    
    if (modalConfirm) {
        modalConfirm.addEventListener('click', async function() {
            paymentModal.style.display = 'none';
            await processPayment();
        });
    }
    
    // Functions
    function validateCreditCardForm() {
        // In a real application, you would validate all card fields
        // For this demo, we'll just check if any card method is selected
        const cardMethod = document.querySelector('.payment-method[data-method="razorpay"]');
        if (cardMethod && cardMethod.classList.contains('active')) {
            // Basic validation
            const cardInput = document.querySelector('#razorpayForm input[type="text"]');
            if (!cardInput || cardInput.value.trim().length < 16) {
                showNotification('Please enter a valid card number', 'error');
                return false;
            }
        }
        return true;
    }
    
    async function processPayment() {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        
        try {
            // Create order with Netlify function
            const orderDetails = {
                orderId: orderId,
                amount: amount ? parseFloat(amount) * 100 : 236, // Convert to paise
                currency: 'INR',
                receipt: `receipt_${orderId}`
            };
            
            // Call Netlify function to create Razorpay order
            const response = await fetch('/.netlify/functions/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderDetails)
            });
            
            if (!response.ok) {
                throw new Error('Failed to create payment order');
            }
            
            const data = await response.json();
            
            if (data.success && data.order) {
                // Initialize Razorpay checkout
                const options = {
                    key: data.key, // Razorpay key from Netlify function
                    amount: data.order.amount,
                    currency: data.order.currency,
                    name: 'Typing Services',
                    description: 'Professional Typing Service',
                    order_id: data.order.id,
                    handler: async function(response) {
                        // Payment successful, verify payment
                        await verifyPayment(response);
                    },
                    prefill: {
                        name: 'Customer Name',
                        email: 'customer@example.com',
                        contact: '9999999999'
                    },
                    notes: {
                        order_id: orderId
                    },
                    theme: {
                        color: '#4361ee'
                    },
                    modal: {
                        ondismiss: function() {
                            // User closed the modal
                            loadingOverlay.style.display = 'none';
                            showNotification('Payment cancelled', 'info');
                        }
                    }
                };
                
                const rzp = new Razorpay(options);
                rzp.open();
                
            } else {
                throw new Error('Failed to initialize payment');
            }
            
        } catch (error) {
            console.error('Payment error:', error);
            loadingOverlay.style.display = 'none';
            showNotification('Payment failed. Please try again.', 'error');
            
            // Redirect to failed page
            setTimeout(() => {
                window.location.href = `/failed.html?order_id=${orderId}&error=${encodeURIComponent(error.message)}`;
            }, 2000);
        }
    }
    
    async function verifyPayment(paymentResponse) {
        try {
            const verifyData = {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                orderId: orderId
            };
            
            const response = await fetch('/.netlify/functions/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(verifyData)
            });
            
            if (!response.ok) {
                throw new Error('Payment verification failed');
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Payment verified successfully
                // Save order to database
                await saveOrderToDatabase(paymentResponse);
                
                // Redirect to success page
                window.location.href = `/success.html?order_id=${orderId}&transaction_id=${paymentResponse.razorpay_payment_id}&amount=${amount}`;
            } else {
                throw new Error('Payment verification failed');
            }
            
        } catch (error) {
            console.error('Verification error:', error);
            window.location.href = `/failed.html?order_id=${orderId}&error=${encodeURIComponent('Payment verification failed')}`;
        }
    }
    
    async function saveOrderToDatabase(paymentResponse) {
        try {
            const savedOrder = localStorage.getItem('currentOrder');
            if (savedOrder) {
                const order = JSON.parse(savedOrder);
                
                // Add payment details
                order.payment = {
                    transactionId: paymentResponse.razorpay_payment_id,
                    orderId: paymentResponse.razorpay_order_id,
                    amount: amount,
                    status: 'completed',
                    timestamp: new Date().toISOString()
                };
                
                order.status = 'processing';
                
                // Save to Netlify function (or your database)
                const saveResponse = await fetch('/.netlify/functions/save-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(order)
                });
                
                // Clear current order from localStorage
                localStorage.removeItem('currentOrder');
                
                // Save to local storage for admin panel demo
                const allOrders = JSON.parse(localStorage.getItem('typingOrders') || '[]');
                allOrders.push(order);
                localStorage.setItem('typingOrders', JSON.stringify(allOrders));
                
            }
        } catch (error) {
            console.error('Error saving order:', error);
            // Continue to success page even if save fails
        }
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === paymentModal) {
            paymentModal.style.display = 'none';
        }
        if (event.target === loadingOverlay) {
            // Don't allow closing loading overlay by clicking outside
            event.preventDefault();
        }
    });
    
    // Show notification function
    function showNotification(message, type = 'info') {
        alert(`${type.toUpperCase()}: ${message}`);
    }
});