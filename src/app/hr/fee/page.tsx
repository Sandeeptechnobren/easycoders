'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './fee.module.css';
import RoleGuard from '@/components/RoleGuard';
import {
  searchStudents,
  getStudentDetails,
  addPayment,
} from '../../../components/allApis';

// async function generateReceiptPDF(data: {
//   studentName: string;
//   email: string;
//   phone: string;
//   enrollmentId: string;
//   course: string;
//   amount: number;
//   mode: string;
//   transactionId: string;
//   date: string;
//   totalFee: number;
//   paidAmount: number;
//   balanceAfter: number;
// }) {
//   const { jsPDF } = await import('jspdf');
//   const doc = new jsPDF({ unit: 'mm', format: 'a4' });
//   const W = 210;
//   const blue = [37, 99, 235] as [number, number, number];
//   const dark = [17, 24, 39] as [number, number, number];
//   const gray = [107, 114, 128] as [number, number, number];
//   const green = [5, 150, 105] as [number, number, number];
//   const lightBlue = [239, 246, 255] as [number, number, number];
//   doc.setFillColor(...blue);
//   doc.rect(0, 0, W, 38, 'F');
//   doc.setTextColor(255, 255, 255);
//   doc.setFont('helvetica', 'bold');
//   doc.setFontSize(20);
//   doc.text('EasyCoders', 14, 16);
//   doc.setFont('helvetica', 'normal');
//   doc.setFontSize(9);
//   doc.text('Payment Receipt', 14, 23);
//   doc.text('api.easycoders.in', 14, 29);
//   doc.setFontSize(8);
//   const receiptNo = `RCP-${Date.now().toString().slice(-8)}`;
//   doc.text(`Receipt No: ${receiptNo}`, W - 14, 16, { align: 'right' });
//   doc.text(`Date: ${data.date}`, W - 14, 22, { align: 'right' });
//   doc.setFillColor(...lightBlue);
//   doc.roundedRect(14, 44, W - 28, 22, 3, 3, 'F');
//   doc.setTextColor(...gray);
//   doc.setFont('helvetica', 'normal');
//   doc.setFontSize(8);
//   doc.text('AMOUNT PAID', W / 2, 51, { align: 'center' });
//   doc.setTextColor(...blue);
//   doc.setFont('helvetica', 'bold');
//   doc.setFontSize(22);
//   doc.text(`₹${data.amount.toLocaleString('en-IN')}`, W / 2, 61, { align: 'center' });
//   let y = 76;
//   doc.setTextColor(...dark);
//   doc.setFont('helvetica', 'bold');
//   doc.setFontSize(10);
//   doc.text('Student Details', 14, y);
//   doc.setDrawColor(...blue);
//   doc.setLineWidth(0.4);
//   doc.line(14, y + 2, W - 14, y + 2);
//   y += 8;
//   const rows1: [string, string][] = [
//     ['Student Name', data.studentName],
//     ['Email', data.email],
//     ['Phone', data.phone],
//     ['Enrollment ID', data.enrollmentId],
//     ['Course', data.course],
//   ];

//   doc.setFontSize(9);
//   rows1.forEach(([k, v]) => {
//     doc.setFont('helvetica', 'normal');
//     doc.setTextColor(...gray);
//     doc.text(k, 14, y);
//     doc.setTextColor(...dark);
//     doc.setFont('helvetica', 'bold');
//     doc.text(v || '—', 80, y);
//     y += 7;
//   });

//   // ── Payment details section ──
//   y += 2;
//   doc.setFont('helvetica', 'bold');
//   doc.setFontSize(10);
//   doc.setTextColor(...dark);
//   doc.text('Payment Details', 14, y);
//   doc.setDrawColor(...blue);
//   doc.line(14, y + 2, W - 14, y + 2);
//   y += 8;

//   const modeLabels: Record<string, string> = {
//     cash: 'Cash', upi: 'UPI', netbanking: 'Net Banking',
//   };

//   const rows2: [string, string][] = [
//     ['Payment Mode', modeLabels[data.mode] ?? data.mode],
//     ...(data.transactionId ? [['Transaction ID', data.transactionId] as [string, string]] : []),
//     ['Payment Date', data.date],
//   ];

//   doc.setFontSize(9);
//   rows2.forEach(([k, v]) => {
//     doc.setFont('helvetica', 'normal');
//     doc.setTextColor(...gray);
//     doc.text(k, 14, y);
//     doc.setTextColor(...dark);
//     doc.setFont('helvetica', 'bold');
//     doc.text(v || '—', 80, y);
//     y += 7;
//   });

//   // ── Fee summary box ──
//   y += 4;
//   doc.setFillColor(249, 250, 251);
//   doc.roundedRect(14, y, W - 28, 36, 2, 2, 'F');
//   doc.setDrawColor(229, 231, 235);
//   doc.setLineWidth(0.3);
//   doc.roundedRect(14, y, W - 28, 36, 2, 2, 'S');

//   doc.setFontSize(9);
//   y += 8;

//   const summaryRows: [string, string, boolean][] = [
//     ['Total Course Fee', `₹${data.totalFee.toLocaleString('en-IN')}`, false],
//     ['Amount Paid (this payment)', `₹${data.amount.toLocaleString('en-IN')}`, false],
//     ['Total Paid to Date', `₹${data.paidAmount.toLocaleString('en-IN')}`, false],
//     ['Balance Remaining', data.balanceAfter > 0
//       ? `₹${data.balanceAfter.toLocaleString('en-IN')}`
//       : 'Fully Paid ✓', true],
//   ];

//   summaryRows.forEach(([k, v, highlight]) => {
//     doc.setFont('helvetica', 'normal');
//     doc.setTextColor(...gray);
//     doc.text(k, 20, y);
//     doc.setFont('helvetica', 'bold');
//     doc.setTextColor(...(highlight
//       ? (data.balanceAfter > 0 ? [217, 119, 6] : green)
//       : dark) as [number, number, number]);
//     doc.text(v, W - 20, y, { align: 'right' });
//     y += 7;
//   });

//   // ── Footer ──
//   y += 8;
//   doc.setFillColor(...blue);
//   doc.rect(0, 277, W, 20, 'F');
//   doc.setTextColor(255, 255, 255);
//   doc.setFont('helvetica', 'normal');
//   doc.setFontSize(8);
//   doc.text('This is a computer-generated receipt and does not require a signature.', W / 2, 285, { align: 'center' });
//   doc.text('EasyCoders · api.easycoders.in', W / 2, 291, { align: 'center' });

//   // ── Status stamp ──
//   doc.setTextColor(data.balanceAfter > 0 ? 217 : 5, data.balanceAfter > 0 ? 119 : 150, data.balanceAfter > 0 ? 6 : 105);
//   doc.setFont('helvetica', 'bold');
//   doc.setFontSize(28);
//   doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
//   doc.text(data.balanceAfter > 0 ? 'PARTIAL' : 'PAID', W / 2, 180, {
//     align: 'center', angle: 35,
//   });
//   doc.setGState(new (doc as any).GState({ opacity: 1 }));

//   doc.save(`receipt-${data.enrollmentId}-${Date.now()}.pdf`);
// }

function generateReceiptHTML(data: {
  studentName: string;
  email: string;
  phone: string;
  enrollmentId: string;
  course: string;
  amount: number;
  mode: string;
  transactionId: string;
  date: string;
  totalFee: number;
  paidAmount: number;
  balanceAfter: number;
}) {
  const logo = window.location.origin + '/images/ec_logo.png';

  // return `
  // <!DOCTYPE html>
  // <html>
  // <head>
  //   <title>Receipt</title>
  //   <style>
  //     body {
  //       font-family: Arial, sans-serif;
  //       background: white;
  //       padding: 20px;
  //     }

  //     .container {
  //       max-width: 800px;
  //       margin: auto;
  //       background: white;
  //       border-radius: 10px;
  //       overflow: hidden;
  //       box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  //     }

  //     .header {
  //       background: #0dfd95;
  //       color: white;
  //       padding: 20px;
  //       display: flex;
  //       justify-content: space-between;
  //       align-items: center;
  //     }

  //     .header img {
  //       height: 40px;
  //     }

  //     .title {
  //       font-size: 20px;
  //       font-weight: bold;
  //     }

  //     .amount-box {
  //       text-align: center;
  //       background: #eff6ff;
  //       padding: 20px;
  //     }

  //     .amount-box h2 {
  //       margin: 0;
  //       color: #2563eb;
  //       font-size: 28px;
  //     }

  //     .section {
  //       padding: 20px;
  //     }

  //     .section h3 {
  //       margin-bottom: 10px;
  //       border-bottom: 2px solid #2563eb;
  //       padding-bottom: 5px;
  //     }

  //     .row {
  //       display: flex;
  //       justify-content: space-between;
  //       margin-bottom: 8px;
  //       font-size: 14px;
  //     }

  //     .label {
  //       color: #6b7280;
  //     }

  //     .value {
  //       font-weight: bold;
  //       color: #111827;
  //     }

  //     .summary {
  //       background: #f9fafb;
  //       margin: 20px;
  //       padding: 15px;
  //       border-radius: 8px;
  //       border: 1px solid #e5e7eb;
  //     }

  //     .footer {
  //       background: #2563eb;
  //       color: white;
  //       text-align: center;
  //       padding: 10px;
  //       font-size: 12px;
  //     }

  //     .status {
  //       text-align: center;
  //       font-size: 40px;
  //       opacity: 0.1;
  //       transform: rotate(-20deg);
  //       margin-top: 30px;
  //     }

  //     @media print {
  //       body {
  //         background: white;
  //       }
  //     }
  //   </style>
  // </head>

  // <body>

  //   <div class="container">

  //     <!-- HEADER -->
  //     <div class="header">
  //       <div>
  //         <img src="${logo}" />
  //         <div class="title">EasyCoders</div>
  //         <div>Payment Receipt</div>
  //       </div>
  //       <div style="text-align:right;">
  //         <div>Receipt: RCP-${Date.now().toString().slice(-6)}</div>
  //         <div>Date: ${data.date}</div>
  //       </div>
  //     </div>

  //     <!-- AMOUNT -->
  //     <div class="amount-box">
  //       <div>AMOUNT PAID</div>
  //       <h2>₹${data.amount.toLocaleString('en-IN')}</h2>
  //     </div>

  //     <!-- STUDENT -->
  //     <div class="section">
  //       <h3>Student Details</h3>
  //       ${row('Name', data.studentName)}
  //       ${row('Email', data.email)}
  //       ${row('Phone', data.phone)}
  //       ${row('Enrollment ID', data.enrollmentId)}
  //       ${row('Course', data.course)}
  //     </div>

  //     <!-- PAYMENT -->
  //     <div class="section">
  //       <h3>Payment Details</h3>
  //       ${row('Mode', data.mode)}
  //       ${data.transactionId ? row('Transaction ID', data.transactionId) : ''}
  //       ${row('Date', data.date)}
  //     </div>

  //     <!-- SUMMARY -->
  //     <div class="summary">
  //       ${row('Total Fee', format(data.totalFee))}
  //       ${row('Paid This Time', format(data.amount))}
  //       ${row('Total Paid', format(data.paidAmount))}
  //       ${row(
  //         'Balance',
  //         data.balanceAfter > 0
  //           ? format(data.balanceAfter)
  //           : 'Fully Paid ✓'
  //       )}
  //     </div>

  //     <!-- STATUS -->
  //     <div class="status">
  //       ${data.balanceAfter > 0 ? 'PARTIAL' : 'PAID'}
  //     </div>

  //     <!-- FOOTER -->
  //     <div class="footer">
  //       This is a system-generated receipt. No signature required.
  //     </div>

  //   </div>

  // </body>
  // </html>
  // `;
return `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background: #f3f4f6;
      margin: 0;
      padding: 30px;
    }

    .container {
      max-width: 850px;
      margin: auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 15px 40px rgba(0,0,0,0.08);
      border: 1px solid #e5e7eb;
    }

    .header {
      background: linear-gradient(135deg, #0dfd95, #06c167);
      color: white;
      padding: 25px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand img {
      height: 45px;
      background: white;
      padding: 5px;
      border-radius: 6px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-text strong {
      font-size: 20px;
    }

    .meta {
      text-align: right;
      font-size: 13px;
      opacity: 0.95;
    }

    .amount-box {
      text-align: center;
      padding: 30px 20px;
      background: #f0f9ff;
      border-bottom: 1px solid #e5e7eb;
    }

    .amount-box span {
      display: block;
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 6px;
    }

    .amount-box h2 {
      margin: 0;
      color: #2563eb;
      font-size: 34px;
      letter-spacing: 1px;
    }

    .section {
      padding: 25px 30px;
    }

    .section h3 {
      margin-bottom: 15px;
      font-size: 15px;
      color: #111827;
      border-left: 4px solid #2563eb;
      padding-left: 10px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }

    .label {
      color: #6b7280;
    }

    .value {
      font-weight: 600;
      color: #111827;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 30px;
    }

    .summary {
      margin: 20px 30px;
      padding: 20px;
      border-radius: 10px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }

    .summary .row {
      font-size: 15px;
    }

    .highlight {
      font-size: 16px;
      font-weight: 700;
      color: #2563eb;
    }

    .status-badge {
      text-align: center;
      margin: 20px 0;
    }

    .badge {
      display: inline-block;
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 1px;
    }

    .paid {
      background: #dcfce7;
      color: #166534;
    }

    .partial {
      background: #fef3c7;
      color: #92400e;
    }

    .watermark {
      position: absolute;
      font-size: 100px;
      color: rgba(0,0,0,0.04);
      transform: rotate(-25deg);
      top: 40%;
      left: 20%;
      pointer-events: none;
    }

    .footer {
      text-align: center;
      padding: 15px;
      font-size: 12px;
      background: #111827;
      color: #9ca3af;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        border: none;
      }
    }
  </style>
</head>

<body>

<div class="container">

  <div class="header">
    <div class="brand">
      <img src="${logo}" />
      <div class="brand-text">
        <strong>EasyCoders</strong>
        <span>Payment Receipt</span>
      </div>
    </div>
    <div class="meta">
      <div>Receipt ID: <strong>RCP-${Date.now().toString().slice(-6)}</strong></div>
      <div>${data.date}</div>
    </div>
  </div>

  <div class="amount-box">
    <span>AMOUNT PAID</span>
    <h2>₹${data.amount.toLocaleString('en-IN')}</h2>
  </div>

  <div class="section">
    <h3>Student Details</h3>
    <div class="grid">
      ${row('Name', data.studentName)}
      ${row('Email', data.email)}
      ${row('Phone', data.phone)}
      ${row('Enrollment ID', data.enrollmentId)}
      ${row('Course', data.course)}
    </div>
  </div>

  <div class="section">
    <h3>Payment Details</h3>
    <div class="grid">
      ${row('Payment Mode', data.mode)}
      ${data.transactionId ? row('Transaction ID', data.transactionId) : ''}
      ${row('Payment Date', data.date)}
    </div>
  </div>

  <div class="summary">
    ${row('Total Fee', format(data.totalFee))}
    ${row('Paid This Time', format(data.amount))}
    ${row('Total Paid', format(data.paidAmount))}
    <div class="row highlight">
      <div>Balance</div>
      <div>
        ${data.balanceAfter > 0 ? format(data.balanceAfter) : 'Fully Paid'}
      </div>
    </div>
  </div>

  <div class="status-badge">
    <span class="badge ${data.balanceAfter > 0 ? 'partial' : 'paid'}">
      ${data.balanceAfter > 0 ? 'PARTIAL PAYMENT' : 'PAID'}
    </span>
  </div>

  <div class="footer">
    This is a system-generated receipt. No signature required.
  </div>

</div>

</body>
</html>
`;
  function row(label: string, value: string | number) {
    return `
      <div class="row">
        <div class="label">${label}</div>
        <div class="value">${value || '-'}</div>
      </div>
    `;
  }

  function format(n: number) {
    return `₹${n.toLocaleString('en-IN')}`;
  }
}
export default function FeeDetails() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_mode: 'cash',
    transaction_id: '',       // ✅ NEW: transaction/reference field
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    type: 'error' | 'success';
    title: string;
    message: string;
    extra?: string;
  }>({ visible: false, type: 'error', title: '', message: '' });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (
    type: 'error' | 'success',
    title: string,
    message: string,
    extra?: string,
    duration = 5000,
  ) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, type, title, message, extra });
    toastTimer.current = setTimeout(
      () => setToast(t => ({ ...t, visible: false })),
      duration,
    );
  };

  const justSelected = useRef(false);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (justSelected.current) { justSelected.current = false; return; }
      if (search.length < 2) { setStudents([]); return; }
      const res = await searchStudents(search);
      setStudents(res);
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  const handleSelect = async (student: any) => {
    justSelected.current = true;
    setSearch(student.name);
    setStudents([]);
    setLoading(true);
    setSelected(null);
    setProfile(null);
    setErrorMsg('');

    try {
      const res = await getStudentDetails(student.id);
      setSelected(res.student);
      setProfile(res.profile);
      setPayments(res.payments || []);
    } catch {
      alert('Failed to load student');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Determine if transaction ID is required
  const needsTxnId = ['upi', 'netbanking'].includes(paymentForm.payment_mode);

  const handlePayment = async () => {
    setErrorMsg('');

    if (!paymentForm.amount) return setErrorMsg('Please enter an amount.');
    if (needsTxnId && !paymentForm.transaction_id.trim()) {
      return setErrorMsg('Transaction / Reference ID is required for UPI and Net Banking payments.');
    }

    setLoading(true);
    try {
      const res = await addPayment({
        user_id: selected.id,
        amount: Number(paymentForm.amount),
        payment_mode: paymentForm.payment_mode,
        // ✅ only send transaction_id when relevant
        ...(needsTxnId ? { transaction_id: paymentForm.transaction_id.trim() } : {}),
      });

      // ✅ Re-fetch updated profile
      const updated = await getStudentDetails(selected.id);
      setProfile(updated.profile);
      setPayments(updated.payments);

      const now = new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      setLastPayment({
        amount: Number(paymentForm.amount),
        mode: paymentForm.payment_mode,
        transactionId: paymentForm.transaction_id,
        date: now,
        balance: updated.profile.due_amount,
        totalFee: updated.profile.total_fee,
        paidAmount: updated.profile.paid_amount,
        // ✅ carry backend message if any
        message: res?.message || 'Payment recorded successfully.',
      });

      setShowModal(true);
      setPaymentForm({ amount: '', payment_mode: 'cash', transaction_id: '' });
    } catch (e: any) {
      // Parse API error: { status: false, message: '...', due_amount: '3.00' }
      const apiMsg = e?.message || e?.data?.message || 'Payment failed. Please try again.';
      const dueAmt = e?.due_amount || e?.data?.due_amount;
      setErrorMsg(apiMsg);
      showToast(
        'error',
        'Payment Failed',
        apiMsg,
        dueAmt ? 'Due amount: ₹' + Number(dueAmt).toLocaleString('en-IN') : undefined,
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleDownloadReceipt = async () => {

  //   if (!lastPayment || !selected || !profile) return;
  //   setPdfLoading(true);
  //   try {
  //     await generateReceiptHTML({
  //       studentName: selected.name,
  //       email: selected.email,
  //       phone: selected.phone,
  //       enrollmentId: profile.enrollment_id || selected.enrollment_id || `STU-${selected.id}`,
  //       course: profile.course?.name || '—',
  //       amount: lastPayment.amount,
  //       mode: lastPayment.mode,
  //       transactionId: lastPayment.transactionId || '',
  //       date: lastPayment.date,
  //       totalFee: Number(lastPayment.totalFee),
  //       paidAmount: Number(lastPayment.paidAmount),
  //       balanceAfter: Number(lastPayment.balance),
  //     });
  //   } finally {
  //     setPdfLoading(false);
  //   }
  // };
const handleDownloadReceipt = async () => {
  if (!lastPayment || !selected || !profile) return;

  setPdfLoading(true);

  try {
    const html = generateReceiptHTML({
      studentName: selected.name,
      email: selected.email,
      phone: selected.phone,
      enrollmentId:
        profile.enrollment_id || `STU-${selected.id}`,
      course: profile.course?.name || '—',
      amount: lastPayment.amount,
      mode: lastPayment.mode,
      transactionId: lastPayment.transactionId || '',
      date: lastPayment.date,
      totalFee: Number(lastPayment.totalFee),
      paidAmount: Number(lastPayment.paidAmount),
      balanceAfter: Number(lastPayment.balance),
    });
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    const element = container.querySelector('.container') as HTMLElement;
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const canvas = await html2canvas(element, {
      scale: 2,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`receipt-${profile.enrollment_id}.pdf`);
    document.body.removeChild(container);
  } catch (err) {
    console.error(err);
    alert('Failed to generate PDF');
  } finally {
    setPdfLoading(false);
  }
};
  const initials = selected?.name
    ?.split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '??';

  const paidPct = profile
    ? Math.min(100, Math.round((profile.paid_amount / profile.total_fee) * 100))
    : 0;

  const modeLabel: Record<string, string> = {
    cash: 'Cash', upi: 'UPI', netbanking: 'Net Banking',
  };

  return (
    <RoleGuard allowedRoles={[1, 2, 4]}>
      <div className={styles.wrap}>

        <div className={styles.crumbs}>
          <span className={styles.crumbLink}>Admin</span>
          <span className={styles.crumbSep}>/</span>
          <span className={styles.crumbNow}>Fee Management</span>
        </div>
        <h1 className={styles.title}>Fee Management</h1>

        {/* ── Search ── */}
        <div className={styles.searchWrap}>
          <div className={styles.searchInner}>
            <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M10.5 10.5l3 3" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search student by name or email…"
              value={search}
              onChange={(e) => {
                justSelected.current = false;
                setSearch(e.target.value);
                if (selected && e.target.value !== selected.name) {
                  setSelected(null);
                  setProfile(null);
                  setPayments([]);
                  setErrorMsg('');
                }
              }}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => {
                justSelected.current = false;
                setSearch('');
                setStudents([]);
                setSelected(null);
                setProfile(null);
                setPayments([]);
                setErrorMsg('');
              }}>✕</button>
            )}
          </div>

          {students.length > 0 && (
            <div className={styles.dropdown}>
              {students.map((s) => (
                <div key={s.id} className={styles.dropItem} onClick={() => handleSelect(s)}>
                  <div>
                    <div className={styles.dropName}>{s.name}</div>
                    <div className={styles.dropEmail}>{s.email}</div>
                  </div>
                  <div className={styles.dropEnroll}>{s.enrollment_id}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Loading ── */}
        {loading && !selected && (
          <div className={styles.stateBox}>
            <div className={styles.loadingDots}><span /><span /><span /></div>
            <div style={{ marginTop: 8 }}>Loading student details…</div>
          </div>
        )}

        {/* ── Student Content ── */}
        {selected && profile && (
          <>
            <div className={styles.studentHeader}>
              <div className={styles.avatar}>{initials}</div>
              <div>
                <div className={styles.studentName}>{selected.name}</div>
                <div className={styles.studentMeta}>{selected.email} · {selected.phone}</div>
                <div className={styles.enrollTag}>{profile.enrollment_id}</div>
              </div>
            </div>

            <div className={styles.grid3}>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Total Fee</div>
                <div className={styles.metricVal}>
                  ₹{Number(profile.total_fee).toLocaleString('en-IN')}
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${paidPct}%` }} />
                </div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Amount Paid</div>
                <div className={`${styles.metricVal} ${styles.paid}`}>
                  ₹{Number(profile.paid_amount).toLocaleString('en-IN')}
                </div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Balance Due</div>
                <div className={`${styles.metricVal} ${styles.due}`}>
                  ₹{Number(profile.due_amount).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardIco}>👤</div>
                <div>
                  <div className={styles.cardTitle}>Student Information</div>
                  <div className={styles.cardSub}>Enrollment & course details</div>
                </div>
              </div>
              <div className={styles.infoRows}>
                {([
                  ['Course', profile.course?.name],
                  ['College', profile.college?.name],
                  ['Phone', selected.phone],
                  ['Email', selected.email],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className={styles.infoRow}>
                    <span className={styles.infoK}>{k}</span>
                    <span className={styles.infoV}>{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Add Payment Card ── */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardIco}>💳</div>
                <div>
                  <div className={styles.cardTitle}>Add Payment</div>
                  <div className={styles.cardSub}>Record a new fee installment</div>
                </div>
              </div>
              <div className={styles.cardBody}>

                {/* ✅ Backend / validation error message */}
                {errorMsg && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                    color: '#dc2626', fontSize: 13, fontWeight: 500,
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                  }}>
                    <span style={{ flexShrink: 0 }}>⚠</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className={styles.form2}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>
                      Amount <span className={styles.req}>*</span>
                    </label>
                    <input
                      className={styles.input}
                      type="number"
                      placeholder="Enter amount"
                      value={paymentForm.amount}
                      onChange={(e) => {
                        setErrorMsg('');
                        setPaymentForm((p) => ({ ...p, amount: e.target.value }));
                      }}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>
                      Payment Mode <span className={styles.req}>*</span>
                    </label>
                    <select
                      className={styles.input}
                      value={paymentForm.payment_mode}
                      onChange={(e) => {
                        setErrorMsg('');
                        setPaymentForm((p) => ({
                          ...p,
                          payment_mode: e.target.value,
                          transaction_id: '', // reset when mode changes
                        }));
                      }}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                    </select>
                  </div>
                </div>

                {/* ✅ Transaction ID — shown only for UPI / Net Banking */}
                {needsTxnId && (
                  <div className={styles.field} style={{ marginTop: 4 }}>
                    <label className={styles.fieldLabel}>
                      Transaction / Reference ID <span className={styles.req}>*</span>
                    </label>
                    <input
                      className={styles.input}
                      placeholder={
                        paymentForm.payment_mode === 'upi'
                          ? 'e.g. UPI123456789'
                          : 'e.g. NEFT/RTGS reference number'
                      }
                      value={paymentForm.transaction_id}
                      onChange={(e) => {
                        setErrorMsg('');
                        setPaymentForm((p) => ({ ...p, transaction_id: e.target.value }));
                      }}
                    />
                    <small style={{ color: '#6b7280', fontSize: 11, marginTop: 4, display: 'block' }}>
                      Required for {modeLabel[paymentForm.payment_mode]} payments
                    </small>
                  </div>
                )}

                <button
                  className={styles.btnSubmit}
                  onClick={handlePayment}
                  disabled={loading}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M1 7h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {loading ? 'Processing…' : 'Add Payment'}
                </button>
              </div>
            </div>

            {/* ── Payment History ── */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardIco}>📋</div>
                <div>
                  <div className={styles.cardTitle}>Payment History</div>
                  <div className={styles.cardSub}>
                    {payments.length} transaction{payments.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className={styles.tableWrap}>
                {payments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9ca3af', fontSize: 13 }}>
                    No payments recorded yet.
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Mode</th>
                        <th>Txn ID</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className={styles.amtCell}>
                            ₹{Number(p.amount).toLocaleString('en-IN')}
                          </td>
                          <td>
                            <span className={`${styles.modePill} ${styles[p.payment_mode] ?? ''}`}>
                              {modeLabel[p.payment_mode] ?? p.payment_mode}
                            </span>
                          </td>
                          <td style={{ color: '#6b7280', fontSize: 12 }}>
                            {p.transaction_id || '—'}
                          </td>
                          <td className={styles.dateCell}>{p.payment_date}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={styles.statusPill}>✓ Received</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Success Modal ── */}
        {showModal && lastPayment && (
          <div className={styles.modalBg}>
            <div className={styles.modal}>
              <div className={styles.modalTop}>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>

                {/* ✅ Green success ring */}
                <div className={styles.checkRing} style={{
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  boxShadow: '0 4px 20px rgba(5,150,105,0.35)',
                }}>✓</div>

                <h2 className={styles.modalHeading}>Payment Received!</h2>

                {/* ✅ Backend message */}
                <p className={styles.modalSub} style={{ color: '#059669', fontWeight: 600 }}>
                  {lastPayment.message}
                </p>
              </div>

              <div className={styles.modalBody}>
                {([
                  ['Amount', `₹${Number(lastPayment.amount).toLocaleString('en-IN')}`],
                  ['Mode', modeLabel[lastPayment.mode] ?? lastPayment.mode],
                  ...(['upi', 'netbanking'].includes(lastPayment.mode) && lastPayment.transactionId
                    ? [['Transaction ID', lastPayment.transactionId]]
                    : []),
                  ['Date & Time', lastPayment.date],
                  ['Balance After', lastPayment.balance > 0
                    ? `₹${Number(lastPayment.balance).toLocaleString('en-IN')} remaining`
                    : '✓ Fully Paid'],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className={styles.mRow}>
                    <span className={styles.mK}>{k}</span>
                    <span
                      className={styles.mV}
                      style={
                        k === 'Balance After'
                          ? { color: lastPayment.balance > 0 ? '#d97706' : '#059669', fontWeight: 700 }
                          : k === 'Transaction ID'
                          ? { fontFamily: 'monospace', fontSize: 12 }
                          : undefined
                      }
                    >
                      {v}
                    </span>
                  </div>
                ))}

                {/* ✅ PDF Download button */}
                <button
                  className={styles.dlBtn}
                  onClick={handleDownloadReceipt}
                  disabled={pdfLoading}
                  style={{
                    background: pdfLoading ? '#e5e7eb' : undefined,
                    cursor: pdfLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {pdfLoading ? '⏳ Generating PDF…' : '⬇ Download Receipt (PDF)'}
                </button>

                {/* ✅ Close button in green */}
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    marginTop: 10, width: '100%', padding: '11px 0',
                    borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    color: '#fff', fontWeight: 700, fontSize: 14,
                    cursor: 'pointer', letterSpacing: '0.01em',
                    boxShadow: '0 2px 8px rgba(5,150,105,0.3)',
                  }}
                >
                  Done ✓
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
        {/* ── Toast Notification ── */}
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: toast.visible ? 'auto' : 'none',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            background: toast.type === 'error' ? '#fff' : '#f0fdf4',
            border: '1.5px solid ' + (toast.type === 'error' ? '#fca5a5' : '#6ee7b7'),
            borderLeft: '4px solid ' + (toast.type === 'error' ? '#ef4444' : '#059669'),
            borderRadius: 10,
            padding: '14px 16px',
            minWidth: 300,
            maxWidth: 380,
            boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
            transform: toast.visible ? 'translateX(0)' : 'translateX(120%)',
            opacity: toast.visible ? 1 : 0,
            transition: 'transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.3s ease',
          }}>
            {/* Icon */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: toast.type === 'error' ? '#fef2f2' : '#d1fae5',
              fontSize: 15,
            }}>
              {toast.type === 'error' ? '⚠' : '✓'}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700, fontSize: 14,
                color: toast.type === 'error' ? '#dc2626' : '#059669',
                marginBottom: 2,
              }}>
                {toast.title}
              </div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                {toast.message}
              </div>
              {toast.extra && (
                <div style={{
                  marginTop: 6, fontSize: 12, fontWeight: 600,
                  color: toast.type === 'error' ? '#b91c1c' : '#065f46',
                  background: toast.type === 'error' ? '#fef2f2' : '#d1fae5',
                  borderRadius: 6, padding: '4px 8px', display: 'inline-block',
                }}>
                  {toast.extra}
                </div>
              )}
            </div>

            {/* Close */}
            <button
              onClick={() => setToast(t => ({ ...t, visible: false }))}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ca3af', fontSize: 16, padding: '0 0 0 4px',
                lineHeight: 1, flexShrink: 0,
              }}
            >✕</button>
          </div>
        </div>

    </RoleGuard>
  );
}