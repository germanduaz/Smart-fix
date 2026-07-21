/**
 * Main Application Logic
 * Handles all business logic and data operations
 */

class SmartFixApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.technicians = [
            'Técnico 1', 'Técnico 2', 'Técnico 3',
            'Técnico 4', 'Técnico 5', 'Técnico 6'
        ];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadDashboard();
        console.log('SmartFixApp initialized');
    }

    setupEventListeners() {
        // Menu navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(item.dataset.section);
            });
        });

        // Form submissions
        document.getElementById('order-form').addEventListener('submit', (e) => this.handleNewOrder(e));
        document.getElementById('edit-form').addEventListener('submit', (e) => this.handleEditOrder(e));
        document.getElementById('cash-cut-form').addEventListener('submit', (e) => this.handleCashCut(e));

        // Search
        document.getElementById('search-orders').addEventListener('input', (e) => this.searchOrders(e.target.value));

        // Admin buttons
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('import-data').addEventListener('click', () => document.getElementById('import-file').click());
        document.getElementById('import-file').addEventListener('change', (e) => this.importData(e));
        document.getElementById('clear-all').addEventListener('click', () => this.clearAllData());

        // Backup button
        document.getElementById('backup-btn').addEventListener('click', () => this.exportData());

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    switchSection(section) {
        // Update active menu
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        // Update active section
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');

        // Update header title
        const titles = {
            dashboard: 'Dashboard',
            'new-order': 'Nueva Orden',
            orders: 'Todas las Órdenes',
            warranties: 'Garantías',
            'no-warranty': 'Sin Garantía',
            budgets: 'Presupuestos',
            admin: 'Administración'
        };
        document.getElementById('section-title').textContent = titles[section] || 'Dashboard';

        // Load section data
        this.loadSection(section);
        this.currentSection = section;
    }

    async loadSection(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'orders':
                await this.loadAllOrders();
                break;
            case 'warranties':
                await this.loadWarranties();
                break;
            case 'no-warranty':
                await this.loadNoWarranty();
                break;
            case 'budgets':
                await this.loadBudgets();
                break;
            case 'admin':
                await this.loadAdmin();
                break;
        }
    }

    async loadDashboard() {
        try {
            const todayOrders = await db.getTodayOrders();
            const allOrders = await db.getAllOrders();

            // Calculate statistics
            const totalGenerated = todayOrders.reduce((sum, order) => sum + (parseFloat(order.advance) || 0), 0);
            const totalCash = allOrders.reduce((sum, order) => {
                if (order.status === 'Entregado') {
                    return sum + (parseFloat(order.advance) || 0);
                }
                return sum;
            }, 0);

            const delivered = todayOrders.filter(o => o.status === 'Entregado').length;
            const pending = todayOrders.filter(o => o.status !== 'Entregado').length;
            const totalAdvances = todayOrders.reduce((sum, o) => sum + (parseFloat(o.advance) || 0), 0);
            const totalExpenses = todayOrders.reduce((sum, o) => sum + (parseFloat(o.expenses) || 0), 0);

            // Update stats
            document.getElementById('today-generated').textContent = '$' + totalGenerated.toFixed(2);
            document.getElementById('total-cash').textContent = '$' + totalCash.toFixed(2);
            document.getElementById('total-orders').textContent = todayOrders.length;
            document.getElementById('delivered-orders').textContent = delivered;
            document.getElementById('pending-orders').textContent = pending;
            document.getElementById('total-advances').textContent = '$' + totalAdvances.toFixed(2);
            document.getElementById('full-payments').textContent = '$' + totalCash.toFixed(2);
            document.getElementById('total-expenses').textContent = '$' + totalExpenses.toFixed(2);

            // Load technicians
            this.loadTechniciansList(allOrders);

            // Load recent orders
            this.loadRecentOrders(todayOrders.slice(0, 5));
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    async loadTechniciansList(allOrders) {
        const container = document.getElementById('technicians-list');
        container.innerHTML = '';

        for (const tech of this.technicians) {
            const techOrders = allOrders.filter(o => o.technician === tech && o.status !== 'Entregado');
            const card = document.createElement('div');
            card.className = 'technician-card';
            card.innerHTML = `
                <div class="technician-name">${tech}</div>
                <div class="technician-orders">${techOrders.length} órdenes</div>
            `;
            container.appendChild(card);
        }
    }

    async loadRecentOrders(orders) {
        const container = document.getElementById('recent-orders');
        container.innerHTML = '';

        if (orders.length === 0) {
            container.innerHTML = '<p style="color: #64748b;">No hay órdenes hoy</p>';
            return;
        }

        orders.forEach(order => {
            const item = document.createElement('div');
            item.className = 'order-item';
            item.innerHTML = `
                <div class="order-info">
                    <h4>${order.clientName}</h4>
                    <p>${order.device} - ${order.repairType}</p>
                </div>
                <span class="status-badge status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span>
            `;
            container.appendChild(item);
        });
    }

    async handleNewOrder(e) {
        e.preventDefault();

        const order = {
            clientName: document.getElementById('client-name').value,
            clientPhone: document.getElementById('client-phone').value,
            device: document.getElementById('device').value,
            repairType: document.getElementById('repair-type').value,
            budget: parseFloat(document.getElementById('budget').value) || 0,
            advance: parseFloat(document.getElementById('advance').value) || 0,
            expenses: parseFloat(document.getElementById('expenses').value) || 0,
            technician: document.getElementById('technician').value,
            notes: document.getElementById('notes').value,
            status: 'Pendiente',
            paid: 0
        };

        try {
            await db.addOrder(order);
            alert('✅ Orden guardada exitosamente!');
            document.getElementById('order-form').reset();
            await this.loadDashboard();
        } catch (error) {
            alert('❌ Error al guardar la orden: ' + error);
        }
    }

    async loadAllOrders() {
        try {
            const orders = await db.getAllOrders();
            this.displayOrdersTable(orders, 'orders-container');
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    displayOrdersTable(orders, containerId) {
        const container = document.getElementById(containerId);

        if (orders.length === 0) {
            container.innerHTML = '<p style="color: #64748b; padding: 20px;">No hay órdenes</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Teléfono</th>
                        <th>Equipo</th>
                        <th>Reparación</th>
                        <th>Estado</th>
                        <th>Presupuesto</th>
                        <th>Anticipo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        orders.forEach(order => {
            const statusClass = `status-${order.status.toLowerCase().replace(' ', '-')}`;
            html += `
                <tr>
                    <td>${order.clientName}</td>
                    <td>${order.clientPhone}</td>
                    <td>${order.device}</td>
                    <td>${order.repairType}</td>
                    <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                    <td>$${order.budget.toFixed(2)}</td>
                    <td>$${order.advance.toFixed(2)}</td>
                    <td>
                        <div class="order-actions">
                            <button class="btn btn-secondary" onclick="app.editOrder(${order.id})">✏️ Editar</button>
                            <button class="btn btn-success" onclick="app.markDelivered(${order.id})">✅ Entregar</button>
                            <button class="btn btn-danger" onclick="app.deleteOrder(${order.id})">🗑️ Borrar</button>
                            <button class="btn btn-warning" onclick="app.showTicket(${order.id})">🎫 Ticket</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    async loadWarranties() {
        try {
            const warranties = await db.getWarranties();
            this.displayWarrantiesTable(warranties);
        } catch (error) {
            console.error('Error loading warranties:', error);
        }
    }

    async displayWarrantiesTable(warranties) {
        const container = document.getElementById('warranties-container');

        if (warranties.length === 0) {
            container.innerHTML = '<p style="color: #64748b; padding: 20px;">No hay órdenes en garantía</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Teléfono</th>
                        <th>Equipo</th>
                        <th>Fecha Entrega</th>
                        <th>Vence</th>
                        <th>Días Restantes</th>
                        <th>Anticipo</th>
                        <th>Saldo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const now = new Date();
        warranties.forEach(order => {
            const deliveryDate = new Date(order.deliveryDate);
            const warrantyDate = new Date(order.warrantyExpiration);
            const daysRemaining = Math.ceil((warrantyDate - now) / (1000 * 60 * 60 * 24));
            const balance = order.budget - order.advance;

            html += `
                <tr>
                    <td>${order.clientName}</td>
                    <td>${order.clientPhone}</td>
                    <td>${order.device}</td>
                    <td>${deliveryDate.toLocaleDateString('es-CO')}</td>
                    <td>${warrantyDate.toLocaleDateString('es-CO')}</td>
                    <td><strong style="color: ${daysRemaining <= 3 ? '#ef4444' : '#10b981'}">${daysRemaining} días</strong></td>
                    <td>$${order.advance.toFixed(2)}</td>
                    <td>$${balance.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="app.showTicket(${order.id})">🎫 Ticket</button>
                        <button class="btn btn-warning" onclick="app.markNoWarranty(${order.id})">⏹️ Fin Garantía</button>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    async loadNoWarranty() {
        try {
            const orders = await db.getAllOrders();
            const noWarranty = orders.filter(o => o.status === 'Sin Garantía');
            this.displayOrdersTable(noWarranty, 'no-warranty-container');
        } catch (error) {
            console.error('Error loading no warranty orders:', error);
        }
    }

    async loadBudgets() {
        try {
            const orders = await db.getAllOrders();
            const budgets = orders.filter(o => o.status === 'Pendiente');
            this.displayOrdersTable(budgets, 'budgets-container');
        } catch (error) {
            console.error('Error loading budgets:', error);
        }
    }

    async loadAdmin() {
        try {
            const cashCuts = await db.getAllCashCuts();
            this.displayCashCuts(cashCuts);
            document.getElementById('cut-date').valueAsDate = new Date();
        } catch (error) {
            console.error('Error loading admin section:', error);
        }
    }

    displayCashCuts(cuts) {
        const container = document.getElementById('cuts-history');

        if (cuts.length === 0) {
            container.innerHTML = '<p style="color: #64748b; padding: 20px;">No hay cortes registrados</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Efectivo en Caja</th>
                        <th>Observaciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        cuts.forEach(cut => {
            const date = new Date(cut.date);
            html += `
                <tr>
                    <td>${date.toLocaleDateString('es-CO')}</td>
                    <td>$${cut.physicalCash.toFixed(2)}</td>
                    <td>${cut.notes || '-'}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    async handleCashCut(e) {
        e.preventDefault();

        const cashCut = {
            date: document.getElementById('cut-date').value,
            physicalCash: parseFloat(document.getElementById('physical-cash').value) || 0,
            notes: document.getElementById('cut-notes').value
        };

        try {
            await db.addCashCut(cashCut);
            alert('✅ Corte de caja registrado exitosamente!');
            document.getElementById('cash-cut-form').reset();
            await this.loadAdmin();
        } catch (error) {
            alert('❌ Error al registrar corte: ' + error);
        }
    }

    async editOrder(id) {
        try {
            const allOrders = await db.getAllOrders();
            const order = allOrders.find(o => o.id === id);

            if (!order) {
                alert('Orden no encontrada');
                return;
            }

            document.getElementById('edit-order-id').value = id;
            document.getElementById('edit-client-name').value = order.clientName;
            document.getElementById('edit-client-phone').value = order.clientPhone;
            document.getElementById('edit-budget').value = order.budget;
            document.getElementById('edit-advance').value = order.advance;
            document.getElementById('edit-paid').value = order.paid || 0;
            document.getElementById('edit-expenses').value = order.expenses || 0;
            document.getElementById('edit-status').value = order.status;
            document.getElementById('edit-notes').value = order.notes || '';

            document.getElementById('edit-modal').style.display = 'block';
        } catch (error) {
            console.error('Error editing order:', error);
        }
    }

    async handleEditOrder(e) {
        e.preventDefault();

        const id = parseInt(document.getElementById('edit-order-id').value);
        const updated = {
            clientName: document.getElementById('edit-client-name').value,
            clientPhone: document.getElementById('edit-client-phone').value,
            budget: parseFloat(document.getElementById('edit-budget').value) || 0,
            advance: parseFloat(document.getElementById('edit-advance').value) || 0,
            paid: parseFloat(document.getElementById('edit-paid').value) || 0,
            expenses: parseFloat(document.getElementById('edit-expenses').value) || 0,
            status: document.getElementById('edit-status').value,
            notes: document.getElementById('edit-notes').value
        };

        try {
            await db.updateOrder(id, updated);
            alert('✅ Orden actualizada exitosamente!');
            document.getElementById('edit-modal').style.display = 'none';
            await this.loadSection(this.currentSection);
        } catch (error) {
            alert('❌ Error al actualizar: ' + error);
        }
    }

    async markDelivered(id) {
        if (!confirm('¿Confirmar entrega y activar garantía de 15 días?')) return;

        try {
            await db.markAsDelivered(id);
            alert('✅ Orden entregada! Garantía activada por 15 días');
            await this.loadSection(this.currentSection);
        } catch (error) {
            alert('❌ Error: ' + error);
        }
    }

    async markNoWarranty(id) {
        if (!confirm('¿Finalizar garantía de esta orden?')) return;

        try {
            await db.updateOrder(id, { status: 'Sin Garantía' });
            alert('✅ Garantía finalizada');
            await this.loadSection(this.currentSection);
        } catch (error) {
            alert('❌ Error: ' + error);
        }
    }

    async deleteOrder(id) {
        if (!confirm('⚠️ ¿Eliminar esta orden permanentemente?')) return;

        try {
            await db.deleteOrder(id);
            alert('✅ Orden eliminada');
            await this.loadSection(this.currentSection);
        } catch (error) {
            alert('❌ Error: ' + error);
        }
    }

    async showTicket(id) {
        try {
            const allOrders = await db.getAllOrders();
            const order = allOrders.find(o => o.id === id);

            if (!order) {
                alert('Orden no encontrada');
                return;
            }

            const balance = order.budget - order.advance;
            const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('es-CO') : '-';
            const warrantyExp = order.warrantyExpiration ? new Date(order.warrantyExpiration).toLocaleDateString('es-CO') : '-';

            const ticketHTML = `
                <div class="ticket-header">
                    <div class="ticket-title">📱 SMART FIX</div>
                    <div>Ticket de Entrega</div>
                    <div>Orden #${order.id}</div>
                </div>

                <div class="ticket-section">
                    <div class="ticket-section-title">👤 CLIENTE</div>
                    <div class="ticket-row">
                        <span class="ticket-label">Nombre:</span>
                        <span class="ticket-value">${order.clientName}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Teléfono:</span>
                        <span class="ticket-value">${order.clientPhone}</span>
                    </div>
                </div>

                <div class="ticket-section">
                    <div class="ticket-section-title">📱 EQUIPO</div>
                    <div class="ticket-row">
                        <span class="ticket-label">Modelo:</span>
                        <span class="ticket-value">${order.device}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Reparación:</span>
                        <span class="ticket-value">${order.repairType}</span>
                    </div>
                </div>

                <div class="ticket-section">
                    <div class="ticket-section-title">💰 FINANZAS</div>
                    <div class="ticket-row">
                        <span class="ticket-label">Presupuesto:</span>
                        <span class="ticket-value">$${order.budget.toFixed(2)}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Anticipo:</span>
                        <span class="ticket-value">$${order.advance.toFixed(2)}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Saldo Pendiente:</span>
                        <span class="ticket-value">$${balance.toFixed(2)}</span>
                    </div>
                </div>

                <div class="ticket-section">
                    <div class="ticket-section-title">✅ ESTADO Y GARANTÍA</div>
                    <div class="ticket-row">
                        <span class="ticket-label">Estado:</span>
                        <span class="ticket-value">${order.status}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Fecha Entrega:</span>
                        <span class="ticket-value">${deliveryDate}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Vencimiento Garantía:</span>
                        <span class="ticket-value">${warrantyExp}</span>
                    </div>
                </div>

                <div class="ticket-footer">
                    Generado: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}
                </div>
            `;

            document.getElementById('ticket-content').innerHTML = ticketHTML;
            document.getElementById('ticket-modal').style.display = 'block';
        } catch (error) {
            console.error('Error showing ticket:', error);
        }
    }

    async searchOrders(query) {
        try {
            const allOrders = await db.getAllOrders();
            const filtered = allOrders.filter(order =>
                order.clientName.toLowerCase().includes(query.toLowerCase()) ||
                order.device.toLowerCase().includes(query.toLowerCase()) ||
                order.clientPhone.includes(query)
            );
            this.displayOrdersTable(filtered, 'orders-container');
        } catch (error) {
            console.error('Error searching:', error);
        }
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
            alert('✅ Datos exportados exitosamente!');
        } catch (error) {
            alert('❌ Error al exportar: ' + error);
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
                alert('✅ Datos importados exitosamente!');
                await this.loadDashboard();
            } catch (error) {
                alert('❌ Error al importar: ' + error);
            }
        };
        reader.readAsText(file);
    }

    async clearAllData() {
        if (!confirm('⚠️ ¿Está seguro? Esto eliminará TODOS los datos. Esta acción no se puede deshacer.')) return;
        if (!confirm('⚠️ SEGUNDA ADVERTENCIA: ¿Está COMPLETAMENTE seguro?')) return;

        try {
            await db.clearAllData();
            alert('✅ Todos los datos han sido eliminados');
            await this.loadDashboard();
        } catch (error) {
            alert('❌ Error: ' + error);
        }
    }
}

// Initialize app
const app = new SmartFixApp();
