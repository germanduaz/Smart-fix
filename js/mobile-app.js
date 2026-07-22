/**
 * Mobile App - Smart Fix
 * Aplicación móvil optimizada para celulares
 */

class MobileApp {
    constructor() {
        this.orders = [];
        this.cashCuts = [];
        this.currentTab = 'dashboard';
        this.init();
    }

    async init() {
        console.log('Inicializando aplicación móvil...');
        await this.loadData();
        this.setupEventListeners();
        this.loadDashboard();
    }

    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Forms
        document.getElementById('mobile-order-form').addEventListener('submit', (e) => this.handleNewOrder(e));
        document.getElementById('mobile-cash-cut-form').addEventListener('submit', (e) => this.handleCashCut(e));

        // Search
        document.getElementById('mobile-search').addEventListener('input', (e) => this.searchOrders(e.target.value));

        // Admin buttons
        document.getElementById('mobile-export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('mobile-import-btn').addEventListener('click', () => {
            document.getElementById('mobile-import-file').click();
        });
        document.getElementById('mobile-import-file').addEventListener('change', (e) => this.importData(e));
        document.getElementById('mobile-clear-btn').addEventListener('click', () => this.clearAllData());

        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.mobile-modal').style.display = 'none';
            });
        });

        // Sync button
        document.getElementById('sync-btn').addEventListener('click', () => this.refreshData());
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        this.currentTab = tabName;

        // Load tab content
        this.loadTabContent(tabName);
    }

    async loadTabContent(tabName) {
        switch (tabName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'orders':
                await this.loadAllOrders();
                break;
            case 'warranties':
                await this.loadWarranties();
                break;
            case 'new-order':
                // Form ya está listo
                break;
            case 'admin':
                // Form ya está listo
                break;
        }
    }

    async loadData() {
        try {
            this.orders = await db.getAllOrders();
            this.cashCuts = await db.getAllCashCuts();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadDashboard() {
        try {
            const todayOrders = await db.getTodayOrders();
            
            const totalGenerated = todayOrders.reduce((sum, o) => sum + (parseFloat(o.advance) || 0), 0);
            const delivered = todayOrders.filter(o => o.status === 'Entregado').length;
            const totalCash = this.orders
                .filter(o => o.status === 'Entregado')
                .reduce((sum, o) => sum + (parseFloat(o.advance) || 0), 0);

            document.getElementById('mobile-today-generated').textContent = '$' + totalGenerated.toFixed(2);
            document.getElementById('mobile-total-orders').textContent = todayOrders.length;
            document.getElementById('mobile-delivered').textContent = delivered;
            document.getElementById('mobile-cash').textContent = '$' + totalCash.toFixed(2);

            this.displayRecentOrders(todayOrders.slice(0, 10));
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    displayRecentOrders(orders) {
        const container = document.getElementById('mobile-recent-orders');
        
        if (orders.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">Sin órdenes hoy</p>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card-mobile" onclick="mobileApp.showOrderDetail(${order.id})">
                <div class="order-card-header">
                    <div class="order-client">${order.clientName}</div>
                    <span class="status-badge-mobile status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-info-row">
                        <span>📱 ${order.device}</span>
                        <span>🔧 ${order.repairType}</span>
                    </div>
                    <div class="order-info-row">
                        <span>💰 $${order.budget.toFixed(2)}</span>
                        <span>📞 ${order.technician}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadAllOrders() {
        const container = document.getElementById('mobile-orders-list');
        
        if (this.orders.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">Sin órdenes</p>';
            return;
        }

        container.innerHTML = this.orders.map(order => `
            <div class="order-card-mobile" onclick="mobileApp.showOrderDetail(${order.id})">
                <div class="order-card-header">
                    <div class="order-client">${order.clientName}</div>
                    <span class="status-badge-mobile status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-info-row">
                        <span>📱 ${order.device}</span>
                    </div>
                    <div class="order-info-row">
                        <span>💰 $${order.budget.toFixed(2)}</span>
                        <span>📞 ${order.clientPhone}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadWarranties() {
        try {
            const warranties = await db.getWarranties();
            const container = document.getElementById('mobile-warranties-list');

            if (warranties.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 20px; color: #999;">Sin garantías activas</p>';
                return;
            }

            const now = new Date();
            container.innerHTML = warranties.map(order => {
                const deliveryDate = new Date(order.deliveryDate);
                const warrantyDate = new Date(order.warrantyExpiration);
                const daysRemaining = Math.ceil((warrantyDate - now) / (1000 * 60 * 60 * 24));

                return `
                    <div class="order-card-mobile" onclick="mobileApp.showTicket(${order.id})">
                        <div class="order-card-header">
                            <div class="order-client">${order.clientName}</div>
                            <span class="warranty-badge-mobile" style="color: ${daysRemaining <= 3 ? '#ef4444' : '#10b981'}">
                                ${daysRemaining} días
                            </span>
                        </div>
                        <div class="order-card-body">
                            <div class="order-info-row">
                                <span>📱 ${order.device}</span>
                            </div>
                            <div class="order-info-row">
                                <span>Entrega: ${deliveryDate.toLocaleDateString('es-CO')}</span>
                            </div>
                            <div class="order-info-row">
                                <span>Anticipo: $${order.advance.toFixed(2)}</span>
                                <span>Saldo: $${(order.budget - order.advance).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading warranties:', error);
        }
    }

    async handleNewOrder(e) {
        e.preventDefault();

        const order = {
            clientName: document.getElementById('mobile-client-name').value,
            clientPhone: document.getElementById('mobile-client-phone').value,
            device: document.getElementById('mobile-device').value,
            repairType: document.getElementById('mobile-repair-type').value,
            budget: parseFloat(document.getElementById('mobile-budget').value) || 0,
            advance: parseFloat(document.getElementById('mobile-advance').value) || 0,
            expenses: 0,
            technician: document.getElementById('mobile-technician').value,
            notes: '',
            status: 'Pendiente',
            paid: 0
        };

        try {
            await db.addOrder(order);
            alert('✅ Orden guardada!');
            document.getElementById('mobile-order-form').reset();
            await this.loadData();
            await this.loadDashboard();
            this.switchTab('dashboard');
        } catch (error) {
            alert('❌ Error: ' + error);
        }
    }

    async handleCashCut(e) {
        e.preventDefault();

        const cashCut = {
            date: new Date().toISOString(),
            physicalCash: parseFloat(document.getElementById('mobile-physical-cash').value) || 0,
            notes: document.getElementById('mobile-cut-notes').value
        };

        try {
            await db.addCashCut(cashCut);
            alert('✅ Corte registrado!');
            document.getElementById('mobile-cash-cut-form').reset();
            await this.loadData();
        } catch (error) {
            alert('❌ Error: ' + error);
        }
    }

    async showOrderDetail(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const balance = order.budget - order.advance;
        const html = `
            <h2>${order.clientName}</h2>
            <div class="detail-section">
                <div class="detail-row">
                    <span>Teléfono:</span>
                    <strong>${order.clientPhone}</strong>
                </div>
                <div class="detail-row">
                    <span>Equipo:</span>
                    <strong>${order.device}</strong>
                </div>
                <div class="detail-row">
                    <span>Reparación:</span>
                    <strong>${order.repairType}</strong>
                </div>
            </div>

            <div class="detail-section">
                <h3>💰 Finanzas</h3>
                <div class="detail-row">
                    <span>Presupuesto:</span>
                    <strong>$${order.budget.toFixed(2)}</strong>
                </div>
                <div class="detail-row">
                    <span>Anticipo:</span>
                    <strong>$${order.advance.toFixed(2)}</strong>
                </div>
                <div class="detail-row">
                    <span>Saldo:</span>
                    <strong>$${balance.toFixed(2)}</strong>
                </div>
            </div>

            <div class="detail-section">
                <h3>🔧 Técnico</h3>
                <div class="detail-row">
                    <span>${order.technician}</span>
                </div>
            </div>

            <div class="detail-section">
                <h3>📊 Estado</h3>
                <div class="detail-row">
                    <span class="status-badge-mobile status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span>
                </div>
            </div>

            <div class="detail-actions">
                ${order.status !== 'Entregado' ? `<button class="btn-success" onclick="mobileApp.markDelivered(${order.id})">✅ Marcar Entregado</button>` : ''}
                <button class="btn-primary" onclick="mobileApp.showTicket(${order.id})">🎫 Ver Ticket</button>
                <button class="btn-danger" onclick="mobileApp.deleteOrder(${order.id})">🗑️ Eliminar</button>
            </div>
        `;

        document.getElementById('mobile-order-detail').innerHTML = html;
        document.getElementById('mobile-order-modal').style.display = 'flex';
    }

    async markDelivered(orderId) {
        if (!confirm('¿Marcar como entregado?')) return;

        try {
            await db.markAsDelivered(orderId);
            alert('✅ Entregado! Garantía de 15 días activada');
            await this.loadData();
            document.getElementById('mobile-order-modal').style.display = 'none';
            await this.loadDashboard();
        } catch (error) {
            alert('❌ Error: ' + error);
        }
    }

    async deleteOrder(orderId) {
        if (!confirm('⚠️ ¿Eliminar esta orden?')) return;

        try {
            await db.deleteOrder(orderId);
            alert('✅ Orden eliminada');
            await this.loadData();
            document.getElementById('mobile-order-modal').style.display = 'none';
            await this.loadAllOrders();
        } catch (error) {
            alert('❌ Error: ' + error);
        }
    }

    async showTicket(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const balance = order.budget - order.paid;
        const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('es-CO') : '-';
        const warrantyExp = order.warrantyExpiration ? new Date(order.warrantyExpiration).toLocaleDateString('es-CO') : '-';

        const html = `
            <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #ddd; padding-bottom: 15px;">
                <div style="font-size: 18px; font-weight: 700;">SMART FIX</div>
                <div style="font-size: 12px;">Ticket de Entrega</div>
                <div style="font-size: 12px; color: #666;">Orden #${order.id}</div>
            </div>

            <div style="margin-bottom: 12px;">
                <div style="font-weight: 700; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 8px; font-size: 12px;">CLIENTE</div>
                <div style="font-size: 12px; margin-bottom: 3px;"><strong>${order.clientName}</strong></div>
                <div style="font-size: 12px; color: #666;">${order.clientPhone}</div>
            </div>

            <div style="margin-bottom: 12px;">
                <div style="font-weight: 700; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 8px; font-size: 12px;">EQUIPO</div>
                <div style="font-size: 12px; margin-bottom: 3px;"><strong>${order.device}</strong></div>
                <div style="font-size: 12px; color: #666;">${order.repairType}</div>
            </div>

            <div style="margin-bottom: 12px;">
                <div style="font-weight: 700; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 8px; font-size: 12px;">PAGO</div>
                <div style="font-size: 12px; display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span>Anticipo:</span>
                    <strong>$${order.advance.toFixed(2)}</strong>
                </div>
                <div style="font-size: 12px; display: flex; justify-content: space-between;">
                    <span>Saldo:</span>
                    <strong>$${balance.toFixed(2)}</strong>
                </div>
            </div>

            <div style="border-top: 2px dashed #ddd; padding-top: 10px; margin-top: 15px; text-align: center; font-size: 11px; color: #666;">
                Entrega: ${deliveryDate}<br>
                Vence: ${warrantyExp}<br>
                Garantía: 15 Días
            </div>
        `;

        document.getElementById('mobile-ticket-content').innerHTML = html;
        document.getElementById('mobile-ticket-modal').style.display = 'flex';
    }

    async searchOrders(query) {
        if (!query) {
            await this.loadAllOrders();
            return;
        }

        const filtered = this.orders.filter(order =>
            order.clientName.toLowerCase().includes(query.toLowerCase()) ||
            order.device.toLowerCase().includes(query.toLowerCase()) ||
            order.clientPhone.includes(query)
        );

        const container = document.getElementById('mobile-orders-list');
        container.innerHTML = filtered.map(order => `
            <div class="order-card-mobile" onclick="mobileApp.showOrderDetail(${order.id})">
                <div class="order-card-header">
                    <div class="order-client">${order.clientName}</div>
                    <span class="status-badge-mobile status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-info-row">
                        <span>📱 ${order.device}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async exportData() {
        try {
            const data = await db.exportData();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `smartfix-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            alert('✅ Datos exportados!');
        } catch (error) {
            alert('❌ Error: ' + error);
        }
    }

    async importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                await db.importData(importedData);
                alert('✅ Datos importados!');
                await this.loadData();
                await this.loadDashboard();
            } catch (error) {
                alert('❌ Error: ' + error);
            }
        };
        reader.readAsText(file);
    }

    async clearAllData() {
        if (!confirm('⚠️ ¿Eliminar TODOS los datos?')) return;
        if (!confirm('⚠️ SEGUNDA ADVERTENCIA: ¿Estás seguro?')) return;

        try {
            await db.clearAllData();
            alert('✅ Datos eliminados');
            await this.loadData();
            await this.loadDashboard();
        } catch (error) {
            alert('❌ Error: ' + error);
        }
    }

    async refreshData() {
        const btn = document.getElementById('sync-btn');
        btn.style.animation = 'spin 0.5s linear infinite';
        
        try {
            await this.loadData();
            await this.loadTabContent(this.currentTab);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            btn.style.animation = '';
        }
    }
}

// Global function for ticket print
window.printMobileTicket = function() {
    const ticketContent = document.getElementById('mobile-ticket-content').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=400');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket</title>
            <style>
                body { font-family: monospace; padding: 10px; font-size: 12px; }
                * { margin: 0; padding: 0; }
            </style>
        </head>
        <body>
            ${ticketContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
};

// Initialize mobile app
const mobileApp = new MobileApp();
