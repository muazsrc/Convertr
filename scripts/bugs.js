// Bugs Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar') && window.innerWidth <= 768) {
                navLinks.classList.remove('active');
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                navLinks.classList.remove('active');
            }
        });
    }

    // EmailJS configuration
    const EMAILJS_SERVICE_ID = 'service_am8fyib'; // Replace with your EmailJS service ID
    const EMAILJS_TEMPLATE_ID = 'template_v9uve2f'; // Replace with your EmailJS template ID
    const EMAILJS_PUBLIC_KEY = 'i_N6UFoPvxudDi8mk'; // Replace with your EmailJS public key

    // Bug report form submission
    const bugReportForm = document.getElementById('bugReportForm');
    const toast = document.getElementById('toast');
    const submitButton = document.querySelector('.submit-button');

    if (bugReportForm && toast) {
        bugReportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Disable submit button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="button-icon">⌛</span><span>Sending...</span>';
            
            // Show loading toast
            showToast('Sending bug report...');
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value,
                browser: document.getElementById('browser').value,
                device: document.getElementById('device').value
            };

            // Send email using EmailJS
            emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                {
                    from_name: formData.name,
                    from_email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                    browser: formData.browser,
                    device: formData.device,
                    to_name: 'Muaz',
                    reply_to: formData.email
                },
                EMAILJS_PUBLIC_KEY
            ).then(
                function(response) {
                    showToast('Bug report sent successfully! Thank you for your feedback.', false);
                    bugReportForm.reset();
                },
                function(error) {
                    console.error('Email error:', error);
                    showToast('Failed to send bug report. Please try again or contact us directly at muazsrc17@gmail.com', true);
                }
            ).finally(function() {
                // Re-enable submit button and restore original state
                submitButton.disabled = false;
                submitButton.innerHTML = '<span class="button-icon">📤</span><span>Submit Bug Report</span>';
            });
        });

        function showToast(message, isError = false) {
            toast.textContent = message;
            toast.className = 'toast';
            
            if (isError) {
                toast.classList.add('error');
            }
            
            toast.classList.add('active');
            
            setTimeout(() => {
                toast.classList.remove('active');
            }, 3000);
        }
    }
}); 