
document.addEventListener('DOMContentLoaded', () => {
    
    console.log("Welcome to my Portfolio!");

    // Contact Link Alert (Simple Interaction)
    const contactLinks = document.querySelectorAll('.links a');
    
    contactLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            // Show a small confirmation when clicking email/links
            const target = event.target.innerText;
            console.log(`Navigating to: ${target}`);
        });
    });

  
});