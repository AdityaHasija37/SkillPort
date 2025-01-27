import React, { useState } from 'react';
import axios from 'axios';

const Payment = ({ courseId, amount }) => {
  const [loading, setLoading] = useState(false);

  const initPayment = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post('/api/payments/create-order', { amount });
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'Skill Share App',
        description: 'Course Payment',
        order_id: data.id,
        handler: async (response) => {
          try {
            const verifyUrl = '/api/payments/verify';
            const { data } = await axios.post(verifyUrl, response);
            console.log(data.message);
            // Handle successful payment (e.g., update course enrollment)
          } catch (error) {
            console.log(error);
          }
        },
        theme: {
          color: '#3399cc'
        }
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={initPayment} disabled={loading}>
      {loading ? 'Processing...' : 'Pay Now'}
    </button>
  );
};

export default Payment;