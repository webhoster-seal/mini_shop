const rupeeFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
});

const cartState = {
    items: 0,
    total: 0
};

const productGrid = document.getElementById('productGrid');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const reviewForm = document.getElementById('reviewForm');
const reviewsGrid = document.getElementById('reviewsGrid');
const characterCount = document.getElementById('characterCount');
const commentInput = document.getElementById('comment');
const formStatus = document.getElementById('formStatus');
const backToTop = document.getElementById('backToTop');
const navLinks = document.getElementById('navLinks');
const menuToggle = document.getElementById('menuToggle');

// Formats a number as Indian rupees.
function formatCurrency(amount) {
    return rupeeFormatter.format(amount);
}

// Reads product values from the selected product card.
function getProductState(card) {
    return {
        basePrice: Number(card.dataset.price),
        quantity: Number(card.dataset.quantity || 1),
        discountApplied: card.dataset.discountApplied === 'true'
    };
}

// Calculates the current line price for a product.
function calculateLineTotal(card) {
    const product = getProductState(card);
    const discountMultiplier = product.discountApplied ? 0.9 : 1;
    return product.basePrice * product.quantity * discountMultiplier;
}

// Updates quantity and live price text for a product card.
function updateProductCard(card) {
    const quantity = Number(card.dataset.quantity || 1);
    const lineTotal = calculateLineTotal(card);

    card.querySelector('.quantity').textContent = quantity;
    card.querySelector('.line-total span').textContent = formatCurrency(lineTotal);
}

// Updates the live cart badge and total amount.
function updateCartSummary() {
    cartCount.textContent = cartState.items;
    cartTotal.textContent = formatCurrency(cartState.total);
}

// Increases the selected product quantity.
function increaseQuantity(card) {
    const currentQuantity = Number(card.dataset.quantity || 1);
    card.dataset.quantity = currentQuantity + 1;
    updateProductCard(card);
}

// Decreases the selected product quantity without going below one.
function decreaseQuantity(card) {
    const currentQuantity = Number(card.dataset.quantity || 1);
    card.dataset.quantity = Math.max(1, currentQuantity - 1);
    updateProductCard(card);
}

// Applies a one-time ten percent discount to the selected product.
function applyDiscount(card) {
    card.dataset.discountApplied = 'true';
    updateProductCard(card);
}

// Adds the selected product quantity and line price to the cart.
function addToCart(card) {
    const product = getProductState(card);
    cartState.items += product.quantity;
    cartState.total += calculateLineTotal(card);
    updateCartSummary();
    alert('Item added successfully');
}

// Toggles wishlist state for a product.
function toggleWishlist(button) {
    const isActive = button.classList.toggle('active');
    button.textContent = isActive ? '\u2665' : '\u2661';
}

// Handles all product button clicks from one listener.
function handleProductClick(event) {
    const button = event.target.closest('button');
    const card = event.target.closest('.product-card');

    if (!button || !card) {
        return;
    }

    if (button.classList.contains('quantity-increase')) {
        increaseQuantity(card);
    }

    if (button.classList.contains('quantity-decrease')) {
        decreaseQuantity(card);
    }

    if (button.classList.contains('discount')) {
        applyDiscount(card);
    }

    if (button.classList.contains('add-cart')) {
        addToCart(card);
    }

    if (button.classList.contains('wishlist-button')) {
        toggleWishlist(button);
    }
}

// Filters product cards by the search input value.
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    document.querySelectorAll('.product-card').forEach((card) => {
        const productName = card.dataset.name.toLowerCase();
        card.classList.toggle('hidden', !productName.includes(searchTerm));
    });
}

// Sorts product cards by their base prices.
function sortProducts() {
    const sortValue = document.getElementById('sortSelect').value;
    const cards = Array.from(document.querySelectorAll('.product-card'));

    if (sortValue === 'low-high') {
        cards.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    }

    if (sortValue === 'high-low') {
        cards.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
    }

    if (sortValue === 'default') {
        cards.sort((a, b) => Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex));
    }

    cards.forEach((card) => productGrid.appendChild(card));
}

// Creates star text for a numeric review rating.
function createStars(rating) {
    return '\u2605'.repeat(Number(rating));
}

// Escapes database text before rendering it in the browser.
function escapeHtml(value) {
    const temporaryElement = document.createElement('div');
    temporaryElement.textContent = value;
    return temporaryElement.innerHTML;
}

