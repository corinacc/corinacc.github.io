// 1. Simple Interaction: Greeting message in the console
console.log("Portfolio loaded successfully!");

// 2. Simple Interaction: Smooth Scroll for navigation links
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        // Only apply to internal links
        if (this.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// 3. Simple Form/Link Validation
// Alert the user when they click a contact link
const contactButtons = document.querySelectorAll('.links a');
contactButtons.forEach(button => {
    button.addEventListener('click', () => {
        alert("Redirecting you to my profile/email!");
    });
});