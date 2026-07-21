/**
 * UI Helper Functions for Smart Fix
 * Utility functions for UI operations
 */

// Print ticket
window.printTicket = function() {
    const ticketContent = document.getElementById('ticket-content').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=850');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket Smart Fix</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Courier New', monospace;
                    padding: 20px;
                    background: white;
                }
                .ticket {
                    border: 2px solid #000;
                    padding: 20px;
                    max-width: 400px;
                    margin: 0 auto;
                    background: white;
                }
                .ticket-header {
                    text-align: center;
                    border-bottom: 2px dashed #000;
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }
                .ticket-title {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 5px;
                }
                .ticket-section {
                    margin-bottom: 15px;
                }
                .ticket-section-title {
                    font-weight: 700;
                    border-bottom: 1px solid #000;
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                }
                .ticket-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                    font-size: 12px;
                }
                .ticket-label {
                    font-weight: 600;
                }
                .ticket-value {
                    text-align: right;
                }
                .ticket-footer {
                    text-align: center;
                    border-top: 2px dashed #000;
                    padding-top: 10px;
                    margin-top: 15px;
                    font-size: 11px;
                }
            </style>
        </head>
        <body>
            <div class="ticket">
                ${ticketContent}
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
    }, 250);
};

// Close modal
window.closeModal = function() {
    document.getElementById('edit-modal').style.display = 'none';
};

// Close ticket modal
window.closeTicketModal = function() {
    document.getElementById('ticket-modal').style.display = 'none';
};

// Format currency
window.formatCurrency = function(value) {
    return '$' + parseFloat(value || 0).toFixed(2);
};

// Format date
window.formatDate = function(dateString) {
    return new Date(dateString).toLocaleDateString('es-CO');
};

// Calculate remaining days
window.calculateDaysRemaining = function(deliveryDate) {
    if (!deliveryDate) return 0;
    const now = new Date();
    const delivery = new Date(deliveryDate);
    const warranty = new Date(delivery.getTime() + 15 * 24 * 60 * 60 * 1000);
    return Math.ceil((warranty - now) / (1000 * 60 * 60 * 24));
};

// Global keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl + S: Export/Backup
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (app && app.exportData) {
            app.exportData();
        }
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

console.log('✅ UI module loaded successfully');