// Renders review cards from the database response.
function renderReviews(reviews) {
    reviewsGrid.innerHTML = '';

    if (!reviews.length) {
        reviewsGrid.innerHTML = '<p>No reviews yet.</p>';
        return;
    }

    reviews.forEach((review) => {
        const card = document.createElement('article');
        card.className = 'review-card';
        card.innerHTML = `
            <h3>${escapeHtml(review.name)}</h3>
            <p class="stars">${createStars(review.rating)}</p>
            <p>${escapeHtml(review.comment)}</p>
            <p class="date">${escapeHtml(review.created_at)}</p>
        `;
        reviewsGrid.appendChild(card);
    });
}

// Loads existing reviews from the PHP endpoint.
async function loadReviews() {
    try {
        reviewsGrid.innerHTML = '<p>Loading reviews...</p>';
        const response = await fetch('php/get_reviews.php');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        renderReviews(data.reviews);
    } catch (error) {
        reviewsGrid.innerHTML = '<p>Reviews will appear here after PHP and MySQL are running.</p>';
    }
}

// Clears all error messages in the review form.
function clearErrors() {
    reviewForm.querySelectorAll('.error-message').forEach((message) => {
        message.textContent = '';
    });
}

// Shows a validation message below a form control.
function showError(field, message) {
    const row = field.closest('.form-row');
    row.querySelector('.error-message').textContent = message;
}

// Validates the review form before submission.
function validateReviewForm() {
    clearErrors();
    let isValid = true;
    const name = reviewForm.elements['name'];
    const email = reviewForm.elements['email'];
    const rating = reviewForm.elements['rating'];
    const comment = reviewForm.elements['comment'];
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.value.trim()) {
        showError(name, 'Name is required.');
        isValid = false;
    }

    if (!email.value.trim()) {
        showError(email, 'Email is required.');
        isValid = false;
    } else if (!emailPattern.test(email.value.trim())) {
        showError(email, 'Enter a valid email address.');
        isValid = false;
    }

    if (!rating.value) {
        showError(rating, 'Select a rating.');
        isValid = false;
    }

    if (!comment.value.trim()) {
        showError(comment, 'Comment is required.');
        isValid = false;
    } else if (comment.value.trim().length < 10) {
        showError(comment, 'Comment must be at least 10 characters.');
        isValid = false;
    }

    return isValid;
}

// Submits a valid review to the PHP endpoint.
async function submitReview(event) {
    event.preventDefault();
    formStatus.textContent = '';

    if (!validateReviewForm()) {
        return;
    }

    try {
        const formData = new FormData(reviewForm);
        const response = await fetch('php/submit_review.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        formStatus.textContent = data.message;
        reviewForm.reset();
        updateCharacterCounter();
        loadReviews();
    } catch (error) {
        formStatus.textContent = error.message || 'Unable to submit review right now.';
    }
}

// Updates the live character counter below the comment field.
function updateCharacterCounter() {
    characterCount.textContent = commentInput.value.length;
}

// Enables smooth scrolling and closes mobile navigation after link clicks.
function setupSmoothNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = document.querySelector(link.getAttribute('href'));

            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
            navLinks.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// Toggles the mobile navigation menu.
function toggleMenu() {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
}

// Toggles dark mode for the whole page.
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

// Shows or hides the back-to-top button based on scroll position.
function updateBackToTopVisibility() {
    backToTop.classList.toggle('visible', window.scrollY > 500);
}

// Scrolls the page back to the hero section.
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Hides the initial loading animation.
function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}

// Initializes product data and event listeners.
function initializePage() {
    document.querySelectorAll('.product-card').forEach((card, index) => {
        card.dataset.originalIndex = index;
        card.dataset.quantity = '1';
        card.dataset.discountApplied = 'false';
        updateProductCard(card);
    });

    productGrid.addEventListener('click', handleProductClick);
    document.getElementById('searchInput').addEventListener('input', filterProducts);
    document.getElementById('sortSelect').addEventListener('change', sortProducts);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    menuToggle.addEventListener('click', toggleMenu);
    reviewForm.addEventListener('submit', submitReview);
    commentInput.addEventListener('input', updateCharacterCounter);
    backToTop.addEventListener('click', scrollToTop);
    window.addEventListener('scroll', updateBackToTopVisibility);

    setupSmoothNavigation();
    updateCartSummary();
    updateCharacterCounter();
    loadReviews();
    window.setTimeout(hideLoader, 450);
}

document.addEventListener('DOMContentLoaded', initializePage);
