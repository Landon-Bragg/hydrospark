import React, { useState, useEffect } from 'react';
import { getBills } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function AdminBills() {
  const [billsByCustomer, setBillsByCustomer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const billsRes = await getBills();
      const bills = billsRes.data.bills || [];

      // Group bills by customer_id
      const grouped = {};
      bills.forEach(bill => {
        if (!grouped[bill.customer_id]) {
          grouped[bill.customer_id] = { customerId: bill.customer_id, bills: [] };
        }
        grouped[bill.customer_id].bills.push(bill);
      });

      // Sort each customer's bills by period descending
      Object.values(grouped).forEach(g => {
        g.bills.sort((a, b) => new Date(b.billing_period_end) - new Date(a.billing_period_end));
      });

      // Sort groups by customer_id ascending
      const sorted = Object.values(grouped).sort((a, b) => a.customerId - b.customerId);

      setBillsByCustomer(sorted);
    } catch (err) {
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (customerId) => {
    setExpanded(prev => ({ ...prev, [customerId]: !prev[customerId] }));
  };

  const expandAll = () => {
    const all = {};
    billsByCustomer.forEach(g => { all[g.customerId] = true; });
    setExpanded(all);
  };

  const collapseAll = () => setExpanded({});

  const getStatusColor = (status) => {
    const colors = {
      'paid': 'bg-green-100 text-green-800',
      'sent': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleGeneratePDF = (customerId, bills) => {
    const doc = new jsPDF();
    const customerName = bills[0].customer_name || 'Customer #' + customerId;
    const locationId = bills[0].location_id || 'N/A';

    doc.setFontSize(22);
    doc.setTextColor(0, 75, 135);
    doc.text('HYDROSPARK WATER CO.', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Official Billing Statement', 14, 28);
    doc.text('Invoice Date: ' + new Date().toLocaleDateString(), 14, 33);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text('BILL TO:', 14, 45);
    doc.setFont(undefined, 'normal');
    doc.text(customerName, 14, 53);
    doc.text('Location ID: ' + locationId, 14, 59);

    const totalAmount = bills.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
    const totalUsage = bills.reduce((sum, b) => sum + parseFloat(b.total_usage_ccf), 0);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text('Total Bills: ' + bills.length, 14, 71);
    doc.text('Total Usage: ' + totalUsage.toFixed(2) + ' CCF', 14, 77);
    doc.text('Total Amount: $' + totalAmount.toFixed(2), 14, 83);

    autoTable(doc, {
      startY: 93,
      head: [['Billing Period', 'Usage (CCF)', 'Amount', 'Due Date', 'Status']],
      body: bills.map(b => [
        b.billing_period_start + ' to ' + b.billing_period_end,
        parseFloat(b.total_usage_ccf).toFixed(2),
        '$' + parseFloat(b.total_amount).toFixed(2),
        b.due_date,
        b.status.toUpperCase()
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 75, 135] },
      styles: { fontSize: 10 }
    });

    doc.save('HydroSpark_Statement_' + customerName.replace(/\s+/g, '_') + '.pdf');
  };

  if (loading) return <div className="text-center py-10">Loading billing data...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-hydro-deep-aqua">All Customer Bills</h1>
        <div className="flex gap-3">
          <button onClick={expandAll} className="btn-primary px-4 py-2 text-sm">
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 text-sm border border-hydro-deep-aqua text-hydro-deep-aqua rounded hover:bg-hydro-sky-blue transition"
          >
            Collapse All
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {billsByCustomer.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-xl text-gray-600">No bills found</p>
          <p className="text-sm text-gray-500 mt-2">Generate bills from the Admin Dashboard first</p>
        </div>
      ) : (
        <div className="space-y-3">
          {billsByCustomer.map(({ customerId, bills }) => {
            const isOpen = !!expanded[customerId];
            const totalAmount = bills.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
            const totalUsage = bills.reduce((sum, b) => sum + parseFloat(b.total_usage_ccf), 0);
            const overdueCount = bills.filter(b => b.status === 'overdue').length;

            return (
              <div key={customerId} className="card p-0 overflow-hidden">

                <button
                  onClick={() => toggleExpanded(customerId)}
                  className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl">{isOpen ? '▾' : '▸'}</span>
                    <div>
                      <p className="font-bold text-hydro-deep-aqua text-lg">{bills[0].customer_name || 'Customer #' + customerId}</p>
                      <p className="text-sm text-gray-500">
                        {bills.length} bill{bills.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleGeneratePDF(customerId, bills); }}
                      className="ml-2 text-white bg-hydro-deep-aqua border border-hydro-deep-aqua px-4 py-2 rounded text-sm font-semibold hover:opacity-90 transition"
                    >
                      📄 Download Full Statement
                    </button>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Total Usage</p>
                      <p className="font-bold text-gray-700">{totalUsage.toFixed(2)} CCF</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Total Billed</p>
                      <p className="font-bold text-hydro-deep-aqua">${totalAmount.toFixed(2)}</p>
                    </div>
                    {overdueCount > 0 && (
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
                        {overdueCount} Overdue
                      </span>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Bill Period</th>
                          <th className="px-6 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Usage (CCF)</th>
                          <th className="px-6 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                          <th className="px-6 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                          <th className="px-6 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bills.map(bill => (
                          <tr key={bill.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm">{bill.billing_period_start} to {bill.billing_period_end}</td>
                            <td className="px-6 py-3 text-sm">{parseFloat(bill.total_usage_ccf).toFixed(2)}</td>
                            <td className="px-6 py-3 text-sm font-semibold text-hydro-deep-aqua">
                              ${parseFloat(bill.total_amount).toFixed(2)}
                            </td>
                            <td className="px-6 py-3 text-sm">{bill.due_date}</td>
                            <td className="px-6 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(bill.status)}`}>
                                {bill.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminBills;