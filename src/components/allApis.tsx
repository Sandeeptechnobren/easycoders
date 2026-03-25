import { fetchWithAuth } from '@/lib/api';

// 🔍 SEARCH STUDENTS
export const searchStudents = async (query: string) => {
  if (!query) return [];

  const res = await fetchWithAuth(
    `https://api.easycoders.in/projects/backend/public/api/commanAPIs/users?search=${query}`
  );

  return res?.data || [];
};

// 👤 GET STUDENT DETAILS
export const getStudentDetails = async (id: number) => {
  const res = await fetchWithAuth(
    `https://api.easycoders.in/projects/backend/public/api/commanAPIs/getStudentList/${id}`
  );

  return res?.data;
};

// 💰 ADD PAYMENT (REAL API)
export const addPayment = async (payload: {
  user_id: number;
  amount: number;
  payment_mode: string;
}) => {
  return await fetchWithAuth(
    `https://api.easycoders.in/projects/backend/public/api/payments/update-payment`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
};